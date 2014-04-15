var events = require("events");
var util = require("util");

exports.Hardware = function() {
  this.reset = 1;
  this.wake = 0;
  this.interrupt = 1;
  this.transferCallback = null;
}

util.inherits(exports.Hardware, events.EventEmitter);

exports.Hardware.prototype.setTransferCallback = function(cb) {
  this.transferCallback = cb;
}

exports.Hardware.prototype.setExpected = function(response) {
  this.response = response;
}

exports.Hardware.prototype.triggerInterrupt = function() {
  this.interrupt = 0;
  this.emit('interrupt');
}

exports.Hardware.prototype.clearInterrupt = function() {
  this.interrupt = 1;
}

exports.Hardware.prototype.transfer = function(txBuf, rxBuf) {
  this.transferCallback(txBuf, rxBuf);
  return rxBuf;
}

exports.Hardware.prototype.writeReset = function(value) {
  this.reset = value;
}

exports.Hardware.prototype.writeWake = function(value) {
  this.wake = value;
}

exports.Hardware.prototype.readInterrupt = function() {
  return this.interrupt;
}
