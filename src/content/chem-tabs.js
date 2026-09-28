export default [
  { id: 'overview', label: 'Overview', scale: 'What it is' },
  { id: 'tracts', label: 'Pathways', scale: 'Where it goes' },
  { id: 'synapse', label: 'At the synapse', scale: 'Made, used, cleared' },
  { id: 'medicine', label: 'Drugs and disorders', scale: 'When it goes wrong' },
];

export function getChemTabs(chem) {
  if (chem?.group === 'hormone') {
    return [
      { id: 'overview', label: 'Overview', scale: 'What it is' },
      { id: 'axis', label: 'The chain', scale: 'Gland to gland' },
      { id: 'synapse', label: 'At the synapse', scale: 'Made, used, cleared' },
      { id: 'medicine', label: 'Drugs and disorders', scale: 'When it goes wrong' },
    ];
  }
  return [
    { id: 'overview', label: 'Overview', scale: 'What it is' },
    { id: 'tracts', label: 'Pathways', scale: 'Where it goes' },
    { id: 'synapse', label: 'At the synapse', scale: 'Made, used, cleared' },
    { id: 'medicine', label: 'Drugs and disorders', scale: 'When it goes wrong' },
  ];
}
