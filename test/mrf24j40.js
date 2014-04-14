describe('MRF24J40', function() {
  var chai = require('chai');
  var EventEmitter = require('events').EventEmitter;
  var Hardware = require('./hardware').Hardware;
  var mrf24j40 = require('../lib/mrf24j40.js');
  var MRF24J40 = mrf24j40.MRF24J40;
  var ControlRegister = mrf24j40.ControlRegister;
  var FIFO = mrf24j40.FIFO;

  chai.should();

  var hw = new Hardware();

  describe('#MRF24J40', function() {
    it('should return an instance of MRF24J40', function() {
      var radio = new MRF24J40(hw);
      radio.should.be.instanceof(EventEmitter);
    });
  });
  
  describe('#readControlRegister', function() {
    it('should read a ControlRegister with short address format', function(done) {
      var radio = new MRF24J40(hw);
      
      hw.setTransferCallback(function(txBuf, rxBuf, cb) {
        txBuf.should.deep.equal(new Buffer([0x30, 0x00]));
        rxBuf.length.should.equal(2);
        rxBuf[1] = 0xCA;
        cb(rxBuf);
      });
      
      radio.readControlRegister(ControlRegister["PACON2"], function(value) {
        value.should.equal(0xCA);
        done();
      })
    });
  });
  
  describe('#readControlRegister', function() {
    it('should read a ControlRegister with long address format', function(done) {
      var radio = new MRF24J40(hw);
      
      hw.setTransferCallback(function(txBuf, rxBuf, cb) {
        txBuf.should.deep.equal(new Buffer([0xC4, 0x80, 0x00]));
        rxBuf.length.should.equal(3);
        rxBuf[2] = 0xAC;
        cb(rxBuf);
      });
      
      radio.readControlRegister(ControlRegister["REMCNTL"], function(value) {
        value.should.equal(0xAC);
        done();
      })
    });
  });
  
  describe('#writeControlRegister', function() {
    it('should read a ControlRegister with short address format', function(done) {
      var radio = new MRF24J40(hw);
      
      hw.setTransferCallback(function(txBuf, rxBuf, cb) {
        txBuf.should.deep.equal(new Buffer([0x25, 0xfa]));
        rxBuf.length.should.equal(2);
        cb();
      });
      
      radio.writeControlRegister(ControlRegister["ACKTMOUT"], 0xfa, function(value) {
        done();
      })
    });
  });
  
  describe('#writeControlRegister', function() {
    it('should write a ControlRegister with short address format', function(done) {
      var radio = new MRF24J40(hw);
      
      hw.setTransferCallback(function(txBuf, rxBuf, cb) {
        txBuf.should.deep.equal(new Buffer([0x25, 0xfa]));
        rxBuf.length.should.equal(2);
        cb();
      });
      
      radio.writeControlRegister(ControlRegister["ACKTMOUT"], 0xfa, function(value) {
        done();
      })
    });
    
    it('should write a ControlRegister with long address format', function(done) {
      var radio = new MRF24J40(hw);
      
      hw.setTransferCallback(function(txBuf, rxBuf, cb) {
        txBuf.should.deep.equal(new Buffer([0xC5, 0xf0, 0xaf]));
        rxBuf.length.should.equal(3);
        cb();
      });
      
      radio.writeControlRegister(ControlRegister["TESTMODE"], 0xaf, function(value) {
        done();
      })
    });
  });
});
