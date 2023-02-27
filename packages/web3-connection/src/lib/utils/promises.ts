type ResolveFunction<T> = (value: T) => unknown;
type RejectFunction = (err: unknown) => void;

export function createManageablePromise<T>(callbacks?: {
	onResolve: ResolveFunction<T>;
	onReject: RejectFunction;
}) {
	let _promise: Promise<T> | undefined;
	let _resolve: ResolveFunction<T> | undefined;
	let _reject: RejectFunction | undefined;
	function clear(): { reject: RejectFunction; resolve: ResolveFunction<T> } | undefined {
		if (_promise) {
			const past = { reject: _reject as RejectFunction, resolve: _resolve as ResolveFunction<T> };
			_promise = undefined;
			_resolve = undefined;
			_reject = undefined;
			return past;
		}
		return undefined;
	}
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
				clear()?.reject(err);
				callbacks?.onReject(err);
			}
			// TODO remove, not really errors
			// console.error(`no pending promise, cannot reject`);
		},
		resolve(value: T) {
			if (_resolve) {
				clear()?.resolve(value);
				callbacks?.onResolve(value);
			}
			// TODO remove, not really errors
			// console.error(`no pending promise, cannot resolve`);
		},
	};
}
