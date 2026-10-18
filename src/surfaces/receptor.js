import { mountReceptorFamilies } from './receptor-families.js';
import { mountReceptorKinetics } from './receptor-kinetics.js';
import { mountReceptorCurves, mountReceptorModulation } from './receptor-curves.js';
import { mountReceptorEnzyme, mountReceptorNuclear } from './receptor-slow.js';
import { mountReceptorTolerance } from './receptor-tolerance.js';

export default {
  type: 'receptor',

  mount(container, props = {}, ctx = {}) {
    const kind = props.kind || 'families';
    if (kind === 'kinetics') return mountReceptorKinetics(container, props, ctx);
    if (kind === 'dose-response') return mountReceptorCurves(container, props, ctx);
    if (kind === 'modulation') return mountReceptorModulation(container, props, ctx);
    if (kind === 'enzyme') return mountReceptorEnzyme(container, props, ctx);
    if (kind === 'nuclear') return mountReceptorNuclear(container, props, ctx);
    if (kind === 'tolerance') return mountReceptorTolerance(container, props, ctx);
    return mountReceptorFamilies(container, props, ctx);
  },
};
