var mosca = require('mosca');

var server = new mosca.Server({port: 1883});
server.on('ready', setup);  //on init it fires up setup()

// fired when the mqtt server is ready
function setup() {
  console.log('Mosca server is up and running');

  // Accepts  connections
  server.authenticate = function(client, username, password, callback) {
    console.log("authenticate :", username, password.toString());
    client.user = username;
    callback(null, true);
  };

  // authorize Publish
  server.authorizePublish = function(client, topic, payload, callback) {
    callback(null, client.user == topic.split('/')[3]);
  };

  // authorize Subscribe
  server.authorizeSubscribe = function(client, topic, callback) {
    callback(null, client.user == topic.split('/')[3]);
  }
};

// fired when a message is published
server.on('published', function(packet, client) {
  //console.log('Published', packet);
  console.log("############  new message  ###############");
  console.log("## topic:", packet.topic.split('/') );
  console.log("## payload:", packet.payload.toString() );
  console.log('## Client:', (client)? client.id: client);
});
// fired when a client connects
server.on('clientConnected', function(client) {
  console.log('Client Connected:', client.id);
});

// fired when a client disconnects
server.on('clientDisconnected', function(client) {
  console.log('Client Disconnected:', client.id);
});
