// Points outside the brain that pathways can start or end at.
// position uses brain coordinates (+x = person's left, +y = up, +z = front).
// flipWhenSliced flips x when sliced so single-organ anchors stay visible on the cut face without duplicating in normal views.
export default [
  { id: 'eye', name: 'Eye', position: [0.14, -0.13, 0.9], color: '#bfe9ff', mirror: true, size: 0.045 },
  { id: 'ear', name: 'Inner ear', position: [0.74, -0.2, -0.02], color: '#c9fff1', flipWhenSliced: true, size: 0.035 },
  { id: 'hand', name: 'Hand', position: [0.9, -0.95, 0.35], color: '#ffe3c2', flipWhenSliced: true, size: 0.05 },
  { id: 'thyroid', name: 'Thyroid', position: [0, -1.2, 0.25], color: '#34d399', size: 0.06, body: true },
  { id: 'heart', name: 'Heart', position: [0, -1.9, 0.2], color: '#f87171', size: 0.08, body: true },
  { id: 'stomach', name: 'Stomach', position: [0, -2.35, 0.25], color: '#fb923c', size: 0.09, body: true },
  { id: 'adrenal', name: 'Adrenal glands', position: [0.18, -2.6, -0.1], color: '#f59e0b', size: 0.055, mirror: true, body: true },
  { id: 'fat', name: 'Fat tissue', position: [0, -2.9, 0.35], color: '#a3e635', size: 0.09, body: true },
  { id: 'gonads', name: 'Ovaries or testes', position: [0, -3.4, 0.2], color: '#ec4899', size: 0.07, mirror: true, body: true },
];
