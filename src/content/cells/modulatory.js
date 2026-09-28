export default [
  {
    id: 'dopamine-neuron',
    name: 'Dopamine neuron',
    group: 'modulatory',
    color: '#b98cff',
    tagline: 'The broadcast beacons signaling motivation, reward prediction, and movement vigor.',
    analogy: 'A lighthouse sweeping a focused beam across stormy waters, spotlighting opportunities that are better than anticipated.',
    transmitter: 'dopamine',
    where: ['substantia-nigra', 'vta'],
    size: 'About 25 to 35 micrometres (0.03 mm) across the cell body',
    morph: { style: 'dopamine', seed: 91 },
    landmarks: ['soma', 'dendrites', 'axon', 'terminals'],
    shape: {
      text: 'Midbrain dopamine [[neuron|neurons]] are large, pigmented cells concentrated in the {{substantia-nigra}} and {{vta}}. They possess smooth, undulating [[dendrite|dendrites]] that can release dopamine locally. From the cell body arises one of the most sprawling axonal networks in the body: a single dopamine [[axon]] can branch into hundreds of thousands of synaptic release points across the {{striatum}} and {{prefrontal-cortex}}.',
      bullets: [
        'Large polygonal cell body rich in dark neuromelanin pigment in the adult brain.',
        'Smooth, widely spreading dendrites that can release dopamine directly from their own membranes.',
        'Enormously branched axon tree spanning hundreds of thousands of release sites.',
        'Releases dopamine via volume transmission into the extracellular space to bathe whole networks.',
      ],
    },
    fires: {
      text: 'Dopamine neurons tick steadily in a rhythmic pacemaker pattern (1 to 5 Hertz) driven by internal ion channels. When something unexpected happens that turns out better than predicted, they switch into a rapid burst of action potentials, delivering a transient surge of [[dopamine]] that reinforces the recent behavior.',
      steps: [
        '1. Internal calcium and sodium channels drive continuous baseline pacemaker firing at 2 to 4 Hertz.',
        '2. An unexpected reward or learning cue triggers incoming [[glutamate]] and [[acetylcholine]] inputs.',
        '3. The neuron transitions into a rapid burst of two to six action potentials.',
        '4. Terminals release a wave of [[dopamine]] across the {{striatum}}, signaling positive reward prediction error.',
      ],
    },
    chem: {
      text: 'Synthesizes [[dopamine]] from tyrosine using the enzymes tyrosine hydroxylase and DOPA decarboxylase. Dopamine neurons monitor their own release with D2 autoreceptors and are regulated by [[GABA]] inputs from the basal ganglia and [[glutamate]] from the [[cortex]].',
      receptors: ['D2', 'AMPA', 'NMDA', 'GABA-A', 'nAChR'],
      modulatedBy: ['acetylcholine', 'serotonin', 'gaba', 'glutamate'],
    },
    breaks: {
      text: 'Loss or dysregulation of dopamine neurons produces profound disorders of motor initiation, motivation, and reality testing.',
      bullets: [
        'Death of dopamine neurons in the {{substantia-nigra}} causes Parkinson disease, with tremor, muscular rigidity, and difficulty starting movements.',
        'Excessive dopamine burst firing in mesolimbic circuits is linked to hallucinations and delusions in schizophrenia.',
        'Reduced dopamine signaling in the {{prefrontal-cortex}} underlies distractibility and impulse control difficulties in ADHD.',
      ],
    },
    diagram: 'neuromodulator',
  },
  {
    id: 'motor-neuron',
    name: 'Motor neuron',
    group: 'modulatory',
    color: '#ffa36b',
    tagline: 'The final common pathway converting mental intent into physical muscle contraction.',
    analogy: 'The heavy electrical cable running from the control console directly to the hydraulic motors of the body.',
    transmitter: 'acetylcholine',
    where: ['spinal-cord', 'medulla'],
    size: 'About 50 to 100 micrometres (0.075 mm) across the cell body',
    morph: { style: 'motor', seed: 102 },
    landmarks: ['soma', 'dendrites', 'axon', 'myelin', 'node', 'terminals'],
    shape: {
      text: 'Motor [[neuron|neurons]] are giant multipolar cells situated in the ventral horn of the {{spinal-cord}} and motor nuclei of the {{medulla}}. They feature large, starlike cell bodies and thick [[dendrite|dendrites]] that receive tens of thousands of incoming synapses. A solitary, heavily insulated [[axon]] leaves the central nervous system to travel inside peripheral nerves, terminating directly on muscle fibres.',
      bullets: [
        'Among the largest cell bodies in the nervous system, measuring up to 0.1 mm across.',
        'Extensive dendritic tree receiving up to 50,000 synaptic boutons from motor and reflex pathways.',
        'Contains the longest axons in the body, which can extend over a metre from the spine to the toes.',
        'Heavily wrapped in [[myelin]] with prominent nodes of Ranvier, ending at neuromuscular junctions.',
      ],
    },
    fires: {
      text: 'Motor neurons collect commands from the {{motor-cortex}}, sensory reflexes, and spinal interneurons. When incoming positive charge reaches threshold, an [[action potential]] leaps at high speed (up to 120 metres per second) down the insulated [[axon]] via saltatory conduction to trigger near-instant muscle contraction.',
      steps: [
        '1. Descending motor tracts and sensory reflex fibres release [[glutamate]] onto motor neuron dendrites.',
        '2. Electrical charges summate at the massive cell body, reaching the low-threshold axon hillock.',
        '3. An all-or-none [[action potential]] leaps from node to node along the myelinated [[axon]].',
        '4. The impulse invades the neuromuscular junction, triggering [[acetylcholine]] release onto muscle fibres to cause contraction.',
      ],
    },
    chem: {
      text: 'Motor neurons use [[acetylcholine]] as their primary neurotransmitter to stimulate nicotinic [[receptors]] on skeletal muscle. They receive excitatory [[glutamate]] inputs, inhibitory glycine and [[GABA]] signals, and modulatory tuning from [[serotonin]] and [[noradrenaline]] to adjust motor gain.',
      receptors: ['AMPA', 'NMDA', 'GABA-A'],
      modulatedBy: ['serotonin', 'noradrenaline', 'glutamate'],
    },
    breaks: {
      text: 'Damage to motor neurons severs the brain\'s physical connection to the muscular system, producing weakness, muscle wasting, and paralysis.',
      bullets: [
        'Amyotrophic lateral sclerosis (ALS) selectively kills motor neurons, leading to progressive muscle weakness, loss of speech, and respiratory failure.',
        'Poliovirus attacks and destroys spinal motor neurons, causing acute flaccid paralysis.',
        'Myasthenia gravis damages the muscle receptors that receive motor neuron signals, causing rapid muscular fatigue.',
      ],
    },
    diagram: 'reflex-arc',
  },
];
