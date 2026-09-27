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
    analogy: 'A night watchman who turns your head toward sudden sounds and sights before you decide to look.',
    levels: {
      where: {
        text: 'The midbrain is the top inch of the brainstem, sitting just below the {{thalamus}} and above the {{pons}}. It is short, about as long as the top joint of your thumb, and shaped like a stubby tube. A narrow fluid channel runs down its middle.',
        bullets: [
          'The roof has four small bumps (the colliculi): two for vision, two for hearing.',
          'Tucked inside its base is the {{substantia-nigra}}, a dark stripe of [[dopamine]] cells.',
          'All signals between the forebrain and the lower brainstem pass through or past it.',
        ],
      },
      does: {
        text: 'The midbrain runs fast reflexes you do not choose. When something flashes at the edge of vision or a twig snaps behind you, it turns your eyes and head toward it. A second job happens quietly in the background. Its dopamine cells send a steady signal that keeps body movement smooth and easy to start.\n\nThink of clapping loudly behind a friend. They flinch and turn before they recognise the sound. That first turn is the midbrain.',
        bullets: [
          'Visual orienting: moves the eyes and head toward sudden movement or light.',
          'Auditory orienting: turns you toward unexpected sounds.',
          'Movement support: dopamine from the substantia nigra helps the {{striatum}} pick and start actions.',
          'Alertness and pain: nearby clusters adjust wakefulness and damp down pain.',
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
          'Losing these cells slows movement. When about half are gone, the signs of Parkinson\'s appear.',
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
      where: {
        text: 'The pons is the rounded bulge on the front of the brainstem, between the {{midbrain}} above and the {{medulla}} below. It sits just in front of the {{cerebellum}}. The name means bridge in Latin, and that is what it looks like, a thick bundle of fibres wrapping around the front.',
        bullets: [
          'About 2 to 3 cm tall, the most prominent part of the brainstem from the front.',
          'Its front is mostly [[white matter]]: crossing fibres heading to the cerebellum.',
          'Inside are scattered clusters of relay [[neuron|neurons]] (the pontine nuclei) plus sleep and face-movement centres.',
        ],
      },
      does: {
        text: 'The pons copies movement plans from the {{motor-cortex}} and hands them to the {{cerebellum}} so it can check and smooth them. It also helps control side to side eye movements, sleep (especially dream sleep) and face sensation and chewing. If the cortex is the office writing the plan, the pons is the mailroom that makes sure the cerebellum gets its copy.',
        bullets: [
          'Relay to cerebellum: forwards a copy of cortical plans for correction.',
          'Eye control: helps move both eyes sideways together.',
          'Sleep and arousal: hosts cells that switch dream sleep on and off.',
          'Face and mouth: carries signals for chewing, swallowing and face feeling.',
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
          'The locus coeruleus holds only about 30,000 cells, yet reaches almost the whole brain.',
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
      where: {
        text: 'The medulla is the lowest part of the brain, where the brain narrows into the {{spinal-cord}}. It sits just below the {{pons}} and in front of the {{cerebellum}}. About 3 cm long, it looks like a slightly swollen stalk. Almost everything going between brain and body passes through it.',
        bullets: [
          'The pyramids on its front are crossing motor fibres: left brain controls right body here.',
          'Olives on its sides hold relay cells for the cerebellum.',
          'Inside are tiny control centres for breathing, heart rate and blood pressure.',
        ],
      },
      does: {
        text: 'The medulla runs the jobs you cannot pause. It sets your breathing rate, steadies blood pressure and heart rate, and coordinates swallowing, coughing and vomiting. It does this using sensors in your blood and body, adjusting second by second without asking you.\n\nYou notice it when you hold your breath. Rising carbon dioxide nags you until the medulla forces a breath in.',
        bullets: [
          'Breathing: speeds up or slows down breaths based on blood chemistry.',
          'Heart and vessels: fine tunes heart rate and blood pressure.',
          'Swallow and cough: runs the throat sequence so food goes down the right tube.',
          'Relay: passes touch and movement signals between body and brain.',
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
      where: {
        text: 'The spinal cord runs from the {{medulla}} down inside your backbone, about 45 cm long in an adult and roughly as thick as your little finger. Nerves branch off at each vertebra to serve one strip of the body. Inside, butterfly shaped [[grey matter]] sits in the middle with [[white matter]] highways around it.',
        bullets: [
          '31 pairs of spinal nerves leave along its length, one pair per backbone level.',
          'The top carries signals for the arms, the middle for the trunk, the bottom for the legs.',
          'It ends around waist height. Below that, loose nerve roots (the cauda equina) continue down.',
        ],
      },
      does: {
        text: 'The spinal cord carries orders down from the {{motor-cortex}} and touch signals up to the {{somatosensory-cortex}}. It also handles quick reflexes on its own. Touch something hot and the hand pulls back before the feeling even reaches your brain.\n\nThat split is the point. Fast local loops protect you, while slower copies keep the brain informed.',
        bullets: [
          'Downward traffic: movement commands from the brain to muscles.',
          'Upward traffic: touch, pain, temperature and body position to the brain.',
          'Reflexes: local loops that pull away from pain or steady the knee jerk.',
          'Automatic routines: helps run walking rhythm and bladder control.',
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
      text: 'Because everything passes through this one cable, injuries have effects below the injury level only.',
      bullets: [
        'A neck injury can paralyse arms and legs (tetraplegia). A lower injury affects the legs only (paraplegia).',
        'Damaged touch highways cause numbness, tingling or chronic pain.',
        'Shingles, slipped discs and motor neuron disease all show up first as spinal nerve symptoms.',
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
    tagline: 'The brainstem seam that produces serotonin to steady mood and sleep.',
    analogy: 'A climate control thermostat that maintains emotional warmth and keeps sleep cycles on track.',
    levels: {
      where: {
        text: 'The raphe nuclei are a narrow chain of neuron clusters running right down the midline seam of the brainstem, from the {{midbrain}} down through the {{pons}} and {{medulla}}. "Raphe" means seam in Greek, describing how they sit like stitches joining the two halves.',
        bullets: [
          'Forms a midline column inside the core of the brainstem.',
          'Upper clusters project upward into the forebrain; lower clusters project down the spinal cord.',
          'The principal source of serotonin for the central nervous system.',
        ],
      },
      does: {
        text: 'The raphe nuclei release [[serotonin]] across almost the entire brain. Serotonin acts as an emotional shock absorber: it promotes patience, buffers against chronic stress, and regulates your body clock and appetite.\n\nWaking up refreshed on a sunny morning and feeling steady through daily hassles reflects healthy raphe serotonin tone.',
        bullets: [
          'Mood stabilization: dampens catastrophic reactions to negative events.',
          'Sleep regulation: triggers tiredness in the evening and regulates dream sleep.',
          'Impulse control: helps delay immediate gratification for longer term goals.',
          'Pain gating: descending projections quiet pain signals in the spinal cord.',
        ],
      },
      connects: {
        text: 'Ascending fibres travel to the {{prefrontal-cortex}} for mood balance, the {{amygdala}} to soothe anxiety, and the {{hypothalamus}} to tune sleep. Descending fibres run down to the {{spinal-cord}} to gate pain.',
        connections: [
          { id: 'prefrontal-cortex', dir: 'out', label: 'Mood and patience regulation' },
          { id: 'amygdala', dir: 'out', label: 'Fear dampening and emotional soothing' },
          { id: 'hypothalamus', dir: 'out', label: 'Circadian rhythm and sleep-wake tuning' },
          { id: 'spinal-cord', dir: 'out', label: 'Pain threshold modulation sent down' },
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
    tryIt: 'Take three deep, slow belly breaths with long exhalations. The calm settling over your chest and thoughts is your parasympathetic system and raphe nuclei bringing down nervous tension.',
    breaks: {
      text: 'Depleted serotonin or damaged raphe circuits severely disrupt emotional balance and sleep.',
      bullets: [
        'Depression and anxiety: linked to reduced serotonin signaling and impaired receptor sensitivity.',
        'Insomnia: disruptions in nighttime serotonin release scramble melatonin production and sleep cycles.',
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
    tagline: 'The brain\'s alert tower that floods the circuits with noradrenaline during urgency.',
    analogy: 'A watchtower sentry who fires a flare when something unexpected happens, putting the whole city on alert.',
    levels: {
      where: {
        text: 'The locus coeruleus ("blue spot") is a tiny pair of nuclei in the upper {{pons}}, on the floor of the fourth ventricle. Its bluish hue under a microscope comes from melanin granules formed as a byproduct of noradrenaline synthesis.',
        bullets: [
          'Contains only around 30,000 to 50,000 neurons in the human brain.',
          'Despite its miniature size, its axons touch almost every corner of the cortex, cerebellum and cord.',
          'Sits near the back wall of the brainstem, right above the sensory trigeminal nuclei.',
        ],
      },
      does: {
        text: 'The locus coeruleus governs your level of arousal. When life is quiet, it ticks over at a steady background rate. When something sudden or dangerous occurs, it fires a burst of [[noradrenaline]] that heightens sensory perception, quickens reaction times, and mobilizes emergency focus.\n\nJumping when you hear a sudden loud crash behind you is an instant locus coeruleus spike.',
        bullets: [
          'Vigilance and alertness: sets the overall brain waking state from drowsy to wired.',
          'Signal amplification: increases sensory clarity by silencing irrelevant cortical noise.',
          'Stress response: prepares the mind and body for rapid fight-or-flight action.',
          'Memory consolidation: ensures terrifying or critical events are remembered vividly.',
        ],
      },
      connects: {
        text: 'It broadcasts alarm signals up to the {{thalamus}} and {{amygdala}} for threat processing, to the {{prefrontal-cortex}} for urgent decision-making, and back to the {{cerebellum}} for fast motor readiness.',
        connections: [
          { id: 'thalamus', dir: 'out', label: 'Sensory gating turned up to maximum sensitivity' },
          { id: 'amygdala', dir: 'out', label: 'Threat assessment boosted during danger' },
          { id: 'prefrontal-cortex', dir: 'out', label: 'Alertness and working memory focused on survival' },
          { id: 'cerebellum', dir: 'out', label: 'Motor circuits primed for sudden movement' },
        ],
      },
      cells: {
        text: 'Locus coeruleus neurons have the most extensively branched axons in the brain, as shown in the neuromodulator broadcast diagram. A single neuron can innervate both the front of the cortex and the spinal cord, synchronizing the entire nervous system with [[noradrenaline]].',
        diagram: 'neuromodulator',
        synapse: 'noradrenaline',
        bullets: [
          'They fire fastest during intense stress, slow down during calm waking, and stop firing completely in REM sleep.',
          'Degeneration of locus coeruleus cells is an early hallmark of both Alzheimer\'s and Parkinson\'s disease.',
        ],
      },
    },
    tryIt: 'Splash cold water on your face. The sudden jolt of alertness and crisp visual clarity is noradrenaline flooding your cortex from the locus coeruleus.',
    breaks: {
      text: 'Imbalances in noradrenaline cause either chronic panic or debilitating exhaustion.',
      bullets: [
        'PTSD and panic disorder: a hyper-reactive locus coeruleus triggers fight-or-flight false alarms.',
        'ADHD: insufficient tonic noradrenaline leaves the prefrontal cortex easily distracted.',
        'Burnout and apathy: chronic stress exhausts noradrenergic reserve, producing deep mental fatigue.',
      ],
    },
  },
];
