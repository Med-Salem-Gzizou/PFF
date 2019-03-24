var camLogSign = require('colors/safe').bold(require('colors/safe').blue('[camDriver.js]'));
var errorLog = require('colors/safe').red;

//ffmpeg     -f v4l2         -framerate 25 -video_size 640x480 -i /dev/video0     -f mpegts         -codec:v mpeg1video -s 640x480 -b:v 1000k -bf 0     http://localhost:8081/supersecret
const EventEmitter = require('events');
const FW = require('ffmpeg-watchdog');

module.exports = new EventEmitter();
module.exports.streamingSockets = [];

module.exports.CONFIG_DATA = {
    cam_device_name: "/dev/video0"
};

module.exports.SET_CONFIG_DATA = function(configData){
  this.CONFIG_DATA = configData;
};

module.exports.START_MODULE = function(){
  //pipe:0 = stdin, pipe:1 = stdout, pipe:2 = stderr, all pipes can be used to stream data from ffmpeg, -loglevel should be set to "quiet" to utilize stderr
  var http = ['-loglevel', 'quiet', '-f', 'v4l2', '-i', module.exports.CONFIG_DATA.cam_device_name, '-f', 'mpegts', "-codec:v", "mpeg1video", "-s", "640x480", "-b:v", "1000k", "-bf", "0", 'pipe:1'];

  var ffmpeg = new FW(http, 'httpCam', 5, 5, 20, null, null, null)
      .on(FW.ERROR, (type, code, signal, message, target) => handleError(type, code, signal, message, target))
      .on(FW.STDOUT_DATA, function (data) {
          //console.log(ffmpeg.getName(), FW.STDOUT_DATA, data.length);
          module.exports.emit('stream', data);
      })
      .on(FW.STDERR_DATA, function (data) {
          //console.log(ffmpeg.getName(), FW.STDERR_DATA, data.length);
      })
      .on(FW.STDIN_DATA, function (data) {
          //console.log(ffmpeg.getName(), FW.STDIN_DATA, data.length);
      })
      .init();

  this.on('stream', function(streamData){
    module.exports.streamingSockets.forEach(function(socket){
      socket.emit('camStream', streamData);
    });
  });

  // MOtOR: INIT PYTHON SHELL
  const PythonShell = require('python-shell');
  this.DRIVER_MOTOR = new PythonShell('driverMotor.py');
  this.DRIVER_MOTOR.on('message', function (message) {
    process.stdout.clearLine();
    process.stdout.cursorTo(0);
    process.stdout.write(message);
  });
  this.DRIVER_MOTOR.updatePosition = function(){
    DRIVER = this; DRIVER.isBusy = true;
    setTimeout(function(){ DRIVER.send(DRIVER.position); DRIVER.isBusy = false; }, 500);
  };

};

module.exports.setCamPosition = function(position){
  process.stdout.cursorTo(0);
  process.stdout.write(camLogSign+' new cam position: '+position);
  if( !this.DRIVER_MOTOR ){ console.log(camLogSign, 'module not started!'); }
  if( this.DRIVER_MOTOR.position != position ){
    this.DRIVER_MOTOR.position = position;
    if( !this.DRIVER_MOTOR.isBusy ){ this.DRIVER_MOTOR.updatePosition(); }
  }
};


function handleError(type, code, signal, message, target) {
  console.log(camLogSign, errorLog(' Cam Error:'));
  console.log(`Error handled for ${target.getName()}`);
  console.log(`Command: ffmpeg ${target.getParams()}`);
  console.log('type:', type, 'code:', code, 'signal:', signal, 'message:', message);
  //check which type of error we have, ffmpegExit or watchdogFail
  switch (type) {
    case FW.FFMPEG_EXIT:
    //ffmpeg exited, check code or signal or message
    break;
    case FW.WATCHDOG_FAIL:
    //watchDog is reporting that all attempts at respawning ffmpeg have failed
    break;
  }
}
