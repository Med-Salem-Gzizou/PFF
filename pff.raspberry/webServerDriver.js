var webServerLogSign = require('colors/safe').bold(require('colors/safe').magenta('[webServerDriver]'));
var errorLog = require('colors/safe').red;

module.exports.CONFIG_DATA = {
    remoteServerUrl: 'http://localhost:8080',
    userName: 'testuser',
    passWord: '0000'
};

module.exports.SET_CONFIG_DATA = function(configData){
  this.CONFIG_DATA = configData.remoteServer;
};

var socketClient = require('socket.io-client');

module.exports.START_MODULE = function(){
  var requestUrl = this.CONFIG_DATA.remoteServerUrl+'/?user='+this.CONFIG_DATA.userName+'&pass='+this.CONFIG_DATA.passWord;
  this.socket = socketClient(requestUrl+'&connectionType=homeServer');
  this.camSocket = socketClient(requestUrl+'&connectionType=homeCam');

  var webServer = this;
  this.socket.on('connect', function(){
    console.log(webServerLogSign, 'connected to server:', webServer.CONFIG_DATA.remoteServerUrl);
  });
  this.camSocket.on('connect', function(){
    console.log(webServerLogSign, 'cam connected to server:', webServer.CONFIG_DATA.remoteServerUrl);
  });

  return this.socket;
};

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
};
