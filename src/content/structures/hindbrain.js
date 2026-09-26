// Brainstem, cerebellum and spinal cord.
// The cerebellum entry is a fully written example of every text field.

export default [
  {
    id: 'cerebellum',
    name: 'Cerebellum',
    group: 'hindbrain',
    color: '#f5b83d',
    shape: {
      parts: [
        { type: 'ellipsoid', center: [0.19, -0.3, -0.6], radii: [0.21, 0.15, 0.2], count: 5200, pattern: 'folia', mirror: true, fill: 0.05 },
        { type: 'ellipsoid', center: [0, -0.29, -0.63], radii: [0.07, 0.14, 0.18], count: 1600, pattern: 'folia', fill: 0.05 },
      ],
    },
    view: 'left-back',
    tagline: 'Fine-tunes movement so it comes out smooth, timed and accurate.',
    analogy: 'A flight controller that compares what you meant to do with what your body is actually doing, and corrects the difference many times a second.',
    levels: {
      where: {
        text: 'The cerebellum ("little brain") sits at the back of your head, tucked under the {{occipital-lobe|occipital lobe}} and behind the {{pons}}. It is only about a tenth of the brain\'s volume, but it holds more than half of all its [[neuron|neurons]].',
        bullets: [
          'Two hemispheres joined by a narrow middle strip called the vermis.',
          'Its surface is folded into thin, tightly packed ridges called folia, much finer than the folds of the cortex.',
          'Three thick stalks (the cerebellar peduncles) attach it to the brainstem. Every signal in or out goes through them.',
        ],
      },
      does: {
        text: 'The cerebellum does not start movements. The {{motor-cortex|motor cortex}} does that. Instead it compares the command that was sent with feedback from your muscles, joints and eyes, and quietly corrects the movement while it happens. It also learns from mistakes, which is why practice makes a skill automatic.',
        bullets: [
          'Balance and posture: keeps you upright without you thinking about it.',
          'Timing and coordination: lets several joints move together, as in reaching or walking.',
          'Motor learning: gradually improves skills like typing, cycling or playing an instrument.',
          'Growing evidence says it also helps with the timing of thought and speech, not just movement.',
        ],
      },
      connects: {
        text: 'Information comes in from the cortex (a copy of the plan, relayed through the {{pons}}) and from the body (what actually happened, through the spinal cord and {{medulla}}). The output goes back up through the {{thalamus}} to the motor cortex, so the correction lands where the command started.',
        connections: [
          { id: 'pons', dir: 'in', label: 'A copy of the movement plan from the cortex' },
          { id: 'spinal-cord', dir: 'in', label: 'Feedback on where your limbs actually are' },
          { id: 'medulla', dir: 'both', label: 'Balance signals from the inner ear' },
          { id: 'thalamus', dir: 'out', label: 'Corrections, relayed up to the cortex' },
          { id: 'motor-cortex', dir: 'out', label: 'Where those corrections end up' },
        ],
      },
      cells: {
        text: 'The cerebellar cortex has an unusually regular wiring pattern that repeats across the whole surface. Tiny [[granule cell|granule cells]] (billions of them) feed signals to large [[Purkinje cell|Purkinje cells]], each with a huge flat fan of [[dendrite|dendrites]]. Purkinje cells are the only output of the cerebellar cortex, and they are [[inhibitory]].',
        diagram: 'cerebellar-circuit',
        synapse: 'gaba',
        bullets: [
          'A single Purkinje cell can receive input from around 200,000 granule cells.',
          'A "climbing fibre" wraps around each Purkinje cell and fires when a movement goes wrong. That error signal is what drives learning.',
        ],
      },
    },
    tryIt: 'Close your eyes, stretch your arm out, then touch your nose. The smooth, accurate path your finger takes is the cerebellum at work. Doctors use this exact test to check it.',
    breaks: {
      text: 'Damage to the cerebellum rarely causes paralysis. Instead movements become clumsy and poorly timed, a condition called [[ataxia]].',
      bullets: [
        'A wide, unsteady walk, a bit like being drunk. Alcohol affects the cerebellum early, which is why roadside sobriety tests check balance.',
        'An "intention tremor": the hand shakes more the closer it gets to a target.',
        'Slurred, uneven speech, because speech muscles need precise timing too.',
      ],
    },
  },
  {
    id: 'midbrain',
    name: 'Midbrain',
    group: 'hindbrain',
    color: '#ffa94d',
    shape: { type: 'tube', path: [[0, -0.01, -0.1], [0, -0.1, -0.13], [0, -0.2, -0.17]], radius: 0.085, count: 1800, pattern: 'rings', fill: 0.18 },
    view: 'left',
    slice: true,
    tagline: 'Reflex hub for eyes and ears, and home of the dopamine cells.',
    levels: {
      connects: {
        connections: [
          { id: 'thalamus', dir: 'out' },
          { id: 'pons', dir: 'both' },
          { id: 'amygdala', dir: 'in' },
        ],
      },
      cells: { diagram: 'neuromodulator', synapse: 'dopamine' },
    },
  },
  {
    id: 'pons',
    name: 'Pons',
    group: 'hindbrain',
    color: '#ff9b3d',
    shape: { type: 'tube', path: [[0, -0.2, -0.155], [0, -0.3, -0.175], [0, -0.4, -0.215]], radius: [[0, 0.095], [0.5, 0.13], [1, 0.095]], count: 2200, pattern: 'rings', fill: 0.14 },
    view: 'left',
    tagline: 'A bridge carrying signals between the cortex and the cerebellum.',
    levels: {
      connects: {
        connections: [
          { id: 'motor-cortex', dir: 'in' },
          { id: 'cerebellum', dir: 'out' },
          { id: 'medulla', dir: 'both' },
        ],
      },
      cells: { diagram: 'neuromodulator', synapse: 'noradrenaline' },
    },
  },
  {
    id: 'medulla',
    name: 'Medulla oblongata',
    group: 'hindbrain',
    color: '#ffc46b',
    shape: { type: 'tube', path: [[0, -0.4, -0.23], [0, -0.52, -0.27], [0, -0.64, -0.3]], radius: [[0, 0.085], [1, 0.058]], count: 1700, pattern: 'fibers', fill: 0.14 },
    view: 'left',
    tagline: 'Keeps you alive on autopilot: breathing, heart rate, swallowing.',
    levels: {
      connects: {
        connections: [
          { id: 'spinal-cord', dir: 'both' },
          { id: 'hypothalamus', dir: 'in' },
          { id: 'cerebellum', dir: 'both' },
          { id: 'pons', dir: 'both' },
        ],
      },
      cells: { diagram: 'neuromodulator', synapse: 'serotonin' },
    },
  },
  {
    id: 'spinal-cord',
    name: 'Spinal cord',
    group: 'hindbrain',
    color: '#e8d7a8',
    shape: { type: 'tube', path: [[0, -0.64, -0.3], [0, -0.82, -0.33], [0, -1.02, -0.35]], radius: [[0, 0.058], [1, 0.045]], count: 1300, pattern: 'fibers', fill: 0.12 },
    view: 'left',
    tagline: 'The main cable between brain and body.',
    levels: {
      connects: {
        connections: [
          { id: 'motor-cortex', dir: 'in' },
          { id: 'somatosensory-cortex', dir: 'out' },
          { id: 'cerebellum', dir: 'out' },
        ],
      },
      cells: { diagram: 'reflex-arc', synapse: 'acetylcholine' },
    },
  },
];
