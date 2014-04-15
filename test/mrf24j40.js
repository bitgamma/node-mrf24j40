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
    it('should read a ControlRegister with short address format', function() {
      var radio = new MRF24J40(hw);
      
      hw.setTransferCallback(function(txBuf, rxBuf) {
        txBuf.should.deep.equal(new Buffer([0x30, 0x00]));
        rxBuf.length.should.equal(2);
        rxBuf[1] = 0xCA;
      });
      
      var value = radio.readControlRegister(ControlRegister["PACON2"]);
      value.should.equal(0xCA);
    });
  });
  
  describe('#readControlRegister', function() {
    it('should read a ControlRegister with long address format', function() {
      var radio = new MRF24J40(hw);
      
      hw.setTransferCallback(function(txBuf, rxBuf) {
        txBuf.should.deep.equal(new Buffer([0xC4, 0x80, 0x00]));
        rxBuf.length.should.equal(3);
        rxBuf[2] = 0xAC;
      });
      
      var value = radio.readControlRegister(ControlRegister["REMCNTL"]);
      value.should.equal(0xAC);
    });
  });
  
  describe('#writeControlRegister', function() {
    it('should write a ControlRegister with short address format', function() {
      var radio = new MRF24J40(hw);
      
      hw.setTransferCallback(function(txBuf, rxBuf) {
        txBuf.should.deep.equal(new Buffer([0x25, 0xFA]));
        rxBuf.length.should.equal(2);
      });
      
      radio.writeControlRegister(ControlRegister["ACKTMOUT"], 0xFA);
    });
    
    it('should write a ControlRegister with long address format', function() {
      var radio = new MRF24J40(hw);
      
      hw.setTransferCallback(function(txBuf, rxBuf) {
        txBuf.should.deep.equal(new Buffer([0xC5, 0xF0, 0xAF]));
        rxBuf.length.should.equal(3);
      });
      
      radio.writeControlRegister(ControlRegister["TESTMODE"], 0xAF);
    });
  });
  
  describe('#readFIFO', function() {
    it('should read multiple bytes from a FIFO from offset 0', function() {
      var radio = new MRF24J40(hw);
      
      hw.setTransferCallback(function(txBuf, rxBuf) {
        txBuf.should.deep.equal(new Buffer([0xE0, 0x00, 0x00, 0x00]));
        rxBuf.length.should.equal(4);
        rxBuf[2] = 0xCA;
        rxBuf[3] = 0xFE;
      });
      
      var data = radio.readFIFO(FIFO["RX"], 0, 2);
      data.should.deep.equal(new Buffer([0xCA, 0xFE]));
    });
    
    it('should read multiple bytes from a FIFO from non-zero offset', function() {
      var radio = new MRF24J40(hw);
      
      hw.setTransferCallback(function(txBuf, rxBuf) {
        txBuf.should.deep.equal(new Buffer([0xE0, 0x20, 0x00, 0x00]));
        rxBuf.length.should.equal(4);
        rxBuf[2] = 0xCA;
        rxBuf[3] = 0xFE;
      });
      
      var data = radio.readFIFO(FIFO["RX"], 1, 2);
      data.should.deep.equal(new Buffer([0xCA, 0xFE]));
    });
  });

  describe('#writeFIFO', function() {
    it('should write multiple bytes from a FIFO at offset 0', function() {
      var radio = new MRF24J40(hw);
      
      hw.setTransferCallback(function(txBuf, rxBuf) {
        txBuf.should.deep.equal(new Buffer([0x80, 0x10, 0xCA, 0xFE]));
        rxBuf.length.should.equal(4);
      });
      
      radio.writeFIFO(FIFO["TX"], 0, new Buffer([0xCA, 0xFE]));
    });
    
    it('should write multiple bytes from a FIFO at non-zero offset', function() {
      var radio = new MRF24J40(hw);
      
      hw.setTransferCallback(function(txBuf, rxBuf) {
        txBuf.should.deep.equal(new Buffer([0x90, 0x30, 0xCA, 0xFE]));
        rxBuf.length.should.equal(4);
      });
      
      radio.writeFIFO(FIFO["TXBEACON"], 1, new Buffer([0xCA, 0xFE]));
    });
  });
});
