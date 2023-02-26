export type ModalCancelationMode = 'clickOutside' | 'esc';
export interface ModalSettings {
	id: string;
	element: HTMLElement;
	/** Provide a function. Returns the repsonse value. */
	response?: (r: any, mode: ModalCancelationMode) => boolean;
}

export type ModalContentSettings =
	| {
			type: 'info';
			title?: string;
			message: string;
	  }
	| {
			type: 'confirm';
			title?: string;
			message: string;
	  }
	| {
			type: 'custom';
	  };
