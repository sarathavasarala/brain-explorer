// Cell tabs configuration for the 4 zoom levels of a cell type.

export default [
  { id: 'shape', label: 'Shape', scale: 'Shape & role', icon: 'cell' },
  { id: 'fires', label: 'Firing', scale: 'How it fires', icon: 'behaviour' },
  { id: 'lives', label: 'Location', scale: 'Where it lives', icon: 'region' },
  { id: 'chem', label: 'Chemistry', scale: 'Signals & receptors', icon: 'circuit' },
];

export function getCellTabs(cell) {
  if (cell?.group === 'glia') {
    return [
      { id: 'shape', label: 'Shape', scale: 'Shape & role', icon: 'cell' },
      { id: 'fires', label: 'Activity', scale: 'How it acts', icon: 'behaviour' },
      { id: 'lives', label: 'Location', scale: 'Where it lives', icon: 'region' },
      { id: 'chem', label: 'Chemistry', scale: 'Signals & receptors', icon: 'circuit' },
    ];
  }
  return [
    { id: 'shape', label: 'Shape', scale: 'Shape & role', icon: 'cell' },
    { id: 'fires', label: 'Firing', scale: 'How it fires', icon: 'behaviour' },
    { id: 'lives', label: 'Location', scale: 'Where it lives', icon: 'region' },
    { id: 'chem', label: 'Chemistry', scale: 'Signals & receptors', icon: 'circuit' },
  ];
}
