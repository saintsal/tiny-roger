import { get, writable } from 'svelte/store';

export type ServiceWorkerState = {
	registration?: ServiceWorkerRegistration;
	updateAvailable: boolean;
};

const store = writable<ServiceWorkerState>({ registration: undefined, updateAvailable: false });
export const serviceWorker = {
	...store,
	get registration(): ServiceWorkerRegistration | undefined {
		return get(store).registration;
	},
	get updateAvailable(): boolean {
		return get(store).updateAvailable;
	},
};
