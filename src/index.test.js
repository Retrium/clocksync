import { test } from 'tape'

import ClockSync from './index'

function createMockSendRequest(server_now) {
	return function mockSendRequest(sync_id, cb) {
		// trip time in ms for the request to get to the server
		const time_to_server = Math.random() * 150 + 10;
		// trip time in ms for the response to get to the client
		const time_to_client = Math.random() * 150 + 10;

		// "send" request to server
		let _timeout = setTimeout( 
			() => {
				const server_time = server_now();
				// "send" response to client
				_timeout = setTimeout( 
					() => {
						cb(null, server_time)
					},
					time_to_client
				);
			},
			time_to_server
		);

		// allow clocksync to cancel the request
		return function dispose() {
			clearTiemout(_timeout);
		} 
	}
}

test('converges to an accurate approximation of the server time', function(t) {
	let expected_offset = Math.random() * 60*1000 + 10*1000;
	let sync_done_count = 0;
	function server_now() {
		return Date.now() + expected_offset;
	}
	const clock = ClockSync({
		interval: 1000,
		delay: 100,
		sendRequest: createMockSendRequest(server_now),
		syncCallback: (err, actual_offset, sync_done) => {
			if(err) {
				return t.end(err);
			}
			const percent_diff = Math.abs(expected_offset - actual_offset) / expected_offset;
			t.ok(
				percent_diff <= 0.01,
				`the approximate server time is within 1% of the actual server time. ${percent_diff*100}`,
				{
					actual: actual_offset,
					expected: expected_offset
				}
			);
			if( sync_done ) {
				sync_done_count++;
				expected_offset = Math.random() * 60*1000 + 10*1000;
				if( sync_done_count >= 2) {
					clock.stop();
					t.end();
				}
			}
		}
	})
	clock.start();
} )
