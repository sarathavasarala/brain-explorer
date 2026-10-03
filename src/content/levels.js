// The zoom ladder. Each level is a tab in the explainer and a key in a structure's `levels`.
// `scene` tells the 3D view how to behave at this level:
//   'focus'    highlight the structure
//   'activity' highlight it and ripple activity across it
//   'wiring'   highlight it, dim-light its partners and animate the connections
export default [
  { id: 'overview', label: 'The part', scale: 'Location & role', size: '~ centimetres', scene: 'focus', icon: 'region' },
  { id: 'connects', label: 'How it connects', scale: 'Signal routes', size: 'long-range wiring', scene: 'wiring', icon: 'circuit' },
  { id: 'cells', label: 'Down to cells', scale: 'Cells & chemistry', size: '~ 0.01 mm', scene: 'focus', icon: 'cell' },
];
