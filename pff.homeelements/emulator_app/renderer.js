// This file is required by the index.html file and will
// be executed in the renderer process for that window.
// All of the Node.js APIs are available in this process.
const jq = require('jquery');
const mqtt = require('mqtt');

document.getElementById("InputIP").value = "raspberrypi.local";

document.getElementById("elements-container").innerHTML = "";

var elementsDB = {};

jq('#addElementbutton').click(function(){
  process.log('adding home element\n');

  var ip = document.getElementById("InputIP").value;
  var id = document.getElementById("InputID").value;
  var password = document.getElementById("InputPassword").value;

  console.log("adding element", id, password, ip);
  document.getElementById("InputID").value = "";
  document.getElementById("InputPassword").value = "";

  if(ip && id && password){
    // UI
    var element = generateElementText(ip, id, password);
    jq('#elements-container').prepend(element);
    // mqtt client
    elementsDB[id] = mqtt.connect({
      host: ip,
      clientId: id,
      username: id,
      password: password
    });
    elementsDB[id].on('connect', mqttConnectHandler);
    elementsDB[id].on('message', mqttMessageHandler);
    elementsDB[id].setStatu = setStatu;
  }

});

function generateElementText(ip, id, password){
  return '<div class="element" statu="off" id="'+id+'">'+
    '<div class="element_info"> <table>'+
      '<tr><th>Element ID:</th> <td>'+id+'</td></tr>'+
      '<tr><th>Element Password:</th> <td>'+password+'</td></tr>'+
      '<tr><th>MQTT brocker:</th> <td>'+ip+'</td></tr>'+
    '</table> </div>'+
    '<div class="buttons">'+
      '<div onclick="renderer.element_statu_click(\''+id+'\')" class="btn btn-info element_button_statu" elementID="'+id+'">Change Statu</div>'+
      '<div onclick="renderer.element_delet_click(\''+id+'\')" class="btn btn-danger element_button_delet" elementID="'+id+'">Delete</div>'+
    '</div>'+
  '</div>';
};

function mqttConnectHandler(){
  console.log('element connect:', this.options.clientId);
  elementsDB[this.options.clientId].subscribe('/elements/command/'+this.options.clientId);
  elementsDB[this.options.clientId].setStatu( (elementsDB[this.options.clientId].statu)? elementsDB[this.options.clientId].statu: "LOW");
}

function mqttMessageHandler(topic, message){
  console.log('element message:', this.options.clientId);
  console.log('mesg topic:', topic, 'message:', message.toString() );
  elementsDB[this.options.clientId].setStatu( message.toString() );
}

function setStatu(statu){
  console.log("set element statu:", this.options.clientId, statu);
  this.statu = statu;
  if(statu === "HIGH"){
    document.getElementById(this.options.clientId).attributes.class.value = "element on";
    document.getElementById(this.options.clientId).attributes.statu.value = "on";
  }else{
    document.getElementById(this.options.clientId).attributes.class.value = "element off";
    document.getElementById(this.options.clientId).attributes.statu.value = "off";
  }
  // publish status
  this.publish('/elements/status/'+this.options.clientId, statu);
}

module.exports.element_statu_click = function(id){
  console.log("status change id:", id);
  if(document.getElementById(id).attributes.statu.value == "off"){
    elementsDB[id].setStatu("HIGH");
  }else{
    elementsDB[id].setStatu("LOW");
  }
};

module.exports.element_delet_click = function(id){
  console.log("delet element id:", id);
  elementsDB[id].end();
  elementsDB[id] = undefined;
  document.getElementById(id).remove();
}
