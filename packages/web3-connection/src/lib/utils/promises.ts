type ResolveFunction<T> = (value: T) => unknown;
type RejectFunction = (err: unknown) => void;

export function createManageablePromise<T>() {
	let _promise: Promise<T> | undefined;
	let _resolve: ResolveFunction<T> | undefined;
	let _reject: RejectFunction | undefined;
	return {
		promise(execute?: (resolve: ResolveFunction<T>, reject: RejectFunction) => void) {
			if (_promise) {
				return _promise;
			}
			_promise = new Promise((resolve, reject) => {
				_resolve = resolve;
				_reject = reject;
				if (execute) {
					execute(_resolve, _reject);
				}
			});
			return _promise;
		},
		reject(err: unknown) {
			if (_reject) {
				_reject(err);
			}
			throw new Error(`no pending promise, cannot reject`);
		},
		resolve(value: T) {
			if (_resolve) {
				_resolve(value);
			}
			throw new Error(`no pending promise, cannot resolve`);
		},
	};
}
