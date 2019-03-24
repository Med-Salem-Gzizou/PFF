const readline = require('readline');
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});


var id   = '0002';
var user = '0002';
var pass = '2222222222';

const mqtt = require('mqtt');
const client = mqtt.connect({
  host: 'localhost',
  clientId: id,
  username: user,
  password: pass
});

var statu = 'LOW';

client.on('connect', () => {
  client.subscribe('/elements/command/'+user);
  client.publish('/elements/status/'+user, statu);
});


client.on('message', (topic, message) => {
  statu = message.toString();
  console.log('new mesg topic:', topic, 'message:', message.toString() );
});



rl.on('line', (input) => {
  console.log(`Received: ${input}`);
  if( input === 'h' ){
    statu = 'HIGH';
    client.publish("/elements/status/"+user, "HIGH");
  }
  else if( input === 'l' ){
    statu = 'LOW';
    client.publish("/elements/status/"+user, "LOW");
  }
  else{
    client.publish("/elements/status/"+user, statu);
  }
});
