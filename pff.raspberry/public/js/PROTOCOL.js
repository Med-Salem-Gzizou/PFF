var socket = io();

var PROTOCOL = {};
PROTOCOL.sendCmd = function(id, statu){
  console.log('[protocol] send elements_command:', id, statu);
  socket.emit('elements_command', {
    id: id,
    statu: statu
  });
};

PROTOCOL.sendMsg = function(lang, text, confidence){
  console.log('[protocol] send message_command:', lang, text, confidence);
  socket.emit('message_command', {
    lang: lang,
    text: text,
    confidence: confidence
  });
};

PROTOCOL.sendCamPos = function(pos){
  console.log('[protocol] send set_cam_pos:', pos);
  socket.emit('set_cam_pos', pos);
};

PROTOCOL.send_AddElement = function(id, key, type, comment){
  var element_data = {id: id, key: key, type: type, comment: comment};
  socket.emit('add_element', element_data);
};

PROTOCOL.send_EditElement = function(id, type, comment){
  var element_data = {id: id, type: type, comment: comment};
  socket.emit('edit_element', element_data);
};

PROTOCOL.send_DeletElement = function(id, key){
  var element_data = {id: id, key: key};
  socket.emit('delet_element', element_data);
};

$(document).ready(function() {
  console.log('[protocol] socket_cmd ready');

  $.getJSON('/api', function(Data){
    console.log('[protocol] api update:', Data);
    UI.updateElements(Data.elements_info);
    UI.updateStatus(Data.elements_status);
  });

  socket.on('elements_status_update', function(data){
    console.log('[protocol] statu_update:', data);
    UI.updateStatus(data);
  });

  socket.on('elements_info_update', function(data){
    console.log('[protocol] elements_update:', data);
    UI.updateElements(data);
  });

  socket.on('message_responce', function(data){
    console.log('[protocol] server message_responce :', data);
    UI.displayMsg(data.text);
  });

});
