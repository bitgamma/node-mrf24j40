var events = require('events');
var util = require('util');

exports.ControlRegister = require('./control_registers');
exports.FIFO = require('./fifo');

exports.MRF24J40 = function(platformOrHW) {  
  this.txBuf = new Buffer(146);
  this.rxBuf = new Buffer(146);
  
  if (typeof platformOrHW === 'string') {
    var Hardware = require('./platforms/' + platformOrHW + '/hardware').Hardware;    
    this.hw = new Hardware();
  } else {
    this.hw = platformOrHW;
  }
  
  this.hw.on('interrupt', handleInterrupt.bind(this));
}

util.inherits(exports.MRF24J40, events.EventEmitter);

exports.MRF24J40.prototype.readControlRegister = function(controlRegister, cb) {
  this._transferControlRegister(controlRegister, 0, false, handleReadControlRegister.bind(this, cb));
}

exports.MRF24J40.prototype.writeControlRegister = function(controlRegister, value, cb) {
  this._transferControlRegister(controlRegister, value, true, handleWriteControlRegister.bind(this, cb));  
}

exports.MRF24J40.prototype._transferControlRegister = function(controlRegister, value, write, cb) {
  var idx = encodeAddress(this.txBuf, controlRegister.address, controlRegister.long, write);
  this.txBuf.writeUInt8(value, idx++);
  this.rxBuf.fill(0, 0, idx);
  
  this.hw.transfer(this.txBuf.slice(0, idx), this.rxBuf.slice(0, idx), cb);  
}

exports.MRF24J40.prototype.readFIFO = function(fifo, offset, count, cb) {
  var idx = count + 2;
  this.txBuf.fill(0, 2, idx);  
  this._transferFIFO(fifo, false, offset, idx, handleReadFIFO.bind(this, idx, cb));
}

exports.MRF24J40.prototype.writeFIFO = function(fifo, offset, data, cb) {
  var idx = data.length + 2;
  data.copy(this.txBuf, 2);  
  
  this._transferFIFO(fifo, true, offset, idx, handleWriteFIFO.bind(this, cb)); 
}

exports.MRF24J40.prototype._transferFIFO = function(fifo, write, offset, idx, cb) {
  encodeAddress(this.txBuf, fifo.address + offset, true, write);
  
  this.rxBuf.fill(0, 0, idx);
  this.hw.transfer(this.txBuf.slice(0, idx), this.rxBuf.slice(0, idx), cb);  
}

exports.MRF24J40.prototype.reset = function() {
  this.hw.writeReset(0, function(){
    this.hw.writeReset(1);
  }.bind(this));
}

function handleInterrupt() {
  this.readControlRegister(exports.ControlRegister["INTSTAT"], function(interruptValue) {
    if ((interruptValue & 0x80) == 0x80) {
      handleSleepInterrupt.call(this);
    }
    
    if ((interruptValue & 0x40) == 0x40) {
      handleWakeInterrupt.call(this);
    }
    
    if ((interruptValue & 0x20) == 0x20) {
      handleHalfSymbolTimerInterrupt.call(this);
    }
    
    if ((interruptValue & 0x10) == 0x10) {
      handleSecurityKeyRequestInterrupt.call(this);
    }
    
    if ((interruptValue & 0x08) == 0x08) {
      handleReceiveInterrupt.call(this);
    }
    
    if ((interruptValue & 0x04) == 0x04) {
      handleTransmitInterrupt.call(this, exports.FIFO["TXGTS2"]);
    }
    
    if ((interruptValue & 0x02) == 0x02) {
      handleTransmitInterrupt.call(this, exports.FIFO["TXGTS1"]);
    }
    
    if ((interruptValue & 0x01) == 0x01) {
      handleTransmitInterrupt.call(this, exports.FIFO["TX"]);
    }
  }.bind(this));  
}

function handleSleepInterrupt() {
  
}

function handleWakeInterrupt() {
  
}

function handleHalfSymbolTimerInterrupt() {
  
}

function handleSecurityKeyRequestInterrupt() {
  
}

function handleReceiveInterrupt() {
  
}

function handleTransmitInterrupt(fifo) {
  
}

function handleReadControlRegister(cb, data) {
  cb(data.readUInt8(data.length - 1));
}

function handleWriteControlRegister(cb, data) {
  cb();
}

function handleReadFIFO(idx, cb, data) {
  cb(data.slice(2, idx))
}

function handleWriteFIFO(cb) {
  cb()
}

function encodeAddress(buf, address, longFormat, write) {
  return longFormat ? encodeLongAddress(buf, address, write) : encodeShortAddress(buf, address, write);
}

function encodeLongAddress(buf, address, write) {
  address = (address | 0x400) << 1;
  
  if (write) {
    address = address | 0x01
  }
  
  address = address << 4;
  
  buf.writeUInt16BE(address, 0);
  
  return 2;
}

function encodeShortAddress(buf, address, write) {
  address = address << 1;
  
  if (write) {
    address = address | 0x01;
  }
  
  buf.writeUInt8(address, 0);
  
  return 1;
}
