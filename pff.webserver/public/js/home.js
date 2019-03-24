var UI = {
  updateMode: false,
  offlineMode: false
};

UI.init = function(){
  this.cam_section = $('#cam_section');
  this.slider_cam_regulator = $("#slider_cam_regulator").bootstrapSlider();
  WEBCAM.init();

  this.elements_container = $('#elements_container');
  this.elements_container.empty();

  this.home_button = $('#home_button');
  this.cam_button = $('#cam_button');
  this.settings_button = $('#settings_button');

  this.server_msg = $('#server_msg');
}

UI.showHomePage = function(){
  this.home_button.addClass('active');
  this.cam_button.removeClass('active');
  this.settings_button.removeClass('active');
  this.cam_section.slideUp();
  WEBCAM.stopStream();
}

UI.showCamPage = function(){
  this.home_button.removeClass('active');
  this.cam_button.addClass('active');
  this.settings_button.removeClass('active');
  this.cam_section.slideDown();
  WEBCAM.startStream();
}

UI.showSettingsPage = function(){

}

UI.updateElements = function(data){
  this.updateMode = true;
  console.log('[home.js] new elements_update:', data);
  $.notify("Home elements updated", {style: 'bootstrap', className: 'info', position: "top left"});
  this.elements_container.empty();
  var t = Object.keys(data).forEach(function(id){
    if(data[id].type === 'lamp'){
      lamp.new(id, data[id].comment, data[id].statu);
    }
    else if(data[id].type === 'lock'){
      lock.new(id, data[id].comment, data[id].statu);
    }
  });
  this.updateMode = false;
}

UI.updateStatus = function(data){
  this.updateMode = true;
  var t = Object.keys(data).forEach(function(id){
    var type = $('#element_'+id)[0].type ;
    if(type === 'lamp'){ lamp.set(id, data[id]); }
    else if(type === 'lock'){ lock.set(id, data[id]); }
  });
  this.updateMode = false;
}

UI.showMsg = function(message_responce){
  console.log('[home.js] new message_responce:', message_responce);
  this.server_msg.text(message_responce.text);
}

UI.setOfflineMode = function(){
  if(!this.offlineMode){
    console.log('[home.js] offline mode');
    $.notify("Error Home Disconnected !", {style: 'bootstrap', className: 'error', position: "top left"});
    $("#server_msg").html("Your Home is Offline !");
    $(".button").bootstrapToggle('disable');
    this.offlineMode = true;
  }
}

UI.stopOfflineMode = function(){
  if(this.offlineMode){
    console.log('[home.js] online mode');
    $.notify("Home Connected", {style: 'bootstrap', className: 'success', position: "top left"});
    $("#server_msg").html("Welcom Home!");
    this.offlineMode = false;
  }
}


$(document).ready(function () {
  UI.init();
  UI.home_button.click(function(){ UI.showHomePage(); });
  UI.cam_button.click(function(){ UI.showCamPage(); });
  UI.settings_button.click(function(){ UI.showSettingsPage(); });

  UI.slider_cam_regulator.on('slide', function(e){
    console.log('[home.js] cam position:', e.value);
    PROTOCOL.sendCamPosition(e.value);
  });

  $('[data-toggle="offcanvas"]').click(function () {
    $('.row-offcanvas').toggleClass('active')
  });

});


function createNewElement(id, comment, statu){
  var imgUrl = (statu)? this.onImg: this.offImg;
  var prototype = document.createElement('div');
  prototype.className = 'col-xs-12 col-sm-6 col-lg-4 element';
  prototype.id = 'element_'+id;
  prototype.type = this.type;
  if(statu){ var checked = "checked"; }else{ var checked = ""; }
  prototype.innerHTML =
    '<div class="col-xs-6">'+
      '<img id="img_'+id+'" class="img-responsive img_ico" src="'+imgUrl+'" />'+
    '</div>'+
    '<div class="col-xs-6">'+
      '<h2>'+id+'</h2>'+
      '<p>'+comment+'</p>'+
      '<input id="'+id+'" type="checkbox" data-toggle="toggle" data-onstyle="success" data-width="100" '+checked+' class="button">'+
    '</div>';
  UI.elements_container.append(prototype);
  $('#'+id).bootstrapToggle();
  $('#'+id).change(function(){ buttonHandler(this.id, this.checked); });
  return(true);
};

function setElementStatu(id, statu){
  $("#"+id).bootstrapToggle('enable');

  if(statu === true){
    $('#'+id).bootstrapToggle('on');
    $('#img_'+id).attr('src', this.onImg);
  }
  else if(statu === false){
    $('#'+id).bootstrapToggle('off');
    $('#img_'+id).attr('src', this.offImg);
  }else{
    console.log('element not connected:', id);
    $('#'+id).bootstrapToggle('off');
    $('#img_'+id).attr('src', this.offImg);
    $("#"+id).bootstrapToggle('disable');
  }
}

function buttonHandler(id, statu){
  if(!UI.updateMode){
    var type = $('#element_'+id)[0].type ;
    console.log('new click id:', id, statu, type);
    PROTOCOL.sendElementCommand(id, statu);
  }
}

var lamp = {
  type: 'lamp',
  onImg: '/img/Light-Bulb-on.png',
  offImg: '/img/Light-Bulb-off.png',
  new: createNewElement,
  set: setElementStatu
};

var lock = {
  type: 'lock',
  onImg: '/img/lock_open.png',
  offImg: '/img/lock_close.png',
  new: createNewElement,
  set: setElementStatu
};
