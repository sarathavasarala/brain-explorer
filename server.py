#!/usr/bin/env python3
"""
Brain Explorer local server.

Serves the static app and one endpoint, GET /api/ask?q=..., which asks Jev
(TypeSafe AI) how each part of the atlas is involved in a condition or state.
The API key is read from .env (TYPESAFE_API_KEY) and never sent to the browser.
Standard library only.
"""

import http.server
import json
import os
import urllib.parse
import urllib.request

HOST = '127.0.0.1'
PORT = int(os.environ.get('PORT', 5173))
ROOT = os.path.dirname(os.path.abspath(__file__))
MAX_QUERY = 120
CLIENT_HEADER = 'X-Brain-Explorer'
PUBLIC_FILES = {'/', '/index.html', '/styles.css'}


def load_key():
    path = os.path.join(ROOT, '.env')
    if os.path.exists(path):
        with open(path) as f:
            for line in f:
                line = line.strip()
                if line.startswith('TYPESAFE_API_KEY='):
                    return line.split('=', 1)[1].strip().strip('"\'')
    return os.environ.get('TYPESAFE_API_KEY')


API_KEY = load_key()

# Parts Jev can choose from. Keys must match structure ids in src/content/structures.
PARTS = {
    'prefrontal-cortex': 'Prefrontal cortex: planning, working memory, self-control, reality checking',
    'motor-cortex': 'Primary motor cortex: sends movement commands to muscles',
    'brocas-area': "Broca's area: producing speech and grammar",
    'somatosensory-cortex': 'Somatosensory cortex: touch, temperature, pain and the body map',
    'posterior-parietal': 'Posterior parietal cortex: spatial attention, body in space, guiding reaches',
    'temporal-lobe': 'Temporal lobe: recognising faces and objects, meaning of words, long-term knowledge',
    'auditory-cortex': 'Auditory cortex: hearing sounds, pitch and speech sounds',
    'wernickes-area': "Wernicke's area: understanding words",
    'visual-cortex': 'Primary visual cortex: edges, lines, motion, colour',
    'cingulate-cortex': 'Cingulate cortex: conflict, mistakes, the unpleasantness of pain, motivation',
    'insula': 'Insula: feeling the inside of the body, heartbeat, hunger, disgust',
    'thalamus': 'Thalamus: relays senses to the cortex, sleep and wake rhythms',
    'hypothalamus': 'Hypothalamus: hunger, thirst, temperature, sleep, stress hormones',
    'striatum': 'Striatum: habits, choosing actions, reward and wanting',
    'globus-pallidus': 'Globus pallidus: the brake on movement',
    'substantia-nigra': 'Substantia nigra: dopamine cells for smooth movement',
    'hippocampus': 'Hippocampus: forming new memories, navigation',
    'amygdala': 'Amygdala: fear, threat, emotional weight of memories',
    'corpus-callosum': 'Corpus callosum: the cable joining the two hemispheres',
    'vta': 'Ventral tegmental area: dopamine for motivation and reward learning',
    'basal-forebrain': 'Basal forebrain: acetylcholine for attention and memory',
    'cerebellum': 'Cerebellum: coordination, balance, timing',
    'pons': 'Pons: bridge to the cerebellum, dreaming sleep',
    'medulla': 'Medulla: breathing, heart rate, swallowing',
    'spinal-cord': 'Spinal cord: carries movement commands and body sensations',
    'raphe-nuclei': 'Raphe nuclei: serotonin for mood, sleep and patience',
    'locus-coeruleus': 'Locus coeruleus: noradrenaline for alertness and alarm',
}

ROLES = {
    'not_involved': 'not a main part of this; plays no special role',
    'more_active': 'fires more than usual, overactive or working much harder',
    'less_active': 'quieter or underactive compared with usual',
    'losing_cells': 'its cells are damaged, dying or wasting away',
    'cut_off': 'works, but its connection to another key part is broken',
    'typical': 'centrally involved, doing its normal job',
}

MESSENGERS = {
    'dopamine': 'dopamine',
    'serotonin': 'serotonin',
    'noradrenaline': 'noradrenaline (norepinephrine)',
    'acetylcholine': 'acetylcholine',
    'gaba': 'GABA',
    'glutamate': 'glutamate',
    'none': 'no single messenger is clearly central',
}

# A messenger is only shown when the part that makes it is also involved.
MESSENGER_SOURCE = {
    'dopamine': {'substantia-nigra', 'vta'},
    'serotonin': {'raphe-nuclei'},
    'noradrenaline': {'locus-coeruleus'},
    'acetylcholine': {'basal-forebrain'},
}

MIN_SCOPE = 0.5
MIN_INVOLVED = 0.95
MIN_ROLE_SURE = 0.5
MIN_MESSENGER = 0.7
MAX_PARTS = 5

CACHE = {}


def build_questions():
    q = {
        'in_scope': {
            'type': 'noul',
            'instructions': 'Is this a condition, feeling, mental state, experience or behaviour that clearly involves the human brain?',
        },
        'kind': {
            'type': 'choice',
            'instructions': 'What kind of thing is this?',
            'criteria': {
                'condition': 'a medical, neurological or psychiatric condition, disorder, injury or syndrome',
                'state': 'an everyday feeling, mood, experience, skill or activity in a healthy person',
            },
        },
        'messenger': {
            'type': 'choice',
            'instructions': 'Which brain chemical messenger is most directly and well-known to be involved?',
            'criteria': MESSENGERS,
        },
    }
    for pid, desc in PARTS.items():
        q[f'part:{pid}'] = {
            'type': 'choice',
            'instructions': f'In this, how is this brain part involved? {desc}',
            'criteria': ROLES,
        }
    return q


def call_jev(state):
    body = json.dumps({'model': 'jev-latest', 'state': state, 'questions': build_questions()}).encode()
    req = urllib.request.Request(
        'https://api.typesafe.ai/v1/systemone',
        data=body,
        headers={'Content-Type': 'application/json', 'Authorization': f'Bearer {API_KEY}'},
    )
    with urllib.request.urlopen(req, timeout=20) as resp:
        return json.loads(resp.read().decode())


def interpret(query, data):
    a = data.get('answers', {})
    scope = a.get('in_scope', {}).get('noul', 0)
    if scope < MIN_SCOPE:
        return {'query': query, 'status': 'out_of_scope'}

    parts = []
    for pid in PARTS:
        ans = a.get(f'part:{pid}', {})
        probs = ans.get('probabilities', {})
        involved = 1 - float(probs.get('not_involved', 1))
        if involved < MIN_INVOLVED:
            continue
        role = ans.get('choice')
        sure = float(ans.get('confidence', 0))
        if role == 'not_involved' or sure < MIN_ROLE_SURE:
            role = 'involved'
        parts.append({'id': pid, 'role': role, 'score': round(involved * (0.5 + sure / 2), 3)})
    parts.sort(key=lambda p: p['score'], reverse=True)
    parts = parts[:MAX_PARTS]
    if not parts:
        return {'query': query, 'status': 'unsure'}

    ids = {p['id'] for p in parts}
    msg = a.get('messenger', {})
    messenger = msg.get('choice')
    if messenger == 'none' or float(msg.get('confidence', 0)) < MIN_MESSENGER:
        messenger = None
    elif messenger in MESSENGER_SOURCE and not (MESSENGER_SOURCE[messenger] & ids):
        messenger = None

    return {
        'query': query,
        'status': 'ok',
        'kind': a.get('kind', {}).get('choice', 'state'),
        'messenger': messenger,
        'parts': parts,
    }


def ask(query):
    query = ' '.join(query.split())[:MAX_QUERY]
    if not query:
        return {'query': '', 'status': 'unsure'}
    key = query.lower()
    if key not in CACHE:
        if not API_KEY:
            return {'query': query, 'status': 'no_key'}
        CACHE[key] = interpret(query, call_jev(query))
    return CACHE[key]


class Handler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=ROOT, **kwargs)

    def send_json(self, code, payload):
        body = json.dumps(payload).encode()
        self.send_response(code)
        self.send_header('Content-Type', 'application/json')
        self.send_header('Cache-Control', 'no-store')
        self.send_header('Content-Length', str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def local_host(self):
        # Blocks DNS-rebinding: a hostile site that points its own name at
        # 127.0.0.1 still sends its own name in the Host header.
        return (self.headers.get('Host') or '').split(':')[0] in ('localhost', '127.0.0.1')

    def send_head(self):
        # Serve the app and nothing else: no .env, .git, server.py or tools.
        path = urllib.parse.unquote(urllib.parse.urlparse(self.path).path)
        if not self.local_host() or not (path in PUBLIC_FILES or path.startswith('/src/')) or '/.' in path:
            self.send_error(404)
            return None
        return super().send_head()

    def do_GET(self):
        parsed = urllib.parse.urlparse(self.path)
        if parsed.path != '/api/ask':
            return super().do_GET()
        # Only the app itself may spend the key: the custom header forces a CORS
        # preflight (which this server never approves) for any other origin.
        if not self.local_host() or self.headers.get(CLIENT_HEADER) != '1':
            return self.send_json(403, {'status': 'error', 'error': 'forbidden'})
        q = urllib.parse.parse_qs(parsed.query).get('q', [''])[0]
        try:
            self.send_json(200, ask(q))
        except Exception as e:  # noqa: BLE001
            self.log_error('ask failed: %s', e)
            self.send_json(502, {'status': 'error', 'error': 'The model could not be reached.'})


def run():
    for port in (PORT, PORT + 1):
        try:
            httpd = http.server.ThreadingHTTPServer((HOST, port), Handler)
        except OSError:
            print(f'[brain-explorer] Port {port} is busy.')
            continue
        print(f'[brain-explorer] http://localhost:{port}')
        print('[brain-explorer] Ask: ' + ('API key loaded from .env' if API_KEY else 'no TYPESAFE_API_KEY, free-text questions are off'))
        httpd.serve_forever()
        return


if __name__ == '__main__':
    run()
