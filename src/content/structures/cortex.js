// Cerebral cortex: the four lobes and the named areas inside them.
//
// Cortical areas don't have their own geometry. They are "views" into one shared
// cortex point cloud, chosen by `shape.test(p)`. The point `p` has:
//   p.x, p.y, p.z   position (+x = person's left, +y = up, +z = front)
//   p.ax            |x|, distance from the midline
//   p.side          'left' | 'right'
//   p.lobe          'frontal' | 'parietal' | 'temporal' | 'occipital'
//   p.medial        true on the flat inner wall facing the other hemisphere
//   p.central       z position of the central sulcus at this height (frontal/parietal border)
//
// All text fields are written for a beginner. See CONTENT_PROMPT.md for the full schema.

import { callosumY } from '../../scene/shapes.js';

export default [
  // ---------------------------------------------------------------- frontal
  {
    id: 'frontal-lobe',
    name: 'Frontal lobe',
    group: 'cortex',
    color: '#e05cff',
    shape: { type: 'cortex', test: (p) => p.lobe === 'frontal' },
    view: 'left-front',
    size: 'about 8 cm front to back',
    tagline: 'Planning, deciding and moving.',
    analogy: 'The office manager who sets the goal, makes the plan and tells the hands what to do.',
    levels: {
      overview: {
        text: 'The frontal lobe spans the front third of each hemisphere, stretching from behind your forehead back to the central groove. It is the largest of the brain\'s four cortical lobes, bounded behind by the {{parietal-lobe}} and below by the {{temporal-lobe}}.\n\nIt turns goals into real-world action. When you decide to leave the couch, tie your shoes, and head outside for a run, the frontal lobe coordinates the sequence: holding the destination in mind, ignoring distractions, and firing movement commands to muscles.',
        bullets: [
          'Goal-directed action: turns conscious intentions into physical movements.',
          'Executive control: holds plans active while filtering out distractions.',
          'Speech construction: houses {{brocas-area}} on the left side for phrasing sentences.',
          'Physical landmarks: spans from the front pole back to the central sulcus.',
        ],
      },
      connects: {
        text: 'Information cycles continuously between frontal executive circuits and the rest of the brain. Spatial maps and sensory updates arrive from parietal areas to guide decisions, while thalamic loops coordinate attention. Outgoing motor and cognitive plans pass into subcortical loops that select and reinforce winning actions.',
        connections: [
          { id: 'parietal-lobe', dir: 'both', label: 'Plans traded for space and body maps' },
          { id: 'thalamus', dir: 'both', label: 'Attention and relay shared both ways' },
          { id: 'striatum', dir: 'out', label: 'Chosen actions sent for habit learning' },
        ],
      },
      cells: {
        text: 'Like all [[cortex]], it is a 6 layer sheet where input lands in the middle, planning happens up top and output leaves from deep [[pyramidal cell|pyramidal cells]], as the column diagram shows. Frontal pyramids are extra large with wide [[dendrite]] trees, built to hold information over seconds. They excite each other with [[glutamate]].',
        diagram: 'cortical-column',
        synapse: 'glutamate',
        bullets: [
          'Frontal [[cortex]] stays active during a delay, holding a goal in mind with no cue present.',
          'It matures last, with wiring still changing into the mid twenties.',
        ],
      },
    },
    tryIt: 'Pick a small task, like tidying one shelf, and hold that goal while a song plays. Keeping the goal alive through distraction is your frontal lobe working.',
    breaks: {
      text: 'Damage here leaves knowledge and movement intact but scrambles planning and control.',
      bullets: [
        'Impulsiveness and trouble finishing steps, as after head injury or stroke.',
        'Apathy where starting anything feels impossible, common in dementia.',
        'Stiff or clumsy movement on the opposite side if the back edge is hit.',
      ],
    },
  },
  {
    id: 'prefrontal-cortex',
    name: 'Prefrontal cortex',
    parent: 'frontal-lobe',
    group: 'cortex',
    color: '#ff6ad5',
    shape: { type: 'cortex', test: (p) => p.lobe === 'frontal' && p.z > 0.3 },
    view: 'left-front',
    size: 'about 5 cm front to back',
    tagline: 'Keeps goals in mind and puts the brakes on impulses.',
    analogy: 'A patient coach who holds the game plan up while the crowd shouts.',
    levels: {
      overview: {
        text: 'The prefrontal [[cortex]] occupies the frontmost region of the {{frontal-lobe}}, sitting directly behind your forehead. Highly developed in humans, it is richly connected with sensory, memory, and emotional hubs across the entire brain.\n\nIt holds goals in mind while you work, letting you follow multi-step recipes, save money, or listen without interrupting. Packing a bag for a trip shows it in action: you picture the weather, remember the charger, and skip the extra shoes you do not need.',
        bullets: [
          'Working memory: holds items active in mind for seconds or minutes.',
          'Impulse control: puts the brakes on quick reactions in favor of better choices.',
          'Planning ahead: strings complex tasks into the correct chronological order.',
          'Physical landmarks: front pole of the cortex, sitting ahead of the motor strip.',
        ],
      },
      connects: {
        text: 'The prefrontal cortex acts as a central exchange where memory, emotion, and action meet. Context from the hippocampus and threat signals from the amygdala are evaluated against long-term goals. Once a choice is made, signals route to the striatum to release behavior, while ongoing thalamic loops sustain focus through distractions.',
        connections: [
          { id: 'thalamus', dir: 'both', label: 'Attention kept in sync both ways' },
          { id: 'striatum', dir: 'out', label: 'Choices sent for habit learning' },
          { id: 'amygdala', dir: 'both', label: 'Feelings weighed against goals' },
          { id: 'hippocampus', dir: 'in', label: 'Memory context arriving for plans' },
          { id: 'posterior-parietal', dir: 'both', label: 'Space maps traded for actions' },
        ],
      },
      cells: {
        text: 'Prefrontal columns look like the diagram, but their [[pyramidal cell|pyramidal cells]] fire longer, holding a thought after the cue is gone. Local [[interneuron|interneurons]] using [[GABA]] protect that memory from noise. [[Dopamine]] tunes the balance, strengthening a clear goal and loosening it when plans must change.',
        diagram: 'cortical-column',
        synapse: 'dopamine',
        bullets: [
          'Delay cells here can keep firing for many seconds with nothing to look at.',
          'Too little dopamine weakens focus, too much makes thought rigid.',
        ],
      },
    },
    tryIt: 'Look around, then close your eyes and list five things you just saw. Holding them without looking is working memory, running on prefrontal loops.',
    breaks: {
      text: 'When this area struggles, goals slip and impulses win.',
      bullets: [
        'ADHD and frontal injury: distracted, disorganised, acting before thinking.',
        'Depression: stuck on bleak thoughts, hard to shift plans.',
        'Dementia at the front: personality and manners change first.',
      ],
      states: [
        {
          kind: 'lesion',
          teaser: 'Self-restraint and long-term planning collapse.',
          text: 'Damage to the front and lower prefrontal cortex strips away the brain\'s natural brakes on behavior. Memory, language, and physical movement remain intact, but social tact, emotional restraint, and the ability to organize long-term plans collapse. Without top-down guidance, emotional impulses from deeper structures go unchecked.',
          signs: [
            'Loss of social restraint, tact, and impulse control.',
            'Intact memory and speech alongside an inability to follow through on plans.',
            'Unpredictable emotional outbursts and extreme impatience.',
          ],
          case: {
            name: 'Phineas Gage (Harlow, 1848)',
            text: 'In 1848, an explosion drove an iron tamping rod through the frontal lobes of railroad foreman Phineas Gage. Physician John Martyn Harlow documented that while Gage survived with his intellect and memory intact, his personality changed sharply. Formerly polite and dependable, he became profane, erratic, and unable to manage social impulses. Later accounts note he partly adapted and later worked as a stagecoach driver in Chile, but the case remains a landmark in showing how frontal networks support self-restraint.',
          },
          ripple: [
            { id: 'amygdala', role: 'more_active' },
          ],
        },
        {
          kind: 'under',
          teaser: 'Exhaustion weakens top-down focus and impulse control.',
          text: 'Sleep loss and exhaustion are linked to weaker prefrontal activity, loosening top-down control over attention. Distractions easily pull attention away from current goals because the filter that keeps irrelevant thoughts out stops working efficiently. As a result, juggling multiple steps in mind becomes frustrating and decision-making defaults to impulsive shortcuts.',
          signs: [
            'Frequent lapses in concentration and high vulnerability to minor distractions.',
            'Difficulty holding multi-step directions active in working memory.',
            'Defaulting to quick, impulsive choices instead of weighing long-term outcomes.',
          ],
        },
        {
          kind: 'over',
          teaser: 'Checking loops get stuck replaying false alarms.',
          text: 'When prefrontal networks, especially orbitofrontal circuits linked with the {{striatum}}, become hyperactive, the brain gets trapped in continuous warning loops. Circuits repeatedly broadcast the feeling that something is wrong, even after a task has been completed and verified. These persistent loops are linked to obsessive-compulsive checking, making it exhausting to disengage attention.',
          signs: [
            'Relentless mental replaying of past mistakes or perceived flaws.',
            'An unshakeable feeling that something is incomplete, even after checking.',
            'Rigid thought loops that make shifting attention to new topics difficult.',
          ],
        },
      ],
    },
  },
  {
    id: 'motor-cortex',
    name: 'Primary motor cortex',
    parent: 'frontal-lobe',
    group: 'cortex',
    color: '#ff4f7b',
    shape: { type: 'cortex', test: (p) => p.lobe === 'frontal' && p.z < p.central + 0.085 && p.y > -0.02 },
    view: 'left',
    size: 'about 10 cm long strip',
    tagline: 'Shapes voluntary movement commands sent toward the spinal cord.',
    analogy: 'A piano keyboard for the body, with more keys for the fingers and lips than the back.',
    levels: {
      overview: {
        text: 'The motor [[cortex]] is a narrow vertical strip about 2 cm wide at the back of the {{frontal-lobe}}, running from the top of the head toward the ear just in front of the central groove. The left side guides movements on the right side of the body, and vice versa.\n\nIt turns planned actions into descending motor commands. Body parts are mapped like an upside-down person (homunculus), with huge cortical territories dedicated to agile hands, lips, and tongue. Reaching for a cup shows it: populations of its [[pyramidal cell|pyramidal cells]] set the direction, force, and timing of several joints at once.',
        bullets: [
          'Movement commands: recruits the muscles needed for voluntary actions.',
          'Motor body map: oversized zones dedicated to hands, lips, and tongue.',
          'Force and direction: sets how hard and where limbs push.',
          'Physical landmarks: vertical strip along the front bank of the central sulcus.',
        ],
      },
      connects: {
        text: 'Descending motor commands travel directly toward spinal motor neurons that contract muscles. At the same time, reciprocal links with somatosensory cortex provide instant tactile feedback, while an outgoing copy heads through the pons so the cerebellum can verify movement timing.',
        connections: [
          { id: 'spinal-cord', dir: 'out', label: 'Orders sent down to muscles' },
          { id: 'somatosensory-cortex', dir: 'both', label: 'Touch feedback traded both ways' },
          { id: 'thalamus', dir: 'in', label: 'Corrections arriving from below' },
          { id: 'pons', dir: 'out', label: 'Copy sent for cerebellum checking' },
        ],
      },
      cells: {
        text: 'Output leaves from giant [[pyramidal cell|pyramidal cells]] in layer V (Betz cells), as the column diagram shows. They use [[glutamate]] to excite spinal motor [[neuron|neurons]]. Input lands in the middle layer, is shaped by [[interneuron|interneurons]], then flows down to the big output cells.',
        diagram: 'cortical-column',
        synapse: 'glutamate',
        bullets: [
          'Betz cells are among the biggest cells in the brain, with axons up to a metre long.',
          'Imagining a movement wakes this strip weakly, which is why mental practice helps a little.',
        ],
      },
    },
    tryIt: 'Tap each fingertip to your thumb in turn, faster and faster. Motor cortex activity helps shape the changing force and timing, alongside premotor, cerebellar and spinal circuits.',
    breaks: {
      text: 'Damage weakens or clumsies the opposite side of the body, face included.',
      bullets: [
        'A stroke causes weakness or paralysis on the opposite side.',
        'Seizures here start as jerking in one hand or face corner.',
        'Loss of fine finger control lingers longest after injury.',
      ],
    },
  },
  {
    id: 'brocas-area',
    name: "Broca's area",
    parent: 'frontal-lobe',
    group: 'cortex',
    color: '#ffb35c',
    shape: {
      type: 'cortex',
      test: (p) => p.side === 'left' && p.lobe === 'frontal' && !p.medial && p.z > 0.16 && p.z < 0.42 && p.y > -0.1 && p.y < 0.13 && p.ax > 0.3,
    },
    view: 'left',
    size: 'about 3 cm across',
    tagline: 'Helps plan speech, grammar and demanding language sequences.',
    analogy: 'One workshop in a larger language network, especially busy when speech needs careful assembly.',
    levels: {
      overview: {
        text: 'Broca\'s area sits on the lower outer edge of the left {{frontal-lobe}}, just above the temple and ahead of the mouth area of the motor strip. Modern neuroscience finds that fluent speech depends on this hub working alongside a wider frontal and temporal language network.\n\nIt coordinates the tongue, lips, breath, and vocal cords into fluent spoken words and sentences. It also manages grammatical rules and word order. When you silently rehearse what you want to say before speaking aloud, this area activates during your inner monologue.',
        bullets: [
          'Speech articulation: coordinates motor sequences for spoken words.',
          'Grammar structure: handles sentence syntax and word order.',
          'Inner rehearsal: activates during silent internal speech.',
          'Physical landmarks: lower left frontal convolution (inferior frontal gyrus).',
        ],
      },
      connects: {
        text: 'Language assembly relies on rapid bidirectional signaling with temporal regions such as {{wernickes-area}}, which supply word concepts and meanings. Once a sentence structure is formed, outgoing commands flow to adjacent motor cortex representations for the lips, tongue, and larynx to articulate sound.',
        connections: [
          { id: 'wernickes-area', dir: 'both', label: 'Meanings traded to build sentences' },
          { id: 'motor-cortex', dir: 'out', label: 'Speech plan sent to mouth muscles' },
        ],
      },
      cells: {
        text: 'Its columns look like the standard diagram, with deep [[pyramidal cell|pyramidal cells]] sending plans out using [[glutamate]]. Left side cells grow richer connections to parietal and temporal language zones. Rhythm between layers keeps words in order, one after the next.',
        diagram: 'cortical-column',
        synapse: 'glutamate',
        bullets: [
          'It activates even when you silently rehearse words in your head.',
          'Learning a second language as an adult leans on it heavily.',
        ],
      },
    },
    tryIt: 'Say "the big brown bag" three times fast, then say it with "yesterday" tucked in: "yesterday\'s big brown bag". The extra planning load you feel is this area working.',
    breaks: {
      text: 'Damage across the surrounding frontal language network can make speech short and effortful. Damage limited to the classic Broca\'s area does not always produce the full syndrome.',
      bullets: [
        'Broca\'s aphasia: few words, missing grammar, but the meaning is clear.',
        'Frustration is common because people know what they want to say.',
        'Singing or swearing sometimes survives, using routes on the right side.',
      ],
      states: [
        {
          kind: 'lesion',
          teaser: 'Words stay clear in mind but become hard to speak.',
          text: 'Damage to Broca\'s area and the frontal regions around it strikes speech production while leaving language understanding largely preserved. People know exactly what they want to say, but coordinating the tongue, lips, and vocal cords into fluent sentences becomes an exhausting struggle. Spoken output shrinks to isolated words, short phrases, and simple gestures.',
          signs: [
            'Halting, fragmented speech produced with noticeable physical and mental effort.',
            'Preserved ability to comprehend spoken sentences and follow complex directions.',
            'Clear awareness of speech errors, often causing understandable frustration.',
          ],
          case: {
            name: 'Patient Tan (Broca, 1861)',
            text: 'In 1861, French physician Paul Broca evaluated Louis-Victor Leborgne, a patient who had lost the ability to speak two decades earlier. Leborgne could articulate only the single syllable tan, though he understood spoken questions and communicated through gestures. An autopsy revealed damage in the left inferior frontal gyrus, though later scans showed the damage reached deeper beyond Broca\'s area itself. The case helped show how this frontal network supports speech articulation.',
          },
        },
      ],
    },
  },

  // ---------------------------------------------------------------- parietal
  {
    id: 'parietal-lobe',
    name: 'Parietal lobe',
    group: 'cortex',
    color: '#6f86ff',
    shape: { type: 'cortex', test: (p) => p.lobe === 'parietal' },
    view: 'left-back',
    size: 'about 7 cm front to back',
    tagline: 'Touch, body sense and where things are in space.',
    analogy: 'A surveyor who keeps an updated map of your body and the space around it.',
    levels: {
      overview: {
        text: 'The parietal lobe covers the upper back of each [[hemisphere]], sitting behind the {{frontal-lobe}}, above the {{temporal-lobe}}, and in front of the {{occipital-lobe}}. The right side is especially important for mapping whole surrounding space.\n\nIt takes the felt body and the seen world and lines them up into a unified 3D map. Catching keys thrown toward you shows its teamwork: the parietal lobe calculates where your hand is and where the keys are moving so your fingers close at the exact right moment.',
        bullets: [
          'Spatial mapping: tracks where your body ends and surrounding space begins.',
          'Touch interpretation: houses the somatosensory strip for bodily feeling.',
          'Reaching coordination: aligns visual targets with physical motor reaches.',
          'Physical landmarks: upper posterior cortex bounded in front by the central groove.',
        ],
      },
      connects: {
        text: 'The parietal lobe merges separate sensory streams into a common spatial frame. Visual coordinates arriving from the occipital lobe combine with skin and joint feedback from thalamic relays, providing frontal motor circuits with the precise target coordinates needed to guide physical actions.',
        connections: [
          { id: 'frontal-lobe', dir: 'both', label: 'Space maps traded for movement plans' },
          { id: 'occipital-lobe', dir: 'in', label: 'Vision arriving for locating objects' },
          { id: 'thalamus', dir: 'both', label: 'Touch and attention shared both ways' },
        ],
      },
      cells: {
        text: 'Columns here match the diagram, with a thick middle layer for touch and vision input. [[Pyramidal cell|Pyramidal cells]] in upper layers compare signals from different senses using [[glutamate]]. Special cells fire for "my hand here" or "target there", blending body and world.',
        diagram: 'cortical-column',
        synapse: 'glutamate',
        bullets: [
          'Some cells fire only when you reach for something you also see.',
          'This lobe keeps updating, which is why your nose feels centred even with eyes closed.',
        ],
      },
    },
    tryIt: 'Close your eyes and touch your nose with each index finger in turn. The hit rate you manage with no vision is your parietal body map at work.',
    breaks: {
      text: 'Damage scrambles the map, so people lose track of space or of one side.',
      bullets: [
        'Right side stroke: ignoring the left side of space, even of a drawing.',
        'Left side injury: trouble with arithmetic, writing and left right naming.',
        'Front edge damage: clumsy hands and lost touch guidance.',
      ],
    },
  },
  {
    id: 'somatosensory-cortex',
    name: 'Primary somatosensory cortex',
    parent: 'parietal-lobe',
    group: 'cortex',
    color: '#4fc3ff',
    shape: { type: 'cortex', test: (p) => p.lobe === 'parietal' && p.z > p.central - 0.085 && p.y > -0.02 },
    view: 'left',
    size: 'about 10 cm long strip',
    tagline: 'Where touch, temperature and pain from your body arrive.',
    analogy: 'A switchboard where every patch of skin has its own blinking light.',
    levels: {
      overview: {
        text: 'The somatosensory [[cortex]] is a vertical ribbon running down the front edge of the {{parietal-lobe}}, sitting directly across the central groove from the {{motor-cortex}}. It decodes touch, temperature, pain, and body position from the opposite side of the body.\n\nEach skin region is mapped to a specific spot along this strip. Sensitive zones like fingertips and lips have huge territories, letting you tell two points apart at 2 mm, while the back requires 40 mm. Buttoning a shirt without looking shows it: your fingers decode button edges and fabric feel from touch alone.',
        bullets: [
          'Touch discrimination: decodes textures, edges, pressure, and vibrations.',
          'Body position: monitors joint angles so limbs do not wander without vision.',
          'Sensory homunculus: huge cortical areas for hands, lips, and tongue.',
          'Physical landmarks: vertical strip along the rear bank of the central sulcus.',
        ],
      },
      connects: {
        text: 'Touch signals arrive from your skin through the {{thalamus}}, reporting pressure, vibration, and texture. This sensory map trades instant updates with the neighboring {{motor-cortex}} to adjust how tightly you hold a glass, while sending spatial layouts to the {{posterior-parietal}} cortex to guide reaching and catching.',
        connections: [
          { id: 'thalamus', dir: 'in', label: 'Touch arriving fresh from the body' },
          { id: 'motor-cortex', dir: 'both', label: 'Touch compared with movement plans' },
          { id: 'posterior-parietal', dir: 'out', label: 'Felt shape sent on for reaching' },
        ],
      },
      cells: {
        text: 'Input lands thickly in the middle layer, as the column diagram shows, then spreads up for detail and down for action. Small star shaped cells sort textures while large [[pyramidal cell|pyramidal cells]] send the result onward with [[glutamate]]. Maps here shift with use, which is why string players grow larger finger zones.',
        diagram: 'cortical-column',
        synapse: 'glutamate',
        bullets: [
          'Lips and fingertips can tell two points apart at 2 mm, the back needs 40 mm.',
          'Losing input, as in amputation, lets neighbours take over the quiet zone.',
        ],
      },
    },
    tryIt: 'With eyes closed, have someone trace a number on your palm with a fingertip. Reading it correctly is this strip decoding shape from touch alone.',
    breaks: {
      text: 'Damage dulls or distorts feeling on the opposite side, even though the skin is fine.',
      bullets: [
        'Numbness or clumsiness when buttoning or holding small things.',
        'Tingling or burning pain with no injury, after stroke.',
        'Losing joint sense, so the hand misses without vision to guide it.',
      ],
      states: [
        {
          kind: 'lesion',
          teaser: 'Touch and body position on the opposite side fade.',
          text: 'Damage to the somatosensory cortex strips away fine tactile perception on the opposite side of the body. Light touch feels numb or muddy, and the fingers can no longer tell a key from a coin by feel alone. Because the brain loses its internal sense of joint position, limbs wander without visual guidance.',
          signs: [
            'Inability to distinguish two separate touch points on the skin from a single point.',
            'Trouble identifying familiar objects by touch alone without looking at them.',
            'Loss of joint position awareness, needing eyes on the limbs to guide them accurately.',
          ],
        },
        {
          kind: 'size',
          look: 'more_active',
          teaser: 'Neighboring body maps move into silent territory.',
          text: 'When an arm is lost, the patch of somatosensory cortex that once mapped the hand goes silent and begins reorganizing. Inputs from neighboring body maps, particularly the face, seem to take over the quiet territory and wake up dormant connections. As a result, touching a patch on the cheek can vividly trigger the sensation of an amputated finger being stroked.',
          signs: [
            'Vivid tactile feelings on missing fingers when specific spots on the cheek are stroked.',
            'Adjacent body maps expanding across boundaries into silenced sensory zones.',
            'Rapid cortical rewiring that creates physical sensory ghosts after an injury.',
          ],
          case: {
            name: 'Phantom Limb Remapping (Ramachandran, 1990s)',
            text: 'In the 1990s, neuroscientist V.S. Ramachandran studied patients who experienced vivid phantom sensations following arm amputation. Because the facial touch map sits directly alongside the hand map in the somatosensory cortex, the face\'s inputs seem to take over the silent hand territory. Stroking specific points on a patient\'s cheek reliably produced the sensation of individual missing fingers being touched. Whether this comes from new growth or from existing connections being unmasked is still debated.',
          },
        },
      ],
    },
  },
  {
    id: 'posterior-parietal',
    name: 'Posterior parietal cortex',
    parent: 'parietal-lobe',
    group: 'cortex',
    color: '#8a9bff',
    shape: { type: 'cortex', test: (p) => p.lobe === 'parietal' && p.z < p.central - 0.085 && p.y > 0.08 },
    view: 'left-back',
    size: 'about 5 cm across',
    tagline: 'Builds a map of space so you can reach and look.',
    analogy: 'A sat nav that keeps "you are here" updated while you move.',
    levels: {
      overview: {
        text: 'The posterior parietal cortex forms the upper back half of the {{parietal-lobe}}, positioned between touch in front and vision behind. It brings together visual coordinates and body feedback into an internal navigation map.\n\nIt converts visual targets into reach-and-grasp commands. Pouring tea from a kettle into a small cup without spilling shows the quiet work: eye, cup, and pot stay aligned in space while your hand tilts.',
        bullets: [
          'Visuomotor reaching: turns "I see it" into "hand go there".',
          'Attention steering: picks the next visual target and shifts focus.',
          'Grasp shaping: adjusts finger aperture to the seen size and angle of objects.',
          'Route tracking: keeps track of turns when moving through rooms.',
        ],
      },
      connects: {
        text: 'This area lines up what your eyes see with where your body is standing. When you spot a mug on a table, it calculates where the mug sits relative to your hand, trades goal plans with the {{prefrontal-cortex}}, and guides your arm movements through the {{motor-cortex}}.',
        connections: [
          { id: 'visual-cortex', dir: 'in', label: 'Seen layout arriving for aiming' },
          { id: 'somatosensory-cortex', dir: 'in', label: 'Felt body arriving for lining up' },
          { id: 'prefrontal-cortex', dir: 'both', label: 'Space plans traded with goals' },
          { id: 'motor-cortex', dir: 'out', label: 'Agreed target sent for action' },
        ],
      },
      cells: {
        text: 'Columns here mix two inputs in upper layers before sending one command down, exactly the column diagram pattern. Many cells fire only for a favourite direction of reach or look. They use [[glutamate]] to excite the next stage, with [[interneuron|interneurons]] sharpening the winner.',
        diagram: 'cortical-column',
        synapse: 'glutamate',
        bullets: [
          'Some cells track the target relative to the eye, others relative to the hand.',
          'Brief zaps here can make people misreach, as if the sat nav lost signal.',
        ],
      },
    },
    tryIt: 'Point at a mug, close your eyes, keep pointing, then open them. The small drift you see is this map running without visual updates.',
    breaks: {
      text: 'Damage breaks aiming and attention to space, often on one side only.',
      bullets: [
        'Optic ataxia: seeing fine but missing when reaching for things.',
        'Neglect: ignoring the left side after right side damage.',
        'Getting lost in familiar places or struggling to copy drawings.',
      ],
    },
  },

  // ---------------------------------------------------------------- temporal
  {
    id: 'temporal-lobe',
    name: 'Temporal lobe',
    group: 'cortex',
    color: '#a67bff',
    shape: { type: 'cortex', test: (p) => p.lobe === 'temporal' },
    view: 'left',
    size: 'about 8 cm front to back',
    tagline: 'Hearing, language and recognising what things are.',
    analogy: 'A librarian who knows every face, tune and word by heart.',
    levels: {
      overview: {
        text: 'The temporal lobe sits low on the side of the head under the temples, below the {{frontal-lobe}} and {{parietal-lobe}} and in front of the {{occipital-lobe}}. It houses the {{auditory-cortex}}, language hubs, and the {{hippocampus}} and {{amygdala}} buried inside.\n\nIt identifies what you hear and see, turning a bark into "neighbour\'s dog" and a face into "my friend". It also stores vocabulary and word meanings. Recognising a friend\'s face in a crowd before you recall their name is temporal processing: the recognition arrives first, the name follows.',
        bullets: [
          'Hearing and speech: decodes sound waves into voices, music, and words.',
          'Visual recognition: identifies faces, objects, and familiar environments.',
          'Language memory: stores word meanings and vocabulary on the left side.',
        ],
      },
      connects: {
        text: 'Recognition is a shared job. Visual details gain meaning here, and that meaning can shape memories, feelings, speech, and plans through different pathways.',
        connections: [
          { id: 'hippocampus', dir: 'both', label: 'Daily life traded for memory filing' },
          { id: 'amygdala', dir: 'both', label: 'Feelings tied to faces and sounds' },
          { id: 'occipital-lobe', dir: 'in', label: 'Vision arriving for recognising' },
          { id: 'frontal-lobe', dir: 'both', label: 'Meanings traded for plans and speech' },
        ],
      },
      cells: {
        text: 'Columns here match the diagram, but lower layers are strongly linked to memory structures. Cells become picky with learning: one may fire only for your grandmother\'s face. They excite each other with [[glutamate]], and repeated patterns strengthen, which is how recognition grows.',
        diagram: 'cortical-column',
        synapse: 'glutamate',
        bullets: [
          'So called grandmother cells respond to one familiar person or place.',
          'The bottom surface maps objects by meaning, with neighbours for faces, animals and tools.',
        ],
      },
    },
    tryIt: 'Hum a familiar tune and notice the next line arrives on its own. That automatic completion is your temporal store predicting ahead.',
    breaks: {
      text: 'Damage blurs recognition and word meaning while leaving vision and hearing sharp.',
      bullets: [
        'Face blindness: familiar faces look unfamiliar, though vision is fine.',
        'Word deafness or loss of word meanings after left side stroke.',
        'Seizures here can bring deja vu, strange smells or brief memory gaps.',
      ],
    },
  },
  {
    id: 'auditory-cortex',
    name: 'Primary auditory cortex',
    parent: 'temporal-lobe',
    group: 'cortex',
    color: '#5ce1e6',
    shape: { type: 'cortex', test: (p) => p.lobe === 'temporal' && p.y > -0.075 && p.z > -0.14 && p.z < 0.12 },
    view: 'left',
    size: 'about 3 cm long',
    tagline: 'The first stop in the cortex for sound.',
    analogy: 'A sound engineer who splits incoming noise into pitch, timing and direction.',
    levels: {
      overview: {
        text: 'The auditory [[cortex]] hides on the upper shelf of the {{temporal-lobe}}, tucked inside the fold above the ear. It receives incoming acoustic signals relayed from the ears through the {{thalamus}}, laid out like piano keys from low to high pitches.\n\nIt breaks raw sound into usable pieces: pitch, loudness, timing, and ear-arrival differences are separated here before wider networks recognize voices or words. Following one friend\'s voice in a noisy cafe starts here as the split into pitches lets later areas lock onto that specific sound.',
        bullets: [
          'Pitch and loudness: maps sound frequency and acoustic intensity.',
          'Sound direction: compares millisecond timing between ears to locate sounds.',
          'Rhythm tracking: detects syllable boundaries and acoustic rhythms.',
          'Physical landmarks: tucked inside the lateral fissure on the temporal lobe\'s upper bank.',
        ],
      },
      connects: {
        text: 'Sound waves captured by your ears travel up through the {{thalamus}} into this primary hearing strip. Clean sound patterns then branch outward: words and speech route to {{wernickes-area}} to be understood, while a sudden, startling noise like a scream alerts the {{amygdala}} before you even know what caused it.',
        connections: [
          { id: 'thalamus', dir: 'in', label: 'Fresh sound arriving from the ears' },
          { id: 'wernickes-area', dir: 'out', label: 'Cleaned sound sent for word meaning' },
          { id: 'amygdala', dir: 'out', label: 'Alarming sounds flagged for feeling' },
        ],
      },
      cells: {
        text: 'Columns match the diagram, with middle layer cells tuned to one favourite pitch. Neighbours excite and hush each other with [[glutamate]] and [[GABA]] to sharpen the tuning. With practice (an instrument, a language), the zones for used pitches grow.',
        diagram: 'cortical-column',
        synapse: 'glutamate',
        bullets: [
          'Musicians grow larger zones for the pitches they play most.',
          'Losing high pitches with age starts in the ear, then this map reshapes.',
        ],
      },
    },
    tryIt: 'Close your eyes and point to a sound, like a clock ticking. Placing it left or right uses the tiny timing gaps this area reads.',
    breaks: {
      text: 'Damage rarely causes deafness, but sound turns confusing.',
      bullets: [
        'Trouble following speech in noise, though quiet rooms are fine.',
        'Music can sound flat or wrong (amusia) after right side damage.',
        'Ringing (tinnitus) reflects overactive maps after ear loss.',
      ],
    },
  },
  {
    id: 'wernickes-area',
    name: "Wernicke's area",
    parent: 'temporal-lobe',
    group: 'cortex',
    color: '#ffd166',
    shape: { type: 'cortex', test: (p) => p.side === 'left' && p.lobe === 'temporal' && p.y > -0.13 && p.z < -0.1 },
    view: 'left',
    size: 'about 3 cm across',
    tagline: 'Helps you understand the words you hear and read.',
    analogy: 'A translator who turns sounds and letters back into meaning.',
    levels: {
      overview: {
        text: 'Wernicke\'s area is a landmark region on the back left {{temporal-lobe}}, near the junction with parietal cortex. Modern studies show that understanding words and sentences depends on this hub working within a broader network across temporal, parietal, and frontal regions.\n\nIt links speech sounds with word ideas and sentence context. Hearing "keys" activates representations of their sound, appearance, and use. Understanding a sentence like "please grab the blue mug" is an achievement of this network, matching spoken syllables to stored concepts and grammatical roles.',
        bullets: [
          'Speech comprehension: matches spoken and written words to concepts.',
          'Word retrieval: helps select the right word when expressing thoughts.',
          'Grammar parsing: tracks sentence roles and who did what to whom.',
          'Physical landmarks: back upper bank of the left temporal lobe.',
        ],
      },
      connects: {
        text: 'Heard speech arrives from the {{auditory-cortex}} to be decoded into meaningful words, while written words enter through visual pathways. Deep white-matter bundles connect this interpretive hub with {{brocas-area}} so that understood ideas can be turned into spoken sentences.',
        connections: [
          { id: 'auditory-cortex', dir: 'in', label: 'Heard words arriving for meaning' },
          { id: 'brocas-area', dir: 'both', label: 'Meanings traded to build replies' },
          { id: 'visual-cortex', dir: 'in', label: 'Seen words arriving for reading' },
        ],
      },
      cells: {
        text: 'Columns here look like the diagram but with extra long range links. Word sounds and word ideas meet on the same [[pyramidal cell|pyramidal cells]] through [[glutamate]] [[synapse|synapses]] that strengthen with use. That is why a new word needs several meetings before it sticks.',
        diagram: 'cortical-column',
        synapse: 'glutamate',
        bullets: [
          'It responds more to real words than to made up sounds.',
          'Learning to read borrows this hub and ties it to vision.',
        ],
      },
    },
    tryIt: 'Listen to a sentence in a language you half know and catch the one word you recognise. The pop of meaning among noise is this area matching sound to memory.',
    breaks: {
      text: 'Large injuries around the back left temporal language network can impair comprehension and produce fluent but hard to follow speech. The classic syndrome usually reflects damage beyond one small patch.',
      bullets: [
        'Wernicke\'s aphasia: fluent speech that makes little sense, with poor understanding.',
        'Trouble naming everyday things, though they can still be used.',
        'Reading aloud stays smooth while comprehension drops.',
      ],
      states: [
        {
          kind: 'lesion',
          teaser: 'Speech flows smoothly but loses its meaning.',
          text: 'Damage to Wernicke\'s area and the temporal regions around it impairs the brain\'s ability to decode the meaning of words while leaving the mechanics of speaking intact. Speech flows effortlessly with normal rhythm and melody, but sentences are filled with made-up words and unintended substitutions that make no sense to listeners. Because the internal comprehension filter is damaged, speakers are usually unaware that their words lack meaning.',
          signs: [
            'Rapid, fluent speech that sounds grammatically natural but consists of meaningless word salad.',
            'Poor understanding of spoken and written sentences.',
            'Lack of awareness that one\'s own speech is confusing or uninterpretable to others.',
          ],
          case: {
            name: 'Receptive Aphasia (Wernicke, 1874)',
            text: 'In 1874, German physician Carl Wernicke documented a distinct form of language loss caused by damage to the left posterior temporal lobe. His patients spoke effortlessly with normal rhythm and grammar, but their sentences were loaded with invented words and made no sense. Furthermore, they could not understand spoken speech, demonstrating that this region serves as the brain\'s primary center for language comprehension.',
          },
        },
      ],
    },
  },

  // ---------------------------------------------------------------- occipital
  {
    id: 'occipital-lobe',
    name: 'Occipital lobe',
    group: 'cortex',
    color: '#c46bff',
    shape: { type: 'cortex', test: (p) => p.lobe === 'occipital' },
    view: 'left-back',
    size: 'about 5 cm front to back',
    tagline: 'The vision department at the back of your head.',
    analogy: 'A darkroom that develops the raw film from the eyes into pictures.',
    levels: {
      overview: {
        text: 'The occipital lobe forms the back tip of each [[hemisphere]], tucked under the skull behind the {{parietal-lobe}} and {{temporal-lobe}} and resting just above the {{cerebellum}}. The left half processes the right visual field, and vice versa.\n\nIt builds the brain\'s first visual representation, deconstructing light into edges, colors, motion, and depth. Spotting a friend\'s bright red coat across a busy train station starts here: color contrasts and motion pop out into awareness before you consciously identify who is wearing it.',
        bullets: [
          'Early visual parsing: extracts edges, orientations, color, and motion.',
          'Depth calculation: blends input from both eyes for 3D stereoscopic vision.',
          'Visual routing: sends spatial data to parietal and object data to temporal cortex.',
          'Physical landmarks: posterior pole of each hemisphere, folded around the calcarine groove.',
        ],
      },
      connects: {
        text: 'Retinal signals relay through the thalamus into primary visual cortex before dividing into two massive processing streams. An upper dorsal stream flows into the parietal lobe to track movement and spatial location, while a lower ventral stream enters the temporal lobe to identify objects, text, and faces.',
        connections: [
          { id: 'thalamus', dir: 'in', label: 'Fresh vision arriving from the eyes' },
          { id: 'parietal-lobe', dir: 'out', label: 'Locations sent on for reaching' },
          { id: 'temporal-lobe', dir: 'out', label: 'Shapes sent on for recognising' },
        ],
      },
      cells: {
        text: 'Middle layer cells get the eye input first, as the column diagram shows, then pass it up for detail and down for sending on. [[Pyramidal cell|Pyramidal cells]] using [[glutamate]] learn favourite angles and colours. Neighbouring [[interneuron|interneurons]] hush the rest, sharpening edges.',
        diagram: 'cortical-column',
        synapse: 'glutamate',
        bullets: [
          'One small patch here holds a full map of the opposite visual field.',
          'Blindness from eye loss still leaves these maps able to rewire to touch or sound.',
        ],
      },
    },
    tryIt: 'Hold a thumb up at arm\'s length and notice only the middle stays sharp. The blur toward the edges mirrors how this lobe devotes most cells to the centre of sight.',
    breaks: {
      text: 'Damage causes blind patches with healthy eyes, because the picture builder is hurt.',
      bullets: [
        'Losing one side causes blindness on the opposite side of sight.',
        'Motion blindness: things appear as still snapshots though shapes stay clear.',
        'Colour loss where the world looks washed out but shapes remain.',
      ],
    },
  },
  {
    id: 'visual-cortex',
    name: 'Primary visual cortex',
    parent: 'occipital-lobe',
    group: 'cortex',
    color: '#ff8ae2',
    shape: { type: 'cortex', test: (p) => p.lobe === 'occipital' && (p.z < -0.73 || (p.medial && p.y < 0.26 && p.y > -0.08)) },
    view: 'back',
    size: 'about 4 cm across',
    tagline: 'Breaks what you see into edges, lines and motion.',
    analogy: 'A prism that splits white light into separate colours, but for lines and movement.',
    levels: {
      overview: {
        text: 'The primary visual [[cortex]] lines the deep horizontal groove (calcarine [[sulcus]]) on the inner wall of each {{occipital-lobe}}, where the two hemispheres face each other. Thin but packed with neurons, the central few degrees of vision you read with receive disproportionately large cortical space.\n\nIt reads the visual fundamentals. Tiny columns of cells fire for one angle of line, one direction of motion, or one color boundary. Reading these words relies on rows of these columns: short vertical, horizontal, and curved line segments are detected before higher areas assemble them into letters.',
        bullets: [
          'Edge detection: responds to specific line angles and borders.',
          'Direction of motion: tracks the vector and speed of moving visual patches.',
          'Central magnification: dedicates massive cortical space to high-detail central vision.',
          'Physical landmarks: medial occipital walls lining the calcarine sulcus.',
        ],
      },
      connects: {
        text: 'Early visual features like edges and motion are detected here and broadcast onward. An upper route travels to the {{posterior-parietal}} cortex to guide reaching and catching, while a lower route heads into the {{temporal-lobe}} to recognize shapes, faces, and text.',
        connections: [
          { id: 'thalamus', dir: 'in', label: 'Raw sight arriving from the eyes' },
          { id: 'posterior-parietal', dir: 'out', label: 'Locations sent on for reaching' },
          { id: 'temporal-lobe', dir: 'out', label: 'Shapes sent on for naming' },
        ],
      },
      cells: {
        text: 'Input lands in the middle layer and fans out, as the column diagram shows. Simple cells combine into complex ones that tolerate small shifts, so an edge counts wherever it sits. [[Glutamate]] carries the feed forward while [[GABA]] cells sharpen the favourite angle.',
        diagram: 'cortical-column',
        synapse: 'glutamate',
        bullets: [
          'Cells here care about lines, not objects. A face means nothing yet.',
          'Covering one eye as a child can permanently shrink its zones here.',
        ],
      },
    },
    tryIt: 'Stare at the centre of a ceiling fan, then flick your eyes to the wall. The brief motion smear you see is this area reporting movement before the rest catches up.',
    breaks: {
      text: 'Damage leaves the eyes fine but erases patches of sight.',
      bullets: [
        'A small stroke causes a matching blind spot in both eyes.',
        'Damage to motion zones leaves a world of still frames.',
        'Some blind people still dodge obstacles, using pathways that bypass this strip.',
      ],
    },
  },

  // ---------------------------------------------------------------- hidden cortex
  {
    id: 'cingulate-cortex',
    name: 'Cingulate cortex',
    group: 'cortex',
    color: '#ff9f6b',
    shape: {
      type: 'cortex',
      test: (p) => p.medial && p.z > -0.42 && p.z < 0.4 && p.y > callosumY(p.z) + 0.03 && p.y < callosumY(p.z) + 0.15,
    },
    view: 'medial',
    size: 'about 10 cm front to back',
    slice: true,
    tagline: 'Notices mistakes and conflict, and links feelings to action.',
    analogy: 'A supervisor who spots when the plan and the feelings disagree and calls a pause.',
    levels: {
      overview: {
        text: 'The cingulate cortex arches like a belt over the {{corpus-callosum}} on the inner medial wall of each [[hemisphere]]. Running from front to back, it bridges deep emotional structures with the higher neocortex.\n\nIt tracks conflict, mistakes, and the cost of effort. When you type quickly and hit the wrong key, you immediately notice, pause, and hit backspace. That instant "oops" signal is the cingulate detecting a mismatch between your goal and what your fingers actually did.',
        bullets: [
          'Error detection: spots slips and signals the need to pause and fix them.',
          'Conflict monitoring: notices when automatic habits clash with current goals.',
          'Effort evaluation: weighs whether a goal is worth the physical or mental push.',
          'Physical landmarks: C-shaped ribbon wrapping above the great bridge of the brain.',
        ],
      },
      connects: {
        text: 'Sitting like a collar between emotional centers and the thinking cortex, the cingulate notices when things go wrong. It links emotional alarms from the {{amygdala}} with plans in the {{prefrontal-cortex}}, flagging surprising mistakes to the {{hippocampus}} so you remember not to repeat them.',
        connections: [
          { id: 'prefrontal-cortex', dir: 'both', label: 'Control traded with planning areas' },
          { id: 'amygdala', dir: 'both', label: 'Feelings linked to actions' },
          { id: 'thalamus', dir: 'in', label: 'Body and attention news arriving' },
          { id: 'hippocampus', dir: 'out', label: 'What mattered sent for remembering' },
        ],
      },
      cells: {
        text: 'Columns here match the diagram, but the front holds rare spindle cells built for fast long distance calls. Upper layers compare "what I did" with "what I meant" using [[glutamate]]. [[Dopamine]] reports whether the outcome was better or worse than expected.',
        diagram: 'cortical-column',
        synapse: 'dopamine',
        bullets: [
          'The "oops" wave in scalp recordings comes largely from here.',
          'It activates for physical pain and for social rejection in similar ways.',
        ],
      },
    },
    tryIt: 'Name the ink colour of the words RED, BLUE, GREEN where ink and word clash. The slowdown you feel is this area wrestling with conflict.',
    breaks: {
      text: 'Too much activity brings stuck worry, too little brings careless slips.',
      bullets: [
        'Overactivity is linked to OCD, anxiety and chronic pain loops.',
        'Damage can flatten motivation, so errors no longer prompt fixes.',
        'Back part failure shows early in Alzheimer\'s as lost direction.',
      ],
    },
  },
  {
    id: 'insula',
    name: 'Insula',
    group: 'cortex',
    color: '#ff7a8a',
    shape: { type: 'ellipsoid', center: [0.43, -0.01, 0.07], radii: [0.025, 0.075, 0.15], count: 1800, pattern: 'fine', mirror: true, fill: 0.2 },
    view: 'left',
    size: 'about 5 cm across',
    tagline: 'Your sense of the inside of your body: heartbeat, hunger, disgust.',
    analogy: 'An inner weather station reporting how the body feels right now.',
    levels: {
      overview: {
        text: 'The insula is a buried island of [[cortex]] hidden inside the deep lateral fold where the {{temporal-lobe}} meets the lower {{frontal-lobe}}. Ribbons of cortex from above fold over it, keeping it unseen from the surface.\n\nIt turns internal bodily signals into conscious feelings you can act on. A fluttering heart becomes nerves, a full stomach becomes satisfaction, and a foul odor becomes disgust. Noticing your heart thump in your chest before speaking in public is the insula bringing your body state into awareness.',
        bullets: [
          'Interoception: monitors heartbeat, breathing, hunger, and gut sensations.',
          'Visceral feeling: links physiological body states to emotions and mood.',
          'Taste and disgust: flags spoiled food and moral repulsion.',
          'Physical landmarks: buried cortical island tucked deep inside the lateral fissure.',
        ],
      },
      connects: {
        text: 'Signals from your heart, lungs, and gut travel up through the {{thalamus}} to build a live picture of your body. The insula shares these gut feelings with the {{amygdala}} and {{cingulate-cortex}}, while telling the {{prefrontal-cortex}} how tired, hungry, or comfortable your body feels so your plans respect physical reality.',
        connections: [
          { id: 'amygdala', dir: 'both', label: 'Body feelings tied to alarms' },
          { id: 'cingulate-cortex', dir: 'both', label: 'Body state linked to actions' },
          { id: 'thalamus', dir: 'in', label: 'Heartbeat and gut news arriving' },
          { id: 'prefrontal-cortex', dir: 'out', label: 'Body read out sent for planning' },
        ],
      },
      cells: {
        text: 'Columns match the diagram, but the front holds spindle cells like the cingulate for fast gut feelings. Middle layers mix taste, gut and pain inputs with [[glutamate]]. The integrated signal leaves from deep [[pyramidal cell|pyramidal cells]] to guide decisions.',
        diagram: 'cortical-column',
        synapse: 'glutamate',
        bullets: [
          'People better at counting heartbeats without touching show stronger insula signals.',
          'Smokers with insula damage sometimes quit effortlessly, losing the craving feeling.',
        ],
      },
    },
    tryIt: 'Sit still, close your eyes and count your heartbeats for 30 seconds without touching your chest, then check against your pulse. The ease or hard work you feel is interoception.',
    breaks: {
      text: 'When this readout fails, body feelings mislead or go missing.',
      bullets: [
        'Damage dulls taste, pain warmth and the sense of heartbeat.',
        'Overactivity is linked to anxiety, panic and disgust disorders.',
        'Addiction hijacks its craving signals, so "need" feels like hunger.',
      ],
    },
  },
];
