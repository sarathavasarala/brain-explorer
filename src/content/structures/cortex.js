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
    tagline: 'Planning, deciding and moving.',
    analogy: 'The office manager who sets the goal, makes the plan and tells the hands what to do.',
    levels: {
      where: {
        text: 'The frontal lobe is the whole front third of each [[hemisphere]], from your forehead back to the central groove near the top. It is the largest [[lobe]], about a third of the [[cortex]]. Inside it sit the {{prefrontal-cortex}}, {{motor-cortex}} and {{brocas-area}}.',
        bullets: [
          'Front of the central [[sulcus]], above the temples.',
          'Two sides joined by the {{corpus-callosum}} underneath.',
          'Outer sheet is deeply folded into ridges (gyri) and grooves.',
        ],
      },
      does: {
        text: 'The frontal lobe turns goals into actions. It holds what you want in mind, picks a plan, then sends the order to move. Reading a recipe, gathering ingredients and starting to cook is a frontal morning.\n\nIt also holds back impulses. Stopping yourself from replying to a rude text is as frontal as sending one.',
        bullets: [
          'Goals and plans: holds intentions while you work toward them.',
          'Decisions: weighs options with help from the {{striatum}}.',
          'Movement orders: issues the final "go" through the {{motor-cortex}}.',
          'Self control: stops or delays actions that do not fit the goal.',
        ],
      },
      connects: {
        text: 'It trades maps and body news both ways with the {{parietal-lobe}}. Attention and relay signals move both ways with the {{thalamus}}. Chosen actions go out to the {{striatum}} to become habits.',
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
    tagline: 'Keeps goals in mind and puts the brakes on impulses.',
    analogy: 'A patient coach who holds the game plan up while the crowd shouts.',
    levels: {
      where: {
        text: 'The prefrontal [[cortex]] is the very front of the {{frontal-lobe}}, behind your forehead. It is the largest part of the frontal lobe in humans, much bigger than in other animals. It sits far from the senses, so it deals in plans rather than raw sights or sounds.',
        bullets: [
          'Frontmost patch of [[cortex]], ahead of the {{motor-cortex}}.',
          'Three faces: outer (plans), middle (memory), lower (feelings and rules).',
          'Richly wired to the {{thalamus}}, {{striatum}} and {{amygdala}}.',
        ],
      },
      does: {
        text: 'The prefrontal [[cortex]] holds a goal in mind while you work. It lets you follow a recipe, save money or listen without interrupting. It does this by keeping the goal active and quieting distractions.\n\nPacking a bag for a weekend trip shows it. You picture the weather, remember the charger and skip the extra shoes. That juggling is prefrontal.',
        bullets: [
          'Working memory: holds a few items active for seconds.',
          'Self control: stops the quick reply in favour of the better one.',
          'Planning ahead: strings steps into the right order.',
          'Social rules: adjusts behaviour for who is in the room.',
        ],
      },
      connects: {
        text: 'It trades attention signals both ways with the {{thalamus}} and space updates both ways with the {{posterior-parietal}}. Choices go out to the {{striatum}}. Feelings are negotiated both ways with the {{amygdala}}, while memory context arrives from the {{hippocampus}}.',
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
    tagline: 'Sends the final "go" signal to your muscles.',
    analogy: 'A piano keyboard for the body, with more keys for the fingers and lips than the back.',
    levels: {
      where: {
        text: 'The motor [[cortex]] is a narrow strip at the back of the {{frontal-lobe}}, just in front of the central groove. It runs from the top of the head down toward the ear. Each spot controls the opposite side of the body, laid out like a tiny upside down person (the homunculus).',
        bullets: [
          'A strip about 2 cm wide, one per [[hemisphere]].',
          'Huge zones for hands, lips and tongue, tiny ones for trunk.',
          'Lies directly across the groove from the {{somatosensory-cortex}}.',
        ],
      },
      does: {
        text: 'This strip issues movement orders. When you reach for a cup, its [[pyramidal cell|pyramidal cells]] fire the pattern for shoulder, elbow and fingers in order. It does not plan the reach, it sends it.\n\nCatching your keys shows the split. The {{posterior-parietal}} aims, the {{motor-cortex}} throws the switch.',
        bullets: [
          'Orders: fires the sequence that contracts muscles.',
          'Force and direction: sets how hard and where to push.',
          'Skill storage: with practice, patterns here run faster and cleaner.',
          'Talk and face: lower end drives lips, tongue and jaw.',
        ],
      },
      connects: {
        text: 'Arousal and corrections arrive from the {{thalamus}}. Touch updates are traded both ways with the {{somatosensory-cortex}}. Finished orders leave for the {{spinal-cord}} and a copy goes to the {{pons}} for the {{cerebellum}} to check.',
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
    tryIt: 'Tap each fingertip to your thumb in turn, faster and faster. The clean ordering you feel is this strip firing finger zones in sequence.',
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
    tagline: 'Turns thoughts into spoken sentences.',
    analogy: 'A careful builder who turns a pile of words into a sentence that stands up.',
    levels: {
      where: {
        text: 'Broca\'s area sits low on the left {{frontal-lobe}}, just above the temple and in front of the face zone of the {{motor-cortex}}. It is usually on the left only, even in many left handed people. It lies near areas that move the lips and tongue.',
        bullets: [
          'A patch a few centimetres across on the left side.',
          'Next to face and mouth motor zones, ready to speak.',
          'Linked by a long bundle to {{wernickes-area}} further back.',
        ],
      },
      does: {
        text: 'Broca\'s area assembles speech. It takes the meaning you want and orders the words and grammar so others can follow. It also helps with sign language and complex hand sequences.\n\nSaying "the dog I saw yesterday was huge" without pausing to plan each word is this area sequencing smoothly.',
        bullets: [
          'Word order: puts words into grammar that makes sense.',
          'Speech plan: strings mouth movements into fluent phrases.',
          'Understanding effort: helps with hard sentences, not just speaking.',
          'Gesture too: supports sign and meaningful hand movements.',
        ],
      },
      connects: {
        text: 'Meaning arrives both ways from {{wernickes-area}} through a long fibre bundle. The finished speech plan goes out to the {{motor-cortex}} mouth zone to be spoken.',
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
      text: 'Damage leaves understanding mostly intact but makes speech short and effortful.',
      bullets: [
        'Broca\'s aphasia: few words, missing grammar, but the meaning is clear.',
        'Frustration is common because people know what they want to say.',
        'Singing or swearing sometimes survives, using routes on the right side.',
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
    tagline: 'Touch, body sense and where things are in space.',
    analogy: 'A surveyor who keeps an updated map of your body and the space around it.',
    levels: {
      where: {
        text: 'The parietal lobe sits on top of the head, between the {{frontal-lobe}} in front and the {{occipital-lobe}} behind. The {{somatosensory-cortex}} forms its front edge, and the {{posterior-parietal}} fills the back. It meets vision, touch and movement streams in one place.',
        bullets: [
          'Top middle patch of [[cortex]], behind the central groove.',
          'Front half handles body feeling, back half handles space.',
          'Right side leans toward space, left side toward numbers and skilled moves.',
        ],
      },
      does: {
        text: 'The parietal lobe answers where. Where are my hands without looking. Where is the cup. Which way is left. It blends touch, sight and body position into one working map.\n\nReaching into a bag to find keys by feel alone is pure parietal. No vision, just touch mapped onto hand shape.',
        bullets: [
          'Body map: tracks where each body part is right now.',
          'Space map: guides reaches, looks and steps around objects.',
          'Numbers and order: left side helps with counting and sequences.',
          'Attention to space: right side notices things on both sides.',
        ],
      },
      connects: {
        text: 'Plans are traded both ways with the {{frontal-lobe}}. Fresh vision arrives from the {{occipital-lobe}}. Body touch is kept in sync both ways with the {{thalamus}}.',
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
    tagline: 'Where touch, temperature and pain from your body arrive.',
    analogy: 'A switchboard where every patch of skin has its own blinking light.',
    levels: {
      where: {
        text: 'This strip runs along the front of the {{parietal-lobe}}, directly behind the {{motor-cortex}} across the central groove. Like its motor neighbour it holds a map of the opposite side of the body. Lips, hands and fingers take up far more room than the back or legs.',
        bullets: [
          'A narrow strip from crown to ear, mirroring the motor strip.',
          'Four thin sub strips, each handling a different touch flavour.',
          'Both sides map the opposite half of the body.',
        ],
      },
      does: {
        text: 'It turns skin and joint signals into felt touch. Pressure, buzz, heat, cold and ache arrive separately and are combined here into "soft cat fur" or "rough denim". It also tells you where your joints are without looking.\n\nButtoning a shirt without looking shows it. You feel each button edge and hole line up through this strip.',
        bullets: [
          'Fine touch: reads texture, edges and shape for the hands.',
          'Body position: reports joint angles so you know limb places.',
          'Pain and temperature: flags harm and hot or cold.',
          'Two point sense: tells one poke from two close together.',
        ],
      },
      connects: {
        text: 'Fresh touch arrives from the {{thalamus}}. Movement and touch are compared both ways with the {{motor-cortex}}. The already read signal goes out to the {{posterior-parietal}} for reaching and grasping.',
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
    tagline: 'Builds a map of space so you can reach and look.',
    analogy: 'A sat nav that keeps "you are here" updated while you move.',
    levels: {
      where: {
        text: 'This is the back half of the {{parietal-lobe}}, sitting between the {{somatosensory-cortex}} in front and the {{visual-cortex}} behind. It takes the felt body and the seen world and lines them up. The right side is especially important for whole space.',
        bullets: [
          'Upper back patch of [[cortex]], one per side.',
          'Meets at the junction of touch, vision and movement streams.',
          'Right side maps both sides of space, left side is more precise for one.',
        ],
      },
      does: {
        text: 'It guides the eyes and hands to targets. Catching a ball uses it twice: once to track where the ball is heading, once to move your hand there. It also shifts attention, like glancing at a sudden flash while keeping your place on the page.\n\nPouring tea without spilling shows the quiet work. Eye, cup and pot stay lined up while the hand tilts.',
        bullets: [
          'Reaching: turns "I see it" into "hand go there".',
          'Looking: picks the next eye target and shifts attention.',
          'Grasping: shapes fingers to the seen size and angle.',
          'Routes: keeps track of turns when moving through rooms.',
        ],
      },
      connects: {
        text: 'Seen layout arrives from the {{visual-cortex}} and felt layout from the {{somatosensory-cortex}}. Space plans are traded both ways with the {{prefrontal-cortex}}. The agreed target goes out to the {{motor-cortex}} as a reach or look.',
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
    tagline: 'Hearing, language and recognising what things are.',
    analogy: 'A librarian who knows every face, tune and word by heart.',
    levels: {
      where: {
        text: 'The temporal lobe sits low on the side of the head, under the temples, below the {{frontal-lobe}} and {{parietal-lobe}} and in front of the {{occipital-lobe}}. It houses the {{auditory-cortex}}, much of {{wernickes-area}}, and the {{hippocampus}} and {{amygdala}} buried inside. Each side handles the opposite ear most strongly.',
        bullets: [
          'Side patch of [[cortex]] around and below the ear level.',
          'Top edge handles sound, bottom edge handles faces and objects.',
          'Inside edge holds the memory and feeling structures.',
        ],
      },
      does: {
        text: 'The temporal lobe identifies what you hear and see. A bark becomes "neighbour\'s dog", a face becomes "my friend". It also stores the vocabulary of things, so you can name them.\n\nRecognising a friend\'s face in a crowd before you recall their name is temporal. The "who is that" comes first, the name follows.',
        bullets: [
          'Hearing: turns tones into voices, music and words.',
          'Seeing who and what: recognises faces, objects and places.',
          'Language store: holds word meanings on the left side.',
          'Memory doorway: feeds daily life into the {{hippocampus}}.',
        ],
      },
      connects: {
        text: 'Object vision flows in from the {{occipital-lobe}}. Day to day records are traded both ways with the {{hippocampus}} and feelings both ways with the {{amygdala}}. Plans and speech are traded both ways with the {{frontal-lobe}}.',
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
    tagline: 'The first stop in the cortex for sound.',
    analogy: 'A sound engineer who splits incoming noise into pitch, timing and direction.',
    levels: {
      where: {
        text: 'The auditory [[cortex]] hides on the top of the {{temporal-lobe}}, tucked inside the fold above the ear. You would not see it from outside. It sits where fibres from the {{thalamus}} arrive, toned low to high like piano keys.',
        bullets: [
          'Small patch on the upper surface of the temporal lobe.',
          'Organised by pitch: high tones at one end, low at the other.',
          'Surrounded by wider zones that read voices and music.',
        ],
      },
      does: {
        text: 'It breaks raw sound into usable parts. Pitch, loudness, timing and which ear heard it first are pulled apart here. Later areas turn those parts into a voice you know or a word you understand.\n\nFollowing one friend\'s voice in a noisy cafe starts here. The split into pitches lets later areas lock onto that voice.',
        bullets: [
          'Pitch and loudness: maps how high and how strong each part is.',
          'Timing: spots gaps and rhythms that mark syllables.',
          'Direction: compares ears to place a sound left or right.',
          'Handoff: passes clean parts to {{wernickes-area}} and the {{amygdala}}.',
        ],
      },
      connects: {
        text: 'Fresh sound arrives from the {{thalamus}}. The decoded stream goes out to {{wernickes-area}} for words and to the {{amygdala}} for a quick emotional check (a scream gets flagged fast).',
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
    tagline: 'Helps you understand the words you hear and read.',
    analogy: 'A translator who turns sounds and letters back into meaning.',
    levels: {
      where: {
        text: 'Wernicke\'s area sits at the back of the left {{temporal-lobe}}, where sound and vision meet. It lies just behind the {{auditory-cortex}} and below the {{posterior-parietal}}. Most people use the left side for this job.',
        bullets: [
          'Back left patch where temporal meets parietal.',
          'Between hearing below and reading vision behind.',
          'Wired forward to {{brocas-area}} for speaking.',
        ],
      },
      does: {
        text: 'It links word forms to meanings. Hearing "keys" wakes the idea of keys, the look of them and where you leave them. Reading uses the same hub, reached through vision instead of hearing.\n\nNodding along to "please grab the blue mug" without thinking shows it. Sounds became objects and actions instantly.',
        bullets: [
          'Speech understanding: maps heard words onto ideas.',
          'Reading support: links seen words to the same ideas.',
          'Sentence sense: tracks who did what to whom.',
          'Word finding: helps pick the right word when speaking.',
        ],
      },
      connects: {
        text: 'Decoded sound arrives from the {{auditory-cortex}} and seen words from the {{visual-cortex}}. Meanings are traded both ways with {{brocas-area}} so understanding can become speech.',
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
      text: 'Damage leaves speech fluent but empty, because words lose their anchors.',
      bullets: [
        'Wernicke\'s aphasia: fluent speech that makes little sense, with poor understanding.',
        'Trouble naming everyday things, though they can still be used.',
        'Reading aloud stays smooth while comprehension drops.',
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
    tagline: 'The vision department at the back of your head.',
    analogy: 'A darkroom that develops the raw film from the eyes into pictures.',
    levels: {
      where: {
        text: 'The occipital lobe is the back tip of each [[hemisphere]], tucked under the skull behind the {{parietal-lobe}} and {{temporal-lobe}} and above the {{cerebellum}}. It is the smallest [[lobe]] but holds the whole {{visual-cortex}}. The left half handles the right side of sight, and vice versa.',
        bullets: [
          'Back pole of the brain, about a fist sized sheet per side.',
          'Folded around a deep groove (the calcarine [[sulcus]]).',
          'Slightly overhangs the {{cerebellum}} below it.',
        ],
      },
      does: {
        text: 'The occipital lobe builds the first picture. Edges, colours, motion and depth are pulled apart and reassembled here. Later areas name what it built.\n\nSpotting a friend\'s red coat across a busy station starts here. Colour and motion pop out before you know whose coat it is.',
        bullets: [
          'Early vision: reads edges, lines, colour and movement.',
          'Scene layout: maps where things sit relative to you.',
          'Depth and motion: blends both eyes for 3D and speed.',
          'Handoff: sends "where" to the {{parietal-lobe}} and "what" to the {{temporal-lobe}}.',
        ],
      },
      connects: {
        text: 'Fresh vision arrives from the {{thalamus}}. The built picture goes out to the {{parietal-lobe}} for reaching and to the {{temporal-lobe}} for recognising.',
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
    tagline: 'Breaks what you see into edges, lines and motion.',
    analogy: 'A prism that splits white light into separate colours, but for lines and movement.',
    levels: {
      where: {
        text: 'The visual [[cortex]] lines the deep groove at the very back of the {{occipital-lobe}}, mostly on the inner walls where the hemispheres face each other. It is thin (a few millimetres) but densely packed. The centre of sight gets far more room than the edges.',
        bullets: [
          'Back inner wall of [[cortex]], around the calcarine [[sulcus]].',
          'Each side maps the opposite half of sight, upside down.',
          'About half is devoted to the central few degrees you read with.',
        ],
      },
      does: {
        text: 'This strip reads the basics. Tiny patches of cells fire for one angle of line, one direction of motion or one colour pair. Together they tile the whole view.\n\nReading this sentence uses rows of them. Short vertical and curved pieces combine into letters before you notice.',
        bullets: [
          'Edges: reports which way each little line tilts.',
          'Motion: flags which way each patch is moving.',
          'Colour and depth: compares eyes and wavelengths.',
          'Assembly: passes the pieces up for objects and places.',
        ],
      },
      connects: {
        text: 'Raw sight arrives from the {{thalamus}}. Edge maps go out to the {{posterior-parietal}} for "where" and to the {{temporal-lobe}} for "what".',
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
    slice: true,
    tagline: 'Notices mistakes and conflict, and links feelings to action.',
    analogy: 'A supervisor who spots when the plan and the feelings disagree and calls a pause.',
    levels: {
      where: {
        text: 'The cingulate arches like a belt above the {{corpus-callosum}} on the inner wall of each [[hemisphere]]. It runs from the front (feelings and errors) to the back (memory and space). You only see it if you slice the brain down the middle.',
        bullets: [
          'C shaped strip on the medial wall, above the great bridge.',
          'Front half tied to feelings, back half tied to memory.',
          'One of the most connected hubs in the [[cortex]].',
        ],
      },
      does: {
        text: 'The cingulate tracks trouble. Conflict between habit and goal, a slip of the hand, or a sad memory with a decision to make all wake it. It then calls for more control or more care.\n\nTyping fast and hitting the wrong key shows the quick part. You notice instantly, pause and fix it. That "oops" signal is cingulate.',
        bullets: [
          'Error watch: flags slips and asks for a fix.',
          'Conflict check: notices when two answers compete.',
          'Feeling to action: links mood and pain to what you do next.',
          'Effort setting: decides if the goal is worth the push.',
        ],
      },
      connects: {
        text: 'Plans are traded both ways with the {{prefrontal-cortex}} and feelings both ways with the {{amygdala}}. Body news arrives from the {{thalamus}}. Memory instructions go out to the {{hippocampus}} to note what mattered.',
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
    tagline: 'Your sense of the inside of your body: heartbeat, hunger, disgust.',
    analogy: 'An inner weather station reporting how the body feels right now.',
    levels: {
      where: {
        text: 'The insula hides inside the fold where the {{temporal-lobe}} meets the lower {{frontal-lobe}}, one island per side. Ribbons of [[cortex]] from above fold over it like lips. It sits where taste, gut, heart and lung signals arrive.',
        bullets: [
          'Buried island about 5 cm long, unseen from outside.',
          'Front half tied to feelings, back half tied to body sense.',
          'Next door to the {{amygdala}} and taste [[cortex]].',
        ],
      },
      does: {
        text: 'The insula turns body signals into feelings you can act on. A fluttering heart becomes nerves, a full stomach becomes satisfaction, a bad smell becomes disgust. It also tastes and feels pain.\n\nNoticing your heart thump before speaking in public is insula. The beat was always there, now it reaches awareness.',
        bullets: [
          'Interoception: reports heartbeat, breath, hunger and fullness.',
          'Taste and disgust: flags spoiled food and moral "yuck".',
          'Pain and heat: marks how much it hurts, not just where.',
          'Empathy echo: wakes when you see someone else in pain.',
        ],
      },
      connects: {
        text: 'Body news arrives from the {{thalamus}}. Feelings are traded both ways with the {{amygdala}} and the {{cingulate-cortex}}. The read out goes to the {{prefrontal-cortex}} so plans can respect the body.',
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
