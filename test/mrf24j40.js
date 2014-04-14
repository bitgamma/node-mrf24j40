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
      });
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
      });
    });
  });
  
  describe('#writeControlRegister', function() {
    it('should read a ControlRegister with short address format', function(done) {
      var radio = new MRF24J40(hw);
      
      hw.setTransferCallback(function(txBuf, rxBuf, cb) {
        txBuf.should.deep.equal(new Buffer([0x25, 0xFA]));
        rxBuf.length.should.equal(2);
        cb();
      });
      
      radio.writeControlRegister(ControlRegister["ACKTMOUT"], 0xFA, function(value) {
        done();
      });
    });
  });
  
  describe('#writeControlRegister', function() {
    it('should write a ControlRegister with short address format', function(done) {
      var radio = new MRF24J40(hw);
      
      hw.setTransferCallback(function(txBuf, rxBuf, cb) {
        txBuf.should.deep.equal(new Buffer([0x25, 0xFA]));
        rxBuf.length.should.equal(2);
        cb();
      });
      
      radio.writeControlRegister(ControlRegister["ACKTMOUT"], 0xFA, function(value) {
        done();
      })
    });
    
    it('should write a ControlRegister with long address format', function(done) {
      var radio = new MRF24J40(hw);
      
      hw.setTransferCallback(function(txBuf, rxBuf, cb) {
        txBuf.should.deep.equal(new Buffer([0xC5, 0xF0, 0xAF]));
        rxBuf.length.should.equal(3);
        cb();
      });
      
      radio.writeControlRegister(ControlRegister["TESTMODE"], 0xAF, function(value) {
        done();
      });
    });
  });
  
  describe('#readFIFO', function() {
    it('should read multiple bytes from a FIFO from offset 0', function(done) {
      var radio = new MRF24J40(hw);
      
      hw.setTransferCallback(function(txBuf, rxBuf, cb) {
        txBuf.should.deep.equal(new Buffer([0xE0, 0x00, 0x00, 0x00]));
        rxBuf.length.should.equal(4);
        rxBuf[2] = 0xCA;
        rxBuf[3] = 0xFE;
        
        cb(rxBuf);
      });
      
      radio.readFIFO(FIFO["RX"], 0, 2, function(data) {
        data.should.deep.equal(new Buffer([0xCA, 0xFE]));
        done();
      });
    });
    
    it('should read multiple bytes from a FIFO from non-zero offset', function(done) {
      var radio = new MRF24J40(hw);
      
      hw.setTransferCallback(function(txBuf, rxBuf, cb) {
        txBuf.should.deep.equal(new Buffer([0xE0, 0x20, 0x00, 0x00]));
        rxBuf.length.should.equal(4);
        rxBuf[2] = 0xCA;
        rxBuf[3] = 0xFE;
        
        cb(rxBuf);
      });
      
      radio.readFIFO(FIFO["RX"], 1, 2, function(data) {
        data.should.deep.equal(new Buffer([0xCA, 0xFE]));
        done();
      });
    });
  });

  describe('#writeFIFO', function() {
    it('should write multiple bytes from a FIFO at offset 0', function(done) {
      var radio = new MRF24J40(hw);
      
      hw.setTransferCallback(function(txBuf, rxBuf, cb) {
        txBuf.should.deep.equal(new Buffer([0x80, 0x10, 0xCA, 0xFE]));
        rxBuf.length.should.equal(4);
        
        cb();
      });
      
      radio.writeFIFO(FIFO["TX"], 0, new Buffer([0xCA, 0xFE]), function(data) {
        done();
      });
    });
    
    it('should write multiple bytes from a FIFO at non-zero offset', function(done) {
      var radio = new MRF24J40(hw);
      
      hw.setTransferCallback(function(txBuf, rxBuf, cb) {
        txBuf.should.deep.equal(new Buffer([0x90, 0x30, 0xCA, 0xFE]));
        rxBuf.length.should.equal(4);
        
        cb();
      });
      
      radio.writeFIFO(FIFO["TXBEACON"], 1, new Buffer([0xCA, 0xFE]), function(data) {
        done();
      });
    });
  });
});
