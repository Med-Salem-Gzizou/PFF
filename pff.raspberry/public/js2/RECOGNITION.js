// voice RECOGNITION and msg handler

var SpeechRecognition = SpeechRecognition || webkitSpeechRecognition;
var SpeechRecognitionEvent = SpeechRecognitionEvent || webkitSpeechRecognitionEvent;
var RECOGNITION = new SpeechRecognition();
RECOGNITION.lang = 'en-US'; // ar-TN , en-US inter.languageOption.val()

RECOGNITION.onresult = function(event) {
   var last = event.results.length - 1;
   var msg = event.results[last][0].transcript;
   var confi = event.results[0][0].confidence ;
   console.log('[RECOGNITION] Speech detected:', msg);
   console.log('[RECOGNITION] Confidence:', confi);

   UI.showMessage(msg);
   PROTOCOL.sendMsg(this.lang, msg, confi);
 };

RECOGNITION.onspeechend = function() {
  console.log('[RECOGNITION] Speech end');
  this.stopRecognition();
};

RECOGNITION.onerror = function(event) {
  console.log('[RECOGNITION] Error:', event.error);
  this.stopRecognition();
};

RECOGNITION.stopRecognition = function(){
  console.log('[RECOGNITION] Stop recognition');
  this.stop();
  UI.assistant_modal.modal('hide');
};

$(document).ready(function() {
  console.log('[RECOGNITION] ready');
});
