// Cell tabs configuration for the 4 zoom levels of a cell type.

export default [
  { id: 'shape', label: 'Shape', scale: 'Its shape' },
  { id: 'fires', label: 'Firing', scale: 'How it fires' },
  { id: 'lives', label: 'Location', scale: 'Where it lives' },
  { id: 'chem', label: 'Chemistry', scale: 'Its chemistry' },
];

export function getCellTabs(cell) {
  if (cell?.group === 'glia') {
    return [
      { id: 'shape', label: 'Shape', scale: 'Its shape' },
      { id: 'fires', label: 'Activity', scale: 'How it acts' },
      { id: 'lives', label: 'Location', scale: 'Where it lives' },
      { id: 'chem', label: 'Chemistry', scale: 'Its chemistry' },
    ];
  }
  return [
    { id: 'shape', label: 'Shape', scale: 'Its shape' },
    { id: 'fires', label: 'Firing', scale: 'How it fires' },
    { id: 'lives', label: 'Location', scale: 'Where it lives' },
    { id: 'chem', label: 'Chemistry', scale: 'Its chemistry' },
  ];
}
