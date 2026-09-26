// Cerebral cortex: the four lobes and the named areas inside them.
//
// Cortical areas don't have their own geometry. They are "views" into one shared
// cortex point cloud, chosen by `shape.test(p)`. The point `p` has:
//   p.x, p.y, p.z   position (+x = person's left, +y = up, +z = front)
//   p.ax            |x|, distance from the midline
//   p.side          'left' | 'right'
//   p.lobe          'frontal' | 'parietal' | 'temporal' | 'occipital'
//   p.medial        true on the flat inner wall facing the other hemisphere
//   p.central       z position of the central sulcus at this height (frontal/parietal border)
//
// All text fields are written for a beginner. See CONTENT_PROMPT.md for the full schema.

import { callosumY } from '../../scene/shapes.js';

export default [
  // ---------------------------------------------------------------- frontal
  {
    id: 'frontal-lobe',
    name: 'Frontal lobe',
    group: 'cortex',
    color: '#e05cff',
    shape: { type: 'cortex', test: (p) => p.lobe === 'frontal' },
    view: 'left-front',
    tagline: 'Planning, deciding and moving.',
    levels: {
      connects: {
        connections: [
          { id: 'parietal-lobe', dir: 'both' },
          { id: 'thalamus', dir: 'both' },
          { id: 'striatum', dir: 'out' },
        ],
      },
    },
  },
  {
    id: 'prefrontal-cortex',
    name: 'Prefrontal cortex',
    parent: 'frontal-lobe',
    group: 'cortex',
    color: '#ff6ad5',
    shape: { type: 'cortex', test: (p) => p.lobe === 'frontal' && p.z > 0.3 },
    view: 'left-front',
    tagline: 'Keeps goals in mind and puts the brakes on impulses.',
    levels: {
      connects: {
        connections: [
          { id: 'thalamus', dir: 'both' },
          { id: 'striatum', dir: 'out' },
          { id: 'amygdala', dir: 'both' },
          { id: 'hippocampus', dir: 'in' },
          { id: 'posterior-parietal', dir: 'both' },
        ],
      },
      cells: { diagram: 'cortical-column', synapse: 'dopamine' },
    },
  },
  {
    id: 'motor-cortex',
    name: 'Primary motor cortex',
    parent: 'frontal-lobe',
    group: 'cortex',
    color: '#ff4f7b',
    shape: { type: 'cortex', test: (p) => p.lobe === 'frontal' && p.z < p.central + 0.085 && p.y > -0.02 },
    view: 'left',
    tagline: 'Sends the final "go" signal to your muscles.',
    levels: {
      connects: {
        connections: [
          { id: 'spinal-cord', dir: 'out' },
          { id: 'somatosensory-cortex', dir: 'both' },
          { id: 'thalamus', dir: 'in' },
          { id: 'pons', dir: 'out' },
        ],
      },
      cells: { diagram: 'cortical-column', synapse: 'glutamate' },
    },
  },
  {
    id: 'brocas-area',
    name: "Broca's area",
    parent: 'frontal-lobe',
    group: 'cortex',
    color: '#ffb35c',
    shape: {
      type: 'cortex',
      test: (p) => p.side === 'left' && p.lobe === 'frontal' && !p.medial && p.z > 0.16 && p.z < 0.42 && p.y > -0.1 && p.y < 0.13 && p.ax > 0.3,
    },
    view: 'left',
    tagline: 'Turns thoughts into spoken sentences.',
    levels: {
      connects: {
        connections: [
          { id: 'wernickes-area', dir: 'both' },
          { id: 'motor-cortex', dir: 'out' },
        ],
      },
      cells: { diagram: 'cortical-column', synapse: 'glutamate' },
    },
  },

  // ---------------------------------------------------------------- parietal
  {
    id: 'parietal-lobe',
    name: 'Parietal lobe',
    group: 'cortex',
    color: '#6f86ff',
    shape: { type: 'cortex', test: (p) => p.lobe === 'parietal' },
    view: 'left-back',
    tagline: 'Touch, body sense and where things are in space.',
    levels: {
      connects: {
        connections: [
          { id: 'frontal-lobe', dir: 'both' },
          { id: 'occipital-lobe', dir: 'in' },
          { id: 'thalamus', dir: 'both' },
        ],
      },
    },
  },
  {
    id: 'somatosensory-cortex',
    name: 'Primary somatosensory cortex',
    parent: 'parietal-lobe',
    group: 'cortex',
    color: '#4fc3ff',
    shape: { type: 'cortex', test: (p) => p.lobe === 'parietal' && p.z > p.central - 0.085 && p.y > -0.02 },
    view: 'left',
    tagline: 'Where touch, temperature and pain from your body arrive.',
    levels: {
      connects: {
        connections: [
          { id: 'thalamus', dir: 'in' },
          { id: 'motor-cortex', dir: 'both' },
          { id: 'posterior-parietal', dir: 'out' },
        ],
      },
      cells: { diagram: 'cortical-column', synapse: 'glutamate' },
    },
  },
  {
    id: 'posterior-parietal',
    name: 'Posterior parietal cortex',
    parent: 'parietal-lobe',
    group: 'cortex',
    color: '#8a9bff',
    shape: { type: 'cortex', test: (p) => p.lobe === 'parietal' && p.z < p.central - 0.085 && p.y > 0.08 },
    view: 'left-back',
    tagline: 'Builds a map of space so you can reach and look.',
    levels: {
      connects: {
        connections: [
          { id: 'visual-cortex', dir: 'in' },
          { id: 'somatosensory-cortex', dir: 'in' },
          { id: 'prefrontal-cortex', dir: 'both' },
          { id: 'motor-cortex', dir: 'out' },
        ],
      },
      cells: { diagram: 'cortical-column', synapse: 'glutamate' },
    },
  },

  // ---------------------------------------------------------------- temporal
  {
    id: 'temporal-lobe',
    name: 'Temporal lobe',
    group: 'cortex',
    color: '#a67bff',
    shape: { type: 'cortex', test: (p) => p.lobe === 'temporal' },
    view: 'left',
    tagline: 'Hearing, language and recognising what things are.',
    levels: {
      connects: {
        connections: [
          { id: 'hippocampus', dir: 'both' },
          { id: 'amygdala', dir: 'both' },
          { id: 'occipital-lobe', dir: 'in' },
          { id: 'frontal-lobe', dir: 'both' },
        ],
      },
    },
  },
  {
    id: 'auditory-cortex',
    name: 'Primary auditory cortex',
    parent: 'temporal-lobe',
    group: 'cortex',
    color: '#5ce1e6',
    shape: { type: 'cortex', test: (p) => p.lobe === 'temporal' && p.y > -0.075 && p.z > -0.14 && p.z < 0.12 },
    view: 'left',
    tagline: 'The first stop in the cortex for sound.',
    levels: {
      connects: {
        connections: [
          { id: 'thalamus', dir: 'in' },
          { id: 'wernickes-area', dir: 'out' },
          { id: 'amygdala', dir: 'out' },
        ],
      },
      cells: { diagram: 'cortical-column', synapse: 'glutamate' },
    },
  },
  {
    id: 'wernickes-area',
    name: "Wernicke's area",
    parent: 'temporal-lobe',
    group: 'cortex',
    color: '#ffd166',
    shape: { type: 'cortex', test: (p) => p.side === 'left' && p.lobe === 'temporal' && p.y > -0.13 && p.z < -0.1 },
    view: 'left',
    tagline: 'Helps you understand the words you hear and read.',
    levels: {
      connects: {
        connections: [
          { id: 'auditory-cortex', dir: 'in' },
          { id: 'brocas-area', dir: 'both' },
          { id: 'visual-cortex', dir: 'in' },
        ],
      },
      cells: { diagram: 'cortical-column', synapse: 'glutamate' },
    },
  },

  // ---------------------------------------------------------------- occipital
  {
    id: 'occipital-lobe',
    name: 'Occipital lobe',
    group: 'cortex',
    color: '#c46bff',
    shape: { type: 'cortex', test: (p) => p.lobe === 'occipital' },
    view: 'left-back',
    tagline: 'The vision department at the back of your head.',
    levels: {
      connects: {
        connections: [
          { id: 'thalamus', dir: 'in' },
          { id: 'parietal-lobe', dir: 'out' },
          { id: 'temporal-lobe', dir: 'out' },
        ],
      },
    },
  },
  {
    id: 'visual-cortex',
    name: 'Primary visual cortex',
    parent: 'occipital-lobe',
    group: 'cortex',
    color: '#ff8ae2',
    shape: { type: 'cortex', test: (p) => p.lobe === 'occipital' && (p.z < -0.73 || (p.medial && p.y < 0.26 && p.y > -0.08)) },
    view: 'back',
    tagline: 'Breaks what you see into edges, lines and motion.',
    levels: {
      connects: {
        connections: [
          { id: 'thalamus', dir: 'in' },
          { id: 'posterior-parietal', dir: 'out' },
          { id: 'temporal-lobe', dir: 'out' },
        ],
      },
      cells: { diagram: 'cortical-column', synapse: 'glutamate' },
    },
  },

  // ---------------------------------------------------------------- hidden cortex
  {
    id: 'cingulate-cortex',
    name: 'Cingulate cortex',
    group: 'cortex',
    color: '#ff9f6b',
    shape: {
      type: 'cortex',
      test: (p) => p.medial && p.z > -0.42 && p.z < 0.4 && p.y > callosumY(p.z) + 0.03 && p.y < callosumY(p.z) + 0.15,
    },
    view: 'medial',
    slice: true,
    tagline: 'Notices mistakes and conflict, and links feelings to action.',
    levels: {
      connects: {
        connections: [
          { id: 'prefrontal-cortex', dir: 'both' },
          { id: 'amygdala', dir: 'both' },
          { id: 'thalamus', dir: 'in' },
          { id: 'hippocampus', dir: 'out' },
        ],
      },
      cells: { diagram: 'cortical-column', synapse: 'dopamine' },
    },
  },
  {
    id: 'insula',
    name: 'Insula',
    group: 'cortex',
    color: '#ff7a8a',
    shape: { type: 'ellipsoid', center: [0.43, -0.01, 0.07], radii: [0.025, 0.075, 0.15], count: 1800, pattern: 'fine', mirror: true, fill: 0.2 },
    view: 'left',
    tagline: 'Your sense of the inside of your body: heartbeat, hunger, disgust.',
    levels: {
      connects: {
        connections: [
          { id: 'amygdala', dir: 'both' },
          { id: 'cingulate-cortex', dir: 'both' },
          { id: 'thalamus', dir: 'in' },
          { id: 'prefrontal-cortex', dir: 'out' },
        ],
      },
      cells: { diagram: 'cortical-column', synapse: 'glutamate' },
    },
  },
];
