// Line icons, 24×24, 1.6 stroke, drawn for this app.
const wrap = (d, size = 18) =>
  `<svg class="icon" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${d}</svg>`;

const paths = {
  reset: '<path d="M4 12a8 8 0 1 0 2.4-5.7"/><path d="M4 4v4.5h4.5"/>',
  slice: '<rect x="4" y="4" width="16" height="16" rx="3"/><path d="M12 2.5v19" stroke-dasharray="2 2.2"/>',
  spin: '<ellipse cx="12" cy="12" rx="9" ry="4"/><circle cx="12" cy="12" r="2"/><path d="M19.5 9.3l1.4 1.2-1.8.5"/>',
  play: '<path d="M8 5.5v13l10-6.5z"/>',
  pause: '<path d="M8.5 5.5v13M15.5 5.5v13"/>',
  prev: '<path d="M15 6l-6 6 6 6"/>',
  next: '<path d="M9 6l6 6-6 6"/>',
  search: '<circle cx="11" cy="11" r="6"/><path d="M20 20l-4.5-4.5"/>',
  close: '<path d="M6 6l12 12M18 6L6 18"/>',
  region: '<path d="M7.5 18c-2.5 0-4-1.8-4-4 0-1.4.7-2.5 1.7-3.1C5 7.6 7.4 5 10.4 5c1.4 0 2.6.5 3.5 1.2.7-.4 1.5-.6 2.3-.6 2.6 0 4.3 2 4.3 4.5 0 .5-.1 1-.2 1.5.4.6.7 1.3.7 2 0 2.4-2 4.4-4.5 4.4z"/><path d="M11 5.3c-.8 2 .2 3.5 2 4M7.4 11c1.4-.2 2.6.6 3 2M15.5 12.5c-.5 1.4-1.8 2.2-3.4 2.2"/>',
  behaviour: '<path d="M2.5 12h4l2-5 3.5 11 3-8 1.5 2h5"/>',
  circuit: '<circle cx="5.5" cy="7" r="2.2"/><circle cx="18.5" cy="6" r="2.2"/><circle cx="12" cy="18" r="2.2"/><path d="M7.6 7.3l8.7-.9M6.8 8.9l4.1 7.2M17.4 8l-4.3 8"/>',
  cell: '<circle cx="12" cy="12" r="3"/><path d="M12 9V3.5M10 3.8l2 1.7 2-1.7M9.4 13.4L4.5 17M5.2 14.4l-.7 2.6 2.7.2M14.6 13.4l2.4 2.1M15 12h6.5"/>',
  in: '<path d="M20 12H6"/><path d="M11 7l-5 5 5 5"/>',
  out: '<path d="M4 12h14"/><path d="M13 7l5 5-5 5"/>',
  both: '<path d="M4 12h16"/><path d="M8 8l-4 4 4 4M16 8l4 4-4 4"/>',
  hand: '<path d="M8 13V5.5a1.5 1.5 0 0 1 3 0V11M11 10.5V4.5a1.5 1.5 0 0 1 3 0v6M14 10.5V6a1.5 1.5 0 0 1 3 0v7c0 4-2.5 7-6 7-2.5 0-4-1.2-5.3-3.3L4 13.5a1.5 1.5 0 0 1 2.5-1.6L8 14"/>',
  alert: '<path d="M12 4l9 16H3z"/><path d="M12 10v4.5M12 17.4v.1"/>',
  pathway: '<circle cx="5" cy="18" r="2"/><circle cx="19" cy="6" r="2"/><path d="M7 18h5a3 3 0 0 0 3-3V9a3 3 0 0 1 3-3"/>',
  layers: '<path d="M12 4l9 4.5-9 4.5-9-4.5z"/><path d="M3 13l9 4.5 9-4.5"/>',
  copy: '<rect x="9" y="9" width="12" height="12" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>',
  key: '<circle cx="7.5" cy="15.5" r="4.5"/><path d="M10.7 12.3L20 3M16 7l2 2M13 10l2 2"/>',
  check: '<path d="M20 6L9 17l-5-5"/>',
};

export function icon(name, size) {
  return wrap(paths[name] || '', size);
}
