const readline = require('readline');
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

rl.on('line', (input) => {
  console.log(`Received: ${input}`);
  if( input == '1' ){
    client.publish("/elements/status/0001", "HIGH");
  }
  else if( input == '2' ){
    client.publish("/elements/status/0001", "LOW");
  }
  else{
  }
});


////////////////////////////////////////////////////////////////////////////////
const mqtt = require('mqtt');

var client = mqtt.connect({
  host: 'localhost',
  clientId: '0001',
  username: '0001',
  password: '0000000000'
});
