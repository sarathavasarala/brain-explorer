// Guided pathways. Each step lights up `focus`, animates signals along `route`
// (pairs of structure or anchor ids), and can override the camera with `view`.
// Earlier steps' routes stay visible but faint, so the whole journey builds up.

export default [
  {
    id: 'seeing',
    name: 'Seeing: from eye to meaning',
    tagline: 'Light becomes edges, then objects and places.',
    summary: 'Seeing happens in stages. The eyes catch light, the {{thalamus}} sorts it, and the {{visual-cortex}} reads edges and motion. From there the brain splits the work: where things are, and what they are.',
    steps: [
      { title: 'Light hits the retina', focus: ['eye'], route: [], view: 'left-front', text: 'Light lands on the retina at the back of each eye. There, about 100 million sensors turn it into tiny electrical signals. The optic nerves carry those signals inward, crossing so each side of the brain gets the opposite half of sight.' },
      { title: 'A relay in the thalamus', focus: ['thalamus'], route: [['eye', 'thalamus']], text: 'The signals stop first in the {{thalamus}}, in a cluster called the lateral geniculate [[nucleus]]. It tidies the input and decides what deserves attention. The cleaned picture then travels back to the {{visual-cortex}} along a fan of fibres.' },
      { title: 'Edges and lines in the visual cortex', focus: ['visual-cortex'], route: [['thalamus', 'visual-cortex']], view: 'left-back', text: 'In the {{visual-cortex}}, cells fire for short edges, angles, colours and motion. Together they tile the whole view like puzzle pieces. This is seeing without yet knowing: lines and movement, but no names.' },
      { title: 'The "where" stream', focus: ['posterior-parietal'], route: [['visual-cortex', 'posterior-parietal']], view: 'left-back', text: 'One copy flows up to the {{posterior-parietal}}. It maps where things sit and how to reach them. This stream guides your hand to a mug without you naming the mug.' },
      { title: 'The "what" stream', focus: ['temporal-lobe'], route: [['visual-cortex', 'temporal-lobe']], text: 'A second copy flows down to the {{temporal-lobe}}. It matches shapes to memory, so edges become a face or a cup. Damage here leaves sight sharp but recognition blank, which shows how separate the two streams are.' },
    ],
  },
  {
    id: 'moving',
    name: 'Moving: deciding to reach',
    tagline: 'From an intention to a muscle twitch.',
    summary: 'A reach starts as a goal and ends as muscle. In between, the {{striatum}} picks the action, the {{thalamus}} releases it, and the {{motor-cortex}} sends it down through the brainstem to the hand. The {{cerebellum}} checks the flight.',
    steps: [
      { title: 'A goal forms', focus: ['prefrontal-cortex'], route: [], view: 'left-front', text: 'It starts in the {{prefrontal-cortex}} with a goal, like "grab that mug". The goal stays active while distractions pass. This holding is what lets a plan survive the seconds before moving.' },
      { title: 'Choosing the action', focus: ['striatum', 'globus-pallidus'], route: [['prefrontal-cortex', 'striatum'], ['striatum', 'globus-pallidus']], text: 'The goal goes to the {{striatum}}, which weighs possible reaches the way you might weigh routes. Its verdict goes to the {{globus-pallidus}}, the brake that normally holds movement back. The right choice starts to lift that brake.' },
      { title: 'Releasing the brake', focus: ['thalamus'], route: [['globus-pallidus', 'thalamus'], ['substantia-nigra', 'striatum']], text: 'The {{globus-pallidus}} pauses its steady hush on the {{thalamus}}. That pause is the release. Meanwhile [[dopamine]] from the {{substantia-nigra}} tells the {{striatum}} the choice was worth making, strengthening it for next time.' },
      { title: 'The command leaves the cortex', focus: ['motor-cortex'], route: [['thalamus', 'motor-cortex']], text: 'Freed by the {{thalamus}}, the {{motor-cortex}} fires the pattern for shoulder, elbow and fingers in order. Large [[pyramidal cell|pyramidal cells]] send the burst down. This is the "go" moment.' },
      { title: 'Down the brainstem', focus: ['midbrain', 'pons', 'medulla'], route: [['motor-cortex', 'midbrain'], ['midbrain', 'medulla']], view: 'left', text: 'Orders travel down through the {{midbrain}}, past the {{pons}} (which copies them for the {{cerebellum}}) and through the {{medulla}}. Most fibres cross sides here, so the left brain drives the right hand.' },
      { title: 'Out to the muscles', focus: ['spinal-cord', 'hand'], route: [['medulla', 'spinal-cord'], ['spinal-cord', 'hand']], view: 'left', text: 'In the {{spinal-cord}}, upper orders meet motor [[neuron|neurons]] that use acetylcholine to contract muscles. Fingers close around the mug. Touch signals start the return trip up to the {{somatosensory-cortex}} to confirm the grip.' },
      { title: 'The cerebellum corrects', focus: ['cerebellum'], route: [['motor-cortex', 'pons'], ['pons', 'cerebellum'], ['cerebellum', 'thalamus']], view: 'left-back', text: 'While the hand moves, a copy sent via the {{pons}} reaches the {{cerebellum}}. It compares plan with feedback from muscles and eyes, then sends corrections up through the {{thalamus}} to the {{motor-cortex}}. The reach lands smooth instead of jerky.' },
    ],
  },
  {
    id: 'remembering',
    name: 'Remembering: making a memory',
    tagline: 'How an experience becomes something you can recall.',
    summary: 'A memory starts spread across the {{cortex}} and gets bound in the {{hippocampus}}. Feeling from the {{amygdala}} adds weight, a loop through the body clocks it, and over time the {{cortex}} keeps it alone.',
    steps: [
      { title: 'An experience in the cortex', focus: ['temporal-lobe', 'parietal-lobe'], route: [], text: 'Meeting a friend in a cafe wakes the {{temporal-lobe}} (faces, words) and the {{parietal-lobe}} (where you sat, the reach for the cup). At first the pieces live apart. Nothing yet ties them into one recallable event.' },
      { title: 'Bound together in the hippocampus', focus: ['hippocampus'], route: [['temporal-lobe', 'hippocampus'], ['parietal-lobe', 'hippocampus']], text: 'Both streams flow into the {{hippocampus}}. Its looped wiring binds who, what and where into one pattern, so later one cue can bring back the rest. This binding is why picturing the cafe can return the whole chat.' },
      { title: 'Emotion adds weight', focus: ['amygdala'], route: [['amygdala', 'hippocampus']], text: 'If the meeting mattered, the {{amygdala}} stamps it. [[neuromodulator]] chemicals tell the {{hippocampus}} to keep this one strongly. That is why emotional days stick while ordinary ones fade.' },
      { title: 'The memory loop', focus: ['hypothalamus', 'thalamus', 'cingulate-cortex'], route: [['hippocampus', 'hypothalamus'], ['hypothalamus', 'thalamus'], ['thalamus', 'cingulate-cortex'], ['cingulate-cortex', 'hippocampus']], view: 'medial', slice: true, text: 'The new trace circles the classic loop: {{hippocampus}} to {{hypothalamus}} to {{thalamus}} to {{cingulate-cortex}} and back. Each pass replays it during rest and sleep. The loop also ties the memory to body rhythms and attention.' },
      { title: 'Stored in the cortex over time', focus: ['temporal-lobe', 'prefrontal-cortex'], route: [['hippocampus', 'temporal-lobe'], ['hippocampus', 'prefrontal-cortex']], text: 'Over days and weeks, replay trains the {{temporal-lobe}} and {{prefrontal-cortex}} to hold the memory directly. The {{hippocampus}} can then let go. Old memories survive hippocampus damage for this reason, while new ones stop forming.' },
    ],
  },
  {
    id: 'fear',
    name: 'Fear: the snake on the path',
    tagline: 'Why you jump before you know why.',
    summary: 'Fear runs on two roads. A fast rough sketch from the {{thalamus}} to the {{amygdala}} moves the body first. A slower detailed check through the {{visual-cortex}} follows, and the {{prefrontal-cortex}} calms things when it was only a stick.',
    steps: [
      { title: 'Something moves', focus: ['eye'], route: [], view: 'left-front', text: 'On a path, a curved shape moves near your foot. The eyes catch motion and shape before detail is clear. The brain treats "maybe snake" as urgent and skips the queue.' },
      { title: 'The fast road', focus: ['thalamus', 'amygdala'], route: [['eye', 'thalamus'], ['thalamus', 'amygdala']], text: 'A rough sketch rushes from the {{thalamus}} straight to the {{amygdala}}. No waiting for full vision. The {{amygdala}} sounds the alarm on the motto "better safe than sorry".' },
      { title: 'The body reacts', focus: ['hypothalamus', 'midbrain'], route: [['amygdala', 'hypothalamus'], ['amygdala', 'midbrain']], text: 'The {{amygdala}} orders the {{hypothalamus}} to raise heart rate and release stress hormones, and the {{midbrain}} to freeze or step back. You jump before you have words for what you saw.' },
      { title: 'The slow road catches up', focus: ['visual-cortex'], route: [['thalamus', 'visual-cortex'], ['visual-cortex', 'amygdala']], view: 'left-back', text: 'Half a second later, the detailed route arrives through the {{visual-cortex}}. Edges and colours resolve into bark pattern and no head. This slower news also reaches the {{amygdala}}, updating the first verdict.' },
      { title: '"It\'s just a stick"', focus: ['prefrontal-cortex'], route: [['prefrontal-cortex', 'amygdala']], view: 'left-front', text: 'The {{prefrontal-cortex}} weighs the new evidence and hushes the alarm through calming cells. Heart rate falls. You laugh, step over the stick, and the {{amygdala}} learns this path is a little safer.' },
    ],
  },
  {
    id: 'hearing-speech',
    name: 'Hearing a sentence and replying',
    tagline: 'Sound becomes words, and words become speech.',
    summary: 'Speech is a relay across the left side. Sound climbs through the {{thalamus}} to the {{auditory-cortex}}, gains meaning in {{wernickes-area}}, gets built into a reply in {{brocas-area}}, and leaves through the {{motor-cortex}}.',
    steps: [
      { title: 'Sound reaches the inner ear', focus: ['ear'], route: [], text: 'A friend asks a question. Sound waves shake the inner ear, where tiny hair cells turn vibration into signals. Pitch and timing are already sorted before the brain gets them.' },
      { title: 'Up through the thalamus', focus: ['thalamus'], route: [['ear', 'thalamus']], text: 'The signals climb to the {{thalamus}}, which filters the voice from background noise. The cleaned stream is sent on to the {{auditory-cortex}}. Without this gate, a cafe would drown the words.' },
      { title: 'Heard in the auditory cortex', focus: ['auditory-cortex'], route: [['thalamus', 'auditory-cortex']], text: 'The {{auditory-cortex}} splits the stream into pitch, rhythm and syllable gaps. At this point it is still sound, not yet meaning. A cough and a word look similar here.' },
      { title: 'Understood in Wernicke\'s area', focus: ['wernickes-area'], route: [['auditory-cortex', 'wernickes-area']], text: 'In {{wernickes-area}}, sounds map onto ideas. "Mug" wakes the look, heft and use of a mug. Strings of words become who did what. Damage here leaves speech smooth but empty.' },
      { title: 'A reply planned in Broca\'s area', focus: ['brocas-area'], route: [['wernickes-area', 'brocas-area']], text: 'Your answer takes shape in {{brocas-area}}. It orders words and grammar into a speakable plan, like "yes, with milk please". This planning is separate from understanding, which is why one can break without the other.' },
      { title: 'Spoken aloud', focus: ['motor-cortex'], route: [['brocas-area', 'motor-cortex']], text: 'The plan goes to the mouth zone of the {{motor-cortex}}. Lips, tongue, jaw and breath move in fast sequence. Sound leaves, crosses the room, and starts the whole relay in reverse for your friend.' },
    ],
  },
  {
    id: 'catch',
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
];
