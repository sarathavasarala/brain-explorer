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

// Default HTTP provider: posts JSON to /api/telemetry using sendBeacon or fetch keepalive.
export class HttpBeaconProvider {
  constructor(endpoint = '/api/telemetry') {
    this.endpoint = endpoint;
  }

  send(events) {
    if (!events || !events.length) return;
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

export class TelemetryService {
  constructor(provider = new HttpBeaconProvider()) {
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
    if (!this.queue.length || !this.provider) return;
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
