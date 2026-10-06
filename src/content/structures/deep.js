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
    size: 'about 3 cm long',
    tagline: 'The relay station that passes almost every sense on to the cortex.',
    analogy: 'An airport hub where every incoming flight is sorted and sent on to the right city.',
    levels: {
      overview: {
        text: 'The thalamus sits deep in the middle of the brain, one oval lump on each side, just above the {{midbrain}} and below the {{corpus-callosum}}. Each is about the size of a walnut. Most sensory signals heading to the [[cortex]] relay here, with smell as the main exception. Wrapped in a thin shell of inhibitory cells, it acts as an active gatekeeper that sorts and reshapes incoming signals before passing them along.\n\nCatching your keys is a good example of this gateway in action. Visual, touch, and sound pathways all pass through distinct thalamic nuclei before reaching their cortical targets. By turning the volume up or down on competing streams, the thalamus helps you focus on the keys midair while muting background noise.',
        bullets: [
          "Sensory relay: forwards touch, vision, and hearing to dedicated cortical areas.",
          "Attention filter: turns the volume up on relevant inputs while dampening background distractions.",
          "Movement loop: passes coordination signals from the cerebellum and basal ganglia up to the {{motor-cortex}}.",
          "Sleep switch: shifts into slow rhythmic bursts during sleep to block out the outside world.",
        ],
      },
      connects: {
        text: 'Signals heading toward the cortex do not pass through unchanged. Sensory streams are sharpened or muffled depending on attention and arousal, while reciprocal loops with frontal areas help align incoming data with current goals. Output from the basal ganglia and cerebellum also relays here to coordinate movement timing.',
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
    size: 'about 2 cm across',
    tagline: 'Runs the body: hunger, thirst, temperature, sleep and hormones.',
    analogy: 'A thermostat and caretaker that reads the blood and tells the body what to fix.',
    levels: {
      overview: {
        text: 'The hypothalamus is a pea sized cluster tucked beneath the {{thalamus}}, right where the brain meets the body. It sits above the {{pituitary}} gland, which dangles below it and carries its chemical orders into the bloodstream. Small but mighty, this command center reads body temperature, blood sugar, salt balance, and circulating hormones directly.\n\nWhen you finish a run on a hot day, the hypothalamus detects the rise in blood warmth and salt concentration. It commands sweat glands to cool your skin, orders kidneys to conserve water, and triggers a strong urge for cold water. As soon as you drink, it counts your swallows and predicts relief long before the water reaches your blood.',
        bullets: [
          "Internal thermostat: commands sweating, shivering, and blood vessel dilation to stabilize temperature.",
          "Hunger and thirst: senses nutrient and hydration levels to trigger appetites and cravings.",
          "Master hormone controller: directs the {{pituitary}} to release body wide endocrine signals.",
          "Daily biological clock: tracks light cycles to synchronize daily sleep and wake rhythms.",
        ],
      },
      connects: {
        text: 'This hub translates emotional and contextual signals into physical changes. When emotional circuits signal threat or anticipated challenge, it sparks the [[HPA axis]] by releasing CRH into portal capillaries, while descending nerve pathways accelerate heart rate and prepare muscles for action.',
        connections: [
          { id: 'amygdala', dir: 'in', label: 'Fear or stress news that needs a body response' },
          { id: 'hippocampus', dir: 'in', label: 'Memory context arriving for context' },
          { id: 'pituitary', dir: 'out', label: 'Releasing hormones sent to master gland' },
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
    size: 'about 6 cm long',
    tagline: 'Learns habits and helps pick which action to do next.',
    analogy: 'A talent scout that watches everything the cortex suggests and backs the winner.',
    levels: {
      overview: {
        text: 'The striatum is a large, curved C shaped structure deep within each [[hemisphere]], curling from behind the {{frontal-lobe}} toward the {{temporal-lobe}}. It wraps around the front of the {{thalamus}} and takes its name from the striped white-matter bundles crossing through it. Composed of the caudate nucleus and putamen, it serves as the primary receiving hub for the basal ganglia.\n\nThe striatum helps you choose what to do next. While the cortex proposes dozens of potential actions at once, the striatum weighs them against past habits and rewards, choosing the winner and quieting the rest. This selection process is how tying your shoes or typing on a keyboard evolves from slow deliberate effort into smooth automatic routine.',
        bullets: [
          "Action selection: backs the most promising movement plan while suppressing competing impulses.",
          "Habit learning: converts repeated, rewarded sequences of actions into automatic routines.",
          "Reward evaluation: uses [[dopamine]] signals to record which actions yield positive outcomes.",
          "Action cancellation: works with frontal circuits to hit the brakes on an action that is no longer helpful.",
        ],
      },
      connects: {
        text: 'Cortical inputs propose many potential movements at once. Dopamine arriving from midbrain centers modulates which striatal circuits become active, tilting the balance so selected plans can proceed while competing options are held back.',
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
          'Many addictive drugs raise dopamine signalling here, directly or indirectly, strengthening learning about drug-related cues and actions.',
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
    size: 'about 2 cm long',
    tagline: 'The brake pedal on movement, released only for the right action.',
    analogy: 'A security guard whose default answer is no, until the striatum shows the right pass.',
    levels: {
      overview: {
        text: 'The globus pallidus is a pale, cone shaped nucleus nestled just inside the curve of the {{striatum}}, near the center of each [[hemisphere]]. Its pale appearance comes from tightly packed, [[myelin]] wrapped nerve fibres.\n\nIt acts like a brake on movement. Its cells are active even at rest, helping prevent unwanted motions. A brief reduction in that activity can help a chosen action proceed, such as lifting a cup without also moving your other hand.',
        bullets: [
          "Movement brake: continuously inhibits the thalamus to prevent spontaneous, unwanted twitches.",
          "Selective release: pauses its firing momentarily to let chosen movements proceed.",
          "Surround inhibition: keeps competing limb and muscle movements braked while the winner acts.",
          "Postural background: stabilizes core posture so you can move your arms and hands with precision.",
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
    size: 'about 1 cm long',
    tagline: 'Uses dopamine and inhibitory output to tune movement circuits.',
    analogy: 'A watering can that sprinkles dopamine over the movement circuits to keep them willing to move.',
    levels: {
      overview: {
        text: 'The substantia nigra is a dark, flattened band of cells nestled inside the {{midbrain}}, sitting just above the {{pons}} and alongside descending motor pathways. Its Latin name means "black substance," reflecting the dark neuromelanin pigment produced when making [[dopamine]]. Despite its tiny size, its sprawling nerve branches reach upward across the entire {{striatum}}.\n\nIts dopamine neurons provide the chemical green light that allows movement circuits to start and run smoothly. When you decide to stand up from a chair, these cells release a burst of dopamine into the striatum to facilitate the transition into motion. When these cells die away, movements become slow, rigid, and hesitant, as seen in Parkinson\'s disease.',
        bullets: [
          "Movement facilitation: delivers dopamine to the {{striatum}} to help initiate voluntary actions.",
          "Action reinforcement: signals unexpected rewards to help motor circuits repeat successful efforts.",
          "Motor tuning: balances the direct and indirect pathways of the basal ganglia to control physical vigour.",
          "Inhibitory output: uses its pars reticulata segment to help guide rapid saccadic eye movements.",
        ],
      },
      connects: {
        text: 'Rather than driving movements directly, this region releases neuromodulatory signals that adjust responsiveness in motor circuits. A burst of dopamine lowers the threshold for starting an action, while inhibitory outputs help stabilize eye movements and posture.',
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
          'Humans have only several hundred thousand dopamine neurons in the substantia nigra on both sides combined.',
          'Their activity reflects movement as well as learning about outcomes and cues.',
        ],
      },
    },
    tryIt: 'Think of how an unexpectedly good result changes what you try next time. Dopamine signals from the substantia nigra are one part of how movement circuits update action values, but the feeling itself comes from a wider network.',
    breaks: {
      text: 'These cells die slowly with age, and faster in disease. Movement and mood both suffer.',
      bullets: [
        'Parkinson\'s motor signs emerge after substantial cell and striatal dopamine loss, producing slow movement, stiffness and sometimes tremor.',
        'Too much dopamine signalling is linked to the false alarms of psychosis.',
        'Some Parkinson\'s drugs mimic dopamine but can cause impulsive habits like gambling.',
      ],
      states: [
        {
          kind: 'lesion',
          teaser: 'Movement loses its chemical starter signal.',
          text: 'The gradual loss of dopamine-producing cells in the substantia nigra deprives movement circuits of their chemical starter signal. Without steady dopamine delivery to the striatum, the brain struggles to initiate and smooth voluntary physical actions. Muscles become stiff and slow, and hands tremble rhythmically when resting.',
          signs: [
            'Slowness and freezing when attempting to start walking or reaching.',
            'Rhythmic resting tremor in the fingers that calms down during active movement.',
            'Muscle stiffness that feels like moving against continuous resistance.',
          ],
          case: {
            name: 'Parkinson\'s Disease (Parkinson, 1817)',
            text: 'In 1817, British physician James Parkinson published the first detailed clinical account of the shaking palsy. Later researchers identified the underlying cause as the loss of dopamine-producing cells in the substantia nigra pars compacta. This chemical deficit cuts off signals to the striatum, producing resting tremors, muscle rigidity, and difficulty starting movements.',
          },
          ripple: [
            { id: 'striatum', role: 'cut_off' },
          ],
        },
        {
          kind: 'over',
          teaser: 'Dopamine medication excess causes involuntary movements.',
          text: 'Too much dopamine signalling, most often from Parkinson\'s medication, causes motor circuits to fire without restraint. Instead of producing smooth coordination, the excess dopamine sparks involuntary twisting and dance-like gestures known as dyskinesias. At the same time, reward circuits become overstimulated, sparking sudden compulsive urges like gambling or shopping.',
          signs: [
            'Involuntary writhing or dance-like movements of the limbs and face.',
            'Sudden compulsive urges to gamble, spend money, or repeat repetitive tasks.',
          ],
        },
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
    size: 'about 5 cm long',
    tagline: 'Turns what happened today into memories you can recall later.',
    analogy: 'A librarian who files the day\'s loose pages overnight so you can find them later.',
    levels: {
      overview: {
        text: 'The hippocampus is a curved, seahorse shaped ridge nestled deep inside the medial {{temporal-lobe}}, one per hemisphere. It sits beside the {{amygdala}} and has a folded inner structure.\n\nThe hippocampus binds the loose threads of an experience into a unified memory. Faces, sounds, locations, and emotions become one event, so a single cue can later bring the episode back. It also creates flexible maps of physical space, which is why London taxi drivers show changes in their rear hippocampi after years of learning city streets.',
        bullets: [
          "Episodic binding: links sensory details, time, and places into coherent conscious memories.",
          "Spatial mapping: uses place cells to build and maintain internal navigation maps of your environment.",
          "Pattern completion: reconstructs an entire past event when prompted by a small sensory hint.",
          "Memory consolidation: replays daily experiences to the cortex during rest for permanent storage.",
        ],
      },
      connects: {
        text: 'An event is easier to remember when its sensory details, setting, and emotional meaning can be brought together. Memory circuits exchange signals in both directions, so a familiar cue can help reconstruct an earlier experience.',
        connections: [
          { id: 'temporal-lobe', dir: 'both', label: 'Daily experience traded both ways' },
          { id: 'mammillary-bodies', dir: 'out', label: 'Memory highway sent along the fornix bundle' },
          { id: 'hypothalamus', dir: 'out', label: 'Memory signals passed for body rhythms' },
          { id: 'prefrontal-cortex', dir: 'out', label: 'Memories sent for long term keeping' },
          { id: 'amygdala', dir: 'both', label: 'Emotional weight added to memories' },
        ],
      },
      cells: {
        text: 'A well studied route runs from entorhinal [[cortex]] through dentate gyrus, CA3 and CA1, then back toward cortex. It is not the only route, and signals also travel through recurrent and parallel connections. CA3 cells excite one another with [[glutamate]], which may help a partial cue reactivate a stored pattern. Lasting changes at these and other [[synapse|synapses]] are one part of how memories are represented.',
        diagram: 'hippocampal-loop',
        synapse: 'glutamate',
        bullets: [
          'Place cells become active in particular locations or situations, and their firing fields can change with context.',
          'Adult hippocampal neurogenesis is clear in many animals, but its extent and function in adult humans remain unsettled.',
        ],
      },
    },
    tryIt: 'Walk into another room, pause, and picture the room you just left in detail. The effort of rebuilding it from a cue is your hippocampus completing the pattern.',
    breaks: {
      text: 'When the hippocampus fails, new memories stop sticking even though old ones and skills remain.',
      bullets: [
        'Alzheimer\'s affects entorhinal and hippocampal memory circuits early, so recent learning often suffers first.',
        'A brief loss of blood or oxygen can wipe out hours around the event.',
        'Long-term stress and depression are associated with smaller hippocampal volume, but the causes and reversibility vary between people.',
      ],
      states: [
        {
          kind: 'lesion',
          teaser: 'New conscious memories stop forming.',
          text: 'Removing or destroying both hippocampi permanently stops the brain from creating new conscious memories of daily events, conversations, and places. Older memories formed long before the damage remain mostly intact, and immediate focus remains clear until attention shifts. Skills and habits can still be learned smoothly through motor circuits without any conscious memory of practicing them.',
          signs: [
            'Inability to form new lasting memories of events, conversations, or places.',
            'Preserved ability to learn physical skills, such as mirror drawing, without remembering practice sessions.',
            'Normal immediate short-term recall that vanishes the moment attention shifts.',
          ],
          case: {
            name: 'Patient H.M. (Henry Molaison, 1953)',
            text: 'In 1953, Henry Molaison underwent bilateral surgery removing his medial temporal lobes to relieve severe epilepsy. Psychologist Brenda Milner discovered he had dense anterograde amnesia, leaving him unable to store new conscious memories. Yet his working memory was preserved while rehearsing, and his motor circuits smoothly mastered mirror drawing across several days without any conscious recollection of the task.',
          },
          ripple: [
            { id: 'mammillary-bodies', role: 'cut_off' },
          ],
        },
        {
          kind: 'size',
          look: 'more_active',
          teaser: 'Years of navigation physically expand the map.',
          text: 'Years of intensive spatial navigation can physically reshape the hippocampus through neural plasticity. Navigating complex, flexible routes expands gray matter volume in the posterior hippocampus while slightly shrinking the anterior portion. This physical remodeling shows that adult brain maps grow and adapt to meet heavy everyday demands.',
          signs: [
            'Enlarged rear hippocampus storing a dense mental street atlas.',
            'Smaller front hippocampus, showing structural trade-offs in memory networks.',
            'Rear hippocampus size correlated with years spent driving a taxi.',
          ],
          case: {
            name: 'London Taxi Drivers (Maguire et al., 2000)',
            text: 'Neuroscientist Eleanor Maguire scanned London taxi drivers who spend years memorizing 25,000 streets to pass The Knowledge examination. Drivers showed significantly enlarged rear hippocampi and smaller front hippocampi compared to non-drivers and bus drivers following fixed routes. The growth in the posterior hippocampus correlated directly with the number of years spent navigating the city.',
          },
        },
        {
          kind: 'over',
          teaser: 'Uncontrolled bursts trigger waves of deja vu.',
          text: 'When hippocampal circuits fire in sudden, uncontrolled electrical bursts, stored memory patterns trigger all at once. This unprovoked storm produces vivid sensory flashes, dreamlike memories, and sudden feelings of intense familiarity known as deja vu. Because the hippocampus connects directly to emotion hubs, these seizures often arrive alongside an overwhelming sense of dread or detachment.',
          signs: [
            'Intense waves of deja vu where unfamiliar settings feel completely recognized.',
            'Sudden involuntary flashes of past memories and vivid sensory scenes.',
            'Rising abdominal sensations accompanied by unprovoked dread or detachment.',
          ],
        },
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
    size: 'about 2 cm across',
    tagline: 'The alarm that flags danger and gives memories emotional weight.',
    analogy: 'A smoke detector: quick, loud and sometimes wrong, but worth having.',
    levels: {
      overview: {
        text: 'The amygdala is an almond shaped cluster of nuclei at the front of each medial {{temporal-lobe}}, close to the {{hippocampus}}. There is one in each hemisphere.\n\nIt helps judge which experiences deserve attention, especially possible threats. A coiled garden hose on a trail might make you pause before you recognize it as harmless. The amygdala also helps emotionally significant experiences stand out in memory, including rewards and social encounters.',
        bullets: [
          "Threat detection: triggers instant freeze, flight, or fight responses within milliseconds of danger.",
          "Emotional stamping: works with the {{hippocampus}} to anchor vivid memories of emotionally charged events.",
          "Social perception: decodes emotional expressions, trustworthiness, and subtle cues in human faces.",
          "Autonomic arousal: drives sudden surges in heart rate, respiration, and adrenaline during acute stress.",
        ],
      },
      connects: {
        text: 'A threat response changes as new evidence comes in. Sensory relays can raise alarm, while memory and frontal circuits help revise it. Outgoing pathways prepare the body to act.',
        connections: [
          { id: 'thalamus', dir: 'in', label: 'Fast rough sketch received early' },
          { id: 'hypothalamus', dir: 'out', label: 'Stress hormones ordered from the body' },
          { id: 'prefrontal-cortex', dir: 'both', label: 'Alarm traded with calm reasoning' },
          { id: 'hippocampus', dir: 'both', label: 'Feelings tied to memories stored' },
          { id: 'midbrain', dir: 'out', label: 'Freeze or flee ordered downward' },
        ],
      },
      cells: {
        text: 'Sensory information enters the [[basolateral amygdala]], where principal [[pyramidal cell|pyramidal cells]] receive fast thalamic alerts and detailed cortical patterns. Threat associations are gated by clusters of inhibitory [[intercalated cells]], which release [[GABA]] directly onto central amygdala output neurons to extinguish fear once safe.',
        diagram: 'fear-circuit',
        synapse: 'glutamate',
        bullets: [
          'The basolateral nucleus acts as the sensory gateway, while the central nucleus drives autonomic panic and freeze reflexes.',
          'Intercalated cells act like physical safety catches, recruited by prefrontal safety signals to clamp fear output.',
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
      states: [
        {
          kind: 'lesion',
          teaser: 'No alarm. Fear of outside threats fades.',
          text: 'Losing both amygdalae silences the brain\'s internal threat alarm, leaving a person with little or no fear of outside threats. Everyday curiosity remains bright, but instincts that protect against dangerous animals, heights, or threatening people are absent. Reading subtle fear in other people\'s faces also becomes difficult because the brain no longer automatically scans their eyes.',
          signs: [
            'Little or no fear in dangerous physical and social situations.',
            'Difficulty identifying fearful facial expressions unless reminded to look at the eyes.',
            'Failure to learn caution or avoid situations that caused past harm.',
          ],
          case: {
            name: 'Patient S.M. (Adolphs et al., 1994)',
            text: 'Patient S.M. developed complete bilateral calcification of both amygdalae due to a rare genetic condition called Urbach-Wiethe disease. Researchers found that she felt no fear when handling venomous snakes, exploring haunted houses, or encountering real-world threats. She also struggled to recognize fear in photographs of faces, until eye-tracking experiments showed that prompting her to scan the eyes restored normal recognition. Remarkably, breathing air high in carbon dioxide did provoke acute panic (Feinstein et al., 2013), proving that internal body alarms do not rely entirely on the amygdala.',
          },
        },
        {
          kind: 'over',
          teaser: 'The alarm fires with no real threat.',
          text: 'When the amygdala fires uncontrollably, it launches the body\'s full emergency response without any real threat present. It floods the hypothalamus with alarm signals, triggering a pounding heartbeat, shallow breathing, and sudden trembling. Conscious reasoning from the prefrontal cortex is drowned out, leaving the mind consumed by sudden terror.',
          signs: [
            'Sudden surge of pounding heart rate, sweating, and shortness of breath.',
            'Overwhelming sense of impending doom that resists logical reassurance.',
            'High vigilance where harmless sensory cues trigger instant fight-or-flight reactions.',
          ],
          ripple: [
            { id: 'hypothalamus', role: 'more_active' },
            { id: 'prefrontal-cortex', role: 'less_active' },
          ],
        },
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
    size: 'about 10 cm long',
    tagline: 'A thick cable of fibres that lets the two halves talk.',
    analogy: 'A wide footbridge between two office towers so both sides work as one company.',
    levels: {
      overview: {
        text: 'The corpus callosum is a thick, arched ribbon of nerve fibres bridging the midline of the brain, suspended directly beneath the {{cingulate-cortex}} and above the {{thalamus}}. Spanning roughly 10 centimetres front to back, it is the largest [[white matter]] tract in the human central nervous system, carrying over 200 million [[myelin]] wrapped [[axon|axons]].\n\nThis grand bridge lets the left and right cerebral hemispheres communicate and work as a single mind. When an object is held in your left hand out of sight, touch signals travel first to the right hemisphere. The corpus callosum whisks that information across to the left hemisphere within milliseconds so that language centers can name what you are holding.',
        bullets: [
          "Interhemispheric bridge: shares information between mirrored cortical areas on left and right sides.",
          "Unified perception: joins the left and right visual fields and spatial maps into a seamless panorama.",
          "Motor coordination: harmonizes movements between both hands during two handed tasks like playing piano.",
          "Skill transfer: helps motor skills learned with one hand transfer more readily to the opposite hand.",
        ],
      },
      connects: {
        text: 'By linking matching areas in each hemisphere, this bridge keeps perceptual maps and decisions unified. Sensorimotor information gathered by one side is shared across the midline within milliseconds, allowing both hands and both eyes to work in coordinated partnership.',
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
    size: 'about 1 cm across',
    tagline: 'Sends learning and motivation signals through several dopamine pathways.',
    analogy: 'A prediction updater that helps the brain revise what is worth pursuing.',
    levels: {
      overview: {
        text: 'The ventral tegmental area (VTA) is a compact cluster of neurons nestled in the floor of the {{midbrain}}, situated immediately medial to the {{substantia-nigra}}. Although small enough to fit on the tip of a pencil, its ascending dopamine, GABA, and glutamate branches reach outward to illuminate the entire front of the brain.\n\nThe VTA computes reward prediction errors, signaling when an outcome turns out better or worse than anticipated. When a notification chimes or you catch an unexpected whiff of fresh coffee, VTA dopamine bursts highlight the cue and generate the motivational drive to pursue it. It does not generate raw pleasure on its own, but rather imbues goals with wanting and anticipation.',
        bullets: [
          "Prediction error: fires when an outcome beats expectations, updating how much an action was worth.",
          "Motivational drive: energizes the willingness to invest physical or mental effort toward a goal.",
          "Mesolimbic pathway: sends dopamine to the {{nucleus-accumbens}} and {{amygdala}} for reward learning.",
          "Mesocortical pathway: projects dopamine to the {{prefrontal-cortex}} to support goal focus and working memory.",
        ],
      },
      connects: {
        text: 'Broad ascending projections carry dopamine pulses to frontal and limbic networks. Rather than carrying detailed sensory content, these signals tell downstream circuits whether an event exceeded expectations, updating the value of memories and strengthening the urge to pursue useful goals.',
        connections: [
          { id: 'nucleus-accumbens', dir: 'out', label: 'Dopamine reward signal to ventral striatum' },
          { id: 'prefrontal-cortex', dir: 'out', label: 'Dopamine tunes working memory and planning' },
          { id: 'amygdala', dir: 'out', label: 'Dopamine influences emotional learning' },
          { id: 'hippocampus', dir: 'out', label: 'Dopamine influences memory formation' },
        ],
      },
      cells: {
        text: 'VTA neurons are neuromodulators with enormous branching trees, as the broadcast diagram shows. They release [[dopamine]] across wide areas, changing how sensitive other synapses are to [[glutamate]]. When an expected reward goes missing, these cells temporarily go quiet.',
        diagram: 'neuromodulator',
        synapse: 'dopamine',
        bullets: [
          'Individual dopamine neurons can influence many thousands of targets through widely branching axons.',
          'Addictive substances alter this learning system through several mechanisms, many of which increase dopamine signalling.',
        ],
      },
    },
    tryIt: 'Notice how a reliable cue, such as the smell of a favourite food, changes what you expect and do next. VTA dopamine helps update such predictions, but the conscious feeling of anticipation uses a wider network.',
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
    size: 'about 2 cm long',
    tagline: 'Sends acetylcholine widely to tune attention, learning and wakefulness.',
    analogy: 'A stage spotlight operator who turns up brightness on what matters so you can focus.',
    levels: {
      overview: {
        text: 'The basal forebrain is a collection of structures tucked along the base of the brain, situated beneath the {{striatum}} and just in front of the {{hypothalamus}}. It houses the nucleus basalis of Meynert, the brain\'s primary manufacturing center for [[acetylcholine]] destined for the entire cerebral cortex.\n\nThis system acts like a stage spotlight operator, tuning cortical circuits during moments of focused attention, learning, and wakefulness. When you search a crowded room for a friend\'s face, basal forebrain acetylcholine sharpens sensory cortex firing, increasing the signal-to-noise ratio so relevant visual features stand out clearly against background clutter.',
        bullets: [
          "Cortical spotlight: releases acetylcholine across the cortex to enhance sensory focus and clarity.",
          "Plasticity gate: signals to cortical networks that the current moment contains important lessons worth storing.",
          "Wakefulness drive: helps transition the brain from drowsy slow-wave states into alert consciousness.",
          "Working memory support: assists the {{frontal-lobe}} in sustaining attention on complex mental tasks.",
        ],
      },
      connects: {
        text: 'Widespread ascending fibres release acetylcholine across the cortex and limbic system. Rather than carrying specific sensory content, these diffuse signals enhance the signal-to-noise ratio in target areas, sharpening perception when something demands close attention and priming memory circuits to record the moment.',
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
          'These neurons degenerate in Alzheimer\'s disease, contributing to problems with attention and memory without being the sole cause.',
        ],
      },
    },
    tryIt: 'Count backwards from 100 by sevens (100, 93, 86...). Sustained attention recruits a broad network, with basal-forebrain acetylcholine helping tune how strongly cortical signals are processed.',
    breaks: {
      text: 'When these cells degenerate, the cortex loses its focus and ability to store new days.',
      bullets: [
        'Alzheimer\'s disease: degeneration here accompanies early changes in connected entorhinal and hippocampal memory circuits.',
        'Delirium and confusion: triggered when medicines block acetylcholine receptors.',
        'Chronic brain fog and daytime drowsiness when this wakefulness system falters.',
      ],
    },
  },
  {
    id: 'nucleus-accumbens',
    name: 'Nucleus accumbens',
    group: 'deep',
    parent: 'striatum',
    color: '#2ed9aa',
    shape: { type: 'ellipsoid', center: [0.12, -0.03, 0.24], radii: [0.035, 0.03, 0.04], count: 850, pattern: 'fine', mirror: true, fill: 0.2 },
    view: 'left-front',
    size: 'about 1 cm across',
    tagline: 'Ventral striatum that translates reward signals and motivation into action.',
    analogy: 'A gateway where wanting meets doing.',
    levels: {
      overview: {
        text: 'The nucleus accumbens is a round, almond-sized structure at the bottom front of the {{striatum}}. There is one in each hemisphere, within the ventral striatum.\n\nIt helps turn anticipation into action. When hunger makes a snack appealing, or a phone chime draws your attention, this area helps weigh whether the expected reward is worth the effort of moving toward it.',
        bullets: [
          "Wanting into doing: translates emotional desire and reward anticipation into goal-directed movement.",
          "Reward evaluation: registers unexpected positive outcomes to reinforce successful behaviors.",
          "Effort calculation: weighs whether an anticipated reward justifies the physical or mental effort required.",
          "Action selection: helps translate motivation into a choice you can carry out.",
        ],
      },
      connects: {
        text: 'Emotional significance from the amygdala and spatial context from the hippocampus converge here alongside goal plans from prefrontal cortex. Dopamine pulses from the midbrain modulate this intersection, helping determine whether an anticipated reward is worth the physical effort to pursue.',
        connections: [
          { id: 'vta', dir: 'in', label: 'Dopamine reward signals from the midbrain' },
          { id: 'prefrontal-cortex', dir: 'in', label: 'Goal and value plans arriving from cortex' },
          { id: 'amygdala', dir: 'in', label: 'Emotional weight and threat assessments' },
          { id: 'hippocampus', dir: 'in', label: 'Spatial and memory context' },
        ],
      },
      cells: {
        text: 'Like the rest of the striatum, most cells are medium spiny [[neuron|neurons]] that use [[GABA]]. They express high densities of dopamine D1 and D2 [[receptor|receptors]], which modulate how easily cortical and limbic signals excite them.',
        diagram: 'basal-ganglia',
        synapse: 'dopamine',
        bullets: [
          'The shell region is wired into limbic systems, while the core connects more directly to motor loops.',
          'Most addictive substances produce surges of extracellular dopamine here.',
        ],
      },
    },
    tryIt: 'Notice the sudden urge to check your phone when you hear a notification chime. That prompt pull involves the nucleus accumbens responding to a learned reward cue.',
    breaks: {
      text: 'Disruptions in this area affect motivation, mood and control over reward-seeking habits.',
      bullets: [
        'Anhedonia: loss of interest or pleasure in everyday activities during depression.',
        'Addiction: compulsively seeking cues despite negative consequences.',
        'Apathy: reduced willingness to invest physical effort for rewards.',
      ],
    },
  },
  {
    id: 'pituitary',
    name: 'Pituitary gland',
    group: 'deep',
    color: '#ff9fd1',
    shape: { type: 'ellipsoid', center: [0, -0.17, 0.08], radii: [0.03, 0.025, 0.03], count: 800, pattern: 'fine', mirror: false, fill: 0.25 },
    view: 'medial',
    size: 'about 1 cm across',
    slice: true,
    tagline: 'The master endocrine gland that releases hormones into the bloodstream.',
    analogy: 'A dispatcher that turns instructions from the brain into chemical packages for the body.',
    levels: {
      overview: {
        text: 'The pituitary gland is a pea-sized organ nestled in a protective pocket of bone called the sella turcica, right at the base of the skull behind the bridge of the nose. It dangles beneath the {{hypothalamus}} on a delicate stalk called the infundibulum. Unlike most brain tissue, it sits outside the blood-brain barrier so its secretions can enter circulation directly.\n\nOften called the master endocrine gland, the pituitary translates neural instructions from the hypothalamus into hormonal messages that travel through the bloodstream. When stress strikes, it releases ACTH to prompt cortisol production by the adrenal glands. It also regulates thyroid metabolism, physical growth, water retention, and reproductive cycles across the entire body.',
        bullets: [
          "Endocrine commander: coordinates peripheral glands including the thyroid, adrenals, and gonads.",
          "Stress axis: releases ACTH to drive adrenal cortisol release during physical or mental emergencies.",
          "Water conservation: releases vasopressin from its posterior lobe to help the kidneys retain water.",
          "Growth and bonding: secretes growth hormone for tissue repair and oxytocin during birth and social bonding.",
        ],
      },
      connects: {
        text: 'Direct nerve fibres and a tiny network of blood vessels connect the pituitary to the {{hypothalamus}}. In response to chemical orders from the brain, the pituitary releases hormones into the bloodstream to instruct distant glands throughout the body, with feedback signals returning to report on body balance.',
        connections: [
          { id: 'hypothalamus', dir: 'in', label: 'Releasing hormones and direct nerve axons' },
          { id: 'thalamus', dir: 'both', label: 'Feedback relayed through subcortical networks' },
        ],
      },
      cells: {
        text: 'The anterior lobe contains endocrine cells (somatotropes, corticotropes, thyrotropes) that synthesize and secrete peptide hormones. The posterior lobe consists of unmyelinated [[axon|axons]] extending directly from neurosecretory cells in the {{hypothalamus}}.',
        diagram: 'thalamic-relay',
        synapse: 'oxytocin',
        bullets: [
          'Posterior pituitary hormones are actually made in the hypothalamus and only stored here.',
          'A specialized capillary portal system carries hypothalamic releasing hormones directly to the anterior lobe.',
        ],
      },
    },
    tryIt: 'Drink a large glass of water. Within an hour, your hypothalamus detects diluted blood and tells the posterior pituitary to hold back vasopressin, prompting your kidneys to release water.',
    breaks: {
      text: 'Pituitary tumours or tissue injury disrupt the balance of multiple hormones at once.',
      bullets: [
        'Pituitary adenoma: benign tumours that can press on the optic chiasm and blur peripheral vision.',
        'Hypopituitarism: underproduction of hormones causing fatigue, low blood pressure, or growth failure.',
        'Cushing\'s disease: excess ACTH production causing high cortisol and elevated blood sugar.',
      ],
    },
  },
  {
    id: 'pineal-gland',
    name: 'Pineal gland',
    group: 'deep',
    color: '#818cf8',
    shape: { type: 'ellipsoid', center: [0, 0.0, -0.22], radii: [0.024, 0.02, 0.024], count: 650, pattern: 'fine', mirror: false, fill: 0.3 },
    view: 'medial',
    size: 'about 7 mm across',
    slice: true,
    tagline: 'Produces melatonin in the dark to set your daily sleep and wake rhythm.',
    analogy: 'A light-sensitive clock that marks the night and tells the brain when it is time to sleep.',
    levels: {
      overview: {
        text: 'The pineal gland is a tiny, pinecone-shaped structure perched on the midline deep near the center of the brain, sitting just above the {{midbrain}} and behind the third ventricle. Roughly the size of a grain of rice, this gland sits outside the blood-brain barrier and receives an exceptionally rich blood supply to distribute its chemical messages.\n\nThe pineal gland serves as the body\'s internal clock for darkness. Receiving light-dark timing cues relayed from the {{hypothalamus}}, it converts serotonin into melatonin during nighttime hours, signaling throughout the brain and body that night has arrived. Staring at bright screens late in the evening delays melatonin release because blue light tricks the circadian clock into assuming daytime continues.',
        bullets: [
          "Melatonin release: synthesizes and secretes the primary hormone of darkness to induce drowsiness.",
          "Circadian synchronization: works with hypothalamic pacemakers to harmonize internal daily rhythms.",
          "Light sensitivity: halts melatonin production rapidly when morning light enters the eyes.",
          "Seasonal regulation: helps adjust seasonal biological shifts in response to changing daylight hours.",
        ],
      },
      connects: {
        text: 'Day and night cues arrive from the {{hypothalamus}} through a sympathetic nerve pathway. The resulting melatonin release enters the bloodstream and fluid spaces around the brain, acting as a chemical nightfall broadcast that prepares sleep centers for rest.',
        connections: [
          { id: 'hypothalamus', dir: 'in', label: 'Day and night timing cues from the master clock' },
          { id: 'thalamus', dir: 'out', label: 'Melatonin signals bathing sleep gating circuits' },
        ],
      },
      cells: {
        text: 'The gland is composed mainly of pinealocytes, specialized endocrine cells that produce melatonin. They take in serotonin and use two light-sensitive enzymes to convert it into melatonin when sympathetic nerves release noradrenaline in the dark.',
        synapse: 'serotonin',
        diagram: 'thalamic-relay',
        bullets: [
          'Sympathetic nerve terminals release noradrenaline onto pinealocyte beta receptors to trigger enzyme production.',
          'Light exposure shuts off sympathetic firing within minutes, stopping melatonin synthesis.',
        ],
      },
    },
    tryIt: 'Dim the lights in your living space an hour before bed. The reduction in bright light allows your pineal gland to ramp up melatonin release on schedule, helping you feel naturally sleepy.',
    breaks: {
      text: 'Damage, cysts, or circadian disruption impairs natural sleep timing and hormone balance.',
      bullets: [
        'Delayed sleep phase: difficulty falling asleep at conventional night hours due to shifted melatonin onset.',
        'Pineal cysts: fluid-filled benign sacs that can cause headaches or compress fluid pathways if unusually large.',
        'Jet lag: misalignment between destination day-night cycles and the pineal gland\'s internal schedule.',
      ],
    },
  },
  {
    id: 'mammillary-bodies',
    name: 'Mammillary bodies',
    group: 'deep',
    parent: 'hypothalamus',
    color: '#fb923c',
    shape: { type: 'ellipsoid', center: [0.022, -0.105, 0.02], radii: [0.026, 0.026, 0.026], count: 420, pattern: 'fine', mirror: true, fill: 0.3, pointScale: 9.0 },
    view: 'medial',
    size: 'about 5 mm across',
    slice: true,
    tagline: 'Relays memory signals from the hippocampus to the thalamus.',
    analogy: 'A relay station on a rail line, passing memory signals to the next stop.',
    levels: {
      overview: {
        text: 'The mammillary bodies are two small, rounded nuclei projecting from the underside of the posterior {{hypothalamus}}, behind the pituitary stalk and in front of the brainstem.\n\nThey help support memory for personal events. Damage here can make it hard to form or retrieve recent memories, even when older memories remain available. Their small size makes them easy to miss in a whole-brain view.',
        bullets: [
          "Memory support: helps recent experiences become memories you can later recall.",
          "Spatial orientation: contains head-direction neurons that help track heading and trajectory in space.",
          "Rhythmic pacing: fires in synchrony with hippocampal theta rhythms to coordinate memory storage.",
          "Metabolic sensitivity: relies heavily on thiamine (vitamin B1) to fuel its high energy demands.",
        ],
      },
      connects: {
        text: 'This is one stop in a wider memory circuit. Signals arrive along the [[fornix]] and leave through the mammillothalamic tract before continuing around the loop.',
        connections: [
          { id: 'hippocampus', dir: 'in', label: 'Memory signals received along the fornix' },
          { id: 'thalamus', dir: 'out', label: 'Relayed upward to the anterior thalamus' },
          { id: 'hypothalamus', dir: 'both', label: 'Connected with daily body rhythms' },
        ],
      },
      cells: {
        text: 'Relay neurons here fire in rhythm with hippocampal theta waves, helping keep memory signals in sync. These cells consume glucose rapidly and depend on thiamine (vitamin B1) to generate energy.',
        diagram: 'hippocampal-loop',
        synapse: 'glutamate',
        bullets: [
          'Fires in rhythmic bursts locked to the theta oscillations that coordinate memory storage.',
          'Contains head direction cells that fire selectively when the head faces a specific direction.',
        ],
      },
    },
    tryIt: 'Think of what you ate for dinner two nights ago. As the memory reconstructs, signals sweep from your hippocampus, through your mammillary bodies, and up into the thalamus.',
    breaks: {
      text: 'Lack of thiamine (vitamin B1), often seen in chronic alcohol misuse or severe malnutrition, damages these nuclei and causes Korsakoff syndrome.',
      bullets: [
        'Korsakoff syndrome: severe memory loss where someone cannot form new long-term memories but keeps older ones.',
        'Confabulation: inventing plausible stories to fill gaps in recent recall without realizing they are untrue.',
        'Disorientation: trouble navigating familiar streets and rooms.',
      ],
    },
  },
  {
    id: 'habenula',
    name: 'Habenula',
    group: 'deep',
    parent: 'thalamus',
    color: '#ef4444',
    shape: { type: 'ellipsoid', center: [0.02, 0.075, -0.17], radii: [0.018, 0.018, 0.024], count: 260, pattern: 'fine', mirror: true, fill: 0.3, pointScale: 9.0 },
    view: 'medial',
    size: 'about 3 mm across',
    slice: true,
    tagline: 'Signals disappointment and brakes dopamine when an expected reward fails.',
    analogy: 'A brake pedal on reward: it fires when things go wrong and pauses the celebration.',
    levels: {
      overview: {
        text: 'The habenula is a tiny paired structure perched near the midline on the upper rear crest of the {{thalamus}}, overlooking the {{midbrain}} and nestled beside the {{pineal-gland}}. Split into medial and lateral halves, this compact hub acts as an emotional and motivational switchboard connecting the forebrain to midbrain monoamine centers.\n\nThe lateral habenula functions as the brain\'s disappointment detector and reward brake. While dopamine neurons fire when outcomes beat expectations, the habenula fires when outcomes fall short or when you experience defeat or pain. Its firing activates inhibitory gates that temporarily silence dopamine neurons in the {{vta}}, helping you learn to steer clear of disappointing choices.',
        bullets: [
          "Disappointment detector: fires when an expected reward fails to appear, signaling negative prediction errors.",
          "Dopamine brake: sends excitatory signals to midbrain inhibitory cells that shut down {{vta}} dopamine firing.",
          "Avoidance learning: reinforces behaviors that help avoid painful, stressful, or unrewarding situations.",
          "Mood regulation: chronic overactivity is strongly linked to the flat affect and lack of motivation in depression.",
        ],
      },
      connects: {
        text: 'When something you hoped for does not happen or a plan falls through, the habenula flags the disappointment. It receives error signals from the {{prefrontal-cortex}} and {{globus-pallidus}}, and immediately tells the {{vta}} and {{raphe-nuclei}} to pause dopamine release so you can learn from the mistake.',
        connections: [
          { id: 'globus-pallidus', dir: 'in', label: 'Missing reward and error signals from basal ganglia' },
          { id: 'prefrontal-cortex', dir: 'in', label: 'Context and rule evaluation received' },
          { id: 'vta', dir: 'out', label: 'Brake signal sent to quiet dopamine firing' },
          { id: 'raphe-nuclei', dir: 'out', label: 'Brake signal sent to quiet serotonin firing' },
        ],
      },
      cells: {
        text: 'Lateral habenula cells use [[glutamate]] to excite local inhibitory cells in the midbrain, which in turn silence dopamine neurons. When a reward is missed, these cells fire rapid bursts.',
        diagram: 'basal-ganglia',
        synapse: 'glutamate',
        bullets: [
          'Increases firing frequency when disappointed, the exact inverse of dopamine neurons.',
          'Deep brain stimulation targeting the lateral habenula is being investigated for treatment-resistant depression.',
        ],
      },
    },
    tryIt: 'Recall the sudden drop in your stomach when you checked your pocket and thought you lost your keys. That jolt of alarm and halted anticipation was your habenula firing.',
    breaks: {
      text: 'Hyperactivity in the lateral habenula is linked to depression, making it hard to feel pleasure or find motivation.',
      bullets: [
        'Depression: an overactive habenula continuously quiets dopamine, leaving everyday events feeling flat.',
        'Learned helplessness: persistent firing can lead to giving up even when success is possible.',
        'Withdrawal: high activity during drug withdrawal drives dysphoria, tempting relapse.',
      ],
    },
  },
  {
    id: 'olfactory-bulb',
    name: 'Olfactory bulb',
    group: 'deep',
    color: '#f472b6',
    shape: { type: 'ellipsoid', center: [0.035, -0.17, 0.46], radii: [0.016, 0.014, 0.07], count: 340, pattern: 'fine', mirror: true, fill: 0.3, pointScale: 8.0 },
    view: 'left-below',
    size: 'about 1 cm long',
    slice: false,
    tagline: 'The sensory station for smell, wired directly to memory and emotion.',
    analogy: 'A direct phone line to memory that skips the central switchboard.',
    levels: {
      overview: {
        text: 'The olfactory bulbs are two matchstick-sized structures resting on the skull floor, beneath the {{frontal-lobe}} and above the nasal cavity. A thin, perforated bone separates them from the nose.\n\nEach bulb sorts incoming scent signals into patterns that the brain can recognize. A whiff of woodsmoke or sunscreen can bring back a memory before you have consciously named the smell.',
        bullets: [
          "Odor pattern sorting: organizes input from hundreds of olfactory receptor types into identifiable scent maps.",
          "Unusual route: smell reaches cortex without the thalamic relay used by other senses.",
          "Contrast sharpening: uses local inhibitory interneurons to distinguish between subtly different aromas.",
          "Hazard warning: triggers immediate alarm upon sensing smoke, spoiled food, or airborne chemical toxins.",
        ],
      },
      connects: {
        text: 'Smell takes a different early route from sight or hearing: its signals reach olfactory and limbic areas without first passing through a thalamic relay. Later processing helps attach flavor, emotion, memory, and names to an odor.',
        connections: [
          { id: 'amygdala', dir: 'out', label: 'Direct scent signals sent to emotion circuits' },
          { id: 'hippocampus', dir: 'out', label: 'Scent patterns sent to retrieve episodic memories' },
          { id: 'insula', dir: 'out', label: 'Aroma data relayed through olfactory cortex for flavor' },
          { id: 'prefrontal-cortex', dir: 'out', label: 'Conscious scent naming via olfactory cortex' },
        ],
      },
      cells: {
        text: 'Sensory axons from the nose gather into dense round spheres called glomeruli. Relay cells receive these signals and carry them into the brain, while local [[inhibitory]] cells use [[GABA]] to sharpen the contrast between similar smells.',
        synapse: 'glutamate',
        bullets: [
          'Contains glomeruli, where thousands of matching scent inputs converge onto single relay cells.',
          'Local inhibitory circuits sharpen contrast so you can tell similar spices apart.',
        ],
      },
    },
    tryIt: 'Close your eyes, breathe in slowly through your nose, and identify three distinct scents in your room. Your olfactory bulbs are sorting those complex chemical blends into recognizable memories right now.',
    breaks: {
      text: 'Losing the sense of smell (anosmia) can follow head trauma, viral illness or neurodegenerative disease.',
      bullets: [
        'Anosmia: loss of smell, which flattens the flavor of food.',
        'Early biomarker: subtle loss of odor discrimination often shows up early in Parkinson and Alzheimer diseases.',
        'Nerve shearing: a knock to the head can snap the fragile nerve fibers passing through the skull floor.',
      ],
    },
  },
];
