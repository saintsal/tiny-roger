export interface ModalSettings {
	id: string;
	element: HTMLElement;
	/** Provide a function. Returns the repsonse value. */
	response?: (r: any) => boolean;
}
