import excitatory from './excitatory.js';
import inhibitory from './inhibitory.js';
import modulatory from './modulatory.js';
import glia from './glia.js';

const cells = [...excitatory, ...inhibitory, ...modulatory, ...glia];
export default cells;
