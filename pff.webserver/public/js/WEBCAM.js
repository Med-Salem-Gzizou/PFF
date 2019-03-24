var WEBCAM = {};

WEBCAM.init = function(){
  this.canvas = document.getElementById('video-canvas');
  if(document.location.protocol === 'https'){ P = 'ws' }else{ P = 'wss' };
  this.url = P+'://'+document.location.host+'/socket.io/?EIO=3&transport=websocket&connectionType=usersCam';
}

WEBCAM.startStream = function(){
  this.player = new JSMpeg.Player(this.url, {canvas: this.canvas});
}

WEBCAM.stopStream = function(){
  this.player.destroy();
}
