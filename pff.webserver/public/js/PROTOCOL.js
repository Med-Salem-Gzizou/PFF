var socket = io();
//var camSocket = io('/socket.io/?connectionType=usersCam');

var PROTOCOL = {};
PROTOCOL.getElementsUpdate = function(){
  var data = {'get': 'elements_update'};
  socket.emit('cmd', data);
};

PROTOCOL.getStatusUpdate = function(){
  var data = {'get': 'statu_update'};
  socket.emit('cmd', data);
};

PROTOCOL.sendElementCommand = function(id, statu){
  var data = {'id': id, 'statu': statu};
  socket.emit('elements_command', data);
};

PROTOCOL.sendCamPosition = function(position){
  socket.emit('set_cam_pos', position);
};


$(document).ready(function() {
  PROTOCOL.getElementsUpdate();

  socket.on('server_log', function(data){
    console.log('[PROTOCOL] web server log:', data);
    if(data == 'home_offline'){ UI.setOfflineMode(); }
    if(data == 'home_online'){ UI.stopOfflineMode(); }
  });

  socket.on('elements_info_update', (elements_info_update) => {
    UI.updateElements(elements_info_update);
  });

  socket.on('elements_status_update', (elements_status_update) => {
    UI.updateStatus(elements_status_update);
  });

  socket.on('message_responce', (message_responce) => {
    UI.showMsg(message_responce);
  });

});
