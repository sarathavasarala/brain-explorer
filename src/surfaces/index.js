import activity from './activity.js';
import quantity from './quantity.js';
import wiring from './wiring.js';
import machinery from './machinery.js';
import model from './model.js';
import receptor from './receptor.js';
import integration from './integration.js';
import actionPotential from './action-potential.js';
import rhythms from './rhythms.js';
import contrast from './contrast.js';
import plasticity from './plasticity.js';

export const surfaces = {
  activity,
  quantity,
  wiring,
  machinery,
  model,
  receptor,
  integration,
  'action-potential': actionPotential,
  actionPotential,
  rhythms,
  contrast,
  plasticity,
};

export default surfaces;
