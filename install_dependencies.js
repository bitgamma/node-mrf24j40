var npm = require("npm");

npm.load({
  loaded: false
}, function (err) {
  if(process.platform == 'linux') {
    npm.commands.install(["onoff", "spi"], function (er, data) {
      if (er) {
        process.exit(1);      
      }
    });    
  }
});