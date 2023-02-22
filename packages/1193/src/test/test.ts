import { init } from '../lib';
import { testEIP1193 } from './eip1193';
import { moreTests } from './moreTests';

// init(window);

// testEIP1193(window as WindowWithEthereum);

// moreTests(window as WindowWithEthereum);

(globalThis as any).init = () => init(window);
(globalThis as any).testEIP1193 = () => testEIP1193(window as WindowWithEthereum);
(globalThis as any).moreTests = () => moreTests(window as WindowWithEthereum);
