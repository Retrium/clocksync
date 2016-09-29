# ClockSync

Time synchronization between peers.

## Usage

ClockSync client can connect to a server and sync the client time with the server's time
```js

const clock = ClockSync({
    sendRequest: function( sync_id, cb) {
        request
            .get('/timestamp') //point this to whatever 
            .end(function(err, res) {
                if(!err && res.body && res.body.server_time) {
                    cb(null, res.body.server_time)
                } else {
                    //notify airbrake
                    cb(err, res);
                }
            })
    }
});
clock.sync();


```

For the ClockSync server you just need to provide the timestamp. Since you pass in the transort method,
it's up to you what this looks like. As long as you provide a timestamp from the server, it will work.

## Options

The following options are available:

**sendRequest**: `function( sync_count, callback(error, timestamp))`
This is the transport function that gets called whenever you sync with the server.
Whenever your transport method finishes, run the callback with the error and timestamp arguments.

**now**: `function`
You can pass a custom function to get the current system timestamp into ClockSync if you want.

**interval**: `number`
The time (ms) that will elapse between synchronizations with the server.

**delay**: `number`
The delay (ms) between calls to the server during synchronization.

**repeat**: `number`
How many times to call the server during the synchronization step.

## Methods

**start**
Starts the sync, and will run the sync at the specified interval

**stop**
Stops sync

**now**
Returns the approximated server time

**getOffset**
Returns the offset from your time

## Algorithm

`ClockSync` uses a simple synchronization protocol aimed at the gaming industry, and extends this for peer-to-peer networks. The algorithm is described [here](A Stream-based Time Synchronization Technique For Networked Computer Games):
The algorithm used in ClockSync is the same one implemented in the `timesync` library: [https://github.com/enmasseio/timesync](https://github.com/enmasseio/timesync)

> A simple algorithm with these properties is as follows:
>
> 1. Client stamps current local time on a "time request" packet and sends to server
> 2. Upon receipt by server, server stamps server-time and returns
> 3. Upon receipt by client, client subtracts current time from sent time and divides by two to compute latency. It subtracts current time from server time to determine client-server time delta and adds in the half-latency to get the correct clock delta. (So far this algothim is very similar to SNTP)
> 4. The first result should immediately be used to update the clock since it will get the local clock into at least the right ballpark (at least the right timezone!)
> 5. The client repeats steps 1 through 3 five or more times, pausing a few seconds each time. Other traffic may be allowed in the interim, but should be minimized for best results
> 6. The results of the packet receipts are accumulated and sorted in lowest-latency to highest-latency order. The median latency is determined by picking the mid-point sample from this ordered list.
> 7. All samples above approximately 1 standard-deviation from the median are discarded and the remaining samples are averaged using an arithmetic mean.

This algorithm assumes multiple clients synchronizing with a single server. In case of multiple peers, `ClockSync` will take the average offset of all peers (excluding itself) as offset.
