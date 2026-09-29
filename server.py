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


def build_system_prompt():
    lines = [
        "You are the narrator of Brain Explorer, an interactive 3D atlas of the human brain.",
        "The user is viewing a 3D holographic point-cloud model of the brain. Each step in your script dynamically lights up brain regions, animates signals along neural pathways, and changes camera views.",
        "",
        "Available brain structures (use these ids in parts, focus, route, or {{id}} links):",
    ]
    for s in CATALOG.get('structures', []):
        lines.append(f"- {s['id']}: {s['name']} ({s.get('tagline', '')})")
    lines.append("\nAvailable body anchors (use for sensory inputs, motor outputs, or endocrine organs):")
    for a in CATALOG.get('anchors', []):
        lines.append(f"- {a['id']}: {a['name']}")
    lines.append("\nAvailable chemical messengers (use for the chemical field):")
    for c in CATALOG.get('chemicals', []):
        lines.append(f"- {c['id']}: {c['name']} [{c.get('group', '')}] ({c.get('tagline', '')})")
    lines.append("\nAvailable glossary terms (ONLY use [[term]] or [[term|shown text]] for these terms):")
    lines.append(", ".join(CATALOG.get('glossary', [])))
    lines.extend([
        "",
        "Step structure and fields:",
        "- title: Short descriptive step title.",
        "- text: 2 to 4 sentences explaining this step like an unfolding story. Plain, warm, concrete.",
        "- parts: Array of { id, role } when activity goes up or down. Roles: more_active, less_active, typical, involved, cut_off, losing_cells.",
        "- route: Array of { from, to } connecting regions when a signal travels from one part to another.",
        "- chemical: Chemical id when a messenger (e.g. dopamine, melatonin, noradrenaline) is central to this step.",
        "- view: Camera angle. Options: 'left', 'left-front', 'left-back', 'medial', 'back', 'below', 'body'. Use 'medial' + slice: true for deep midline structures (hippocampus, hypothalamus, etc.). Use 'body' + body: true for hormone steps that reach organs (thyroid, heart, adrenal, etc.).",
        "- slice: true to slice the brain open to view inner structures. Do not slice when routing to or focusing outer cortical areas (auditory-cortex, visual-cortex, motor-cortex) because slicing cuts away the outer cortex. Use slice: false with lateral views (left, left-front) when showing cortical destinations.",
        "- body: true to show the body silhouette when endocrine signals travel to visceral organs.",
        "",
        "Storytelling and Narrative Rules:",
        "1. Build a coherent story in order: 2 to 6 steps. Each step handles one clear idea.",
        "2. In each step, light only a few relevant parts. Do not light the whole brain at once.",
        "3. Plain, warm, and concrete tone. Use familiar physical analogies (e.g. catching keys, reaching for a mug).",
        "4. Use 'about' or 'roughly' for figures. Never use false precision.",
        "5. STRICT PROHIBITION: NO EM DASHES. Never use the '—' character. Use commas, periods, or parentheses.",
        "6. STRICT PROHIBITION: NO HYPE OR FILLER WORDS. Avoid 'fascinating', 'incredible', 'remarkable', 'delve', 'intricate', 'vital', 'complex interplay'.",
        "7. Mention a part with {{id}} at least once in the step text where it lights up.",
        "8. Be honest when science is debated (e.g. 'researchers still debate...').",
        "9. Followups: Provide exactly 3 short, intriguing follow-up questions.",
        "10. Out of scope / Greetings / Conversational:",
        "    If the query is a greeting (such as 'hey', 'hello', 'hi'), conversational chit-chat, unrelated to the brain, mind, or body, or asks for personal medical advice:",
        "    Set status: 'out_of_scope', steps: [], title: 'Ask about how the brain works', and write a warm, friendly summary welcoming them, explaining that Brain Explorer shows what the brain is doing in 3D (like sleep, caffeine, panic, music chills, or memory), and inviting them to ask a brain question.",
    ])
    return "\n".join(lines)


SYSTEM_PROMPT = build_system_prompt()


def build_script_schema():
    step_schema = {
        'type': 'object',
        'properties': {
            'title': {'type': 'string'},
            'text': {'type': 'string'},
            'focus': {
                'type': ['array', 'null'],
                'items': {'type': 'string', 'enum': REGION_IDS}
            },
            'parts': {
                'type': ['array', 'null'],
                'items': {
                    'type': 'object',
                    'properties': {
                        'id': {'type': 'string', 'enum': REGION_IDS},
                        'role': {'type': 'string', 'enum': ROLES_LIST}
                    },
                    'required': ['id', 'role'],
                    'additionalProperties': False
                }
            },
            'route': {
                'type': ['array', 'null'],
                'items': {
                    'type': 'object',
                    'properties': {
                        'from': {'type': 'string', 'enum': REGION_IDS},
                        'to': {'type': 'string', 'enum': REGION_IDS}
                    },
                    'required': ['from', 'to'],
                    'additionalProperties': False
                }
            },
            'view': {
                'type': ['string', 'null'],
                'enum': VIEWS_LIST + [None]
            },
            'slice': {'type': ['boolean', 'null']},
            'chemical': {
                'type': ['string', 'null'],
                'enum': CHEMICAL_IDS + [None]
            },
            'body': {'type': ['boolean', 'null']}
        },
        'required': ['title', 'text', 'focus', 'parts', 'route', 'view', 'slice', 'chemical', 'body'],
        'additionalProperties': False
    }

    return {
        'type': 'object',
        'properties': {
            'status': {
                'type': 'string',
                'enum': ['ok', 'out_of_scope']
            },
            'title': {'type': 'string'},
            'summary': {'type': 'string'},
            'steps': {
                'type': 'array',
                'items': step_schema
            },
            'followups': {
                'type': 'array',
                'items': {'type': 'string'}
            }
        },
        'required': ['status', 'title', 'summary', 'steps', 'followups'],
        'additionalProperties': False
    }


SCRIPT_SCHEMA = build_script_schema()
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
        if parsed.path == '/api/chat':
            if not self.local_host() or self.headers.get(CLIENT_HEADER) != '1':
                return self.send_json(403, {'status': 'error', 'error': 'forbidden'})
            if not CHAT_ENABLED:
                return self.send_json(501, {'status': 'no_key'})
            length = int(self.headers.get('Content-Length', 0))
            if length > 65536:
                return self.send_json(413, {'status': 'error', 'error': 'payload too large'})
            body = self.rfile.read(length) if length > 0 else b''
            try:
                data = json.loads(body.decode('utf-8')) if body else {}
            except Exception:
                return self.send_json(400, {'status': 'error', 'error': 'invalid json'})

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

            try:
                res = handle_chat(cleaned_messages)
                return self.send_json(200, res)
            except Exception as e:  # noqa: BLE001
                print(f'[brain-explorer] chat failed: {e}')
                return self.send_json(502, {'status': 'error', 'error': 'Upstream model error'})

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
        print('[brain-explorer] Chat: ' + (f'Azure OpenAI ({AZURE_DEPLOYMENT})' if CHAT_ENABLED else 'no Azure OpenAI keys, free-form chat is off'))
        print(f'[brain-explorer] Telemetry: enabled ({DB_PATH})')
        httpd.serve_forever()
        return


if __name__ == '__main__':
    run()
