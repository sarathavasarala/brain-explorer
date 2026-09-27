// Guided pathways. Each step lights up `focus`, animates signals along `route`
// (pairs of structure or anchor ids), and can override the camera with `view`.
// Earlier steps' routes stay visible but faint, so the whole journey builds up.

export default [
  {
    id: 'seeing',
    category: 'function',
    name: 'Seeing: from eye to meaning',
    tagline: 'Light becomes edges, then objects and places.',
    summary: 'Seeing happens in stages. The eyes catch light, the {{thalamus}} sorts it, and the {{visual-cortex}} reads edges and motion. From there the brain splits the work: where things are, and what they are.',
    steps: [
      { title: 'Light hits the retina', focus: ['eye'], route: [], view: 'left-front', text: 'Light lands on the retina at the back of each eye. There, roughly 100 million rods and cones begin turning it into electrical signals. At the optic chiasm, some fibres cross and some stay on the same side, so each hemisphere receives the opposite half of the visual world from both eyes.' },
      { title: 'A relay in the thalamus', focus: ['thalamus'], route: [['eye', 'thalamus']], text: 'Most retinal signals headed for vision relay in the {{thalamus}}, in a cluster called the lateral geniculate [[nucleus]]. It preserves the map of the visual field while attention and feedback from the cortex change the strength of the signal. Fibres then fan back to the {{visual-cortex}}.' },
      { title: 'Edges and lines in the visual cortex', focus: ['visual-cortex'], route: [['thalamus', 'visual-cortex']], view: 'left-back', text: 'In the {{visual-cortex}}, cells fire for short edges, angles, colours and motion. Together they tile the whole view like puzzle pieces. This is seeing without yet knowing: lines and movement, but no names.' },
      { title: 'The "where" stream', focus: ['posterior-parietal'], route: [['visual-cortex', 'posterior-parietal']], view: 'left-back', text: 'One copy flows up to the {{posterior-parietal}}. It maps where things sit and how to reach them. This stream guides your hand to a mug without you naming the mug.' },
      { title: 'The "what" stream', focus: ['temporal-lobe'], route: [['visual-cortex', 'temporal-lobe']], text: 'Visual processing also flows toward the {{temporal-lobe}}, where patterns are matched with learned objects and faces. Damage in this network can spare basic sight while disrupting recognition. The "what" and "where" streams are useful labels, but they exchange information rather than working as separate pipes.' },
    ],
  },
  {
    id: 'moving',
    category: 'function',
    name: 'Moving: deciding to reach',
    tagline: 'From an intention to a muscle twitch.',
    summary: 'A reach starts as a goal and ends as muscle. In between, cortical and basal-ganglia loops help select the action, the {{motor-cortex}} contributes descending commands, and the {{cerebellum}} helps predict and correct errors. No single region acts as the lone start switch.',
    steps: [
      { title: 'A goal forms', focus: ['prefrontal-cortex'], route: [], view: 'left-front', text: 'It starts in the {{prefrontal-cortex}} with a goal, like "grab that mug". The goal stays active while distractions pass. This holding is what lets a plan survive the seconds before moving.' },
      { title: 'Choosing the action', focus: ['striatum', 'globus-pallidus'], route: [['prefrontal-cortex', 'striatum'], ['striatum', 'globus-pallidus']], text: 'The goal goes to the {{striatum}}, which weighs possible reaches the way you might weigh routes. Its verdict goes to the {{globus-pallidus}}, the brake that normally holds movement back. The right choice starts to lift that brake.' },
      { title: 'Adjusting the gate', focus: ['thalamus'], route: [['globus-pallidus', 'thalamus'], ['substantia-nigra', 'striatum']], text: 'Changes in {{globus-pallidus}} output alter the inhibition reaching the {{thalamus}}, which feeds activity back to motor areas. [[Dopamine]] from the {{substantia-nigra}} tunes how striatal pathways respond and learn. The familiar brake metaphor captures part of this loop, but real movement uses several interacting pathways.' },
      { title: 'Commands leave the cortex', focus: ['motor-cortex'], route: [['thalamus', 'motor-cortex']], text: 'Populations in the {{motor-cortex}} contribute to the direction, force and timing of the reach. Large [[pyramidal cell|pyramidal cells]] send descending signals, which brainstem and spinal circuits combine with other inputs before muscles contract.' },
      { title: 'Down the brainstem', focus: ['midbrain', 'pons', 'medulla'], route: [['motor-cortex', 'midbrain'], ['midbrain', 'medulla']], view: 'left', text: 'Orders travel down through the {{midbrain}}, past the {{pons}} (which copies them for the {{cerebellum}}) and through the {{medulla}}. Most fibres cross sides here, so the left brain drives the right hand.' },
      { title: 'Out to the muscles', focus: ['spinal-cord', 'hand'], route: [['medulla', 'spinal-cord'], ['spinal-cord', 'hand']], view: 'left', text: 'In the {{spinal-cord}}, upper orders meet motor [[neuron|neurons]] that use acetylcholine to contract muscles. Fingers close around the mug. Touch signals start the return trip up to the {{somatosensory-cortex}} to confirm the grip.' },
      { title: 'The cerebellum corrects', focus: ['cerebellum'], route: [['motor-cortex', 'pons'], ['pons', 'cerebellum'], ['cerebellum', 'thalamus'], ['thalamus', 'motor-cortex']], view: 'left-back', text: 'While the hand moves, a copy sent via the {{pons}} reaches the {{cerebellum}}. It compares plan with feedback from muscles and eyes, then sends corrections up through the {{thalamus}} to the {{motor-cortex}}. The reach lands smooth instead of jerky.' },
    ],
  },
  {
    id: 'remembering',
    category: 'function',
    name: 'Remembering: making a memory',
    tagline: 'How an experience becomes something you can recall.',
    summary: 'An experience activates patterns across the [[cortex]], while the {{hippocampus}} helps bind their relationships. Emotion can alter what is remembered, and later replay helps reorganise the memory across hippocampal and cortical networks.',
    steps: [
      { title: 'An experience in the cortex', focus: ['temporal-lobe', 'parietal-lobe'], route: [], text: 'Meeting a friend in a cafe wakes the {{temporal-lobe}} (faces, words) and the {{parietal-lobe}} (where you sat, the reach for the cup). At first the pieces live apart. Nothing yet ties them into one recallable event.' },
      { title: 'Bound together in the hippocampus', focus: ['hippocampus'], route: [['temporal-lobe', 'hippocampus'], ['parietal-lobe', 'hippocampus']], text: 'Both streams flow into the {{hippocampus}}. Its looped wiring binds who, what and where into one pattern, so later one cue can bring back the rest. This binding is why picturing the cafe can return the whole chat.' },
      { title: 'Emotion adds weight', focus: ['amygdala'], route: [['amygdala', 'hippocampus']], text: 'If the meeting mattered, the {{amygdala}} stamps it. [[neuromodulator]] chemicals tell the {{hippocampus}} to keep this one strongly. That is why emotional days stick while ordinary ones fade.' },
      { title: 'A wider memory network', focus: ['hypothalamus', 'thalamus', 'cingulate-cortex'], route: [['hippocampus', 'hypothalamus'], ['hypothalamus', 'thalamus'], ['thalamus', 'cingulate-cortex'], ['cingulate-cortex', 'hippocampus']], view: 'medial', slice: true, text: 'The hippocampus also belongs to a wider circuit through the {{hypothalamus}}, {{thalamus}} and {{cingulate-cortex}}, historically called the Papez circuit. This network supports aspects of memory and emotion, but sleep replay does not simply circle this loop on each pass.' },
      { title: 'Reorganised over time', focus: ['temporal-lobe', 'prefrontal-cortex'], route: [['hippocampus', 'temporal-lobe'], ['hippocampus', 'prefrontal-cortex']], text: 'During rest, sleep and recall, hippocampal and cortical activity can replay parts of an experience. Over time, many memories rely more on distributed cortical connections, although vivid episodic detail can continue to involve the {{hippocampus}}. Consolidation has no single fixed timetable.' },
    ],
  },
  {
    id: 'fear',
    category: 'function',
    name: 'Fear: the snake on the path',
    tagline: 'Why you jump before you know why.',
    summary: 'Threat responses emerge from interacting sensory, amygdala, hippocampal, frontal and body-control networks. Thalamic and cortical routes can both carry useful information, while context helps the brain revise an early guess.',
    steps: [
      { title: 'Something moves', focus: ['eye'], route: [], view: 'left-front', text: 'On a path, a curved shape moves near your foot. The eyes catch motion and shape before detail is clear. The brain treats "maybe snake" as urgent and skips the queue.' },
      { title: 'An early warning', focus: ['thalamus', 'amygdala'], route: [['eye', 'thalamus'], ['thalamus', 'amygdala']], text: 'Early sensory activity can influence the {{amygdala}} through thalamic and cortical routes before you have identified the object. Researchers still debate how much a direct thalamic route contributes to visual fear in humans.' },
      { title: 'The body reacts', focus: ['hypothalamus', 'midbrain'], route: [['amygdala', 'hypothalamus'], ['amygdala', 'midbrain']], text: 'Amygdala networks can recruit the {{hypothalamus}}, brainstem and midbrain systems that change heart rate, stress hormones, attention and movement. Several pathways work together when you freeze or step back.' },
      { title: 'Detail changes the guess', focus: ['visual-cortex'], route: [['thalamus', 'visual-cortex'], ['visual-cortex', 'amygdala']], view: 'left-back', text: 'Visual processing resolves edges, colour and shape into bark with no snake head. That information reaches amygdala and memory networks through several cortical routes, updating the early guess without a fixed half-second delay.' },
      { title: '"It\'s just a stick"', focus: ['prefrontal-cortex'], route: [['prefrontal-cortex', 'amygdala']], view: 'left-front', text: 'The {{prefrontal-cortex}} weighs the new evidence and hushes the alarm through calming cells. Heart rate falls. You laugh, step over the stick, and the {{amygdala}} learns this path is a little safer.' },
    ],
  },
  {
    id: 'hearing-speech',
    category: 'function',
    name: 'Hearing a sentence and replying',
    tagline: 'A voice reaches your ears. A reply leaves your mouth.',
    summary: 'Follow the main stops as you hear a question and answer it. The brain regions work together, even though we are visiting them one at a time. Sound moves from the ear through the brainstem and {{thalamus}} to the {{auditory-cortex}}. From there, temporal, parietal and frontal networks exchange information in parallel as meaning is grasped and speech is prepared, rather than passing a finished parcel down a single assembly line.',
    steps: [
      {
        title: 'Sound reaches the inner ear',
        focus: ['ear'],
        route: [],
        text: 'A friend asks a question. Sound vibrates your eardrum, and tiny bones carry that vibration into the fluid-filled cochlea. Hair cells there turn the movement into nerve signals. Different parts of the cochlea respond best to different pitches, while the timing of nerve activity carries more detail about the sound.'
      },
      {
        title: 'Signals meet in the brainstem',
        focus: ['pons', 'midbrain'],
        route: [['ear', 'pons'], ['pons', 'midbrain']],
        text: 'The signals first reach the cochlear nuclei near the {{pons}}, then travel along several routes. One group of brainstem cells compares sound arriving at your two ears, helping you tell where the voice is coming from. Higher up, the inferior colliculus in the {{midbrain}} brings together information about the sound before it travels onward.'
      },
      {
        title: 'Sound reaches the thalamus',
        focus: ['thalamus'],
        route: [['midbrain', 'thalamus']],
        text: 'The hearing-related part of the {{thalamus}} sharpens and routes sound signals on their way to the {{auditory-cortex}}. Rather than a simple one-way depot, this relay constantly receives feedback from the cortex itself, helping tune your attention to your friend\'s voice amidst surrounding cafe noise.'
      },
      {
        title: 'Patterns form in auditory cortex',
        focus: ['auditory-cortex'],
        route: [['thalamus', 'auditory-cortex']],
        text: 'The {{auditory-cortex}} tracks acoustic features such as pitch, rhythm and quick changes in sound. Processing does not wait for a neat border between sound and meaning. Speech-sensitive networks across the temporal lobe progressively match these patterns with familiar words while staying in dialogue with frontal areas.'
      },
      {
        title: 'Words connect with meaning',
        focus: ['wernickes-area'],
        route: [['auditory-cortex', 'wernickes-area']],
        text: 'Across temporal and parietal regions, the sounds you hear connect with words, ideas and the rest of the sentence. {{wernickes-area}} is a traditional name for part of this territory, but understanding language is the collective work of a wider network. These regions stay continuously engaged, linking what you hear to the speech you might prepare.'
      },
      {
        title: 'A reply takes shape',
        focus: ['brocas-area'],
        route: [['wernickes-area', 'brocas-area', { flow: 'both' }]],
        text: 'Frontal language regions, including {{brocas-area}}, help shape a response and organize it for speech. They work in continuous two-way exchange with temporal and parietal regions as you choose words and prepare to say something like "Yes, with milk, please." This is an ongoing conversation between regions, not a message passed along a single wire.'
      },
      {
        title: 'Spoken aloud and heard',
        focus: ['motor-cortex'],
        route: [['brocas-area', 'motor-cortex'], ['motor-cortex', 'auditory-cortex']],
        text: 'The mouth and face region of the {{motor-cortex}} helps send commands that move your jaw, lips and tongue while breathing muscles make sound. As you speak, signals also loop back to your own {{auditory-cortex}} to monitor and tune your pronunciation in real time, while the sound crossing the room begins the hearing pathway in your friend.'
      },
    ],
  },
  {
    id: 'catch',
    category: 'function',
    name: 'Catching a ball',
    tagline: 'Half a second, a dozen brain areas.',
    summary: 'Catching looks simple and uses almost the whole brain. The {{visual-cortex}} sees the ball, the {{posterior-parietal}} predicts its flight, the {{motor-cortex}} orders the reach, and the {{cerebellum}} trims the error mid flight.',
    steps: [
      { title: 'Spotting the ball', focus: ['eye', 'visual-cortex'], route: [['eye', 'thalamus'], ['thalamus', 'visual-cortex']], view: 'left-back', text: 'The ball leaves a hand across the room. Motion and edges register in the {{visual-cortex}} within a tenth of a second. You have not yet decided to move, but the throw is already tracked.' },
      { title: 'Where is it going?', focus: ['posterior-parietal'], route: [['visual-cortex', 'posterior-parietal']], text: 'The {{posterior-parietal}} plots the flight and where your hand must meet it. It blends ball path with your body position. This prediction is why you run to where the ball will be, not where it is.' },
      { title: 'Plan the reach', focus: ['motor-cortex'], route: [['posterior-parietal', 'motor-cortex']], text: 'The target reaches the {{motor-cortex}}, which fires the shoulder, elbow and finger sequence. The plan includes when to close, not just where to go. Too early or late and the ball bounces off.' },
      { title: 'Command to the arm', focus: ['spinal-cord', 'hand'], route: [['motor-cortex', 'spinal-cord'], ['spinal-cord', 'hand']], view: 'left', text: 'Orders rush down to the {{spinal-cord}} and out to arm and hand muscles. The hand opens to ball size on the way. Touch will report the catch a moment later through the {{somatosensory-cortex}}.' },
      { title: 'Fine-tuning mid-flight', focus: ['cerebellum'], route: [['motor-cortex', 'pons'], ['pons', 'cerebellum'], ['cerebellum', 'thalamus'], ['thalamus', 'motor-cortex']], view: 'left-back', text: 'As the ball curves, a copy of the plan sent via the {{pons}} lets the {{cerebellum}} spot the miss early. Corrections loop up through the {{thalamus}} back to the {{motor-cortex}}. The hand shifts and the catch looks easy.' },
    ],
  },
  {
    id: 'dopamine-pathways',
    category: 'chemistry',
    name: 'Dopamine: drive, habits and reward',
    tagline: 'Why you want things, and how wanting becomes a habit.',
    summary: 'Dopamine is involved in learning, motivation and movement rather than acting as a simple pleasure chemical. Midbrain neurons in the {{substantia-nigra}} and {{vta}} send it to different, overlapping networks. Their signals help update predictions and change how strongly other inputs shape behaviour.',
    steps: [
      { title: 'A hint of reward', focus: ['vta'], route: [], view: 'left', text: 'Something hints that a good thing may be coming, like the smell of coffee. Many {{vta}} dopamine neurons change their firing when an outcome differs from what was expected. With learning, part of that response can shift from the reward to a cue that predicts it.' },
      { title: 'Learning a cue', focus: ['striatum'], route: [['vta', 'striatum']], view: 'left', text: 'Dopamine reaching the {{striatum}} helps change how cues and actions are learned. It can increase the motivational pull of a cue, but an urge is produced by a wider network and cannot be read directly from dopamine alone.' },
      { title: 'Keeping the goal in mind', focus: ['prefrontal-cortex'], route: [['vta', 'prefrontal-cortex']], view: 'left-front', text: 'Another branch from the {{vta}} reaches the {{prefrontal-cortex}}. Here dopamine helps hold the goal in working memory and tunes out distractions while you work out how to get it.' },
      { title: 'Reaching for it', focus: ['substantia-nigra', 'striatum', 'motor-cortex'], route: [['substantia-nigra', 'striatum'], ['striatum', 'globus-pallidus'], ['globus-pallidus', 'thalamus'], ['thalamus', 'motor-cortex']], view: 'left', text: 'To act, the movement loop needs dopamine from the {{substantia-nigra}}. It helps lift the brake in the {{globus-pallidus}}, the {{thalamus}} passes the go signal to the cortex, and your hand reaches out. This is the supply that fails in Parkinson\'s disease.' },
      { title: 'Learning for next time', focus: ['hippocampus', 'amygdala'], route: [['vta', 'hippocampus'], ['vta', 'amygdala']], view: 'left', text: 'The {{hippocampus}} and {{amygdala}} store where it happened and how good it felt. If the reward beat your prediction, the links that led there get stronger. Next time the cue pulls a little harder and the habit starts sooner.' },
    ],
  },
  {
    id: 'serotonin-pathways',
    category: 'chemistry',
    name: 'Serotonin: mood, resilience and sleep',
    tagline: 'A slow, steady signal from the brainstem that shapes mood and sleep.',
    summary: 'Serotonin is made by a thin strip of cells, the {{raphe-nuclei}}, running down the middle of the brainstem. Their fibres branch to almost every part of the brain and spinal cord. Its effects are broad and slow, and scientists still argue about exactly what it does for mood.',
    steps: [
      { title: 'A steady pulse in the brainstem', focus: ['raphe-nuclei'], route: [], view: 'medial', slice: true, text: 'The {{raphe-nuclei}} fire slowly and regularly while you are awake. They make [[serotonin]] from tryptophan, an amino acid you get from food.' },
      { title: 'Tuning the amygdala', focus: ['amygdala'], route: [['raphe-nuclei', 'amygdala']], view: 'left', slice: true, text: 'Fibres reach the {{amygdala}}. Serotonin changes how easily it reacts, which is one reason serotonin is linked to anxiety and to how well people cope with stress.' },
      { title: 'Patience in the frontal cortex', focus: ['prefrontal-cortex', 'cingulate-cortex'], route: [['raphe-nuclei', 'prefrontal-cortex'], ['raphe-nuclei', 'cingulate-cortex']], view: 'left-front', text: 'Other fibres reach the {{prefrontal-cortex}} and {{cingulate-cortex}}. Here serotonin is linked to patience and to switching away from a strategy that is not working. Low serotonin in animals makes them more impulsive.' },
      { title: 'Sleep and appetite', focus: ['hypothalamus'], route: [['raphe-nuclei', 'hypothalamus']], view: 'medial', slice: true, text: 'Serotonin also reaches the {{hypothalamus}}, which runs appetite, body temperature and the sleep-wake cycle. The raphe cells go almost silent during dreaming sleep.' },
      { title: 'Turning down pain', focus: ['spinal-cord'], route: [['raphe-nuclei', 'spinal-cord']], view: 'left', text: 'One branch runs down the {{spinal-cord}}. There serotonin can turn down pain signals on their way up to the brain.' },
    ],
  },
  {
    id: 'noradrenaline-pathways',
    category: 'chemistry',
    name: 'Noradrenaline: the alert system',
    tagline: 'How a sudden surprise snaps you to attention.',
    summary: 'The two {{locus-coeruleus}} nuclei contain only tens of thousands of neurons, yet send [[noradrenaline]] to most of the brain. Their activity helps tune alertness, attention and responses to uncertainty.',
    steps: [
      { title: 'A burst from the blue spot', focus: ['locus-coeruleus'], route: [], view: 'left-back', text: 'A sudden bang breaks the quiet. The {{locus-coeruleus}} fires a burst within a fraction of a second and releases [[noradrenaline]] across the brain.' },
      { title: 'Sharper senses', focus: ['thalamus'], route: [['locus-coeruleus', 'thalamus']], view: 'left', text: 'In the {{thalamus}} and sensory cortex, noradrenaline makes cells respond more strongly to what matters and less to background noise. The sound you just heard stands out.' },
      { title: 'Attention snaps into place', focus: ['prefrontal-cortex', 'posterior-parietal'], route: [['locus-coeruleus', 'prefrontal-cortex'], ['locus-coeruleus', 'posterior-parietal']], view: 'left-front', text: 'In the {{prefrontal-cortex}} and {{posterior-parietal}}, it pulls attention onto the surprise. Your mind stops wandering. Too much of it, as under heavy stress, makes clear thinking harder.' },
      { title: 'Ready to move', focus: ['cerebellum', 'spinal-cord'], route: [['locus-coeruleus', 'cerebellum'], ['locus-coeruleus', 'spinal-cord']], view: 'left-back', text: 'Fibres to the {{cerebellum}} and {{spinal-cord}} raise muscle tone and speed up reflexes, so you are ready to move.' },
    ],
  },
  {
    id: 'acetylcholine-pathways',
    category: 'chemistry',
    name: 'Acetylcholine: attention and memory',
    tagline: 'Helping you pay attention and remember what you learned.',
    summary: '[[acetylcholine]] carries the signal from motor neurons to skeletal muscles. Inside the brain, cells in the {{basal-forebrain}} send it across the cortex and to the {{hippocampus}} to tune attention and learning. Separate brainstem clusters also release it to regulate arousal and sleep. The forebrain supply degenerates early in Alzheimer\'s disease.',
    steps: [
      { title: 'Something worth learning', focus: ['basal-forebrain'], route: [], view: 'left-front', text: 'You sit down to learn something new, a tune or a puzzle. Cells in the {{basal-forebrain}} become more active when something needs attention.' },
      { title: 'Boosting what comes in', focus: ['frontal-lobe', 'parietal-lobe'], route: [['basal-forebrain', 'frontal-lobe'], ['basal-forebrain', 'parietal-lobe']], view: 'left', text: 'Their fibres release [[acetylcholine]] across the {{frontal-lobe}} and {{parietal-lobe}}. It boosts the signals coming in from the senses relative to the brain\'s own chatter, so what you are looking at gets more weight.' },
      { title: 'Laying down new memories', focus: ['hippocampus'], route: [['basal-forebrain', 'hippocampus']], view: 'medial', slice: true, text: 'In the {{hippocampus}}, acetylcholine helps set the theta rhythm and makes synapses easier to strengthen. This favours taking in new memories. Drugs that block it make it hard to learn new things.' },
      { title: 'Linking to what you know', focus: ['temporal-lobe'], route: [['basal-forebrain', 'temporal-lobe']], view: 'left', text: 'Fibres also reach the {{temporal-lobe}}, where knowledge about names, faces and words is stored. Acetylcholine here helps new facts link up with what you already know.' },
    ],
  },
  {
    id: 'default-mode-network',
    category: 'network',
    name: 'Default mode: the wandering mind',
    tagline: 'What your brain does when you are doing nothing in particular.',
    summary: 'Some brain areas get more active when you stop focusing on the outside world. Together they are called the default mode network. They are busy when you daydream, remember your past, picture the future or think about other people.',
    steps: [
      { title: 'Looking away from the world', focus: ['prefrontal-cortex'], route: [], view: 'left-front', text: 'You put your phone down and stare out of the window. Areas that handle outside tasks quieten, and the inner part of the {{prefrontal-cortex}} gets busier. It is active when you think about yourself.' },
      { title: 'Past and future', focus: ['hippocampus', 'cingulate-cortex'], route: [['prefrontal-cortex', 'cingulate-cortex'], ['cingulate-cortex', 'hippocampus']], view: 'medial', slice: true, text: 'The back of the {{cingulate-cortex}} and the {{hippocampus}} join in. You drift to a memory from years ago, or rehearse a conversation you have not had yet.' },
      { title: 'Thinking about other people', focus: ['temporal-lobe', 'posterior-parietal'], route: [['cingulate-cortex', 'temporal-lobe'], ['temporal-lobe', 'posterior-parietal']], view: 'left', text: 'Parts of the {{temporal-lobe}} and {{posterior-parietal}} cortex come in too. They are active when you think about what someone else knows, wants or feels.' },
      { title: 'Back to the task', focus: ['insula'], route: [['insula', 'prefrontal-cortex']], view: 'left', text: 'Someone calls your name. The {{insula}} flags it as important, the default mode network quietens, and the areas for focused tasks take over again.' },
    ],
  },
];
