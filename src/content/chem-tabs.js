export default [
  { id: 'overview', label: 'Overview', scale: 'What it is', icon: 'region' },
  { id: 'tracts', label: 'Pathways', scale: 'Where it goes', icon: 'pathway' },
  { id: 'synapse', label: 'Synapse', scale: 'Made, used, cleared', icon: 'circuit' },
  { id: 'medicine', label: 'Medicine', scale: 'When it goes wrong', icon: 'alert' },
];

export function getChemTabs(chem) {
  if (chem?.group === 'hormone') {
    return [
      { id: 'overview', label: 'Overview', scale: 'What it is', icon: 'region' },
      { id: 'axis', label: 'The chain', scale: 'Gland to gland', icon: 'pathway' },
      { id: 'synapse', label: 'Synapse', scale: 'Made, used, cleared', icon: 'circuit' },
      { id: 'medicine', label: 'Medicine', scale: 'When it goes wrong', icon: 'alert' },
    ];
  }
  return [
    { id: 'overview', label: 'Overview', scale: 'What it is', icon: 'region' },
    { id: 'tracts', label: 'Pathways', scale: 'Where it goes', icon: 'pathway' },
    { id: 'synapse', label: 'Synapse', scale: 'Made, used, cleared', icon: 'circuit' },
    { id: 'medicine', label: 'Medicine', scale: 'When it goes wrong', icon: 'alert' },
  ];
}
