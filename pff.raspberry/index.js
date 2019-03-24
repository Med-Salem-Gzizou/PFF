
var indexLogSign = require('colors/safe').bold(require('colors/safe').green('[index.js]'));
var errorLog = require('colors/safe').red;

var ASSISTANT = require('./assistant.js');
var DRIVER = require('./elementsDriver.js');
var CAM = require('./camDriver.js');
var REMOTESERVER = require('./webServerDriver.js');

const CONFIG_FILE_DATA = require('./config/config.json');

REMOTESERVER.SET_CONFIG_DATA( CONFIG_FILE_DATA );
DRIVER.SET_CONFIG_DATA( CONFIG_FILE_DATA );
ASSISTANT.SET_CONFIG_DATA( CONFIG_FILE_DATA );
CAM.SET_CONFIG_DATA( CONFIG_FILE_DATA );

const LOCALSERVER_TCP_PORT = (process.argv[2])? process.argv[2]: CONFIG_FILE_DATA.homeServer.tcpPort;

DRIVER.START_MODULE();
ASSISTANT.START_MODULE();
CAM.START_MODULE();
REMOTESERVER.START_MODULE();

var express = require('express');
var server = express();
var http = require('http').Server(server);
var io = require('socket.io')(http);

server.use(express.static('public'));

server.get('/v2', function(req, res){
  res.sendFile(__dirname + '/public/v2.html');
});

server.get('/api', function(req, res){
  console.log(indexLogSign,'new api request');
  res.send({'elements_info': DRIVER.elements_info,
            'elements_status': DRIVER.elements_status});
});

io.on('connection', function(socket){
  console.log(indexLogSign,'New client connection', socket.handshake.url);
  console.log(indexLogSign,'connection target:', socket.handshake.query.target);
  if(socket.handshake.query.target === 'cam'){
    CAM.streamingSockets.push(socket);
    console.log(indexLogSign, 'new cam stream total:', CAM.streamingSockets.length);
  }

  socket.on('disconnect', function(){
    console.log(indexLogSign, 'Client disconnected');
    if(CAM.streamingSockets.indexOf(socket) > -1){
      CAM.streamingSockets.splice(CAM.streamingSockets.indexOf(socket), 1);
      console.log(indexLogSign, 'remove cam stream total:', CAM.streamingSockets.length);
    }
  });

  socket.on('elements_command', function(elements_command){
    console.log(indexLogSign, 'new elements_command : ', elements_command);
    DRIVER.sendElementcmd(elements_command.id, elements_command.statu);
  });

  socket.on('message_command', function(message_command){
    ASSISTANT.messageCommand(message_command, function(responce_msg){
      socket.emit('message_responce', responce_msg);
    });
  });

  socket.on('set_cam_pos', function(position){
    CAM.setCamPosition(position);
  });

  socket.on('add_element', function(element_data){
    DRIVER.add_HomeElement(element_data);
  });

  socket.on('delet_element', function(element_data){
    DRIVER.delet_HomeElement(element_data);
  });

  socket.on('edit_element', function(element_data){
    DRIVER.edit_HomeElement(element_data);
  });

});

http.listen(LOCALSERVER_TCP_PORT, function(){
  console.log(indexLogSign, 'listening on TCP:', LOCALSERVER_TCP_PORT);
});

////////////////////////////////////////////////////////////////////////////////

ASSISTANT.on('message_responce', (message_responce) => {});

ASSISTANT.on('elements_command', (elements_command) => {
  DRIVER.sendElementcmd(elements_command.id, elements_command.statu);
});

ASSISTANT.on('set_cam_pos', (position) => {
  CAM.setCamPosition(position);
});

////////////////////////////////////////////////////////////////////////////////

DRIVER.on('elements_status_change', (elements_status) => {
  console.log(indexLogSign, 'broadcast elements_status');
  io.sockets.emit('elements_status_update', elements_status);
  if(REMOTESERVER.socket.connected){
    REMOTESERVER.socket.emit('elements_status_update', elements_status);
  }
});

DRIVER.on('elements_info_change', (elements_info) => {
  console.log(indexLogSign, 'broadcast elements_info');
  io.sockets.emit('elements_info_update', elements_info);
  if(REMOTESERVER.socket.connected){
    REMOTESERVER.socket.emit('elements_info_update', elements_info);
  }
});

////////////////////////////////////////////////////////////////////////////////

REMOTESERVER.socket.on('connect', () => {
  REMOTESERVER.socket.emit('elements_info_update', DRIVER.elements_info);
  REMOTESERVER.socket.emit('elements_status_update', DRIVER.elements_status);
});

REMOTESERVER.socket.on('elements_command', (elements_command) => {
  console.log(indexLogSign, 'online remote elements_command:', elements_command);
  DRIVER.sendElementcmd(elements_command.id, elements_command.statu);
});

REMOTESERVER.socket.on('message_command', (message_command) => {
  console.log(indexLogSign, 'online remote message_command:', message_command);
});

REMOTESERVER.socket.on('cam_cmd', (cam_cmd) => {
  console.log(indexLogSign, 'online remote cam_cmd:', cam_cmd);
  if(cam_cmd === 'start' && CAM.streamingSockets.indexOf(REMOTESERVER.camSocket) === -1){
    CAM.streamingSockets.push(REMOTESERVER.camSocket);
  }else if(cam_cmd === 'stop'){
    CAM.streamingSockets.splice(CAM.streamingSockets.indexOf(REMOTESERVER.camSocket), 1);
  }
});

REMOTESERVER.socket.on('set_cam_pos', (position) => {
  CAM.setCamPosition(position);
});

REMOTESERVER.socket.on('get', (get) => {
  console.log(indexLogSign, 'online remote get:', get);
});
