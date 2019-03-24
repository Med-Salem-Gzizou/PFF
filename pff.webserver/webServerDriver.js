var socketClient = require('socket.io-client');

module.exports.info = {
    url: 'http://localhost:8080',
    user: 'testuser',
    pass: '0000',
    connectionType: 'homeServer'
}

module.exports.connect = function(){
  var requestUrl = this.info.url+'/?user='+this.info.user+'&pass='+this.info.pass+'&connectionType='+this.info.connectionType;
  this.socket = socketClient(requestUrl);
  var webServer = this;
  this.socket.on('connect', function(){
    console.log('[webServerDriver] connected to server:', webServer.info.url);
  });
  return this.socket;
}

module.exports.test = function(){
  this.socket.on('element_command', (element_command) => {
    console.log('element_command', element_command);
  });
  this.socket.on('message_command', (message_command) => {
    console.log('message_command:', message_command);
  });
  this.socket.on('cam_cmd', (cam_cmd) => {
    console.log('cam_cmd', cam_cmd);
  });
}
