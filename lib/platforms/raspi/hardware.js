var SPI = require("spi");
var Gpio = require("onoff").Gpio;
var events = require("events");

// Make configurable
var SPI_DEVICE = '/dev/spidev0.0';
var RESET_PIN = 4;
var WAKE_PIN = 17;
var INTERRUPT_PIN = 23;

exports.Hardware = function() {
  this.reset = new Gpio(RESET_PIN, 'out');
  this.reset.writeSync(1);
  this.wake = new Gpio(WAKE_PIN, 'out');
  this.wake.writeSync(0);
  this.interrupt = new Gpio(INTERRUPT_PIN, 'in', 'falling');
  this.interrupt.watch(handleInterrupt.bind(this));
  
  this.spi = new SPI.Spi(SPI_DEVICE, { 'mode': SPI.MODE['MODE_0'], 'maxSpeed': 10000000 }, function(s) {
    s.open();
  });
}

util.inherits(exports.Hardware, events.EventEmitter);

exports.Hardware.prototype.transfer = function(txBuf, rxBuf, cb) {
  this.spi.transfer(txBuf, rxBuf, handleTransfered.bind(this, cb));
}

exports.Hardware.prototype.writeReset = function(value, cb) {
  this.reset.write(value, cb);
}

exports.Hardware.prototype.writeWake = function(value, cb) {
  this.wake.write(value, cb);
}

exports.Hardware.prototype.readInterrupt = function(cb) {
  this.interrupt.read(cb);
}

function handleInterrupt(err, value) {
  //TODO: do something if there is an error
  this.emit('interrupt');
}

function handleTransfered(cb, device, buf) {
  cb(buf);
}