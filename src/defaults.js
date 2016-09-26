
export const INTERVAL = 60 * 60 * 1000;

export const DELAY = 1000;

export const REPEAT = 5;

export const NOW = Date.now.bind(Date);

export const SYNC_CALLBACK = function default_syncCallback(err) {
	if(err) {
		throw err;
	}
}