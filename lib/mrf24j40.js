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

exports.MRF24J40.prototype.resetRFStateMachine = function() {
  var rfctl = this.readControlRegister(exports.ControlRegister['RFCTL']);
  
  this.writeControlRegister(exports.ControlRegister['RFCTL'], (rfctl | 0x04));
  this.writeControlRegister(exports.ControlRegister['RFCTL'], (rfctl & 0xFB));
}

exports.MRF24J40.prototype.initialize = function() {
  // Initialization according datasheet example for non-beacon networks
  this.writeControlRegister(exports.ControlRegister['SOFTRST'], 0x07);
  this.writeControlRegister(exports.ControlRegister['PACON2'], 0x98);
  this.writeControlRegister(exports.ControlRegister['TXSTBL'], 0x95);
  this.writeControlRegister(exports.ControlRegister['RFCON1'], 0x01);
  this.writeControlRegister(exports.ControlRegister['RFCON2'], 0x80);
  this.writeControlRegister(exports.ControlRegister['RFCON3'], 0x00);
  this.writeControlRegister(exports.ControlRegister['RFCON6'], 0x90);
  this.writeControlRegister(exports.ControlRegister['RFCON7'], 0x80);
  this.writeControlRegister(exports.ControlRegister['RFCON8'], 0x10);
  this.writeControlRegister(exports.ControlRegister['SLPCON1'], 0x21);

  // Non-beacon
  this.writeControlRegister(exports.ControlRegister['BBREG2'], 0x80);
  this.writeControlRegister(exports.ControlRegister['CCAEDTH'], 0x60);
  this.writeControlRegister(exports.ControlRegister['BBREG6'], 0x40);

  // Enabled: SECIE, RXIE, TXNIE
  this.writeControlRegister(exports.ControlRegister['INTCON'], 0xE6);
  
  // Flush RX FIFO
  this.writeControlRegister(exports.ControlRegister['RXFLUSH'], 0x01);
}

exports.MRF24J40.prototype.setPANCoordinator = function() {
  var rxmcr = this.readControlRegister(exports.ControlRegister['RXMCR']);
  this.writeControlRegister(exports.ControlRegister['RXMCR'], (rxmcr | 0x08));
}

exports.MRF24J40.prototype.clearPANCoordinator = function() {
  var rxmcr = this.readControlRegister(exports.ControlRegister['RXMCR']);
  this.writeControlRegister(exports.ControlRegister['RXMCR'], (rxmcr & 0xF7));
}

exports.MRF24J40.prototype.setPANID = function(panID) {
  this.writeControlRegister(exports.ControlRegister['PANIDL'], panID[0]);
  this.writeControlRegister(exports.ControlRegister['PANIDH'], panID[1]);
}

exports.MRF24J40.prototype.setShortAddress = function(shortAddress) {
  this.writeControlRegister(exports.ControlRegister['SADRL'], shortAddress[0]);
  this.writeControlRegister(exports.ControlRegister['SADRH'], shortAddress[1]);
}

exports.MRF24J40.prototype.setEUI = function(eui) {
  this.writeControlRegister(exports.ControlRegister['EADR0'], eui[0]);
  this.writeControlRegister(exports.ControlRegister['EADR1'], eui[1]);
  this.writeControlRegister(exports.ControlRegister['EADR2'], eui[2]);
  this.writeControlRegister(exports.ControlRegister['EADR3'], eui[3]);
  this.writeControlRegister(exports.ControlRegister['EADR4'], eui[4]);
  this.writeControlRegister(exports.ControlRegister['EADR5'], eui[5]);
  this.writeControlRegister(exports.ControlRegister['EADR6'], eui[6]);
  this.writeControlRegister(exports.ControlRegister['EADR7'], eui[7]);
}

exports.MRF24J40.prototype.setDataRequestFramePending = function(hasPendingFrame) {
  var acktmout = this.readControlRegister(exports.ControlRegister['ACKTMOUT']);  
  var drpack = hasPendingFrame ? 0x80 : 0x00;
  
  this.writeControlRegister(exports.ControlRegister['ACKTMOUT'], ((acktmout & 0x7f) | drpack));  
}

exports.MRF24J40.prototype.setFramePending = function(hasPendingFrame) {
  var txpend = this.readControlRegister(exports.ControlRegister['TXPEND']);  
  var fpack = hasPendingFrame ? 0x01 : 0x00;
  
  this.writeControlRegister(exports.ControlRegister['TXPEND'], ((txpend & 0xfe) | fpack));  
}

exports.MRF24J40.prototype.setChannel = function(channel) {
  this.writeControlRegister(exports.ControlRegister['RFCON0'], ((channel << 4) | 0x03));
  this.resetRFStateMachine();
}

exports.MRF24J40.prototype.setCipher = function(startDecrypt, ignoreDecrypt, rxCipher, txCipher) {
  var seccon0 = (((rxCipher & 0x07) << 3) | (txCipher & 0x07));
  
  if (startDecrypt) {
    seccon0 |= 0x40;
  } else if (ignoreDecrypt) {
    seccon0 |= 0x80;    
  }
  
  this.writeControlRegister(exports.ControlRegister['SECCON0'], seccon0);
  
  if (ignoreDecrypt) {
    this.writeControlRegister(exports.ControlRegister['RXFLUSH'], 0x01);
  }
}

exports.MRF24J40.prototype.hasDecryptionFailed = function() {
  var failed = (this.readControlRegister(exports.ControlRegister['RXSR']) >> 2) & 0x01;
  this.writeControlRegister(exports.ControlRegister['RXSR'], 0x00);
  
  return failed;
}

exports.MRF24J40.prototype.setTXNSecurityKey = function(key) {
  this.writeFIFO(exports.FIFO['TXNSECKEY'], 0, key);
}

exports.MRF24J40.prototype.setRXSecurityKey = function(key) {
  this.writeFIFO(exports.FIFO['RXSECKEY'], 0, key);
}

exports.MRF24J40.prototype.transmit = function(frame) {
  this.writeFIFO(exports.FIFO['TX'], 0, frame);
  
  var txncon = 0x01;

  if ((frame[2] >> 3) & 0x01) {
    txncon = txncon | 0x02;
  }
    
  if ((frame[2] >> 5) & 0x01) {
    txncon = txncon | 0x04;
  }
  
  this.writeControlRegister(exports.ControlRegister['TXNCON'], txncon);
}

function handleInterrupt() {
  var interruptValue = this.readControlRegister(exports.ControlRegister['INTSTAT']);
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
}

function handleSleepInterrupt() {
  
}

function handleWakeInterrupt() {
  
}

function handleHalfSymbolTimerInterrupt() {
  
}

function handleSecurityKeyRequestInterrupt() {
  var eui = new Buffer(8);
  
  eui[0] = this.readControlRegister(exports.ControlRegister['SRCADR0']);
  eui[1] = this.readControlRegister(exports.ControlRegister['SRCADR1']);
  eui[2] = this.readControlRegister(exports.ControlRegister['SRCADR2']);
  eui[3] = this.readControlRegister(exports.ControlRegister['SRCADR3']);
  eui[4] = this.readControlRegister(exports.ControlRegister['SRCADR4']);
  eui[5] = this.readControlRegister(exports.ControlRegister['SRCADR5']);
  eui[6] = this.readControlRegister(exports.ControlRegister['SRCADR6']);
  eui[7] = this.readControlRegister(exports.ControlRegister['SRCADR7']);

  this.emit('keyRequest', eui);
}

function handleReceiveInterrupt() {
  if (this.hasDecryptionFailed()) {
    this.writeControlRegister(exports.ControlRegister['RXFLUSH'], 0x01);
    return;
  }
  
  this.writeControlRegister(exports.ControlRegister['BBREG1'], 0x04);
  
  var frameLength = this.readFIFO(exports.FIFO['RX'], 0, 1).readUInt8(0);
  var data = this.readFIFO(exports.FIFO['RX'], 1, (frameLength + 2));
  
  this.writeControlRegister(exports.ControlRegister['RXFLUSH'], 0x01);
  this.writeControlRegister(exports.ControlRegister['BBREG1'], 0x00);
    
  var lqi = data.readUInt8(frameLength);
  var rssi = data.readUInt8(frameLength + 1);
  this.emit('frame', data.slice(0, frameLength), lqi, rssi);
}

function handleTransmitInterrupt(fifo) {
  var txStatus = this.readControlRegister(exports.ControlRegister['TXSTAT']);
  
  //TODO: handle GTS FIFOs
  if (fifo == exports.FIFO["TX"]) {
    var txError = (txStatus & 0x01) == 0x01;
    var ccaFail = (txStatus & 0x20) != 0;
    
    this.emit('transmitted', txError, ccaFail);
  }
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
