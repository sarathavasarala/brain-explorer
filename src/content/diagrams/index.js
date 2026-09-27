// Cell-level circuit diagrams, described as data. The renderer draws the cells and animates
// signals along the links. Coordinates are 0–100 on both axes (y grows downward).
//
// node.kind:  pyramidal | stellate | granule | purkinje | interneuron | modulator | neuron
//             region (a labelled box) | input | output (edge-of-diagram terminals)
// link.type:  excite | inhibit | modulate
// Optional:   bands (horizontal layers), divider (a vertical line, e.g. the midline)

export default {
  'cortical-column': {
    title: 'A column of cortex',
    caption: 'The cortex is a sheet about 3 mm thick, built from six layers. Input arrives in the middle, is processed in the upper layers, and leaves from the deep layers.',
    bands: [
      { label: 'I', y: 4 }, { label: 'II/III', y: 16 }, { label: 'IV', y: 44 },
      { label: 'V', y: 60 }, { label: 'VI', y: 80 },
    ],
    nodes: [
      { id: 'in', kind: 'input', label: 'From thalamus', x: 16, y: 94 },
      { id: 'l4', kind: 'stellate', label: 'Stellate cell', x: 34, y: 52 },
      { id: 'l23', kind: 'pyramidal', label: 'Pyramidal cell', x: 54, y: 30 },
      { id: 'inh', kind: 'interneuron', label: 'Interneuron', x: 36, y: 22 },
      { id: 'l5', kind: 'pyramidal', label: 'Large pyramidal', x: 70, y: 72 },
      { id: 'o1', kind: 'output', label: 'To other areas', x: 92, y: 20 },
      { id: 'o2', kind: 'output', label: 'To spinal cord, striatum', x: 90, y: 94 },
    ],
    links: [
      { from: 'in', to: 'l4', type: 'excite' },
      { from: 'l4', to: 'l23', type: 'excite' },
      { from: 'inh', to: 'l23', type: 'inhibit' },
      { from: 'l23', to: 'l5', type: 'excite' },
      { from: 'l23', to: 'o1', type: 'excite' },
      { from: 'l5', to: 'o2', type: 'excite' },
    ],
  },

  'cerebellar-circuit': {
    title: 'The cerebellar circuit',
    caption: 'Granule cells pass on context, climbing fibres report errors, and Purkinje cells combine the two. Their inhibitory output sculpts the signal leaving the deep nuclei.',
    bands: [{ label: 'Molecular', y: 6 }, { label: 'Purkinje', y: 42 }, { label: 'Granular', y: 58 }, { label: 'Deep nucleus', y: 80 }],
    nodes: [
      { id: 'mf', kind: 'input', label: 'Mossy fibre (plan + body)', x: 12, y: 94 },
      { id: 'gc', kind: 'granule', label: 'Granule cell', x: 30, y: 68 },
      { id: 'bc', kind: 'interneuron', label: 'Basket cell', x: 34, y: 28 },
      { id: 'pc', kind: 'purkinje', label: 'Purkinje cell', x: 58, y: 44 },
      { id: 'cf', kind: 'input', label: 'Climbing fibre (error)', x: 12, y: 44 },
      { id: 'dcn', kind: 'neuron', label: 'Deep nucleus cell', x: 72, y: 86 },
      { id: 'out', kind: 'output', label: 'To thalamus', x: 94, y: 86 },
    ],
    links: [
      { from: 'mf', to: 'gc', type: 'excite' },
      { from: 'mf', to: 'dcn', type: 'excite' },
      { from: 'gc', to: 'pc', type: 'excite' },
      { from: 'gc', to: 'bc', type: 'excite' },
      { from: 'bc', to: 'pc', type: 'inhibit' },
      { from: 'cf', to: 'pc', type: 'excite' },
      { from: 'pc', to: 'dcn', type: 'inhibit' },
      { from: 'dcn', to: 'out', type: 'excite' },
    ],
  },

  'thalamic-relay': {
    title: 'A thalamic relay',
    caption: 'Relay cells pass sensory signals up to the cortex. A thin shell of inhibitory cells (the reticular nucleus) acts like a gate, and the cortex sends feedback down to adjust it.',
    nodes: [
      { id: 'in', kind: 'input', label: 'From eye or body', x: 10, y: 70 },
      { id: 'tc', kind: 'neuron', label: 'Relay cell', x: 44, y: 70 },
      { id: 'trn', kind: 'interneuron', label: 'Reticular cell', x: 44, y: 30 },
      { id: 'ctx', kind: 'region', label: 'Cortex', x: 84, y: 40 },
    ],
    links: [
      { from: 'in', to: 'tc', type: 'excite' },
      { from: 'tc', to: 'ctx', type: 'excite' },
      { from: 'tc', to: 'trn', type: 'excite' },
      { from: 'trn', to: 'tc', type: 'inhibit' },
      { from: 'ctx', to: 'trn', type: 'excite' },
    ],
  },

  'basal-ganglia': {
    title: 'The basal ganglia loop',
    caption: 'The output of the loop keeps the thalamus braked. The direct route releases that brake for the chosen action; the indirect route presses it harder for everything else. Dopamine tips the balance.',
    nodes: [
      { id: 'ctx', kind: 'region', label: 'Cortex', x: 50, y: 8 },
      { id: 'str', kind: 'region', label: 'Striatum', x: 50, y: 34 },
      { id: 'snc', kind: 'modulator', label: 'Substantia nigra', x: 12, y: 34 },
      { id: 'gpe', kind: 'region', label: 'GP external', x: 78, y: 56 },
      { id: 'stn', kind: 'region', label: 'Subthalamic n.', x: 78, y: 84 },
      { id: 'gpi', kind: 'region', label: 'GP internal', x: 40, y: 66 },
      { id: 'th', kind: 'region', label: 'Thalamus', x: 16, y: 88 },
    ],
    links: [
      { from: 'ctx', to: 'str', type: 'excite' },
      { from: 'snc', to: 'str', type: 'modulate' },
      { from: 'str', to: 'gpi', type: 'inhibit', label: 'direct' },
      { from: 'str', to: 'gpe', type: 'inhibit', label: 'indirect' },
      { from: 'gpe', to: 'stn', type: 'inhibit' },
      { from: 'stn', to: 'gpi', type: 'excite' },
      { from: 'gpi', to: 'th', type: 'inhibit' },
      { from: 'th', to: 'ctx', type: 'excite', bend: -0.5 },
    ],
  },

  'hippocampal-loop': {
    title: 'The hippocampal loop',
    caption: 'This simplified route follows three major relays, but the hippocampus also contains parallel and recurrent connections. CA3 cells connect strongly with one another, which may help a partial cue reactivate a stored pattern.',
    nodes: [
      { id: 'ec', kind: 'region', label: 'Entorhinal cortex', x: 14, y: 20 },
      { id: 'dg', kind: 'granule', label: 'Dentate gyrus', x: 32, y: 70 },
      { id: 'ca3', kind: 'pyramidal', label: 'CA3', x: 58, y: 72 },
      { id: 'ca1', kind: 'pyramidal', label: 'CA1', x: 72, y: 28 },
      { id: 'out', kind: 'output', label: 'Back to cortex', x: 94, y: 14 },
    ],
    links: [
      { from: 'ec', to: 'dg', type: 'excite' },
      { from: 'dg', to: 'ca3', type: 'excite' },
      { from: 'ca3', to: 'ca1', type: 'excite' },
      { from: 'ec', to: 'ca1', type: 'excite', bend: -0.25 },
      { from: 'ca1', to: 'out', type: 'excite' },
    ],
  },

  'fear-circuit': {
    title: 'The fear circuit',
    caption: 'Sensory information reaches the amygdala through thalamic and cortical routes that interact. Frontal and local inhibitory circuits help update the response when more context becomes available.',
    nodes: [
      { id: 'in', kind: 'input', label: 'Sight or sound', x: 8, y: 50 },
      { id: 'th', kind: 'region', label: 'Thalamus', x: 26, y: 50 },
      { id: 'ctx', kind: 'region', label: 'Sensory cortex', x: 46, y: 14 },
      { id: 'la', kind: 'pyramidal', label: 'Amygdala', x: 60, y: 56 },
      { id: 'pfc', kind: 'region', label: 'Prefrontal', x: 84, y: 14 },
      { id: 'itc', kind: 'interneuron', label: 'Calming cell', x: 78, y: 42 },
      { id: 'hy', kind: 'output', label: 'Stress hormones', x: 92, y: 70 },
      { id: 'pag', kind: 'output', label: 'Freeze', x: 70, y: 92 },
    ],
    links: [
      { from: 'in', to: 'th', type: 'excite' },
      { from: 'th', to: 'la', type: 'excite', label: 'fast' },
      { from: 'th', to: 'ctx', type: 'excite' },
      { from: 'ctx', to: 'la', type: 'excite', label: 'slow' },
      { from: 'pfc', to: 'itc', type: 'excite' },
      { from: 'itc', to: 'la', type: 'inhibit' },
      { from: 'la', to: 'hy', type: 'excite' },
      { from: 'la', to: 'pag', type: 'excite' },
    ],
  },

  'callosal-fibres': {
    title: 'Crossing the midline',
    caption: 'Pyramidal cells in one hemisphere send long axons across the corpus callosum to the matching spot on the other side.',
    divider: { x: 50, label: 'Midline' },
    nodes: [
      { id: 'l', kind: 'pyramidal', label: 'Left hemisphere', x: 20, y: 50 },
      { id: 'r', kind: 'pyramidal', label: 'Right hemisphere', x: 80, y: 50 },
    ],
    links: [
      { from: 'l', to: 'r', type: 'excite', bend: 0.35 },
      { from: 'r', to: 'l', type: 'excite', bend: 0.35 },
    ],
  },

  neuromodulator: {
    title: 'A broadcast system',
    caption: 'A small cluster of cells sends thin, branching axons all over the brain. Instead of one precise message, it changes the mood of whole regions at once.',
    nodes: [
      { id: 'n', kind: 'modulator', label: 'Brainstem nucleus', x: 16, y: 52 },
      { id: 'a', kind: 'region', label: 'Cortex', x: 78, y: 12 },
      { id: 'b', kind: 'region', label: 'Thalamus', x: 84, y: 38 },
      { id: 'c', kind: 'region', label: 'Striatum', x: 84, y: 64 },
      { id: 'd', kind: 'region', label: 'Spinal cord', x: 78, y: 90 },
    ],
    links: [
      { from: 'n', to: 'a', type: 'modulate' },
      { from: 'n', to: 'b', type: 'modulate' },
      { from: 'n', to: 'c', type: 'modulate' },
      { from: 'n', to: 'd', type: 'modulate' },
    ],
  },

  'reflex-arc': {
    title: 'A reflex arc',
    caption: 'Some responses never wait for the brain. A sensor, a relay cell and a motor neuron in the spinal cord pull your hand away, while a copy of the signal travels up so you feel it a moment later.',
    nodes: [
      { id: 's', kind: 'input', label: 'Skin sensor', x: 8, y: 80 },
      { id: 'sn', kind: 'neuron', label: 'Sensory neuron', x: 30, y: 56 },
      { id: 'in', kind: 'interneuron', label: 'Relay cell', x: 54, y: 56 },
      { id: 'mn', kind: 'neuron', label: 'Motor neuron', x: 74, y: 80 },
      { id: 'm', kind: 'output', label: 'Muscle', x: 94, y: 80 },
      { id: 'up', kind: 'output', label: 'Up to brain', x: 54, y: 10 },
    ],
    links: [
      { from: 's', to: 'sn', type: 'excite' },
      { from: 'sn', to: 'in', type: 'excite' },
      { from: 'in', to: 'mn', type: 'excite' },
      { from: 'mn', to: 'm', type: 'excite' },
      { from: 'sn', to: 'up', type: 'excite' },
    ],
  },
};
