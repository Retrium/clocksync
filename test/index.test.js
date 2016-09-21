/**
 * Created by jasoncrider on 9/21/16.
 */
var chai = require('chai');
var sinon = require('sinon');
var sinonChai = require('sinon-chai');
chai.should();
chai.use(sinonChai);

var ClockSync = require('../src')

describe('ClockSync', function() {
    var sandbox;
    beforeEach(function() {
        sandbox = sinon.sandbox.create();
        sandbox.stub(Date, 'now')
    });

    afterEach(function() {
        sandbox.restore();
    })

    it('should call sync() 5 times', function(done) {
        var cs = ClockSync({
            sendRequest: (cb) => {cb(false, 12345)}
        });
        sandbox.spy(cs, 'sync')
        cs.start();
        cs.on('syncComplete', function() {
            cs.sync.callCount.should.eql(5);
            done();
        });
    });

    /*
    This test isn't great because the way we're using the timeout
    makes it hard to control the timers without freezing up the sync() function.
    It really only asserts that we can pass in a function for now()
    and that if we force the offset to be 0 it'll always return what's in the passed in now() func
     */
    it('should return the correct time for now when passed in as a function', function(done) {
        Date.now.returns(1); //doing this lets us assume offset always is null
        var nowStr = 12345;
        var i = 1;
        var cs = ClockSync({
            sendRequest: (cb) => {
                cb(false, 12345)
            },
            now: () => {
                return nowStr;
            }
        })
        cs.start();
        cs.on('syncComplete', function() {
            cs.now().should.eql(nowStr);
            done();
        })
    })

    it('should return the correct time for now', function(done) {
        var nowStr = 12345;
        Date.now.returns(nowStr);
        var i = 1;
        var cs = ClockSync({
            sendRequest: (cb) => {
                cb(false, 12345)
            }
        })
        cs.start();
        cs.on('syncComplete', function() {
            cs.now().should.eql(nowStr);
            done();
        })
    })

    it('should emit an event when the sync starts', function(done) {
        var cs = ClockSync({
            sendRequest: (cb) => {
                cb(false, 12345)
            }
        })
        cs.on('started', function() {
            done();
        })
        cs.start();
    })

    it('should emit an event when sync ends', function(done) {
        var cs = ClockSync({
            sendRequest: (cb) => {
                cb(false, 12345)
            }
        })
        cs.on('stopped', function() {
            done();
        })
        cs.start();
        cs.stop();
    })
})