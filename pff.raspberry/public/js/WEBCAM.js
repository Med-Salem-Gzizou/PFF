var WEBCAM = {};

WEBCAM.init = function(){
  this.canvas = document.getElementById('video-canvas');
  this.url = 'ws://'+document.location.host+'/socket.io/?EIO=3&transport=websocket&target=cam';
};

WEBCAM.startStream = function(){
  this.player = new JSMpeg.Player(this.url, {canvas: this.canvas});
};

WEBCAM.stopStream = function(){
  if(this.player){ this.player.destroy(); }
};
