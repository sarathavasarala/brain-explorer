// Definitions and metadata for 'What if' perturbation states.
// Standardizes state categories, 3D visual roles, and UI attributes.

export const STATE_KINDS = ['lesion', 'under', 'over', 'size'];

export const STATE_METADATA = {
  lesion: {
    id: 'lesion',
    label: 'is damaged or removed',
    role: 'losing_cells',
    question: 'What changes when this part is lost?',
  },
  under: {
    id: 'under',
    label: 'goes quiet',
    role: 'less_active',
    question: 'What happens when firing slows down?',
  },
  over: {
    id: 'over',
    label: 'goes into overdrive',
    role: 'more_active',
    question: 'What happens when signals fire uncontrollably?',
  },
  size: {
    id: 'size',
    label: 'is reshaped',
    role: 'more_active',
    question: 'How does intensive training or rewiring reshape this area?',
  },
};

export function roleForState(st) {
  if (!st) return 'typical';
  return st.look || STATE_METADATA[st.kind]?.role || 'more_active';
}
