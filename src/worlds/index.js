import * as rpe from './rpe.js';
import * as receptor from './receptor.js';
import * as integration from './integration.js';
import * as actionPotential from './action-potential.js';
import * as rhythms from './rhythms.js';
import * as contrast from './contrast.js';
import * as plasticity from './plasticity.js';

export const worlds = {
  rpe,
  receptor,
  integration,
  'action-potential': actionPotential,
  actionPotential,
  rhythms,
  contrast,
  plasticity,
};

export default worlds;
