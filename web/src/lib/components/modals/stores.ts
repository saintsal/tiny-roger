// Modal Store Queue

import { writable } from 'svelte/store';
import type { ModalSettings } from './types';

function modalService() {
	const { subscribe, set, update } = writable<ModalSettings[]>([]);
	return {
		subscribe,
		set,
		update,
		/** Append to end of queue. */
		trigger: (modal: ModalSettings) => {
			console.log(`trigger modal`);
			update((mStore) => {
				mStore.unshift(modal);
				return mStore;
			});
		},

		/**  Remove first item in queue. */
		close: () => {
			console.log(`close modal`);
			update((mStore) => {
				if (mStore.length > 0) mStore.shift();
				return mStore;
			});
		},
		/** Remove all items from queue. */
		clear: () => set([]),
	};
}

export const modalStore = modalService();

if (typeof window !== 'undefined') {
	(window as any).modalStore = modalStore;
}
