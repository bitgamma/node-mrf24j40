var events = require('events');

exports.ControlRegister = require('./control_registers');
exports.FIFO = require('./fifo');

exports.MRF24J40 = new MRF24J40(platformOrHW) {  
  if (platformOrHW typeof String) {
    var Hardware = require('./platforms/' + platformOrHW + '/hardware').Hardware;    
    this.hw = new Hardware();
  } else {
    this.hw = platformOrHW;
  }
  
  this.hw.on('interrupt', handleInterrupt.bind(this));
}

exports.MRF24J40.prototype.readControlRegister = function(controlRegister, cb) {
  
}

exports.MRF24J40.prototype.writeControlRegister = function(controlRegister, value, cb) {
  
}

exports.MRF24J40.prototype.readFIFO = function(fifo, buf, offset, count) {
  
}

exports.MRF24J40.prototype.writeFIFO = function(fifo, buf, offset, count) {
  
}

exports.MRF24J40.prototype.reset = function() {
  this.hw.writeReset(0, function(){
    this.hw.writeReset(1);
  }.bind(this));
}

util.inherits(exports.MRF24J40, events.EventEmitter);

function handleInterrupt() {
  //TODO: read the interrupt mask, emit interrupt-specific events and reset all interrupt
}
