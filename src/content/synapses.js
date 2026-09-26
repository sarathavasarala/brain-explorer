// Chemical messengers. A structure's `levels.cells.synapse` points at one of these ids,
// and the explainer draws an animated synapse for it.
//   effect: 'excite' (makes the next cell more likely to fire),
//           'inhibit' (less likely), or 'modulate' (changes how it responds over time)
export default {
  glutamate: {
    name: 'Glutamate',
    color: '#ffcf6b',
    effect: 'excite',
    receptors: ['AMPA', 'NMDA'],
    blurb: 'The brain\'s main "go" signal. Most fast communication between neurons uses it.',
  },
  gaba: {
    name: 'GABA',
    color: '#ff6b7d',
    effect: 'inhibit',
    receptors: ['GABA-A', 'GABA-B'],
    blurb: 'The main "stop" signal. It quiets the cell that receives it.',
  },
  dopamine: {
    name: 'Dopamine',
    color: '#b98cff',
    effect: 'modulate',
    receptors: ['D1', 'D2'],
    blurb: 'Signals "that was better than expected" and tunes how strongly other inputs work.',
  },
  serotonin: {
    name: 'Serotonin',
    color: '#6be4ff',
    effect: 'modulate',
    receptors: ['5-HT1', '5-HT2'],
    blurb: 'Broadcast from the brainstem; shapes mood, sleep and appetite.',
  },
  noradrenaline: {
    name: 'Noradrenaline',
    color: '#7dffb2',
    effect: 'modulate',
    receptors: ['α', 'β'],
    blurb: 'Sets alertness. Surges when something surprising or urgent happens.',
  },
  acetylcholine: {
    name: 'Acetylcholine',
    color: '#ffa36b',
    effect: 'excite',
    receptors: ['Nicotinic', 'Muscarinic'],
    blurb: 'Makes muscles contract, and helps attention inside the brain.',
  },
  oxytocin: {
    name: 'Oxytocin',
    color: '#ff9fd1',
    effect: 'modulate',
    receptors: ['OXTR'],
    blurb: 'A hormone and messenger linked to bonding, trust and birth.',
  },
};
