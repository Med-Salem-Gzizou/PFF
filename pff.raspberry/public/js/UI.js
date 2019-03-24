var UI = {};
UI.init = function(){
  this.home_page = $('#home_page');
  this.cams_page = $('#cams_page');
  this.settings_page = $('#settings_page');

  this.home_button = $('#home_button');
  this.cams_button = $('#cams_button');
  this.settings_button = $('#settings_button');

  this.assistant = $('#assistant');
  this.assistantLogo = $('#assistant_logo');
  this.assistantMsgInput = $('#msg_input');
  this.recognitioMod = false;

  this.languageOption = $('#speech_language');
  this.voicelist = responsiveVoice.getVoices();

  this.offline_elements_Button = $('#offline_elements_Button');
  this.offline_elements_list = $('#offline_elements_list');
  this.number_ofElements_offline = $('#number_ofElements_offline');

  this.delet_table_togle = $('#delet_table_togle');
  this.delet_table = $('#delet_table');
  this.delet_submit_button = $('#delet_submit_button');
  this.delet_id = $('#delet_id');
  this.delet_key = $('#delet_key');

  this.add_table_togle = $('#add_table_togle');
  this.add_table = $('#add_table');
  this.add_submit_button = $('#add_submit_button');
  this.add_id = $('#add_id');
  this.add_key = $('#add_key');
  this.add_type = $('#add_type');
  this.add_comment = $('#add_comment');

  this.edit_table_togle = $('#edit_table_togle');
  this.edit_table = $('#edit_table');
  this.edit_submit_button = $('#edit_submit_button');
  this.edit_id = $('#edit_id');
  this.edit_type = $('#edit_type');
  this.edit_comment = $('#edit_comment');

  this.homeElements = {};
  this.home_page.empty();

  this.CamRightButton = $('#right_controler');
  this.CamLeftButton  = $('#left_controler');
  this.CamPositionDisplay = $('#cam_position_display');
  WEBCAM.init();
  WEBCAM.position = 0;
};

UI.displayCamPosition = function(){
  this.CamPositionDisplay.html(WEBCAM.position * (90/1000) + '&ordm;');
}

UI.setRecognitionMode = function(statu){
  if(statu){
    this.assistantLogo.addClass('logo_active');
    this.assistantMsgInput.addClass('msg_active');
    this.recognitioMod = true;
  }else{
    this.assistantLogo.removeClass('logo_active');
    this.assistantMsgInput.removeClass('msg_active');
    this.recognitioMod = false;
  }
  console.log('[UI] Recognition mod:', this.recognitioMod);
};

UI.displayMsg = function(msg){
  console.log('[UI] display msg:', msg);
  this.assistantMsgInput.val(msg);
  var voice =
    (RECOGNITION.lang === 'ar-TN')? "Arabic Female":
    (RECOGNITION.lang === 'fr-FR')? "French Female": "UK English Male";
  responsiveVoice.speak(msg, voice);
};

UI.updateElements = function(data){ // elements_update
  console.log("[UI] update elements ...");
  INTER = this;
  INTER.home_page.empty(); homeElements = {};

  $('.offline_element').remove();
  INTER.number_ofElements_offline.text('0');
  INTER.edit_id.html('');
  INTER.delet_id.html('');

  Object.keys(data).forEach(function(id){
    var selectOption = '<option value="'+id+'">'+id+'</option>';
    INTER.edit_id.append(selectOption);
    INTER.delet_id.append(selectOption);

    if(data[id].connection){
      if(data[id].type === 'lamp'){
        INTER.homeElements[id] = lamp.addNew(id, data[id].comment, data[id].statu);
      }else if(data[id].type === 'lock'){
        INTER.homeElements[id] = lock.addNew(id, data[id].comment, data[id].statu);
      }
    }else{
      var element = '<tr class="offline_element">'+'<td>'+id+'</td>'
        +'<td>'+data[id].comment+'</td>'
        +'<td>'+data[id].type+'</td></tr>';
      INTER.offline_elements_list.append(element);
      INTER.number_ofElements_offline.text(parseInt(INTER.number_ofElements_offline.text()) + 1);
    }
  });
};

UI.updateStatus = function(data){ // statu_update
  console.log("[UI] update status ...");
  Object.keys(data).forEach(function(id){
    if(UI.homeElements[id]){
      if(UI.homeElements[id].type === 'lamp'){ lamp.set(id, data[id]); }
      else if(UI.homeElements[id].type === 'lock'){ lock.set(id, data[id]); }
    }
  });
};

$(document).ready(function() {
  UI.init();

  UI.home_button.click(function(){
    displayPage('home');
    UI.assistant.show();
  });
  UI.cams_button.click(function(){
    displayPage('cams');
    UI.assistant.show();
  });
  UI.settings_button.click(function(){
    displayPage('settings');
    UI.assistant.hide();
  });

  UI.assistantLogo.click(function(){
    if(UI.recognitioMod){
      UI.setRecognitionMode(false);
    }else{
      UI.setRecognitionMode(true);
      RECOGNITION.lang = UI.languageOption.val();
      RECOGNITION.start();
      setTimeout(RECOGNITION.stopRecognition , 2500);
    }
  });

  UI.assistantMsgInput.on('keydown', function(key) {
    if (key.which == 13) {
      var msg = UI.assistantMsgInput.val();
      console.log('[UI] Send text msg:', msg);
      RECOGNITION.lang = UI.languageOption.val();
      PROTOCOL.sendMsg(RECOGNITION.lang, msg, 1);
    }
  });

  UI.CamRightButton.click(function(){
    WEBCAM.position += 100;
    if(WEBCAM.position >= 1000){ WEBCAM.position = 1000; }
    UI.displayCamPosition();
    PROTOCOL.sendCamPos(WEBCAM.position);
  });

  UI.CamLeftButton.click(function(){
    WEBCAM.position -= 100;
    if(WEBCAM.position <= -1000){ WEBCAM.position = -1000; }
    UI.displayCamPosition();
    PROTOCOL.sendCamPos(WEBCAM.position);
  });

  UI.offline_elements_Button.click(function(){
    UI.offline_elements_list.toggle();
  });
  UI.delet_table_togle.click(function(){
    UI.delet_table.toggle();
  });
  UI.add_table_togle.click(function(){
    UI.add_table.toggle();
  });
  UI.edit_table_togle.click(function(){
    UI.edit_table.toggle();
  });

  UI.edit_submit_button.click(function(){
    PROTOCOL.send_EditElement(UI.edit_id.val(), UI.edit_type.val(), UI.edit_comment.val());
    UI.edit_comment.val('');
  });
  UI.add_submit_button.click(function(){
    PROTOCOL.send_AddElement(UI.add_id.val(), UI.add_key.val(), UI.add_type.val(), UI.add_comment.val());
    UI.add_id.val(''); UI.add_key.val(''); UI.add_comment.val('');
  });
  UI.delet_submit_button.click(function(){
    PROTOCOL.send_DeletElement(UI.delet_id.val(), UI.delet_key.val());
    UI.delet_key.val('');
  });

});

////////////////////////////////////////////////////
var addNew = function(id, comment, statu){
  var imgUrl = (statu)? this.onImg: this.offImg;
  var prototype = document.createElement('div');
  prototype.className = 'home_element noselect';
  prototype.id = id;
  prototype.innerHTML = "<div class='inline left'>"+
      "<img class='img_element' src='"+imgUrl+"'>"+
      "</div><div class='inline right'>"+
      "<p>"+id+"</p>"+
      "<p>"+comment+"</p></div>";
  prototype.onclick = elementsClickHandler;
  UI.home_page.append(prototype);
  var L = $('#'+id); L.type = this.type; L.statu = statu;
  return(L);
};
var set = function(id, statu){
  var img = UI.homeElements[id].children()[0].children[0];
  var imgUrl = (statu)? this.onImg: this.offImg;
  img.setAttribute('src', imgUrl);
  UI.homeElements[id].statu = statu;
};

var lamp = {
  type: 'lamp',
  list: [],
  onImg: '/img/Light-Bulb-on.png',
  offImg: '/img/Light-Bulb-off.png',
  addNew: addNew,
  set: set
};
var lock = {
  type: 'lock',
  list: [],
  onImg: '/img/lock_open.png',
  offImg: '/img/lock_close.png',
  addNew: addNew,
  set: set
};

function elementsClickHandler(clickEvent){
  for(var i=0; i<clickEvent.path.length; i++){
    if(clickEvent.path[i].id){
      var id = clickEvent.path[i].id;
      console.log("[UI] element clicked id:", id);
      PROTOCOL.sendCmd(id, !UI.homeElements[id].statu);
      return undefined;
    }
  }
};

function displayPage(pageName){
  console.log("[UI] display :", pageName);
  UI.home_page.hide();
  UI.cams_page.hide();
  UI.settings_page.hide();
  UI[pageName+'_page'].slideDown("slow");
  UI.home_button.removeClass('active_button');
  UI.cams_button.removeClass('active_button');
  UI.settings_button.removeClass('active_button');
  UI[pageName+'_button'].addClass('active_button');

  if(pageName === "cams"){
    console.log("[UI] start cam");
    WEBCAM.startStream();
  }else{
    console.log("[UI] pause cam");
    WEBCAM.stopStream();
  }
};
