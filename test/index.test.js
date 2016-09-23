var test = require('tape').test;

var ClockSync = require('../src')

test('should give us an accurate offset', function(t) {
    const expected_offset = Math.random() * 10000;
    const cs = ClockSync({
        delay: 1000,
        sendRequest: cb => {
            // trip time in ms for the request to get to the server
            const time_to_server = Math.random() * 150 + 10;
            // trip time in ms for the response to get to the client
            const time_to_client = Math.random() * 150 + 10;
            setTimeout( () => {
                const server_time = Date.now() + expected_offset + Math.random() * 100;
                setTimeout( () => {
                    cb(null, server_time)
                }, time_to_client );
            }, time_to_server ); 
        },
        syncCallback: (err, measured_offset) => {
            if(err) {
                return t.end(err);
            }
            t.ok( 
                Math.abs(expected_offset - measured_offset) <= expected_offset * 0.01,
                `the measured offset (${measured_offset}) is within 1% of the expected offset (${expected_offset})`
            )
            cs.stop();
            t.end();

        }
    })
    cs.start();
} )