// Lightweight, provider-decoupled client telemetry service for Brain Explorer.
// Zero external dependencies. Tracks unique visits, active dwell time, and location context.

function generateId(len = 16) {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  const chars = '0123456789abcdef';
  let out = '';
  for (let i = 0; i < len; i++) {
    out += chars[Math.floor(Math.random() * chars.length)];
  }
  return out;
}

function getStoredId(storage, key) {
  try {
    let id = storage.getItem(key);
    if (!id) {
      id = generateId();
      storage.setItem(key, id);
    }
    return id;
  } catch {
    return generateId();
  }
}

// Default HTTP provider: posts JSON to a custom backend or local server.
// Only sends if an endpoint is explicitly configured or if running locally with server.py.
export class HttpBeaconProvider {
  constructor(endpoint) {
    this.endpoint = endpoint || (typeof window !== 'undefined' ? window.TELEMETRY_ENDPOINT : null);
    if (!this.endpoint) {
      const isLocal = typeof location !== 'undefined' && (location.hostname === 'localhost' || location.hostname === '127.0.0.1');
      if (isLocal) {
        this.endpoint = '/api/telemetry';
      }
    }
  }

  send(events) {
    if (!this.endpoint || !events || !events.length) return;
    const body = JSON.stringify({ events });
    if (typeof navigator !== 'undefined' && navigator.sendBeacon) {
      const blob = new Blob([body], { type: 'application/json' });
      const sent = navigator.sendBeacon(this.endpoint, blob);
      if (sent) return;
    }
    if (typeof fetch !== 'undefined') {
      fetch(this.endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body,
        keepalive: true,
      }).catch(() => {
        // Silently ignore telemetry transmission errors
      });
    }
  }
}

// Umami analytics provider.
// Works seamlessly with Umami Cloud (https://cloud.umami.is) or self-hosted Umami.
// Supports both the official script tag (window.umami) and direct API dispatch.
export class UmamiProvider {
  constructor(opts = {}) {
    const scriptEl = typeof document !== 'undefined' ? document.querySelector('script[data-website-id]') : null;
    this.websiteId = opts.websiteId || (typeof window !== 'undefined' ? window.UMAMI_WEBSITE_ID : '') || scriptEl?.dataset?.websiteId || '';
    this.hostUrl = (opts.hostUrl || (typeof window !== 'undefined' ? window.UMAMI_HOST_URL : '') || 'https://cloud.umami.is').replace(/\/+$/, '');
  }

  send(events) {
    if (!events || !events.length) return;

    // Use official Umami tracker script if loaded
    if (typeof window !== 'undefined' && window.umami && typeof window.umami.track === 'function') {
      for (const ev of events) {
        if (ev.type === 'pageview') {
          window.umami.track((props) => ({
            ...props,
            url: ev.path || location.hash || '#/',
            title: ev.title || 'Brain Explorer',
          }));
        } else if (ev.type === 'event') {
          window.umami.track(ev.event_name, ev.data || {});
        } else if (ev.type === 'duration') {
          window.umami.track('dwell_time', { path: ev.path, seconds: ev.duration });
        }
      }
      return;
    }

    // Direct HTTP API fallback (no script tag needed if websiteId is set)
    if (!this.websiteId) return;
    const endpoint = `${this.hostUrl}/api/send`;

    for (const ev of events) {
      const payload = {
        website: this.websiteId,
        hostname: typeof location !== 'undefined' ? location.hostname : 'brain-explorer',
        screen: ev.screen || '',
        language: ev.locale || '',
        url: ev.path || (typeof location !== 'undefined' ? location.hash || '#/' : '#/'),
        title: ev.title || 'Brain Explorer',
      };
      if (ev.type === 'event') {
        payload.name = ev.event_name;
        payload.data = ev.data || {};
      } else if (ev.type === 'duration') {
        payload.name = 'dwell_time';
        payload.data = { path: ev.path, seconds: ev.duration };
      }

      const body = JSON.stringify({ type: 'event', payload });
      if (typeof navigator !== 'undefined' && navigator.sendBeacon) {
        const blob = new Blob([body], { type: 'application/json' });
        navigator.sendBeacon(endpoint, blob);
      } else if (typeof fetch !== 'undefined') {
        fetch(endpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body,
          keepalive: true,
        }).catch(() => {});
      }
    }
  }
}

function resolveDefaultProvider() {
  const hasScript = typeof document !== 'undefined' && document.querySelector('script[data-website-id]');
  if (typeof window !== 'undefined' && (window.UMAMI_WEBSITE_ID || window.umami || hasScript)) {
    return new UmamiProvider();
  }
  return new HttpBeaconProvider();
}

export class TelemetryService {
  constructor(provider = resolveDefaultProvider()) {
    this.provider = provider;
    this.visitorId = typeof localStorage !== 'undefined' ? getStoredId(localStorage, 'be_visitor_id') : generateId();
    this.sessionId = typeof sessionStorage !== 'undefined' ? getStoredId(sessionStorage, 'be_session_id') : generateId();
    this.queue = [];
    this.currentView = null;
    this.activeTimeStart = null;
    this.accumulatedDuration = 0;
    this.isTabVisible = typeof document !== 'undefined' ? document.visibilityState === 'visible' : true;
    this.initListeners();
  }

  setProvider(provider) {
    this.provider = provider;
  }

  getEnvironmentContext() {
    let timezone = '';
    try {
      timezone = Intl.DateTimeFormat().resolvedOptions().timeZone || '';
    } catch {
      timezone = '';
    }

    return {
      timezone,
      locale: typeof navigator !== 'undefined' ? (navigator.language || '') : '',
      screen: typeof window !== 'undefined' ? `${window.innerWidth}x${window.innerHeight}` : '',
      referrer: typeof document !== 'undefined' ? (document.referrer || '') : '',
      user_agent: typeof navigator !== 'undefined' ? (navigator.userAgent || '') : '',
    };
  }

  startActiveTimer() {
    if (this.isTabVisible && this.activeTimeStart === null) {
      this.activeTimeStart = Date.now();
    }
  }

  pauseActiveTimer() {
    if (this.activeTimeStart !== null) {
      this.accumulatedDuration += (Date.now() - this.activeTimeStart) / 1000;
      this.activeTimeStart = null;
    }
  }

  getActiveDuration() {
    let dur = this.accumulatedDuration;
    if (this.isTabVisible && this.activeTimeStart !== null) {
      dur += (Date.now() - this.activeTimeStart) / 1000;
    }
    return Math.round(dur * 10) / 10;
  }

  initListeners() {
    if (typeof document === 'undefined') return;

    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'hidden') {
        this.isTabVisible = false;
        this.pauseActiveTimer();
        this.flush();
      } else {
        this.isTabVisible = true;
        this.startActiveTimer();
      }
    });

    if (typeof window !== 'undefined') {
      window.addEventListener('pagehide', () => {
        this.pauseActiveTimer();
        this.flushCurrentViewDuration();
        this.flush();
      });
      window.addEventListener('beforeunload', () => {
        this.pauseActiveTimer();
        this.flushCurrentViewDuration();
        this.flush();
      });
    }

    this.startActiveTimer();
  }

  flushCurrentViewDuration() {
    if (!this.currentView) return;
    const duration = this.getActiveDuration();
    if (duration > 0.3) {
      this.queue.push({
        type: 'duration',
        visitor_id: this.visitorId,
        session_id: this.sessionId,
        path: this.currentView.path,
        title: this.currentView.title || '',
        duration,
        timestamp: new Date().toISOString(),
        ...this.getEnvironmentContext(),
      });
    }
    this.accumulatedDuration = 0;
    this.activeTimeStart = this.isTabVisible ? Date.now() : null;
  }

  pageView(viewData = {}) {
    this.flushCurrentViewDuration();

    const path = viewData.path || (typeof location !== 'undefined' ? location.hash || '#/' : '#/');
    this.currentView = {
      path,
      title: viewData.title || document?.title || 'Brain Explorer',
      type: viewData.type || '',
      id: viewData.id || '',
      level: viewData.level || '',
    };

    this.queue.push({
      type: 'pageview',
      visitor_id: this.visitorId,
      session_id: this.sessionId,
      path: this.currentView.path,
      title: this.currentView.title,
      extra: {
        view_type: this.currentView.type,
        target_id: this.currentView.id,
        level: this.currentView.level,
      },
      timestamp: new Date().toISOString(),
      ...this.getEnvironmentContext(),
    });

    this.flush();
  }

  event(eventName, data = {}) {
    this.queue.push({
      type: 'event',
      visitor_id: this.visitorId,
      session_id: this.sessionId,
      event_name: eventName,
      path: this.currentView?.path || (typeof location !== 'undefined' ? location.hash : '#/'),
      data,
      timestamp: new Date().toISOString(),
      ...this.getEnvironmentContext(),
    });
    this.flush();
  }

  flush() {
    if (!this.queue.length) return;
    const hasScript = typeof document !== 'undefined' && document.querySelector('script[data-website-id]');
    if (this.provider instanceof HttpBeaconProvider && typeof window !== 'undefined' && (window.umami || window.UMAMI_WEBSITE_ID || hasScript)) {
      this.provider = new UmamiProvider();
    }
    if (!this.provider) return;
    const items = [...this.queue];
    this.queue = [];
    try {
      this.provider.send(items);
    } catch {
      // Re-queue items if transmission fails
      this.queue.unshift(...items);
    }
  }
}

export const telemetry = new TelemetryService();
