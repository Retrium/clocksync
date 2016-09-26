import { median, std, mean } from './stat'
import { SYNC_CALLBACK, INTERVAL, DELAY, REPEAT, NOW } from './defaults'

/**
 * Let's synchronize our clocks!  ClockSync will continuously keep a client's clock
 *  synchronized with the server's clock.
 */
export default function ClockSync({
	sendRequest,
	syncCallback = SYNC_CALLBACK,
	interval = INTERVAL,
	delay = DELAY,
	repeat = REPEAT,
	now = NOW
}) {
	if( typeof sendRequest !== 'function') {
		throw new TypeError(`ClockSync: expected sendRequest to be a function but was ${typeof sendRequest}`);
	}
	if( typeof syncCallback !== 'function' ) {
		throw new TypeError(`ClockSync: expected syncCallback to be a function but was ${typeof syncCallback}`);
	}
	if( typeof interval !== 'number' && interval >= 0	) {
		throw new TypeError('ClockSync: interval must be a positive number');
	}
	if( typeof delay !== 'number' && delay <= interval) {
		throw new TypeError('ClockSync: delay must be a positive number no greater than interval');
	}
	if( typeof repeat !== 'number' && repeat >= 1 ) {
		throw new TypeError('ClockSync: repeat must be a postitive number no smaller than 1');
	}
	if( typeof now !== 'function' ) {
		throw new TypeError('ClockSync: now must be a function');
	}

	let _syncing = false;
	let _sync_count = -1;
	let _timeout_id = null;
	let _results = [];
	let _offset = 0;
	let _sync_complete = false;
	let _time_of_sync = null;

	/*
	 * there's a whole bunch of nasty side effects
	 */
	function _perform_nasty_side_effects(new_result) {
		const results = _results.slice();
		if(results.length >= repeat) {
			results.shift();
		}
		results.push(new_result);
		// calculate the limit for outliers
		const roundtrips = results.map(result => result.roundtrip);
		const roundtrip_limit = median(roundtrips) + std(roundtrips);

		// filter all results which have a roundtrip smaller than the mean+std
		const filtered = results.filter(result => result.roundtrip < roundtrip_limit);
		const offsets = filtered.map(result => result.offset);

		const has_new_offset = offsets.length > 0;

		_sync_count += 1;

		_offset = has_new_offset 
			? mean(offsets) 
			: _offset;

		_sync_complete = results.length >= repeat;
		if(has_new_offset) {
			_time_of_sync = _now();
		}
		_results = results;

		return has_new_offset;
	}

	function _sync() {
		_timeout_id = null;
		if( !_syncing ) return;
		if(_sync_complete) {
			_results = [];
			_sync_complete = false;
		}
		let has_new_offset = false;
		try {
			const sync_start_time = now();
			sendRequest( _sync_count, (err, server_timestamp) => {
				if( !_syncing ) return;
				if(err) {
					syncCallback(err);
				}
				if( server_timestamp <= 0 ) {
					syncCallback( new Error(`ClockSync: the timestamp from the server must be a postiive number (${server_timestamp})`) );
				}
				try {
					const sync_end_time = now();
					const roundtrip = sync_end_time - sync_start_time;
					const result = {
						roundtrip: roundtrip,
						offset: server_timestamp - sync_end_time + roundtrip / 2
					};
					has_new_offset = _perform_nasty_side_effects(result);
					_timeout_id = setTimeout(_sync, _sync_complete ? interval : delay);
				} catch (err) {
					syncCallback(err);
				}
				if( has_new_offset ) {
					syncCallback(null, _offset, _sync_complete);
				}
			} )
		} catch (err) {
			syncCallback(err);
		}
	}

	function _now() {
		return now() + _offset;
	}

	return {
		start() {
			if(_syncing) {
				throw new Error('ClockSync: cannot call ClockSync.start() on an already synchronizing clock.');
			}
			_syncing = true;
			if( _sync_complete ) {
				const time_since_last_sync = _now() - _time_of_sync;
				// if more time has elapsed since we last synchronized
				//  then lets sync right now
				if( interval > time_since_last_sync ) {
					_timeout_id = setTimeout(_sync, 0);
				} else {
					_timeout_id = setTimeout(_sync, interval - time_since_last_sync);
				}
			} else {
				// sync right now
				_timeout_id = setTimeout(_sync, 0);
			}
		},
		stop() {
			if(!_syncing) {
				throw new Error('ClockSync: cannot call ClockSync.stop() on an clock that is not synchronizing.');
			}
			_syncing = false;
			clearTimeout(_timeout_id);
		},
		now: _now,
		get offset() {
			return _offset;
		},
		get isSyncing() {
			return _syncing;
		},
	};
};

