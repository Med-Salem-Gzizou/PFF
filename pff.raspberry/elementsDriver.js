
var elementsDriverLogSign = require('colors/safe').bold(require('colors/safe').yellow('[elementsDriver.js]'));
var errorLog = require('colors/safe').red;
const fs = require('fs');

const EventEmitter = require('events');
module.exports = new EventEmitter(); // emit list [elements_status_change, elements_info_change]

module.exports.CONFIG_DATA = {
  mqttServer:{ userName: "home", passWord: "0000" },
  elementsData_File: "./config/homeElements.json"
};

module.exports.SET_CONFIG_DATA = function(configData){
  this.CONFIG_DATA = configData;
};

module.exports.START_MODULE = function(){
  // INIT ELEMENTS DATA
  this.elementsData ;    //[object] all data from database
  this.elements_info = {};     //[object] id:{ comment, type, connection }
  this.elements_status = {};   //[object] id:statu
  updateAll_ElementsData();
  fs.watch(this.CONFIG_DATA.elementsData_File, {encoding: 'buffer'}, function(eventType, filename){
    if(eventType == 'change'){
      console.log(elementsDriverLogSign, 'db change detected !');
      updateAll_ElementsData();
    }
  });

  // INIT MQTT BROCKER
  var mosca = require('mosca');
  this.MQTT_BROCKER = new mosca.Server({port: 1883});
  this.MQTT_BROCKER.on('ready', SETUP_MQTT_BROCKER);
};

module.exports.sendElementcmd = function(id, cmdStatu){
  console.log(elementsDriverLogSign, 'execute cmd id:', id, 'cmdStatu:', cmdStatu);
  if(module.exports.MQTT_BROCKER.clients[id]){
    // publish command
    var message = {
      topic: '/elements/command/'+id,
      payload: (cmdStatu)? "HIGH": "LOW", // or a Buffer
      qos: 0, // 0, 1, or 2
      retain: false // or true
    };
    module.exports.MQTT_BROCKER.publish(message, function(){
      console.log(elementsDriverLogSign, 'mqtt publish done!');
    });
  }else{
    var element_statu_update = {}; element_statu_update[id] = null;
    module.exports.emit('elements_status_change', element_statu_update);
  }
};

module.exports.add_HomeElement = function(element_data){
  console.log(elementsDriverLogSign, 'add element:', element_data);
  if(!this.elementsData[element_data.id]){
    if(element_data.id && element_data.key && element_data.type){
      this.elementsData[element_data.id] = {
        key: element_data.key.toString(),
        comment: element_data.comment.toString(),
        type: element_data.type.toString()
      };
      save_elementDato_toFile();
    }else{ console.log(elementsDriverLogSign, errorLog('add error: format') );}
  }else{ console.log(elementsDriverLogSign, errorLog('add error: element exist') );}
};

module.exports.delet_HomeElement = function(element_data){
  console.log(elementsDriverLogSign, 'delet element:', element_data);
  if(this.elementsData[element_data.id]){
    if(element_data.key && element_data.key === this.elementsData[element_data.id].key){
      this.elementsData[element_data.id] = undefined;
      save_elementDato_toFile();
    }else{console.log(elementsDriverLogSign, errorLog('delet error: not authorized') );}
  }else{console.log(elementsDriverLogSign, errorLog('delet error: element not exist') );}
};

module.exports.edit_HomeElement = function(element_data){
  console.log(elementsDriverLogSign, 'edit element:', element_data);
  if(this.elementsData[element_data.id]){
    if(element_data.comment && element_data.comment.length < 20){
      this.elementsData[element_data.id].comment = element_data.comment;
    }
    if(element_data.type === 'lamp' || element_data.type === 'lock'){
      this.elementsData[element_data.id].type = element_data.type;
    }
    save_elementDato_toFile();
  }else{console.log(elementsDriverLogSign, errorLog('delet error: element not exist') );}
};

////////////////////////////////////////////////////////////////////////////////
function SETUP_MQTT_BROCKER(){  // fired when the mqtt server is ready
  console.log(elementsDriverLogSign, 'Mosca server is up and running');
  // Accepts  connections
  module.exports.MQTT_BROCKER.authenticate = function(client, username, password, callback) {
    if(module.exports.elementsData[username] && password.toString() === module.exports.elementsData[username].key){
      console.log(elementsDriverLogSign, 'element authorized :', username, password.toString());
      client.user = username;
      module.exports.elements_info[username].connection = true;
      module.exports.emit('elements_info_change', module.exports.elements_info);
      callback(null, true);
    }else if(username === module.exports.CONFIG_DATA.mqttServer.userName &&
             password.toString() === module.exports.CONFIG_DATA.mqttServer.passWord){
      console.log(elementsDriverLogSign, 'client authorized :', username, password.toString());
      client.user = username;
      callback(null, true);
    }else{
      console.log(elementsDriverLogSign, errorLog('not authorized :'), username, password);
      callback(null, false);
    }
  };
  // authorize Publish
  module.exports.MQTT_BROCKER.authorizePublish = function(client, topic, payload, callback) {
    var authorized =
      ( client.user === topic.split('/')[3] ) ||
      ( client.user === module.exports.CONFIG_DATA.mqttServer.userName && topic.indexOf('/elements/status/') < 0 );
    callback(null, authorized);
  };
  // authorize Subscribe
  module.exports.MQTT_BROCKER.authorizeSubscribe = function(client, topic, callback) {
    callback(null, true);
  };


  module.exports.MQTT_BROCKER.on('clientConnected', function(client) {
    console.log(elementsDriverLogSign, 'Client Connected:', client.user);
  });

  module.exports.MQTT_BROCKER.on('clientDisconnected', function(client) {
    console.log(elementsDriverLogSign, 'Client Disconnected:', client.id, client.user);
    if(client.id === client.user){
      module.exports.elements_status[client.user] = undefined ;
      module.exports.elements_info[client.user].connection = false;
      module.exports.emit('elements_info_change', module.exports.elements_info);
      module.exports.emit('elements_status_change', module.exports.elements_status);
    }
  });

  module.exports.MQTT_BROCKER.on('published', function(packet, client) {
    console.log(elementsDriverLogSign, 'new mqtt publish:');
    var topic = packet.topic.split('/');
    var payload = packet.payload.toString();
    var clientId = (client)? client.id: client;
    console.log('    # topic  :', topic);
    console.log('    # payload:', payload);
    // get elements status
    if(topic[1] === 'elements'){
      if(topic[2] === 'status' && module.exports.elementsData[topic[3]]){
        var elementId = topic[3];
        if(payload === 'HIGH'){ module.exports.elements_status[elementId] = true; }
        if(payload === 'LOW' ){ module.exports.elements_status[elementId] = false; }
        module.exports.emit('elements_status_change', module.exports.elements_status);
      }
    }
  });

};

////////////////////////////////////////////////////////////////////////////////

function updateAll_ElementsData(){
  console.log(elementsDriverLogSign, 'updating driver data ...');
  try {
    var fileData = JSON.parse( fs.readFileSync(module.exports.CONFIG_DATA.elementsData_File, 'utf8') );
  }catch(err){
    console.log(elementsDriverLogSign, errorLog('error reading home elements database !'));
    console.log(elementsDriverLogSign, errorLog(err.message));
    return null;
  }
  module.exports.elementsData = fileData;
  module.exports.elements_info = update_elements_info();
  module.exports.emit('elements_info_change', module.exports.elements_info);
};

function update_elements_info(){
  var elements_info = {};
  var idsArray = Object.keys(module.exports.elementsData);
  for(var i=0; i<idsArray.length; i++){ var id = idsArray[i];
    elements_info[id] = {};
    elements_info[id].type    = module.exports.elementsData[id].type;
    elements_info[id].comment = module.exports.elementsData[id].comment;
    if(module.exports.elements_info[id]){
      elements_info[id].connection = module.exports.elements_info[id].connection;
    }
  }
  return elements_info;
};

function save_elementDato_toFile(){
  var jsonString = JSON.stringify(module.exports.elementsData, null, space=2);
  fs.writeFile(module.exports.CONFIG_DATA.elementsData_File, jsonString, 'utf8', (err) => {
    if(err){ console.log(elementsDriverLogSign, errorLog(err)); }
    else{ console.log(elementsDriverLogSign, 'element data saved'); }
  });
};
