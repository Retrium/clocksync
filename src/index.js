'use strict'

/**
 * Created by jasoncrider on 9/20/16.
 */
const stat = require('../lib/stat');

module.exports = function(opts) {
    if( typeof opts.sendRequest !== 'function') {
        throw new TypeError('You must set the sendRequest option');
    }
    if( typeof opts.syncCallback !== 'function' ) {
        throw new TypeError('You must set the syncCallback option');
    }

    //const causes conflicts even though it should be only scoped here.
    var options = Object.assign({}, {
        //defaults
        interval: 60 * 1000, //one hour
        timesToSend: 5,
        now: Date.now.bind(Date), //you can set your own now func if you want
        delay: 1000
    }, opts);

    let _interval = false;
    let results = [];
    let offset = 0;

    const calculateOffset = function(all) {
        var results = all.filter(result => result !== null);

        // calculate the limit for outliers
        var roundtrips = results.map(result => result.roundtrip);
        var limit = stat.median(roundtrips) + stat.std(roundtrips);

        // filter all results which have a roundtrip smaller than the mean+std
        var filtered = results.filter(result => result.roundtrip < limit);
        var offsets = filtered.map(result => result.offset);

        // return the new offset
        return (offsets.length > 0) ? stat.mean(offsets) : null;
    };

    const ClockSync = {
        start: function() {
            _interval = setInterval(function() {
                ClockSync.sync();
            }, options.interval);

            setTimeout(function() {
                ClockSync.sync();
            }, 0);
        },
        stop: function() {
            clearInterval(_interval);
        },
        sync: function(sent) {
            if(!sent) {
                sent = 0;
            }
            const rtStart = options.now();
            options.sendRequest(function(err, timestamp) {
                if(err) {
                    throw new Error(err);
                }
                if(!timestamp) {
                    //throw error or something
                    throw new Error('no timestamp!');
                }
                sent+=1;
                if(sent == options.timesToSend) {
                    offset = calculateOffset(results);
                    opts.syncCallback(null, offset);
                } else {
                    const rtEnd = options.now();
                    var roundtrip = rtEnd - rtStart;
                    results.push({
                        roundtrip: roundtrip,
                        offset: timestamp - rtEnd + roundtrip / 2
                    });
                    setTimeout(function() {
                        ClockSync.sync(sent);
                    }, options.delay);
                }
            })
        },
        now: function() {
            return options.now() + offset;
        },
        getOffset: function() {
            return offset;
        }
    };

    return ClockSync;
};