var UI = {};
UI.init = function(){
  this.lamp = { on: 'img2/Light-Bulb-on.png', off: 'img2/Light-Bulb-off.png', color: 'green' };
  this.lock = { on: 'img2/lock_open.png', off: 'img2/lock_close.png', color: 'orange' };

  this.elements_container = $('#elements_container');
  this.camera_container = $('#camera_container');
  this.settings_container = $('#settings_container');
  this.assistant_modal = $('#assistant_modal');

  this.elements_button = $('#elements_button');
  this.camera_button = $('#camera_button');
  this.settings_button = $('#settings_button');

  this.assistant_button = $('#assistant_button');
  this.text_input_form = $('#text_input_form');

  this.table_content = $('#table_content');

  this.language_select = $('#language_select');
  this.lang_statu = $('#lang_statu');
  this.voice_statu_select = $('#voice_statu_select');
  this.voice_statu = $('#voice_statu');

  this.edit_button = $('#edit_button');
  this.edit_form = $('#edit_form');
  this.add_button = $('#add_button');
  this.add_form = $('#add_form');
  this.delet_button = $('#delet_button');
  this.delet_form = $('#delet_form');

  WEBCAM.init();
};

UI.showContainer = function(containerName){
  $('.pageContainer').hide();
  $('.active').removeClass('active');
  this[containerName+'_container'].slideDown('slow');
  this[containerName+'_button'].addClass('active');
  if(containerName === 'camera'){WEBCAM.startStream();}else{WEBCAM.stopStream();}
};

UI.addElement = function(id, inf){
  var img = (inf.type === 'lamp')? this.lamp.off: this.lock.off;
  var element = '<div class="col-lg-4 col-md-6 col-sm-6">'+
    '<div class="card card-stats"><div id="e-'+id+'" class="card-header" data-background-color="">'+
    '<img id="img-'+id+'" src="'+img+'"></div><div class="card-content">'+
    '<p class="category">'+inf.type+'</p><h3 class="title">'+inf.comment+'<small id="cs-'+id+'"> OFF</small></h3>'+
    '<input id="'+id+'" elementType="'+inf.type+'" type="checkbox" data-toggle="toggle" data-onstyle="'+
    ((inf.type === 'lamp')? 'success':'warning')+'"></div><div class="card-footer">'+
    '<div class="stats"><i class="text-success">id: '+id+'</i></div></div></div></div>';
  this.elements_container.append(element);
  $('#'+id).bootstrapToggle();
  $('#'+id).change(function(){
    UI.elementsClickHandler(this.id, this.getAttribute('elementtype'), this.checked );
  });
};

UI.addToTable = function(id, type, comment, con_statu){
  var element = '<tr><td>'+id+'</td><td>'+comment+'</td><td>'+type+'</td><td'+
  ( (con_statu)? ' style="background-color: rgba(0, 255, 0, 0.08);">C': ' style="background-color: rgba(255, 0, 0, 0.08);">N/C' )+'</td></tr>';
  this.table_content.append(element);
  var option = '<option class="id-option">'+id+'</option>';
  $('#edit_id').append(option); $('#delet_id').append(option);
};

UI.setElementStatu = function(id, statu){
  if($('#'+id).length){
    var type = $('#'+id).attr('elementtype');
    $('#img-'+id).attr('src', ((statu)? this[type].on: this[type].off) );
    $('#e-'+id).attr('data-background-color', ((statu)? this[type].color:'') );
    $('#'+id).bootstrapToggle((statu)? 'on':'off');
    $('#cs-'+id).html((statu)? ' ON':' OFF');
  }else{
    console.log('element', id, 'not exists');
  }
};

UI.elementsClickHandler = function(id, type, statu){
  if(!this.updateMode){
    console.log('new element click:', id, type, statu);
    PROTOCOL.sendElementCmd(id, statu);
  }
};

UI.updateElements = function(elements_info){
  var INT = this;
  INT.elements_container.empty();
  INT.table_content.empty();
  $('.id-option').remove();
  INT.nc_elements_cont = 0;
  Object.keys(elements_info).forEach(function(id){
    INT.addToTable(id, elements_info[id].type, elements_info[id].comment, elements_info[id].connection);
    if(elements_info[id].connection){
      INT.addElement(id, elements_info[id]);
    }else{
      INT.nc_elements_cont += 1;
    }
  });
  $('#nc-number').html(INT.nc_elements_cont);
  this.notifyMessage('Elements Updated');
};

UI.updateStatus = function(elements_status){
  INTER = this;
  INTER.updateMode = true;
  Object.keys(elements_status).forEach(function(id){
    INTER.setElementStatu(id, elements_status[id]);
  });
  INTER.updateMode = false;
};

$(document).ready(function() {
  UI.init();
  UI.elements_button.click(function(){ UI.showContainer('elements'); });
  UI.camera_button.click(function(){ UI.showContainer('camera'); });
  UI.settings_button.click(function(){ UI.showContainer('settings'); });

  UI.edit_button.click(function(){
    UI.add_form.slideUp();
    UI.delet_form.slideUp();
    UI.edit_form.slideDown();
  });
  UI.add_button.click(function(){
    UI.edit_form.slideUp();
    UI.delet_form.slideUp();
    UI.add_form.slideDown();
  });
  UI.delet_button.click(function(){
    UI.edit_form.slideUp();
    UI.add_form.slideUp();
    UI.delet_form.slideDown();
  });

  UI.language_select.on('change', function(e){
    console.log('lang change to:', UI.language_select.val() );
    UI.lang_statu.html( UI.language_select.val() );
  });
  UI.voice_statu_select.on('change', function(e){
    console.log('voice statu change to:', UI.voice_statu_select.val() );
    UI.voice_statu.html( UI.voice_statu_select.val() );
  });

  UI.edit_form.on('submit', function(e){
    var id=$('#edit_id').val();var type=$('#edit_type').val();var comment=$('#edit_comment').val();
    console.log('edit submit', e ); e.preventDefault();
    PROTOCOL.send_EditElement(id, type, comment);
  });
  UI.add_form.on('submit', function(e){
    var id=$('#add_id').val();var key=$('#add_key').val();var type=$('#add_type').val();var comment=$('#add_comment').val();
    console.log('add submit', id, key, type, comment); e.preventDefault();
    PROTOCOL.send_AddElement(id, key, type, comment);
  });
  UI.delet_form.on('submit', function(e){
    var id=$('#delet_id').val();var key=$('#delet_key').val();
    console.log('delet submit', id, key); e.preventDefault();
    PROTOCOL.send_DeletElement(id, key);
  });

  UI.text_input_form.on('submit', function(e){
    var textMsg = $('#text_input').val();
    var lang = 'en-US';
    console.log('msg submit:', textMsg); e.preventDefault();
    PROTOCOL.sendMsg(lang, textMsg, 1);
  });
  UI.assistant_modal.on('show.bs.modal', function (event) {
    console.log('assistant mode active');
    RECOGNITION.lang = UI.language_select.val();
    RECOGNITION.start();
    setTimeout(RECOGNITION.stopRecognition , 3000);
  });
});

UI.showMessage = function(msg){
  $('#text_input').val(msg);
};
UI.notifyMessage = function(msg, lang){
  $.notify({ message: msg, icon: '<svg fill="#000000" height="24" viewBox="0 0 24 24" width="24" ><circle cx="9" cy="9" r="4"/><path d="M9 15c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4zm7.76-9.64l-1.68 1.69c.84 1.18.84 2.71 0 3.89l1.68 1.69c2.02-2.02 2.02-5.07 0-7.27zM20.07 2l-1.63 1.63c2.77 3.02 2.77 7.56 0 10.74L20.07 16c3.9-3.89 3.91-9.95 0-14z"/><path d="M0 0h24v24H0z" fill="none"/></svg>' },
  { type: '', delay: 2000, placement: {from: 'top', align: 'left'} });

  if(this.voice_statu_select.val() === 'Enable'){
    var voice =
      (lang === 'ar-TN')? "Arabic Female":
      (lang === 'fr-FR')? "French Female": "UK English Male";
    responsiveVoice.speak(msg, voice);
  }
};
