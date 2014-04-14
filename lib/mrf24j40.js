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

exports.MRF24J40.prototype.readFIFO = function(fifo, buf, offset, count, cb) {
  
}

exports.MRF24J40.prototype.writeFIFO = function(fifo, buf, offset, count, cb) {
  
}

exports.MRF24J40.prototype.reset = function() {
  this.hw.writeReset(0, function(){
    this.hw.writeReset(1);
  }.bind(this));
}

function handleInterrupt() {
  //TODO: read the interrupt mask, emit interrupt-specific events and reset all interrupt
}

function handleReadControlRegister(cb, data) {
  cb(data.readUInt8(data.length - 1));
}

function handleWriteControlRegister(cb, data) {
  cb();
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
