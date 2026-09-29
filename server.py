#!/usr/bin/env python3
"""
Brain Explorer local server.

Serves the static app and one endpoint, GET /api/ask?q=..., which asks Jev
(TypeSafe AI) how each part of the atlas is involved in a condition or state.
The API key is read from .env (TYPESAFE_API_KEY) and never sent to the browser.
Standard library only.
"""

import datetime
import http.server
import json
import os
import sqlite3
import urllib.parse
import urllib.request

HOST = '127.0.0.1'
PORT = int(os.environ.get('PORT', 5173))
ROOT = os.path.dirname(os.path.abspath(__file__))
DB_PATH = os.path.join(ROOT, 'telemetry.db')
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


def init_db():
    with sqlite3.connect(DB_PATH) as conn:
        conn.execute('PRAGMA journal_mode=WAL;')
        conn.execute('''
            CREATE TABLE IF NOT EXISTS telemetry_pageviews (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                timestamp TEXT,
                visitor_id TEXT,
                session_id TEXT,
                path TEXT,
                title TEXT,
                duration REAL DEFAULT 0,
                country TEXT,
                city TEXT,
                timezone TEXT,
                locale TEXT,
                screen TEXT,
                referrer TEXT,
                user_agent TEXT
            )
        ''')
        conn.execute('''
            CREATE TABLE IF NOT EXISTS telemetry_events (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                timestamp TEXT,
                visitor_id TEXT,
                session_id TEXT,
                event_name TEXT,
                path TEXT,
                data TEXT,
                country TEXT,
                city TEXT,
                timezone TEXT,
                locale TEXT
            )
        ''')
        conn.execute('CREATE INDEX IF NOT EXISTS idx_pv_visitor ON telemetry_pageviews(visitor_id)')
        conn.execute('CREATE INDEX IF NOT EXISTS idx_pv_session ON telemetry_pageviews(session_id)')
        conn.execute('CREATE INDEX IF NOT EXISTS idx_pv_path ON telemetry_pageviews(path)')
        conn.execute('CREATE INDEX IF NOT EXISTS idx_pv_timestamp ON telemetry_pageviews(timestamp)')
        conn.execute('CREATE INDEX IF NOT EXISTS idx_ev_name ON telemetry_events(event_name)')


def record_telemetry(events, client_meta):
    if not events:
        return
    if isinstance(events, dict):
        events = [events]
    with sqlite3.connect(DB_PATH) as conn:
        for ev in events:
            if not isinstance(ev, dict):
                continue
            ev_type = ev.get('type', 'event')
            visitor_id = str(ev.get('visitor_id') or '')[:64]
            session_id = str(ev.get('session_id') or '')[:64]
            ts = ev.get('timestamp') or datetime.datetime.now(datetime.timezone.utc).isoformat()
            path = str(ev.get('path') or '')[:200]
            title = str(ev.get('title') or '')[:200]
            tz = str(ev.get('timezone') or client_meta.get('timezone') or '')[:64]
            locale = str(ev.get('locale') or client_meta.get('locale') or '')[:32]
            screen = str(ev.get('screen') or '')[:32]
            referrer = str(ev.get('referrer') or '')[:500]
            ua = str(ev.get('user_agent') or client_meta.get('user_agent') or '')[:500]
            country = client_meta.get('country') or ''
            city = client_meta.get('city') or ''

            if ev_type == 'pageview':
                conn.execute('''
                    INSERT INTO telemetry_pageviews
                    (timestamp, visitor_id, session_id, path, title, duration, country, city, timezone, locale, screen, referrer, user_agent)
                    VALUES (?, ?, ?, ?, ?, 0, ?, ?, ?, ?, ?, ?, ?)
                ''', (ts, visitor_id, session_id, path, title, country, city, tz, locale, screen, referrer, ua))
            elif ev_type == 'duration':
                dur = float(ev.get('duration', 0))
                cur = conn.execute('''
                    SELECT id, duration FROM telemetry_pageviews
                    WHERE visitor_id = ? AND session_id = ? AND path = ?
                    ORDER BY id DESC LIMIT 1
                ''', (visitor_id, session_id, path))
                row = cur.fetchone()
                if row:
                    conn.execute('UPDATE telemetry_pageviews SET duration = duration + ? WHERE id = ?', (dur, row[0]))
                else:
                    conn.execute('''
                        INSERT INTO telemetry_pageviews
                        (timestamp, visitor_id, session_id, path, title, duration, country, city, timezone, locale, screen, referrer, user_agent)
                        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                    ''', (ts, visitor_id, session_id, path, title, dur, country, city, tz, locale, screen, referrer, ua))
            elif ev_type == 'event':
                name = str(ev.get('event_name') or '')[:64]
                data_str = json.dumps(ev.get('data') or {})[:2000]
                conn.execute('''
                    INSERT INTO telemetry_events
                    (timestamp, visitor_id, session_id, event_name, path, data, country, city, timezone, locale)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                ''', (ts, visitor_id, session_id, name, path, data_str, country, city, tz, locale))


def get_telemetry_stats():
    with sqlite3.connect(DB_PATH) as conn:
        conn.row_factory = sqlite3.Row
        cur = conn.cursor()

        cur.execute('''
            SELECT
                COUNT(*) as total_pageviews,
                COUNT(DISTINCT visitor_id) as unique_visitors,
                COUNT(DISTINCT session_id) as total_sessions,
                ROUND(COALESCE(SUM(duration), 0), 1) as total_dwell_seconds,
                ROUND(COALESCE(AVG(CASE WHEN duration > 0 THEN duration END), 0), 1) as avg_dwell_seconds
            FROM telemetry_pageviews
        ''')
        summary = dict(cur.fetchone() or {})

        cur.execute('''
            SELECT path, COUNT(*) as views, ROUND(COALESCE(AVG(CASE WHEN duration > 0 THEN duration END), 0), 1) as avg_dwell
            FROM telemetry_pageviews
            GROUP BY path
            ORDER BY views DESC
            LIMIT 20
        ''')
        top_paths = [dict(r) for r in cur.fetchall()]

        cur.execute('''
            SELECT COALESCE(NULLIF(country, ''), 'Local/Unknown') as name, COUNT(DISTINCT visitor_id) as count
            FROM telemetry_pageviews
            GROUP BY name
            ORDER BY count DESC
            LIMIT 10
        ''')
        top_countries = [dict(r) for r in cur.fetchall()]

        cur.execute('''
            SELECT COALESCE(NULLIF(timezone, ''), 'Unknown') as name, COUNT(DISTINCT visitor_id) as count
            FROM telemetry_pageviews
            GROUP BY name
            ORDER BY count DESC
            LIMIT 10
        ''')
        top_timezones = [dict(r) for r in cur.fetchall()]

        cur.execute('''
            SELECT SUBSTR(timestamp, 1, 10) as date, COUNT(*) as pageviews, COUNT(DISTINCT visitor_id) as visitors
            FROM telemetry_pageviews
            GROUP BY date
            ORDER BY date DESC
            LIMIT 14
        ''')
        daily = [dict(r) for r in cur.fetchall()]

        cur.execute('''
            SELECT event_name, COUNT(*) as count
            FROM telemetry_events
            GROUP BY event_name
            ORDER BY count DESC
            LIMIT 10
        ''')
        events = [dict(r) for r in cur.fetchall()]

        return {
            'status': 'ok',
            'summary': summary,
            'top_paths': top_paths,
            'countries': top_countries,
            'timezones': top_timezones,
            'daily': daily,
            'events': events,
        }


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

    def end_headers(self):
        self.send_header('Cache-Control', 'no-cache, no-store, must-revalidate')
        self.send_header('Pragma', 'no-cache')
        self.send_header('Expires', '0')
        super().end_headers()

    def send_head(self):
        # Serve the app and nothing else: no .env, .git, server.py or tools.
        path = urllib.parse.unquote(urllib.parse.urlparse(self.path).path)
        if not self.local_host() or not (path in PUBLIC_FILES or path.startswith('/src/')) or '/.' in path:
            self.send_error(404)
            return None
        return super().send_head()

    def do_GET(self):
        parsed = urllib.parse.urlparse(self.path)
        if parsed.path == '/api/telemetry/stats':
            if not self.local_host():
                return self.send_json(403, {'status': 'error', 'error': 'forbidden'})
            try:
                return self.send_json(200, get_telemetry_stats())
            except Exception as e:  # noqa: BLE001
                self.log_error('telemetry stats failed: %s', e)
                return self.send_json(500, {'status': 'error', 'error': 'failed to query telemetry stats'})

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

    def do_POST(self):
        parsed = urllib.parse.urlparse(self.path)
        if parsed.path == '/api/telemetry':
            if not self.local_host():
                return self.send_json(403, {'status': 'error', 'error': 'forbidden'})
            length = int(self.headers.get('Content-Length', 0))
            if length > 65536:
                return self.send_json(413, {'status': 'error', 'error': 'payload too large'})
            body = self.rfile.read(length) if length > 0 else b''
            try:
                data = json.loads(body.decode('utf-8')) if body else {}
            except Exception:
                return self.send_json(400, {'status': 'error', 'error': 'invalid json'})

            events = data.get('events', [data] if 'type' in data else [])
            client_meta = {
                'country': self.headers.get('CF-IPCountry') or self.headers.get('X-Vercel-IP-Country') or self.headers.get('X-Country-Code') or '',
                'city': self.headers.get('CF-IPCity') or self.headers.get('X-Vercel-IP-City') or '',
                'user_agent': self.headers.get('User-Agent') or '',
            }
            try:
                record_telemetry(events, client_meta)
                return self.send_json(200, {'status': 'ok'})
            except Exception as e:  # noqa: BLE001
                self.log_error('telemetry write failed: %s', e)
                return self.send_json(500, {'status': 'error', 'error': 'internal error'})

        self.send_error(404)


def run():
    init_db()
    for port in (PORT, PORT + 1):
        try:
            httpd = http.server.ThreadingHTTPServer((HOST, port), Handler)
        except OSError:
            print(f'[brain-explorer] Port {port} is busy.')
            continue
        print(f'[brain-explorer] http://localhost:{port}')
        print('[brain-explorer] Ask: ' + ('API key loaded from .env' if API_KEY else 'no TYPESAFE_API_KEY, free-text questions are off'))
        print(f'[brain-explorer] Telemetry: enabled ({DB_PATH})')
        httpd.serve_forever()
        return


if __name__ == '__main__':
    run()
