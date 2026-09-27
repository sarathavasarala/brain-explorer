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
    analogy: 'An airport hub where every incoming flight is sorted and sent on to the right city.',
    levels: {
      where: {
        text: 'The thalamus sits deep in the middle of the brain, one oval lump on each side, just above the {{midbrain}} and below the {{corpus-callosum}}. Each is about the size of a walnut. Almost every signal heading to the [[cortex]] stops here first.',
        bullets: [
          'Two thumb sized ovals joined by a small bridge across the middle.',
          'Made of many small clusters (nucleus clusters), one per sense or job.',
          'Wrapped in a thin shell of [[inhibitory]] cells that act like a gate.',
        ],
      },
      does: {
        text: 'The thalamus decides what gets through to conscious thought. It passes on touch, sight and sound, and filters out the rest, like the hum of a fridge you stop noticing. It also keeps the cortex awake and in sync, passing messages back and forth with the {{prefrontal-cortex}}.\n\nCatching your keys is a good example. Touch, sight and sound arrive here first, get sorted, then go to the right cortical areas at the same time.',
        bullets: [
          'Sensory relay: forwards touch, vision and hearing to their cortical areas.',
          'Attention filter: turns the volume up or down on what matters.',
          'Movement loop: passes cerebellum and basal ganglia output on to the {{motor-cortex}}.',
          'Sleep switch: changes firing mode to block the outside world when you sleep.',
        ],
      },
      connects: {
        text: 'Touch, sight and hearing arrive from below and leave for the {{visual-cortex}}, {{somatosensory-cortex}} and {{auditory-cortex}}. Plans and feedback move both ways with the {{prefrontal-cortex}}. Movement corrections arrive from the {{globus-pallidus}} and go onward to the {{motor-cortex}}.',
        connections: [
          { id: 'visual-cortex', dir: 'out', label: 'Vision relayed to the back of the brain' },
          { id: 'somatosensory-cortex', dir: 'out', label: 'Touch relayed to the top of the brain' },
          { id: 'auditory-cortex', dir: 'out', label: 'Sound relayed to the side of the brain' },
          { id: 'prefrontal-cortex', dir: 'both', label: 'Attention signals traded both ways' },
          { id: 'motor-cortex', dir: 'out', label: 'Movement corrections passed upward' },
          { id: 'globus-pallidus', dir: 'in', label: 'Movement gating received from below' },
        ],
      },
      cells: {
        text: 'Relay cells use [[glutamate]] to excite the cortex, exactly as the relay diagram shows. The thin shell around them (the reticular [[nucleus]]) uses [[GABA]] to hush relay cells that should stay quiet. Cortex feedback adjusts that gate, so what you expect changes what you perceive.',
        diagram: 'thalamic-relay',
        synapse: 'glutamate',
        bullets: [
          'In sleep the gate closes, and relay cells fire in slow waves instead of passing signals.',
          'Losing this gate is linked to the sensory flooding reported in some psychoses.',
        ],
      },
    },
    tryIt: 'Stare at one word on this page and notice the rest blur. Your thalamus turned down the surrounding vision so the cortex could focus.',
    breaks: {
      text: 'Damage here scrambles the signals going to the cortex, so feeling and awareness both suffer.',
      bullets: [
        'A stroke can cause loss of touch on the opposite side, plus burning central pain.',
        'Damage to the visual relay causes a blind patch with no eye problem.',
        'Severe injury on both sides can shut down awareness itself.',
      ],
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
    analogy: 'A thermostat and caretaker that reads the blood and tells the body what to fix.',
    levels: {
      where: {
        text: 'The hypothalamus is a pea sized patch under the {{thalamus}}, right where the brain meets the body. It sits above the pituitary gland, which dangles below it and carries its orders into the blood. Small, but it reads temperature, salt, sugar and hormones directly.',
        bullets: [
          'About the size of a pea, roughly 1 cm across.',
          'Divided into a dozen tiny clusters, each with its own job.',
          'Wired straight to the pituitary, the master hormone gland.',
        ],
      },
      does: {
        text: 'The hypothalamus keeps your insides steady. Hungry, thirsty, too hot, too cold, sleepy or stressed are all its calls. It also starts puberty, birth and nursing through hormones.\n\nThink of finishing a run on a hot day. You are sweaty, thirsty and breathing hard. The hypothalamus ordered all three responses.',
        bullets: [
          'Hunger and thirst: tells you to eat or drink, and what to crave.',
          'Temperature and water: sweats, shivers and saves water as needed.',
          'Sleep and daily rhythm: tracks light and time to set sleepiness.',
          'Hormones and stress: commands the pituitary to release body wide signals.',
        ],
      },
      connects: {
        text: 'Emotional and memory news arrives from the {{amygdala}} and {{hippocampus}}. The hypothalamus turns that into body action, sending orders down to the {{medulla}} and alerting the {{thalamus}} so the cortex knows how the body feels.',
        connections: [
          { id: 'amygdala', dir: 'in', label: 'Fear or stress news that needs a body response' },
          { id: 'hippocampus', dir: 'in', label: 'Memory context arriving for context' },
          { id: 'medulla', dir: 'out', label: 'Orders for heart, breath and gut' },
          { id: 'thalamus', dir: 'out', label: 'Body state passed up to the cortex' },
        ],
      },
      cells: {
        text: 'Hypothalamus cells are unusual because many release hormones straight into the blood, not just onto other [[neuron|neurons]]. Others send thin, widely branching [[axon|axons]] like the broadcast diagram shows. Its [[synapse|synapses]] often use slow neuromodulator signals such as oxytocin, which linger and set the mood of whole regions.',
        diagram: 'neuromodulator',
        synapse: 'oxytocin',
        bullets: [
          'Some cells sense warmth, salt or sugar directly, with no [[synapse]] input needed.',
          'Oxytocin released here surges during birth, nursing and close contact.',
        ],
      },
    },
    tryIt: 'Drink a big glass of cold water when you are very thirsty and notice how quickly you feel better, long before the water reaches your blood. The hypothalamus counts swallows and predicts relief.',
    breaks: {
      text: 'Damage here breaks body balance. People stop feeling full, sleepy or warm at the right times.',
      bullets: [
        'Injury can cause constant hunger and rapid weight gain, or loss of thirst.',
        'Broken temperature control leads to overheating or constant chill.',
        'Hormone failures delay puberty, disrupt periods or stop breastfeeding.',
      ],
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
    analogy: 'A talent scout that watches everything the cortex suggests and backs the winner.',
    levels: {
      where: {
        text: 'The striatum is a curved C shape deep in each [[hemisphere]], curling from the {{frontal-lobe}} back toward the {{temporal-lobe}}. It wraps around the front of the {{thalamus}}. Its striped look (which gives it its name) comes from fibres crossing through it.',
        bullets: [
          'The largest deep cluster, about the size of a small plum per side.',
          'Two parts: the caudate (the tail of the C) and the putamen (the round base).',
          'Receives input from almost the whole [[cortex]], so it sees every plan.',
        ],
      },
      does: {
        text: 'The striatum helps choose what to do. The cortex proposes many actions at once, and the striatum weighs them by habit and reward, then backs one. This is how tying shoelaces moves from slow thinking to automatic habit.\n\nIt learns from [[dopamine]]. Actions that turn out better than expected get strengthened, so they win faster next time.',
        bullets: [
          'Action choice: backs one movement plan and quiets the rest.',
          'Habit learning: turns repeated rewarded actions into routines.',
          'Reward tracking: records which actions paid off before.',
          'Stopping: helps cancel an action that is no longer wanted.',
        ],
      },
      connects: {
        text: 'Plans flow in from the {{prefrontal-cortex}} and {{motor-cortex}}. A [[dopamine]] teaching signal arrives from the {{substantia-nigra}}. The verdict goes out to the {{globus-pallidus}}, which carries it toward the muscles.',
        connections: [
          { id: 'prefrontal-cortex', dir: 'in', label: 'Goals and plans arriving for review' },
          { id: 'motor-cortex', dir: 'in', label: 'Movement options arriving for choice' },
          { id: 'substantia-nigra', dir: 'in', label: 'Dopamine teaching signal about reward' },
          { id: 'globus-pallidus', dir: 'out', label: 'Chosen action sent on for release' },
        ],
      },
      cells: {
        text: 'The main cells are medium spiny [[neuron|neurons]], covered in tiny bumps where cortical [[axon|axons]] land. They are [[inhibitory]] and stay mostly silent until the right pattern appears. As the loop diagram shows, [[dopamine]] from the {{substantia-nigra}} turns the volume up on the "go" cells and down on the "stop" cells.',
        diagram: 'basal-ganglia',
        synapse: 'dopamine',
        bullets: [
          'About 95 percent of striatum cells are this one type, an unusual uniformity.',
          'Addictive drugs flood this area with dopamine, which is why habits form fast around them.',
        ],
      },
    },
    tryIt: 'Brush your teeth with your non dominant hand tomorrow. The slowness you feel is your striatum without a ready made habit to run.',
    breaks: {
      text: 'When the striatum or its dopamine supply fails, choosing and running actions breaks down.',
      bullets: [
        'Parkinson\'s: too little dopamine, so starting movement feels stuck.',
        'Huntington\'s: striatum cells die, causing jerky unwanted movements.',
        'Addiction and OCD: reward learning locks onto the wrong routines.',
      ],
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
    analogy: 'A security guard whose default answer is no, until the striatum shows the right pass.',
    levels: {
      where: {
        text: 'The globus pallidus is a small pale wedge tucked just inside the {{striatum}}, near the middle of each [[hemisphere]]. It sits between the striatum outside and the {{thalamus}} below. Its paleness comes from many [[myelin]] wrapped fibres passing through.',
        bullets: [
          'About the size of a pea, with inner and outer segments.',
          'Fires constantly at rest, unlike most brain areas.',
          'Forms the main output of the basal ganglia toward the thalamus.',
        ],
      },
      does: {
        text: 'The pallidus keeps movement braked by default. It constantly inhibits the {{thalamus}}, stopping unwanted twitches before they start. When the {{striatum}} picks an action, it briefly hushes the pallidus, the brake lifts, and the chosen movement goes through.\n\nReaching for one cup among many on a shelf uses this. Everything else stays braked while one reach is released.',
        bullets: [
          'Default brake: hushes the thalamus to stop random movement.',
          'Selective release: pauses briefly to let the chosen action through.',
          ' competing actions: keeps the losers braked while the winner moves.',
          'Posture background: steadies the body while you move one part.',
        ],
      },
      connects: {
        text: 'The choice arrives as inhibition from the {{striatum}}. The pallidus passes the result on by inhibiting the {{thalamus}}. It also trades signals both ways with the {{substantia-nigra}} to set the overall level of braking.',
        connections: [
          { id: 'striatum', dir: 'in', label: 'Chosen action arriving to lift the brake' },
          { id: 'thalamus', dir: 'out', label: 'Brake signal holding the thalamus quiet' },
          { id: 'substantia-nigra', dir: 'both', label: 'Braking level tuned with dopamine' },
        ],
      },
      cells: {
        text: 'Pallidus cells are large, fast and [[inhibitory]], using [[GABA]] to hush their targets. Because they fire all the time, a pause in firing is itself a message. The loop diagram shows this logic: more striatum activity means less pallidus braking, which means more thalamus output.',
        diagram: 'basal-ganglia',
        synapse: 'gaba',
        bullets: [
          'Pallidus cells can fire over 60 times a second at rest, among the fastest in the brain.',
          'Deep brain stimulation here can release movement in Parkinson\'s, like loosening a stuck brake.',
        ],
      },
    },
    tryIt: 'Hold your arm out still and notice you are not twitching in all directions. That quiet is your pallidus braking everything except "hold still".',
    breaks: {
      text: 'Too much or too little braking both cause movement problems.',
      bullets: [
        'Too much brake (Parkinson\'s): stiffness and trouble starting movement.',
        'Too little brake: jerky, flinging movements as in ballism or Huntington\'s.',
        'Uneven braking causes dystonia, where muscles pull into odd postures.',
      ],
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
    analogy: 'A watering can that sprinkles dopamine over the movement circuits to keep them willing to move.',
    levels: {
      where: {
        text: 'The substantia nigra is a thin dark stripe in the {{midbrain}}, just above the {{pons}}. "Black substance" is what the name means, and it does look darker than nearby tissue. Although tiny, it reaches the whole {{striatum}} above it.',
        bullets: [
          'A flat band only a few millimetres thick, one per side.',
          'Dark because its cells contain a pigment related to [[dopamine]] making.',
          'Sits beside the movement fibres heading down to the body.',
        ],
      },
      does: {
        text: 'The nigra supplies [[dopamine]] that tells the movement circuits a reward was better than expected. That signal teaches the {{striatum}} which actions are worth repeating. It also sets the background willingness to move. Low dopamine and everything feels effortful, as if walking through sand.\n\nSipping coffee when tired shows a small piece of it. The lift you feel partly reflects dopamine nudging the movement system awake.',
        bullets: [
          'Reward signal: marks actions that turned out well.',
          'Go versus stop: boosts the "go" path, calms the "stop" path.',
          'Habit ink: helps write repeated good actions into routine.',
          'Eye moves too: a nearby part guides quick eye jumps.',
        ],
      },
      connects: {
        text: 'Its main delivery goes up to the {{striatum}}. It swaps tuning signals both ways with the {{globus-pallidus}}. A smaller branch reaches the {{thalamus}}, keeping the whole loop supplied.',
        connections: [
          { id: 'striatum', dir: 'out', label: 'Dopamine teaching signal sent upward' },
          { id: 'globus-pallidus', dir: 'both', label: 'Braking level tuned together' },
          { id: 'thalamus', dir: 'out', label: 'A smaller supply to the relay' },
        ],
      },
      cells: {
        text: 'Each dopamine cell grows an enormously branched [[axon]], one cell reaching tens of thousands of striatum targets. Like the [[neuromodulator]] broadcast diagram, it does not send precise orders. It changes how strongly other inputs work, and the effect lasts seconds to minutes rather than milliseconds.',
        diagram: 'basal-ganglia',
        synapse: 'dopamine',
        bullets: [
          'Humans have only about 400,000 of these cells, yet they shape all habits.',
          'They fire in short bursts for surprise rewards, and pause when an expected reward fails.',
        ],
      },
    },
    tryIt: 'Think of a time a text brought unexpectedly good news. That brief lift and urge to act is dopamine, much of it first made here, doing its job.',
    breaks: {
      text: 'These cells die slowly with age, and faster in disease. Movement and mood both suffer.',
      bullets: [
        'Parkinson\'s begins when roughly half are lost: slow, stiff, trembling movement.',
        'Too much dopamine signalling is linked to the false alarms of psychosis.',
        'Some Parkinson\'s drugs mimic dopamine but can cause impulsive habits like gambling.',
      ],
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
    analogy: 'A librarian who files the day\'s loose pages overnight so you can find them later.',
    levels: {
      where: {
        text: 'The hippocampus curls inside the {{temporal-lobe}}, one per side, near the {{amygdala}}. It is about as long as your little finger and shaped a bit like a seahorse (which is what the name means). It sits where what, where and when streams meet.',
        bullets: [
          'A curved tube with a toothlike ridge (the dentate gyrus) along its edge.',
          'Tightly linked to the nearby entorhinal [[cortex]], its main doorway (the entorhinal cortex).',
          'One of the few places where new [[neuron|neurons]] keep being born in adults.',
        ],
      },
      does: {
        text: 'The hippocampus binds the pieces of an experience into one memory. Faces, places, words and feelings arrive separately, and it links them so later one cue brings back the rest. It also maps space, which is why London taxi drivers famously grew larger rear hippocampi while learning the streets.\n\nSay you lose your keys. Picturing where you last saw them works because the hippocampus tied the keys to that place.',
        bullets: [
          'Binding: links who, what and where into one episode.',
          'Space maps: tracks places and routes (place cells).',
          'Recall: completes a whole memory from a small cue.',
          'Handover: replays new memories to the cortex for long term storage.',
        ],
      },
      connects: {
        text: 'Day to day experience flows in both ways with the {{temporal-lobe}}. Emotional weight arrives both ways from the {{amygdala}}. Finished files go out to the {{hypothalamus}} and {{prefrontal-cortex}} for body regulation and long term keeping.',
        connections: [
          { id: 'temporal-lobe', dir: 'both', label: 'Daily experience traded both ways' },
          { id: 'hypothalamus', dir: 'out', label: 'Memory signals passed for body rhythms' },
          { id: 'prefrontal-cortex', dir: 'out', label: 'Memories sent for long term keeping' },
          { id: 'amygdala', dir: 'both', label: 'Emotional weight added to memories' },
        ],
      },
      cells: {
        text: 'Information makes a one way trip through three relays, as the loop diagram shows: entorhinal [[cortex]] to dentate gyrus to CA3 to CA1, then back out. CA3 cells excite each other with [[glutamate]], so a small cue can reawaken the whole pattern. Those [[synapse|synapses]] strengthen quickly, which is the physical trace of a new memory.',
        diagram: 'hippocampal-loop',
        synapse: 'glutamate',
        bullets: [
          'So called place cells fire only when you are in one favourite spot.',
          'New dentate cells are born daily, and exercise and sleep help them survive.',
        ],
      },
    },
    tryIt: 'Walk into another room, pause, and picture the room you just left in detail. The effort of rebuilding it from a cue is your hippocampus completing the pattern.',
    breaks: {
      text: 'When the hippocampus fails, new memories stop sticking even though old ones and skills remain.',
      bullets: [
        'Alzheimer\'s hits here first: recent events vanish while childhood stays.',
        'A brief loss of blood or oxygen can wipe out hours around the event.',
        'Chronic stress shrinks it, and treating depression can help it regrow.',
      ],
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
    analogy: 'A smoke detector: quick, loud and sometimes wrong, but worth having.',
    levels: {
      where: {
        text: 'The amygdala is an almond sized lump at the front tip of the {{hippocampus}}, deep inside the {{temporal-lobe}}. One sits on each side. Despite the single name it is really a cluster of about a dozen small nucleus clusters.',
        bullets: [
          'About 1 to 2 cm across, shaped like an almond (hence the name).',
          'Sits where smell, sight, sound and body signals converge.',
          'Wired straight to the {{hypothalamus}} and {{midbrain}} for fast body action.',
        ],
      },
      does: {
        text: 'The amygdala flags what matters, especially threats and rewards. It learns fast: one bad meal or one scare can set a lasting warning. It then tells the body to react before you have words for it.\n\nWalking past a snake shaped stick on a path shows it. You jump first, then the cortex reports it is only a stick.',
        bullets: [
          'Threat alarm: triggers freeze, flight or fight within milliseconds.',
          'Emotional memory: stamps strong feelings onto {{hippocampus}} memories.',
          'Face reading: spots fear, anger and trustworthiness in faces.',
          'Body arousal: raises heart rate, sweat and attention through the body.',
        ],
      },
      connects: {
        text: 'A quick rough sketch arrives from the {{thalamus}}, while detailed news is traded both ways with the {{prefrontal-cortex}} and {{hippocampus}}. Orders go out to the {{hypothalamus}} for stress hormones and to the {{midbrain}} for freezing or fleeing.',
        connections: [
          { id: 'thalamus', dir: 'in', label: 'Fast rough sketch received early' },
          { id: 'hypothalamus', dir: 'out', label: 'Stress hormones ordered from the body' },
          { id: 'prefrontal-cortex', dir: 'both', label: 'Alarm traded with calm reasoning' },
          { id: 'hippocampus', dir: 'both', label: 'Feelings tied to memories stored' },
          { id: 'midbrain', dir: 'out', label: 'Freeze or flee ordered downward' },
        ],
      },
      cells: {
        text: 'The fear circuit diagram shows the logic. A fast [[excitatory]] route from the {{thalamus}} hits the amygdala directly, while a slower route goes via sensory [[cortex]] with more detail. {{prefrontal-cortex}} input excites local calming cells that hush the alarm with [[GABA]] once the danger passes.',
        diagram: 'fear-circuit',
        synapse: 'glutamate',
        bullets: [
          'Its fear learning needs only one trial, unlike most learning which needs repeats.',
          'Calming cells can be strengthened by therapy, which is partly how exposure therapy works.',
        ],
      },
    },
    tryIt: 'Next time a message pings and your stomach jumps before you read it, notice that order. Body first, meaning second. That gap is the amygdala beating the cortex.',
    breaks: {
      text: 'A stuck alarm causes needless fear. A quiet one misses real warnings.',
      bullets: [
        'Overactivity is linked to anxiety, phobias and post traumatic stress.',
        'Underactivity can flatten fear and risk sensing, so warnings are ignored.',
        'Seizures here can bring sudden waves of fear or deja vu for no reason.',
      ],
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
    analogy: 'A wide footbridge between two office towers so both sides work as one company.',
    levels: {
      where: {
        text: 'The corpus callosum arches over the middle of the brain, just above the {{thalamus}} and under the {{cingulate-cortex}}. It is about 10 cm long front to back, the largest [[white matter]] bundle in the brain. You only see it if you gently pull the two hemispheres apart.',
        bullets: [
          'About 200 million [[axon|axons]] cross here, mostly linking matching spots.',
          'Front part links planning areas, back part links seeing and hearing.',
          'Still growing into your twenties as [[myelin]] builds up.',
        ],
      },
      does: {
        text: 'The callosum shares work between hemispheres. Language mostly on the left and space mostly on the right still need each other to read aloud or catch a ball. It passes the summary across in milliseconds.\n\nNaming an object you hold behind your back shows it. Touch on the right goes left, then crosses to language on the left so you can say its name.',
        bullets: [
          'Sharing: sends a summary of each side to the other.',
          'Teamwork: lets language and space systems combine.',
          'One self: keeps attention and memory in sync across halves.',
          'Learning: helps a skill learned on one side transfer to the other.',
        ],
      },
      connects: {
        text: 'Fibres run both ways with the {{frontal-lobe}} for plans, the {{parietal-lobe}} for touch and space, and the {{occipital-lobe}} for vision. Almost every pair of matching areas talks through this bridge.',
        connections: [
          { id: 'frontal-lobe', dir: 'both', label: 'Plans and decisions shared across sides' },
          { id: 'parietal-lobe', dir: 'both', label: 'Touch and space maps kept in sync' },
          { id: 'occipital-lobe', dir: 'both', label: 'Left and right vision joined up' },
        ],
      },
      cells: {
        text: 'The crossing fibres are the long [[axon|axons]] of [[pyramidal cell|pyramidal cells]], wrapped in [[myelin]] for speed. Like the midline diagram shows, left and right pyramids excite each other with [[glutamate]] so both sides rise and fall together. A few [[inhibitory]] cells keep the crossing balanced.',
        diagram: 'callosal-fibres',
        synapse: 'glutamate',
        bullets: [
          'Signals cross in about 10 to 30 milliseconds, fast enough to feel instant.',
          'Without myelin here, the two halves drift apart and react more slowly.',
        ],
      },
    },
    tryIt: 'Draw a circle with your left hand and a square with your right at the same time. The struggle is your hemispheres negotiating through this bridge.',
    breaks: {
      text: 'Cut or missing connections split the teamwork, while slower development delays sharing.',
      bullets: [
        'Split brain surgery (rare, for severe epilepsy) leaves each hand partly unaware of the other.',
        'Born without it, people cope well day to day but struggle with fast two sided tasks.',
        'Damage at the back causes one side to ignore what the other sees.',
      ],
    },
  },
  {
    id: 'vta',
    name: 'Ventral tegmental area',
    group: 'deep',
    color: '#ffb703',
    shape: { type: 'ellipsoid', center: [0.03, -0.13, -0.09], radii: [0.024, 0.016, 0.032], count: 500, mirror: true, fill: 1 },
    view: 'left',
    tagline: 'Supplies the dopamine that drives desire, curiosity and learning.',
    analogy: 'The fuel injector that squirts motivation into the brain whenever a goal seems reachable.',
    levels: {
      where: {
        text: 'The ventral tegmental area (VTA) is a tiny cluster of cells in the {{midbrain}}, sitting just medial to the {{substantia-nigra}}. Although small enough to fit on the tip of a pencil, its branches reach right across the front half of the brain.',
        bullets: [
          'Nested close to the midline in the floor of the midbrain.',
          'Made of around 40,000 dopamine-producing neurons in humans.',
          'Sits right next to the substantia nigra but serves motivation rather than movement.',
        ],
      },
      does: {
        text: 'The VTA creates the dopamine burst behind desire and anticipation. It fires when something good happens unexpectedly, or when you spot a hint that reward is on the way. That chemical pulse tells your thoughts to pay attention and remember what led here.\n\nHearing your phone chime with a message notification is the VTA in miniature. The burst of curiosity arrives before you even read the screen.',
        bullets: [
          'Reward prediction: fires when an outcome beats expectations.',
          'Motivation engine: turns vague wants into energized pursuit.',
          'Curiosity and exploration: encourages you to investigate novel sights and ideas.',
          'Habit reinforcement: stamps memories in the hippocampus with emotional importance.',
        ],
      },
      connects: {
        text: 'Its main branches go up to the {{striatum}} for reward pursuit, the {{prefrontal-cortex}} for planning, and the {{amygdala}} for emotional weight.',
        connections: [
          { id: 'striatum', dir: 'out', label: 'Dopamine sent to the reward center' },
          { id: 'prefrontal-cortex', dir: 'out', label: 'Motivation relayed to executive planning' },
          { id: 'amygdala', dir: 'out', label: 'Emotional value added to experiences' },
          { id: 'hippocampus', dir: 'out', label: 'Memories marked for long term keeping' },
        ],
      },
      cells: {
        text: 'VTA neurons are neuromodulators with enormous branching trees, as the broadcast diagram shows. They release [[dopamine]] across wide areas, changing how sensitive other synapses are to [[glutamate]]. When an expected reward goes missing, these cells temporarily go quiet.',
        diagram: 'neuromodulator',
        synapse: 'dopamine',
        bullets: [
          'A single VTA dopamine cell can form over 100,000 synaptic contacts.',
          'Addictive substances hijack this exact system by prolonging the dopamine surge.',
        ],
      },
    },
    tryIt: 'Recall the anticipation you felt while unboxing a gift or waiting in line for favourite food. That heightened focus and forward tilt is VTA dopamine.',
    breaks: {
      text: 'Disruptions in this circuit alter drive, mood, and belief in what is worth doing.',
      bullets: [
        'Anhedonia: losing the ability to feel pleasure or anticipation, common in severe depression.',
        'Addiction: repeated surges re-wire the circuit until cravings overpower conscious goals.',
        'Overactivity is linked to the false importance assigned to coincidences in psychosis.',
      ],
    },
  },
  {
    id: 'basal-forebrain',
    name: 'Basal forebrain',
    group: 'deep',
    color: '#10b981',
    shape: { type: 'ellipsoid', center: [0.08, -0.06, 0.08], radii: [0.035, 0.022, 0.038], count: 650, mirror: true, fill: 1 },
    view: 'left-front',
    tagline: 'Bathes the cortex in acetylcholine to sharpen attention and seal in memories.',
    analogy: 'A stage spotlight operator who turns up brightness on what matters so you can focus.',
    levels: {
      where: {
        text: 'The basal forebrain is a cluster of structures tucked below the {{striatum}} and just in front of the {{hypothalamus}}. It contains the nucleus basalis of Meynert, the brain\'s major acetylcholine manufacturing plant for the entire outer cortex.',
        bullets: [
          'Located near the base of the front of the brain, under the basal ganglia.',
          'Sends direct fibres to all four lobes of the cerebral cortex.',
          'Among the first areas to suffer cell loss in Alzheimer\'s disease.',
        ],
      },
      does: {
        text: 'The basal forebrain decides when the cortex should pay sharp attention. When something demands focus, it floods the cortex with acetylcholine, quietening background chatter and boosting sensory input. It acts like a focus dial for your thoughts.\n\nSearching for your lost keys in a messy room is this system at work: it keeps your eyes looking and your mind from drifting.',
        bullets: [
          'Selective attention: turns up signal-to-noise ratio in sensory areas.',
          'Neuroplasticity: tells cortical circuits that right now is worth learning.',
          'Arousal and waking: helps transition from groggy sleep to alert wakefulness.',
          'Working memory: supports holding several numbers or names in mind.',
        ],
      },
      connects: {
        text: 'It sends widespread projections up to the {{frontal-lobe}} for attention, the {{temporal-lobe}} for recognition, and the {{hippocampus}} for storing new facts.',
        connections: [
          { id: 'frontal-lobe', dir: 'out', label: 'Acetylcholine sent to boost executive focus' },
          { id: 'hippocampus', dir: 'out', label: 'Rhythm and memory storage signals' },
          { id: 'temporal-lobe', dir: 'out', label: 'Sensory sharpening sent to language and recognition' },
          { id: 'hypothalamus', dir: 'in', label: 'Sleep-wake status and body rhythms received' },
        ],
      },
      cells: {
        text: 'Large cholinergic neurons send sprawling axons that release [[acetylcholine]] across cortical layers. As shown in the broadcast diagram, this does not carry an image or word itself, but changes how receptive cortical cells are to incoming [[glutamate]].',
        diagram: 'neuromodulator',
        synapse: 'acetylcholine',
        bullets: [
          'These cells fire in bursts locked to moments of surprise and intense curiosity.',
          'Loss of up to 90 percent of these neurons is a primary cause of memory loss in dementia.',
        ],
      },
    },
    tryIt: 'Count backwards from 100 by sevens (100, 93, 86...). The effortful mental grip keeping you on track is fueled by acetylcholine from the basal forebrain.',
    breaks: {
      text: 'When these cells degenerate, the cortex loses its focus and ability to store new days.',
      bullets: [
        'Alzheimer\'s disease: earliest memory decline correlates directly with cell death here.',
        'Delirium and confusion: triggered when medicines block acetylcholine receptors.',
        'Chronic brain fog and daytime drowsiness when this wakefulness system falters.',
      ],
    },
  },
];
