// Guided pathways. Each step lights up `focus`, animates signals along `route`
// (pairs of structure or anchor ids), and can override the camera with `view`.
// Earlier steps' routes stay visible but faint, so the whole journey builds up.

export default [
  {
    id: 'seeing',
    name: 'Seeing: from eye to meaning',
    tagline: 'Light becomes edges, then objects and places.',
    steps: [
      { title: 'Light hits the retina', focus: ['eye'], route: [], view: 'left-front' },
      { title: 'A relay in the thalamus', focus: ['thalamus'], route: [['eye', 'thalamus']] },
      { title: 'Edges and lines in the visual cortex', focus: ['visual-cortex'], route: [['thalamus', 'visual-cortex']], view: 'left-back' },
      { title: 'The "where" stream', focus: ['posterior-parietal'], route: [['visual-cortex', 'posterior-parietal']], view: 'left-back' },
      { title: 'The "what" stream', focus: ['temporal-lobe'], route: [['visual-cortex', 'temporal-lobe']] },
    ],
  },
  {
    id: 'moving',
    name: 'Moving: deciding to reach',
    tagline: 'From an intention to a muscle twitch.',
    steps: [
      { title: 'A goal forms', focus: ['prefrontal-cortex'], route: [], view: 'left-front' },
      { title: 'Choosing the action', focus: ['striatum', 'globus-pallidus'], route: [['prefrontal-cortex', 'striatum'], ['striatum', 'globus-pallidus']] },
      { title: 'Releasing the brake', focus: ['thalamus'], route: [['globus-pallidus', 'thalamus'], ['substantia-nigra', 'striatum']] },
      { title: 'The command leaves the cortex', focus: ['motor-cortex'], route: [['thalamus', 'motor-cortex']] },
      { title: 'Down the brainstem', focus: ['midbrain', 'pons', 'medulla'], route: [['motor-cortex', 'midbrain'], ['midbrain', 'medulla']] },
      { title: 'Out to the muscles', focus: ['spinal-cord', 'hand'], route: [['medulla', 'spinal-cord'], ['spinal-cord', 'hand']], view: 'left' },
      { title: 'The cerebellum corrects', focus: ['cerebellum'], route: [['motor-cortex', 'pons'], ['pons', 'cerebellum'], ['cerebellum', 'thalamus']], view: 'left-back' },
    ],
  },
  {
    id: 'remembering',
    name: 'Remembering: making a memory',
    tagline: 'How an experience becomes something you can recall.',
    steps: [
      { title: 'An experience in the cortex', focus: ['temporal-lobe', 'parietal-lobe'], route: [] },
      { title: 'Bound together in the hippocampus', focus: ['hippocampus'], route: [['temporal-lobe', 'hippocampus'], ['parietal-lobe', 'hippocampus']] },
      { title: 'Emotion adds weight', focus: ['amygdala'], route: [['amygdala', 'hippocampus']] },
      { title: 'The memory loop', focus: ['hypothalamus', 'thalamus', 'cingulate-cortex'], route: [['hippocampus', 'hypothalamus'], ['hypothalamus', 'thalamus'], ['thalamus', 'cingulate-cortex'], ['cingulate-cortex', 'hippocampus']], view: 'medial', slice: true },
      { title: 'Stored in the cortex over time', focus: ['temporal-lobe', 'prefrontal-cortex'], route: [['hippocampus', 'temporal-lobe'], ['hippocampus', 'prefrontal-cortex']] },
    ],
  },
  {
    id: 'fear',
    name: 'Fear: the snake on the path',
    tagline: 'Why you jump before you know why.',
    steps: [
      { title: 'Something moves', focus: ['eye'], route: [], view: 'left-front' },
      { title: 'The fast road', focus: ['thalamus', 'amygdala'], route: [['eye', 'thalamus'], ['thalamus', 'amygdala']] },
      { title: 'The body reacts', focus: ['hypothalamus', 'midbrain'], route: [['amygdala', 'hypothalamus'], ['amygdala', 'midbrain']] },
      { title: 'The slow road catches up', focus: ['visual-cortex'], route: [['thalamus', 'visual-cortex'], ['visual-cortex', 'amygdala']], view: 'left-back' },
      { title: '"It\'s just a stick"', focus: ['prefrontal-cortex'], route: [['prefrontal-cortex', 'amygdala']], view: 'left-front' },
    ],
  },
  {
    id: 'hearing-speech',
    name: 'Hearing a sentence and replying',
    tagline: 'Sound becomes words, and words become speech.',
    steps: [
      { title: 'Sound reaches the inner ear', focus: ['ear'], route: [] },
      { title: 'Up through the thalamus', focus: ['thalamus'], route: [['ear', 'thalamus']] },
      { title: 'Heard in the auditory cortex', focus: ['auditory-cortex'], route: [['thalamus', 'auditory-cortex']] },
      { title: 'Understood in Wernicke\'s area', focus: ['wernickes-area'], route: [['auditory-cortex', 'wernickes-area']] },
      { title: 'A reply planned in Broca\'s area', focus: ['brocas-area'], route: [['wernickes-area', 'brocas-area']] },
      { title: 'Spoken aloud', focus: ['motor-cortex'], route: [['brocas-area', 'motor-cortex']] },
    ],
  },
  {
    id: 'catch',
    name: 'Catching a ball',
    tagline: 'Half a second, a dozen brain areas.',
    steps: [
      { title: 'Spotting the ball', focus: ['eye', 'visual-cortex'], route: [['eye', 'thalamus'], ['thalamus', 'visual-cortex']], view: 'left-back' },
      { title: 'Where is it going?', focus: ['posterior-parietal'], route: [['visual-cortex', 'posterior-parietal']] },
      { title: 'Plan the reach', focus: ['motor-cortex'], route: [['posterior-parietal', 'motor-cortex']] },
      { title: 'Command to the arm', focus: ['spinal-cord', 'hand'], route: [['motor-cortex', 'spinal-cord'], ['spinal-cord', 'hand']] },
      { title: 'Fine-tuning mid-flight', focus: ['cerebellum'], route: [['motor-cortex', 'pons'], ['pons', 'cerebellum'], ['cerebellum', 'thalamus'], ['thalamus', 'motor-cortex']], view: 'left-back' },
    ],
  },
];
