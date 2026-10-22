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
import math
import os
import threading
import time
import urllib.parse
import urllib.request

ALLOW_LAN = os.environ.get('ALLOW_LAN') == '1'
HOST = os.environ.get('HOST') or ('0.0.0.0' if ALLOW_LAN else '127.0.0.1')
PORT = int(os.environ.get('PORT', 5173))
ROOT = os.path.dirname(os.path.abspath(__file__))
MAX_QUERY = 120
CLIENT_HEADER = 'X-Brain-Explorer'
CSP = (
    "default-src 'self'; "
    "script-src 'self' 'unsafe-inline' https://cdn.jsdelivr.net https://cloud.umami.is; "
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; "
    "font-src 'self' https://fonts.gstatic.com data:; "
    "img-src 'self' data:; "
    "connect-src 'self' https://api.openai.com https://*.openai.azure.com https://*.services.ai.azure.com https://cloud.umami.is https://gateway.umami.is; "
    "worker-src 'self'; "
    "manifest-src 'self'; "
    "base-uri 'self'; "
    "object-src 'none'; "
    "frame-ancestors 'none'; "
    "form-action 'self'"
)
SECURITY_HEADERS = {
    'Content-Security-Policy': CSP,
    'Referrer-Policy': 'no-referrer',
    'X-Content-Type-Options': 'nosniff',
    'Permissions-Policy': 'camera=(), microphone=(), geolocation=(), payment=(), usb=(), magnetometer=(), gyroscope=(), accelerometer=(), display-capture=(), idle-detection=()',
}
PUBLIC_FILES = {
    '/',
    '/index.html',
    '/styles.css',
    '/manifest.webmanifest',
    '/sw.js',
    '/favicon.svg',
}


def load_env():
    env = {}
    path = os.path.join(ROOT, '.env')
    if os.path.exists(path):
        with open(path, 'r', encoding='utf-8') as f:
            for line in f:
                line = line.strip()
                if not line or line.startswith('#') or '=' not in line:
                    continue
                k, v = line.split('=', 1)
                env[k.strip()] = v.strip().strip('"\'')
    return env


ENV = load_env()


def get_env(key, default=''):
    return os.environ.get(key) or ENV.get(key, default)


API_KEY = get_env('TYPESAFE_API_KEY')
AZURE_ENDPOINT = get_env('AZURE_OPENAI_ENDPOINT').rstrip('/')
AZURE_KEY = get_env('AZURE_OPENAI_API_KEY')
AZURE_DEPLOYMENT = get_env('AZURE_OPENAI_DEPLOYMENT') or get_env('AZURE_OPENAI_MODEL')
AZURE_VERSION = get_env('AZURE_OPENAI_API_VERSION', '2024-10-21')

CHAT_ENABLED = bool(AZURE_ENDPOINT and AZURE_KEY and AZURE_DEPLOYMENT)


def env_int(key, default):
    try:
        return max(1, int(get_env(key, str(default))))
    except (TypeError, ValueError):
        return default


ASK_RATE_PER_MIN = env_int('ASK_RATE_PER_MIN', 30)
ASK_RATE_PER_DAY = env_int('ASK_RATE_PER_DAY', 1000)
CHAT_RATE_PER_MIN = env_int('CHAT_RATE_PER_MIN', 8)
CHAT_RATE_PER_DAY = env_int('CHAT_RATE_PER_DAY', 200)
CHAT_MAX_CONCURRENT = env_int('CHAT_MAX_CONCURRENT', 4)

RATE_LOCK = threading.Lock()
RATE_EVENTS = {}
RATE_STATE = {'last_cleanup': 0.0}
CHAT_SLOTS = threading.BoundedSemaphore(CHAT_MAX_CONCURRENT)


def _cleanup_rate_events(now):
    if now - RATE_STATE['last_cleanup'] < 300 and len(RATE_EVENTS) < 512:
        return
    RATE_STATE['last_cleanup'] = now
    cutoff = now - 86400
    stale = []
    for key, times in RATE_EVENTS.items():
        if not times or times[-1] < cutoff:
            stale.append(key)
            continue
        drop = 0
        while drop < len(times) and times[drop] < cutoff:
            drop += 1
        if drop:
            del times[:drop]
    for key in stale:
        RATE_EVENTS.pop(key, None)


def check_rate(scope, client):
    now = time.monotonic()
    per_min = ASK_RATE_PER_MIN if scope == 'ask' else CHAT_RATE_PER_MIN
    per_day = ASK_RATE_PER_DAY if scope == 'ask' else CHAT_RATE_PER_DAY
    key = (scope, client)
    with RATE_LOCK:
        bucket = RATE_EVENTS.setdefault(key, [])
        day_cutoff = now - 86400
        if bucket and bucket[0] < day_cutoff:
            bucket[:] = [t for t in bucket if t >= day_cutoff]
        minute_cutoff = now - 60
        minute_times = [t for t in bucket if t >= minute_cutoff]
        if len(minute_times) >= per_min:
            retry = max(1, int(math.ceil(60 - (now - minute_times[0]))))
            return False, retry
        if len(bucket) >= per_day:
            retry = max(1, int(math.ceil(86400 - (now - bucket[0]))))
            return False, retry
        bucket.append(now)
        _cleanup_rate_events(now)
    return True, 0

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
    'olfactory-bulb': 'Olfactory bulb: detecting and sorting odors, routing scent directly to emotion and memory',
    'mammillary-bodies': 'Mammillary bodies: relaying memory signals from hippocampus to thalamus, episodic recall',
    'habenula': 'Habenula: anti-reward hub, signaling disappointment, defeat and braking dopamine',
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


# ---------------------------------------------------------------- Azure OpenAI Chat
CATALOG_PATH = os.path.join(ROOT, 'src', 'content', 'catalog.json')


def load_catalog():
    if os.path.exists(CATALOG_PATH):
        try:
            with open(CATALOG_PATH, 'r', encoding='utf-8') as f:
                return json.load(f)
        except Exception as e:
            print(f'[brain-explorer] error loading catalog: {e}')
    return {'structures': [], 'anchors': [], 'chemicals': [], 'glossary': [], 'roles': [], 'views': []}


CATALOG = load_catalog()
REGION_IDS = [s['id'] for s in CATALOG.get('structures', [])] + [a['id'] for a in CATALOG.get('anchors', [])]
CHEMICAL_IDS = [c['id'] for c in CATALOG.get('chemicals', [])]
ROLES_LIST = CATALOG.get('roles', ['more_active', 'less_active', 'typical', 'involved', 'cut_off', 'losing_cells'])
VIEWS_LIST = CATALOG.get('views', ['left', 'left-front', 'left-back', 'medial', 'back', 'below', 'body'])


AI_CONTRACT_PATH = os.path.join(ROOT, 'src', 'content', 'ai-contract.json')
SYSTEM_PROMPT = ''
SCRIPT_SCHEMA = {}


def load_ai_contract():
    if not os.path.exists(AI_CONTRACT_PATH):
        raise FileNotFoundError(f'missing {AI_CONTRACT_PATH}')
    with open(AI_CONTRACT_PATH, 'r', encoding='utf-8') as f:
        contract = json.load(f)
    if not isinstance(contract, dict) or not contract.get('systemPrompt') or not isinstance(contract.get('scriptSchema'), dict):
        raise ValueError(f'invalid {AI_CONTRACT_PATH}')
    return contract


CHAT_CACHE = {}


def sanitize_chat_response(raw_data):
    status = raw_data.get('status', 'ok')
    if status != 'ok':
        return {
            'status': 'out_of_scope',
            'title': (raw_data.get('title') or 'Out of scope').replace('—', ', '),
            'summary': (raw_data.get('summary') or 'That does not seem to be about the brain. Try asking about a feeling, memory, or action.').replace('—', ', '),
            'steps': [],
            'followups': [f.replace('—', ', ') for f in (raw_data.get('followups') or [])][:3]
        }

    valid_regions = set(REGION_IDS)
    valid_chems = set(CHEMICAL_IDS)
    valid_roles = set(ROLES_LIST)
    valid_views = set(VIEWS_LIST)

    raw_steps = raw_data.get('steps', [])
    clean_steps = []
    for st in raw_steps[:6]:
        if not isinstance(st, dict):
            continue
        title = (st.get('title') or 'Step').replace('—', ', ')
        text = (st.get('text') or '').replace('—', ', ')

        focus = [fid for fid in (st.get('focus') or []) if fid in valid_regions]
        parts = [{'id': p['id'], 'role': p['role']} for p in (st.get('parts') or []) if isinstance(p, dict) and p.get('id') in valid_regions and p.get('role') in valid_roles]

        route = []
        for r in (st.get('route') or []):
            if isinstance(r, dict) and r.get('from') in valid_regions and r.get('to') in valid_regions:
                route.append([r['from'], r['to']])
            elif isinstance(r, list) and len(r) >= 2 and r[0] in valid_regions and r[1] in valid_regions:
                route.append([r[0], r[1]])

        chemical = st.get('chemical') if st.get('chemical') in valid_chems else None
        view = st.get('view') if st.get('view') in valid_views else None
        slice_val = bool(st['slice']) if st.get('slice') is not None else None
        body_val = bool(st['body']) if st.get('body') is not None else None

        has_visual = bool(focus or parts or route or chemical)
        if not has_visual:
            continue

        step_dict = {'title': title, 'text': text}
        if focus:
            step_dict['focus'] = focus
        if parts:
            step_dict['parts'] = parts
        if route:
            step_dict['route'] = route
        if view:
            step_dict['view'] = view
        if slice_val is not None:
            step_dict['slice'] = slice_val
        if chemical:
            step_dict['chemical'] = chemical
        if body_val is not None:
            step_dict['body'] = body_val

        clean_steps.append(step_dict)

    followups = [f.replace('—', ', ') for f in (raw_data.get('followups') or [])][:3]
    return {
        'status': 'ok',
        'title': (raw_data.get('title') or 'Brain Explorer').replace('—', ', '),
        'summary': (raw_data.get('summary') or '').replace('—', ', '),
        'steps': clean_steps,
        'followups': followups,
    }


def handle_chat(messages):
    is_first_turn = len(messages) == 1 and messages[0]['role'] == 'user'
    q_key = ' '.join(messages[0]['content'].lower().split())[:120] if is_first_turn else None
    if is_first_turn and q_key in CHAT_CACHE:
        return CHAT_CACHE[q_key]

    formatted_messages = [{'role': 'system', 'content': SYSTEM_PROMPT}]
    for m in messages:
        formatted_messages.append({'role': m['role'], 'content': m['content']})

    payload = {
        'messages': formatted_messages,
        'temperature': 1.0,
        'response_format': {
            'type': 'json_schema',
            'json_schema': {
                'name': 'brain_script',
                'strict': True,
                'schema': SCRIPT_SCHEMA
            }
        }
    }
    url = f'{AZURE_ENDPOINT}/openai/deployments/{AZURE_DEPLOYMENT}/chat/completions?api-version={AZURE_VERSION}'
    req = urllib.request.Request(
        url,
        data=json.dumps(payload).encode('utf-8'),
        headers={
            'Content-Type': 'application/json',
            'api-key': AZURE_KEY
        }
    )
    with urllib.request.urlopen(req, timeout=45) as resp:
        resp_data = json.loads(resp.read().decode('utf-8'))

    choice = resp_data.get('choices', [{}])[0]
    msg = choice.get('message', {})
    content = msg.get('content', '{}')
    parsed = json.loads(content)
    result = sanitize_chat_response(parsed)

    if is_first_turn and q_key and result.get('status') in ('ok', 'out_of_scope'):
        CHAT_CACHE[q_key] = result

    return result


class Handler(http.server.SimpleHTTPRequestHandler):
    protocol_version = 'HTTP/1.1'

    extensions_map = {
        **http.server.SimpleHTTPRequestHandler.extensions_map,
        '.webmanifest': 'application/manifest+json',
        '.svg': 'image/svg+xml',
    }

    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=ROOT, **kwargs)

    def send_json(self, code, payload, extra_headers=None):
        body = json.dumps(payload).encode()
        self.send_response(code)
        self.send_header('Content-Type', 'application/json')
        self.send_header('Cache-Control', 'no-store')
        for name, value in (extra_headers or {}).items():
            self.send_header(name, value)
        self.send_header('Content-Length', str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def local_host(self):
        # Blocks DNS-rebinding while allowing localhost by default.
        host = (self.headers.get('Host') or '').split(':')[0].lower()
        if host in ('localhost', '127.0.0.1', '0.0.0.0'):
            return True
        if not ALLOW_LAN:
            return False
        # Allow Tailscale CGNAT IPs (100.x.y.z), MagicDNS (.ts.net), and private LANs.
        if host.startswith('100.') or host.endswith('.ts.net') or host.startswith(('192.168.', '10.', '172.')):
            return True
        return False

    def end_headers(self):
        for name, value in SECURITY_HEADERS.items():
            self.send_header(name, value)
        self.send_header('Cache-Control', 'no-cache, no-store, must-revalidate')
        self.send_header('Pragma', 'no-cache')
        self.send_header('Expires', '0')
        super().end_headers()

    def send_head(self):
        # Serve the app and nothing else: no .env, .git, server.py or tools.
        path = urllib.parse.unquote(urllib.parse.urlparse(self.path).path)
        if not self.local_host() or not (path in PUBLIC_FILES or path.startswith('/src/') or path.startswith('/icons/')) or '/.' in path:
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
        allowed, retry = check_rate('ask', self.client_address[0])
        if not allowed:
            return self.send_json(429, {'status': 'error', 'error': 'rate limit exceeded', 'retryAfter': retry}, {'Retry-After': str(retry)})
        q = urllib.parse.parse_qs(parsed.query).get('q', [''])[0]
        try:
            self.send_json(200, ask(q))
        except Exception as e:  # noqa: BLE001
            self.log_error('ask failed: %s', e)
            self.send_json(502, {'status': 'error', 'error': 'The model could not be reached.'})

    def do_POST(self):
        parsed = urllib.parse.urlparse(self.path)
        if parsed.path == '/api/chat':
            if not self.local_host() or self.headers.get(CLIENT_HEADER) != '1':
                return self.send_json(403, {'status': 'error', 'error': 'forbidden'})
            length = int(self.headers.get('Content-Length', 0))
            if length > 65536:
                self.close_connection = True
                return self.send_json(413, {'status': 'error', 'error': 'payload too large'})
            body = self.rfile.read(length) if length > 0 else b''
            try:
                data = json.loads(body.decode('utf-8')) if body else {}
            except Exception:
                return self.send_json(400, {'status': 'error', 'error': 'invalid json'})

            allowed, retry = check_rate('chat', self.client_address[0])
            if not allowed:
                return self.send_json(429, {'status': 'error', 'error': 'rate limit exceeded', 'retryAfter': retry}, {'Retry-After': str(retry)})
            if not CHAT_ENABLED:
                return self.send_json(501, {'status': 'no_key'})

            messages = data.get('messages')
            if not isinstance(messages, list) or len(messages) == 0:
                return self.send_json(400, {'status': 'error', 'error': 'messages must be a non-empty array'})

            cleaned_messages = []
            for m in messages[-8:]:
                if not isinstance(m, dict) or m.get('role') not in ('user', 'assistant') or not isinstance(m.get('content'), str):
                    return self.send_json(400, {'status': 'error', 'error': 'invalid message format'})
                cleaned_messages.append({
                    'role': m['role'],
                    'content': m['content'][:500]
                })

            if not CHAT_SLOTS.acquire(blocking=False):
                return self.send_json(503, {'status': 'error', 'error': 'The chat service is busy. Please try again shortly.'}, {'Retry-After': '2'})
            try:
                res = handle_chat(cleaned_messages)
                return self.send_json(200, res)
            except Exception as e:  # noqa: BLE001
                print(f'[brain-explorer] chat failed: {e}')
                return self.send_json(502, {'status': 'error', 'error': 'Upstream model error'})
            finally:
                CHAT_SLOTS.release()

        self.send_error(404)


def run():
    global SYSTEM_PROMPT, SCRIPT_SCHEMA
    try:
        contract = load_ai_contract()
    except Exception as e:  # noqa: BLE001
        print(f'[brain-explorer] Cannot load AI contract: {e}')
        print('[brain-explorer] Run npm run catalog to generate src/content/ai-contract.json.')
        return
    SYSTEM_PROMPT = contract['systemPrompt']
    SCRIPT_SCHEMA = contract['scriptSchema']

    if ALLOW_LAN:
        print('[brain-explorer] WARNING: LAN access is enabled (ALLOW_LAN=1). Other devices on your network can reach this server.')

    for port in (PORT, PORT + 1):
        try:
            httpd = http.server.ThreadingHTTPServer((HOST, port), Handler)
        except OSError:
            print(f'[brain-explorer] Port {port} is busy.')
            continue
        print(f'[brain-explorer] http://localhost:{port}')
        print('[brain-explorer] Ask: ' + ('API key loaded from .env' if API_KEY else 'no TYPESAFE_API_KEY, free-text questions are off'))
        print('[brain-explorer] Chat: ' + (f'Azure OpenAI ({AZURE_DEPLOYMENT})' if CHAT_ENABLED else 'no Azure OpenAI keys, free-form chat is off'))
        print(f'[brain-explorer] Limits: ask {ASK_RATE_PER_MIN}/min {ASK_RATE_PER_DAY}/day, chat {CHAT_RATE_PER_MIN}/min {CHAT_RATE_PER_DAY}/day, {CHAT_MAX_CONCURRENT} concurrent chats')
        httpd.serve_forever()
        return


if __name__ == '__main__':
    run()
