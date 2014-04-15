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

exports.MRF24J40.prototype.readControlRegister = function(controlRegister) {
  var data = this._transferControlRegister(controlRegister, 0, false);
  return data.readUInt8(data.length - 1);
}

exports.MRF24J40.prototype.writeControlRegister = function(controlRegister, value) {
  this._transferControlRegister(controlRegister, value, true);  
}

exports.MRF24J40.prototype._transferControlRegister = function(controlRegister, value, write) {
  var idx = encodeAddress(this.txBuf, controlRegister.address, controlRegister.long, write);
  this.txBuf.writeUInt8(value, idx++);
  this.rxBuf.fill(0, 0, idx);
  
  return this.hw.transfer(this.txBuf.slice(0, idx), this.rxBuf.slice(0, idx));  
}

exports.MRF24J40.prototype.readFIFO = function(fifo, offset, count) {
  var idx = count + 2;
  this.txBuf.fill(0, 2, idx);  
  var data = this._transferFIFO(fifo, false, offset, idx);
  return data.slice(2, idx);
}

exports.MRF24J40.prototype.writeFIFO = function(fifo, offset, data) {
  var idx = data.length + 2;
  data.copy(this.txBuf, 2);  
  
  this._transferFIFO(fifo, true, offset, idx); 
}

exports.MRF24J40.prototype._transferFIFO = function(fifo, write, offset, idx) {
  encodeAddress(this.txBuf, fifo.address + offset, true, write);
  
  this.rxBuf.fill(0, 0, idx);
  return this.hw.transfer(this.txBuf.slice(0, idx), this.rxBuf.slice(0, idx));  
}

exports.MRF24J40.prototype.reset = function() {
  this.hw.writeReset(0);
  this.hw.writeReset(1);
}

exports.MRF24J40.prototype.initialize = function() {
  /*SOFTRST (0x2A) = 0x07 – Perform a software Reset. The bits will be automatically cleared to ‘0’ by hardware.
  2. PACON2 (0x18) = 0x98 – Initialize FIFOEN = 1 and TXONTS = 0x6.
  3. TXSTBL (0x2E) = 0x95 – Initialize RFSTBL = 0x9.
  4. RFCON0 (0x200) = 0x03 – Initialize RFOPT = 0x03.
  5. RFCON1 (0x201) = 0x01 – Initialize VCOOPT = 0x02.
  6. RFCON2 (0x202) = 0x80 – Enable PLL (PLLEN = 1).
  7. RFCON6 (0x206) = 0x90 – Initialize TXFIL = 1 and 20MRECVR = 1.
  8. RFCON7 (0x207) = 0x80 – Initialize SLPCLKSEL = 0x2 (100 kHz Internal oscillator).
  9. RFCON8 (0x208) = 0x10 – Initialize RFVCO = 1.
  10. SLPCON1(0x220)=0x21–InitializeCLKOUTEN=1andSLPCLKDIV=0x01.*/
  
}

function handleInterrupt() {
  this.readControlRegister(exports.ControlRegister['INTSTAT'], function(interruptValue) {
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
      handleTransmitInterrupt.call(this, exports.FIFO['TXGTS2']);
    }
    
    if ((interruptValue & 0x02) == 0x02) {
      handleTransmitInterrupt.call(this, exports.FIFO['TXGTS1']);
    }
    
    if ((interruptValue & 0x01) == 0x01) {
      handleTransmitInterrupt.call(this, exports.FIFO['TX']);
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
  this.writeControlRegister(exports.ControlRegister['BBREG1'], 0x04);
  //TODO: measure if it is faster to just dump the entire FIFO, or read the length and then only the needed bytes.
  var data = this.readFIFO(exports.FIFO['RX'], 0, exports.FIFO['RX'].size);
  this.writeControlRegister(exports.ControlRegister['BBREG1'], 0x00);
  var end = data.readUInt8(0) + 1;
  //TODO: do something with RSSI and LQI
  this.emit('packetReceived', data.slice(1, end));
}

function handleTransmitInterrupt(fifo) {
  
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
