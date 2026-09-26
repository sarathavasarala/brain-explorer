// Deep structures: tucked under the cortex, in the middle of the brain.
// Shapes use primitives from src/scene/shapes.js. `mirror: true` = one on each side.

import { callosumY } from '../../scene/shapes.js';

export default [
  {
    id: 'thalamus',
    name: 'Thalamus',
    group: 'deep',
    color: '#5fd4ff',
    shape: { type: 'ellipsoid', center: [0.075, 0.05, -0.07], radii: [0.065, 0.07, 0.125], count: 2600, pattern: 'fine', mirror: true, fill: 0.18 },
    view: 'left',
    tagline: 'The relay station that passes almost every sense on to the cortex.',
    levels: {
      connects: {
        connections: [
          { id: 'visual-cortex', dir: 'out' },
          { id: 'somatosensory-cortex', dir: 'out' },
          { id: 'auditory-cortex', dir: 'out' },
          { id: 'prefrontal-cortex', dir: 'both' },
          { id: 'motor-cortex', dir: 'out' },
          { id: 'globus-pallidus', dir: 'in' },
        ],
      },
      cells: { diagram: 'thalamic-relay', synapse: 'glutamate' },
    },
  },
  {
    id: 'hypothalamus',
    name: 'Hypothalamus',
    group: 'deep',
    color: '#ff8fcf',
    shape: { type: 'ellipsoid', center: [0.028, -0.07, 0.06], radii: [0.03, 0.04, 0.055], count: 1100, pattern: 'fine', mirror: true, fill: 0.25 },
    view: 'left',
    tagline: 'Runs the body: hunger, thirst, temperature, sleep and hormones.',
    levels: {
      connects: {
        connections: [
          { id: 'amygdala', dir: 'in' },
          { id: 'hippocampus', dir: 'in' },
          { id: 'medulla', dir: 'out' },
          { id: 'thalamus', dir: 'out' },
        ],
      },
      cells: { diagram: 'neuromodulator', synapse: 'oxytocin' },
    },
  },
  {
    id: 'striatum',
    name: 'Striatum',
    group: 'deep',
    color: '#3fe0c5',
    shape: {
      mirror: true,
      parts: [
        {
          type: 'tube',
          path: [[0.13, 0.05, 0.3], [0.15, 0.16, 0.16], [0.17, 0.2, -0.02], [0.2, 0.16, -0.18], [0.26, 0.05, -0.25], [0.3, -0.06, -0.16]],
          radius: [[0, 0.065], [0.3, 0.04], [0.7, 0.02], [1, 0.012]],
          count: 2200, pattern: 'rings', fill: 0.15,
        },
        { type: 'ellipsoid', center: [0.235, 0.02, 0.08], radii: [0.045, 0.085, 0.14], count: 1800, pattern: 'fine', fill: 0.2 },
      ],
    },
    view: 'left',
    tagline: 'Learns habits and helps pick which action to do next.',
    levels: {
      connects: {
        connections: [
          { id: 'prefrontal-cortex', dir: 'in' },
          { id: 'motor-cortex', dir: 'in' },
          { id: 'substantia-nigra', dir: 'in' },
          { id: 'globus-pallidus', dir: 'out' },
        ],
      },
      cells: { diagram: 'basal-ganglia', synapse: 'dopamine' },
    },
  },
  {
    id: 'globus-pallidus',
    name: 'Globus pallidus',
    group: 'deep',
    color: '#9cf6a8',
    shape: {
      mirror: true,
      parts: [
        { type: 'ellipsoid', center: [0.18, 0.0, 0.05], radii: [0.03, 0.055, 0.085], count: 1000, pattern: 'fine', fill: 0.25 },
        { type: 'ellipsoid', center: [0.1, -0.1, -0.05], radii: [0.025, 0.015, 0.035], count: 300, fill: 1 },
      ],
    },
    view: 'left',
    tagline: 'The brake pedal on movement, released only for the right action.',
    levels: {
      connects: {
        connections: [
          { id: 'striatum', dir: 'in' },
          { id: 'thalamus', dir: 'out' },
          { id: 'substantia-nigra', dir: 'both' },
        ],
      },
      cells: { diagram: 'basal-ganglia', synapse: 'gaba' },
    },
  },
  {
    id: 'substantia-nigra',
    name: 'Substantia nigra',
    group: 'deep',
    color: '#ffcf5c',
    shape: { type: 'ellipsoid', center: [0.07, -0.14, -0.1], radii: [0.04, 0.014, 0.05], count: 700, mirror: true, fill: 1 },
    view: 'left',
    tagline: 'Makes the dopamine that keeps movement smooth.',
    levels: {
      connects: {
        connections: [
          { id: 'striatum', dir: 'out' },
          { id: 'globus-pallidus', dir: 'both' },
          { id: 'thalamus', dir: 'out' },
        ],
      },
      cells: { diagram: 'basal-ganglia', synapse: 'dopamine' },
    },
  },
  {
    id: 'hippocampus',
    name: 'Hippocampus',
    group: 'deep',
    color: '#ffc857',
    shape: {
      type: 'tube',
      path: [[0.28, -0.2, 0.11], [0.295, -0.17, -0.02], [0.27, -0.12, -0.16], [0.2, -0.02, -0.27]],
      radius: [[0, 0.045], [0.6, 0.03], [1, 0.014]],
      count: 2200, pattern: 'rings', mirror: true, fill: 0.15,
    },
    view: 'left',
    tagline: 'Turns what happened today into memories you can recall later.',
    levels: {
      connects: {
        connections: [
          { id: 'temporal-lobe', dir: 'both' },
          { id: 'hypothalamus', dir: 'out' },
          { id: 'prefrontal-cortex', dir: 'out' },
          { id: 'amygdala', dir: 'both' },
        ],
      },
      cells: { diagram: 'hippocampal-loop', synapse: 'glutamate' },
    },
  },
  {
    id: 'amygdala',
    name: 'Amygdala',
    group: 'deep',
    color: '#ff6b5e',
    shape: { type: 'ellipsoid', center: [0.27, -0.19, 0.18], radii: [0.045, 0.045, 0.05], count: 1000, pattern: 'fine', mirror: true, fill: 0.3 },
    view: 'left',
    tagline: 'The alarm that flags danger and gives memories emotional weight.',
    levels: {
      connects: {
        connections: [
          { id: 'thalamus', dir: 'in' },
          { id: 'hypothalamus', dir: 'out' },
          { id: 'prefrontal-cortex', dir: 'both' },
          { id: 'hippocampus', dir: 'both' },
          { id: 'midbrain', dir: 'out' },
        ],
      },
      cells: { diagram: 'fear-circuit', synapse: 'glutamate' },
    },
  },
  {
    id: 'corpus-callosum',
    name: 'Corpus callosum',
    group: 'deep',
    color: '#cfe0ff',
    shape: {
      type: 'band',
      path: [0.38, 0.3, 0.18, 0.05, -0.1, -0.22, -0.32, -0.37].map((z) => [0, callosumY(z) - (Math.abs(z) > 0.34 ? 0.04 : 0), z]),
      width: [[0, 0.18], [0.5, 0.3], [1, 0.22]],
      sag: 0.09, count: 3200, pattern: 'cross', fill: 0.05,
    },
    view: 'top',
    tagline: 'A thick cable of fibres that lets the two halves talk.',
    levels: {
      connects: {
        connections: [
          { id: 'frontal-lobe', dir: 'both' },
          { id: 'parietal-lobe', dir: 'both' },
          { id: 'occipital-lobe', dir: 'both' },
        ],
      },
      cells: { diagram: 'callosal-fibres', synapse: 'glutamate' },
    },
  },
];
