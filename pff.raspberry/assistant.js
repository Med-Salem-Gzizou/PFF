var assistantLogSign = require('colors/safe').bold(require('colors/safe').cyan('[assistant.js]'));
var errorLog = require('colors/safe').red;

const fs = require('fs');
const EventEmitter = require('events');
// emits list ['message_responce', 'elements_command', 'set_cam_pos']
module.exports = new EventEmitter();

module.exports.CONFIG_DATA = {
    textCommandsDb_File: "./config/textCommandsDb.json"
};

module.exports.SET_CONFIG_DATA = function(configData){
  this.CONFIG_DATA = configData;
};

module.exports.START_MODULE = function(){
  this.TEXT_CMDS_DATABASE = {} // all commands from db file
  UpdateTextCommandsData();
  fs.watch(this.CONFIG_DATA.textCommandsDb_File, {encoding: 'buffer'}, function(eventType, filename){
    if(eventType == 'change'){
      console.log(assistantLogSign, 'change detected !');
      UpdateTextCommandsData();
    }
  });
};

module.exports.messageCommand = function(message_command, callback){
  console.log(assistantLogSign, 'new message command:', message_command);
  message_command.text = message_command.text.toLowerCase();
  var CommandData = getCommandData(message_command);

  if(CommandData.elementsCommand){
    CommandData.elementsCommand.forEach( (elements_command) => {
      module.exports.emit('elements_command', elements_command);
    });
  }
  if(CommandData.messageResponce){
    var message_responce = CommandData.messageResponce[
      Math.floor(Math.random()*CommandData.messageResponce.length)
    ];
    callback( {text: message_responce, lang: message_command.lang});
  }
  if(CommandData.camPosistionCommand !== undefined){
    module.exports.emit('set_cam_pos', CommandData.camPosistionCommand);
  }
};

function getCommandData(message_command){
  var text = message_command.text;
  var langue = message_command.lang;
  var confidence = message_command.confidence;

  for(var i=1; i<module.exports.TEXT_CMDS_DATABASE[langue].length; i++){
    if(module.exports.TEXT_CMDS_DATABASE[langue][i].messageText.indexOf(text) >= 0){
      return module.exports.TEXT_CMDS_DATABASE[langue][i];
    }
  }
  if(confidence < 0.7){
    return { "messageResponce": module.exports.TEXT_CMDS_DATABASE[langue][0].lowConfidence }
  }else{
    return { "messageResponce": module.exports.TEXT_CMDS_DATABASE[langue][0].errorResponce }
  }
};

////////////////////////////////////////////////////////////////////////////////
function UpdateTextCommandsData(){
  var fileName = module.exports.CONFIG_DATA.textCommandsDb_File;
  console.log(assistantLogSign, 'updating cmds database ...');
  try {
    var Data = JSON.parse( fs.readFileSync(fileName, 'utf8') );
  }catch(err){
    console.log(assistantLogSign, errorLog(err.message));
    var Data = null;
  }
  module.exports.TEXT_CMDS_DATABASE = (Data)? Data: module.exports.TEXT_CMDS_DATABASE;
};
