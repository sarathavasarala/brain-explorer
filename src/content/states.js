// Definitions and metadata for 'What if' perturbation states.
// Standardizes state categories, 3D visual roles, and UI attributes.

export const STATE_KINDS = ['lesion', 'under', 'over', 'size'];

export const STATE_METADATA = {
  lesion: {
    id: 'lesion',
    label: 'Damaged or removed',
    role: 'losing_cells',
    color: '#8b9bb4',
    symbol: '⊝',
    tag: 'Lesion',
    question: "What happens if this part is damaged, cut off, or surgically removed?",
  },
  under: {
    id: 'under',
    label: 'Too quiet',
    role: 'less_active',
    color: '#5db0ff',
    symbol: '▾',
    tag: 'Hypoactive',
    question: "What happens if firing slows down or chemical supply runs dry?",
  },
  over: {
    id: 'over',
    label: 'Overdriven',
    role: 'more_active',
    color: '#ffaa33',
    symbol: '▴',
    tag: 'Hyperactive',
    question: "What happens if signals fire uncontrollably or without normal brakes?",
  },
  size: {
    id: 'size',
    label: 'Bigger or smaller',
    role: 'more_active',
    color: '#c488ff',
    symbol: '⤢',
    tag: 'Plasticity',
    question: "How does intensive training or atrophy physically reshape this area?",
  },
};
