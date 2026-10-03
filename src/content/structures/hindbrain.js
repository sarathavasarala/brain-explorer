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
      overview: {
        text: 'The cerebellum ("little brain") sits at the back of your head, tucked under the {{occipital-lobe|occipital lobe}} and behind the {{pons}}. It is only about a tenth of the brain\'s volume, but its tightly folded ridges hold more than half of all the brain\'s [[neuron|neurons]].\n\nIt prepares, times, and adjusts movements rather than starting them on its own. When you reach for a glass or step over a puddle, it constantly compares what you meant to do with what your limbs are actually doing, reducing errors on the fly.',
        bullets: [
          'Coordination and timing: lets multiple joints move together smoothly.',
          'Balance and posture: keeps you steady and upright on autopilot.',
          'Motor learning: gradually perfects physical skills through practice.',
          'Physical landmarks: two hemispheres joined by a middle strip called the vermis.',
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
      states: [
        {
          kind: 'lesion',
          teaser: 'Timing and balance break down into unsteady tremors.',
          text: 'Losing cerebellar calibration scrambles the fine timing and coordination needed for smooth physical movement. Muscle strength remains intact, but the brain can no longer predict momentum or smooth out trajectory errors in real time. Reaching for a cup produces wide tremors that worsen near the target, and walking turns into an unsteady stagger.',
          signs: [
            'Hand tremors that grow more pronounced as fingers approach a target.',
            'Wide, unsteady footsteps resembling walking on a pitching ship.',
            'Slurred, scanning speech where syllables are delivered with irregular pacing and volume.',
          ],
          ripple: [
            { id: 'thalamus', role: 'cut_off' },
            { id: 'motor-cortex', role: 'cut_off' },
          ],
        },
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
    analogy: 'A night watchman who turns your head toward sudden sounds and sights before you decide to look.',
    levels: {
      overview: {
        text: 'The midbrain is the top inch of the brainstem, sitting just below the {{thalamus}} and above the {{pons}}. About as long as the top joint of your thumb, all neural signals traveling between the forebrain and the rest of the body pass through or beside it.\n\nIt runs fast survival reflexes you do not choose. When something flashes at the edge of vision or a twig snaps behind you, it whips your eyes and head toward the surprise. At the same time, its {{substantia-nigra}} cells send steady [[dopamine]] that keeps voluntary movement smooth and ready to start.',
        bullets: [
          'Visual and sound reflexes: points the eyes and head toward sudden cues.',
          'Movement support: dopamine from the substantia nigra helps start physical actions.',
          'Alertness control: adjusts background wakefulness and dampens pain.',
          'Physical landmarks: roof features four bumps (the colliculi) for sight and sound reflexes.',
        ],
      },
      connects: {
        text: 'Alarm input arrives from the {{amygdala}} when something might matter. The midbrain adds its reflex and passes the news upward to the {{thalamus}}, which wakes up the cortex. It also trades signals down with the {{pons}} to coordinate the eyes, head and body.',
        connections: [
          { id: 'thalamus', dir: 'out', label: 'Alert signals passed up toward the cortex' },
          { id: 'pons', dir: 'both', label: 'Eye and body signals shared down the brainstem' },
          { id: 'amygdala', dir: 'in', label: 'Alarm input when something feels threatening' },
        ],
      },
      cells: {
        text: 'Most midbrain cells are ordinary relay [[neuron|neurons]] that use [[glutamate]] and pass messages quickly. The famous exception is the dopamine cluster in the {{substantia-nigra}}. Like the broadcast diagram shows, a few thousand of these cells grow hugely branched [[axon|axons]] that reach the whole {{striatum}} and change how it responds.',
        diagram: 'neuromodulator',
        synapse: 'dopamine',
        bullets: [
          'The dark colour of the substantia nigra comes from pigment inside its dopamine cells.',
          'Parkinson\'s motor signs usually appear only after substantial loss of these cells and their striatal dopamine supply.',
        ],
      },
    },
    tryIt: 'Look at one corner of the room, then flick your eyes to the opposite corner without moving your head. That quick jump (a saccade) is steered through the midbrain.',
    breaks: {
      text: 'Damage here is rare but serious, because so many cables pass through such a small space.',
      bullets: [
        'Loss of dopamine cells causes Parkinson\'s: slow movement, stiffness and a resting tremor.',
        'Damage to the eye reflex bumps causes double vision or trouble looking up and down.',
        'A stroke here can affect the eyes, the body and wakefulness all at once.',
      ],
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
    analogy: 'A busy interchange where every lane from the cortex gets copied and sent south to the cerebellum.',
    levels: {
      overview: {
        text: 'The pons is the rounded bulge on the front of the brainstem, between the {{midbrain}} above, the {{medulla}} below, and the {{cerebellum}} behind. Its Latin name means bridge, describing its thick bundle of crossing [[white matter]] fibres that wrap around the brainstem\'s front.\n\nIt copies movement plans leaving the {{motor-cortex}} and forwards them south to the {{cerebellum}} so movements can be checked and smoothed. It also coordinates sideways eye movements, chewing, face sensation, and the switches that govern dream sleep.',
        bullets: [
          'Cerebellar relay: sends a copy of cortical motor plans to the cerebellum.',
          'Eye coordination: coordinates both eyes to move sideways together.',
          'Sleep rhythms: hosts circuits that trigger and regulate dream sleep.',
          'Physical landmarks: prominent rounded bulge about 2 to 3 cm tall on the front of the brainstem.',
        ],
      },
      connects: {
        text: 'Plans flow in from the {{motor-cortex}} and out to the {{cerebellum}}, which is the pons\'s main job. It also talks both ways with the {{medulla}} to share breathing, sleep and heartbeat duties.',
        connections: [
          { id: 'motor-cortex', dir: 'in', label: 'A copy of each movement plan from the cortex' },
          { id: 'cerebellum', dir: 'out', label: 'Plans forwarded for smoothing and timing' },
          { id: 'medulla', dir: 'both', label: 'Breathing, sleep and heart signals shared' },
        ],
      },
      cells: {
        text: 'The pons is mostly crossing [[axon|axons]] wrapped in [[myelin]], which is why it looks pale and bulging. Scattered among them are relay cells that use [[glutamate]] to pass the cortical copy onward. A small blue-tinged cluster (the locus coeruleus) works like the broadcast diagram, spraying noradrenaline across the brain to raise alertness.',
        diagram: 'neuromodulator',
        synapse: 'noradrenaline',
        bullets: [
          'The two locus coeruleus nuclei together contain only tens of thousands of neurons, yet their axons reach most of the brain.',
          'It goes quiet during dream sleep and fires in bursts when something surprising happens.',
        ],
      },
    },
    tryIt: 'Hold a finger up and look at it, then look at the far wall, then back. The clean sideways jump your eyes make travels through circuits in the pons.',
    breaks: {
      text: 'Because the pons packs movement, feeling and alertness fibres into a small space, damage here has wide effects.',
      bullets: [
        'A stroke can cause "locked-in" syndrome: fully awake but unable to move except the eyes.',
        'Damage to eye circuits causes double vision or eyes that do not move together.',
        'Interrupted sleep circuits lead to very broken sleep or loss of dream sleep.',
      ],
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
    analogy: 'The building manager in the basement who keeps the power, water and air running while everyone upstairs works.',
    levels: {
      overview: {
        text: 'The medulla oblongata is the lowest part of the brainstem, where the brain narrows into the {{spinal-cord}}. It sits beneath the {{pons}} and in front of the {{cerebellum}}, looking like a slightly swollen stalk about 3 cm long.\n\nIt runs the vital survival jobs you cannot pause. Sensors in your blood and body feed into the medulla, which fine-tunes your breathing rate, steadies blood pressure, and directs swallowing and coughing. When you try holding your breath, rising carbon dioxide triggers the medulla until it forces a breath in.',
        bullets: [
          'Breathing control: speeds or slows respiration based on blood chemistry.',
          'Heart and blood pressure: balances heart rate and vascular tone second by second.',
          'Throat reflexes: coordinates swallowing, gagging, and coughing sequences.',
          'Physical landmarks: front ridges called pyramids where motor cables cross sides.',
        ],
      },
      connects: {
        text: 'Orders about body state arrive from the {{hypothalamus}}. The medulla acts on them and trades signals both ways with the {{spinal-cord}} below and the {{pons}} above. It also swaps balance and body feedback with the {{cerebellum}} to keep posture steady.',
        connections: [
          { id: 'spinal-cord', dir: 'both', label: 'Body signals up, orders down' },
          { id: 'hypothalamus', dir: 'in', label: 'Body-state orders such as hunger or heat' },
          { id: 'cerebellum', dir: 'both', label: 'Balance and posture feedback exchanged' },
          { id: 'pons', dir: 'both', label: 'Breathing and heart rhythms coordinated' },
        ],
      },
      cells: {
        text: 'The medulla mixes big [[white matter]] highways with small [[grey matter]] control clusters. Many clusters spray serotonin widely, as the broadcast diagram shows, to set sleep, mood and pain levels. Its rhythm-generating cells fire on their own, like a slow pacemaker, and excite motor [[neuron|neurons]] with [[glutamate]].',
        diagram: 'neuromodulator',
        synapse: 'serotonin',
        bullets: [
          'Breathing pacemaker cells keep firing even in a dish, with no input at all.',
          'Opiate painkillers act partly here, which is why overdoses slow breathing dangerously.',
        ],
      },
    },
    tryIt: 'Swallow now and notice you cannot breathe at the same moment. That brief switch, breathing paused while the throat closes, is the medulla running the sequence.',
    breaks: {
      text: 'Damage here can be life threatening, because breathing and blood pressure control live here.',
      bullets: [
        'A stroke can cause trouble swallowing, slurred speech and dizziness.',
        'Injury high on the neck or medulla can stop breathing and need a ventilator.',
        'Long term high blood pressure and sleep apnoea both involve these control loops going wrong.',
      ],
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
    analogy: 'A motorway with local slip roads: through traffic to the brain, plus quick local exits for reflexes.',
    levels: {
      overview: {
        text: 'The spinal cord runs from the {{medulla}} down inside your backbone, measuring about 45 cm long in an adult and roughly as thick as your little finger. At each vertebra, paired spinal nerves branch off to serve a specific horizontal strip of the body.\n\nIt serves as the main information highway, carrying movement commands down from the {{motor-cortex}} to muscles and touch feedback up to the {{somatosensory-cortex}}. It also manages immediate reflex loops on its own, pulling your hand away from a hot stove before the brain even registers pain.',
        bullets: [
          'Two-way highway: carries motor orders down and sensory signals up.',
          'Local reflex loops: snaps limbs away from danger without waiting for the brain.',
          'Rhythm generators: coordinates automatic walking cycles and bladder control.',
          'Physical landmarks: 31 pairs of spinal nerves leaving along the vertebral column.',
        ],
      },
      connects: {
        text: 'Movement plans arrive from the {{motor-cortex}} and travel down to muscles. Touch and position signals head the other way to the {{somatosensory-cortex}}. A copy of both streams goes to the {{cerebellum}} so it can fine tune movement.',
        connections: [
          { id: 'motor-cortex', dir: 'in', label: 'Movement orders travelling down to muscles' },
          { id: 'somatosensory-cortex', dir: 'out', label: 'Touch and body signals travelling up' },
          { id: 'cerebellum', dir: 'out', label: 'Copies sent for balance correction' },
        ],
      },
      cells: {
        text: 'A reflex arc, like the diagram shows, needs only three cells: a sensory [[neuron]], a relay [[interneuron]], and a motor neuron that uses acetylcholine to contract muscle. Signals between vertebrae use [[glutamate]] to excite the next cell. Brain orders ride down fast, [[myelin]] wrapped highways on the outside.',
        diagram: 'reflex-arc',
        synapse: 'acetylcholine',
        bullets: [
          'A knee jerk reflex uses just two cells and takes about 30 milliseconds.',
          'Motor neurons in the cord are among the longest cells in your body, up to a metre long.',
        ],
      },
    },
    tryIt: 'Rest a hand near the edge of a table and have a friend tap just below your kneecap with the side of their hand while your leg dangles. The small kick that follows is a spinal reflex, no brain needed.',
    breaks: {
      text: 'A spinal-cord injury can disrupt movement, sensation and automatic body functions below the injury. Damage at the injured segment can also affect nearby nerves and muscles.',
      bullets: [
        'A neck injury can paralyse arms and legs (tetraplegia). A lower injury affects the legs only (paraplegia).',
        'Damaged touch highways cause numbness, tingling or chronic pain.',
        'Disc disease can compress nerve roots, while motor neuron diseases can damage cells in the cord as well as other motor pathways.',
      ],
    },
  },
  {
    id: 'raphe-nuclei',
    name: 'Raphe nuclei',
    group: 'hindbrain',
    color: '#00f5d4',
    shape: { type: 'ellipsoid', center: [0.0, -0.22, -0.2], radii: [0.018, 0.07, 0.024], count: 650, pattern: 'fine', fill: 0.8 },
    view: 'medial',
    slice: true,
    tagline: 'Brainstem nuclei that send serotonin through widespread circuits.',
    analogy: 'A set of tuning controls whose effects depend on the receptor and circuit receiving the signal.',
    levels: {
      overview: {
        text: 'The raphe nuclei form a narrow chain of neuron clusters running down the midline seam of the brainstem, from the {{midbrain}} through the {{pons}} and {{medulla}}. The name comes from the Greek word for seam, describing how they sit like stitches joining the two halves.\n\nThese nuclei serve as the central nervous system\'s primary source of [[serotonin]]. They release serotonin into widespread forebrain and spinal circuits, shaping sleep cycles, appetite, pain sensitivity, and behavioral flexibility depending on the local receptors receiving the signal.',
        bullets: [
          'Serotonin broadcast: sends neuromodulatory projections across the whole brain.',
          'Sleep and wake cycles: changes firing rates across sleep, dream sleep, and waking.',
          'Pain dampening: descending projections quiet pain signals in the spinal cord.',
          'Physical landmarks: a thin column running along the midline core of the brainstem.',
        ],
      },
      connects: {
        text: 'Ascending fibres reach the {{prefrontal-cortex}}, {{amygdala}} and {{hypothalamus}}, where their effects depend on local receptors and activity. Descending fibres run to the {{spinal-cord}} and can either reduce or facilitate pain in different conditions.',
        connections: [
          { id: 'prefrontal-cortex', dir: 'out', label: 'Behaviour and learning tuned by serotonin' },
          { id: 'amygdala', dir: 'out', label: 'Emotional responses modulated by serotonin' },
          { id: 'hypothalamus', dir: 'out', label: 'Circadian rhythm and sleep-wake tuning' },
          { id: 'spinal-cord', dir: 'out', label: 'Pain processing modulated from above' },
        ],
      },
      cells: {
        text: 'Raphe neurons fire with a slow, regular pacemaker beat during wakefulness. Their sprawling branches release [[serotonin]], which binds to over a dozen different [[receptor]] types across target areas, as pictured in the broadcast diagram.',
        diagram: 'neuromodulator',
        synapse: 'serotonin',
        bullets: [
          'Antidepressant medicines (SSRIs) slow down the removal of serotonin released by these cells.',
          'Psychedelic compounds act primarily by stimulating 5-HT2A serotonin receptors in the cortex.',
        ],
      },
    },
    tryIt: 'Take three slow breaths with longer exhalations and notice any change in tension. Breathing can alter autonomic and attention networks, but the feeling cannot be assigned to serotonin or the raphe nuclei alone.',
    breaks: {
      text: 'Raphe damage and altered serotonin signalling can affect sleep, pain and behaviour, but common mood disorders cannot be reduced to a simple serotonin shortage.',
      bullets: [
        'Depression and anxiety involve many interacting systems. Serotonin treatments can help some people without proving a single chemical deficit.',
        'Sleep disorders can involve raphe circuits alongside many other brainstem, hypothalamic and cortical systems.',
        'Serotonin syndrome: life-threatening toxicity caused by accidental overdoses of serotonergic drugs.',
      ],
    },
  },
  {
    id: 'locus-coeruleus',
    name: 'Locus coeruleus',
    group: 'hindbrain',
    color: '#ff5722',
    shape: { type: 'ellipsoid', center: [0.035, -0.2, -0.21], radii: [0.016, 0.02, 0.022], count: 450, mirror: true, fill: 1 },
    view: 'left-back',
    tagline: 'A small noradrenaline system that retunes alertness and attention.',
    analogy: 'A watchtower sentry who fires a flare when something unexpected happens, putting the whole city on alert.',
    levels: {
      overview: {
        text: 'The locus coeruleus ("blue spot") is a tiny pair of nuclei in the upper {{pons}}, on the floor of the fourth ventricle. Its bluish hue under a microscope comes from melanin granules produced as a byproduct of synthesizing [[noradrenaline]].\n\nAlthough it contains only about 30,000 to 50,000 neurons, its branched axons reach almost every corner of the cortex, cerebellum, and spinal cord. It acts like a neural broadcast tower, firing in bursts during surprises or sudden danger to sharpen sensory focus and wake the brain up.',
        bullets: [
          'Arousal broadcasting: releases noradrenaline to tune alertness across the brain.',
          'Surprise response: fires bursts when unexpected events demand immediate attention.',
          'Signal tuning: helps circuits focus on relevant cues and filter out noise.',
          'Physical landmarks: tiny blue-pigmented nuclei on the upper rear wall of the pons.',
        ],
      },
      connects: {
        text: 'It broadcasts alarm signals up to the {{thalamus}} and {{amygdala}} for threat processing, to the {{prefrontal-cortex}} for urgent decision-making, and back to the {{cerebellum}} for fast motor readiness.',
        connections: [
          { id: 'thalamus', dir: 'out', label: 'Sensory relay responses retuned' },
          { id: 'amygdala', dir: 'out', label: 'Emotional learning and arousal modulated' },
          { id: 'prefrontal-cortex', dir: 'out', label: 'Attention and working memory retuned' },
          { id: 'cerebellum', dir: 'out', label: 'Movement and learning circuits modulated' },
        ],
      },
      cells: {
        text: 'Locus coeruleus neurons have extremely branched axons, as shown in the neuromodulator broadcast diagram. Different cells project to overlapping sets of cortical, cerebellar, brainstem and spinal targets, allowing [[noradrenaline]] to coordinate broad but not uniform changes.',
        diagram: 'neuromodulator',
        synapse: 'noradrenaline',
        bullets: [
          'Their firing varies with arousal and events, and becomes very low during REM sleep.',
          'Locus coeruleus degeneration occurs early in Alzheimer\'s disease and is also found in Parkinson\'s disease.',
        ],
      },
    },
    tryIt: 'Notice how a sudden sound interrupts a wandering thought. Locus-coeruleus noradrenaline helps retune attention during surprise, alongside sensory, autonomic and cortical networks.',
    breaks: {
      text: 'Changes in this system are associated with several disorders, but they are not a single cause of panic, ADHD or fatigue.',
      bullets: [
        'PTSD and panic disorder can involve altered noradrenergic arousal alongside wider fear and stress networks.',
        'ADHD medicines can act on noradrenaline and dopamine, but the condition is not a simple shortage of either.',
        'Stress and fatigue change locus coeruleus activity, without evidence for a finite noradrenaline reserve being exhausted.',
      ],
    },
  },
];
