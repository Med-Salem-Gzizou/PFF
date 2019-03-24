var express = require('express')
var app = express();

// session parser
var sharedsession = require("express-socket.io-session");
var session = require('express-session')({secret: "This Is The Secret Code"});
app.use(session);

var server = require('http').Server(app);
var io = require('socket.io')(server);
io.use(sharedsession(session, { autoSave:true })); // Share session with io sockets

var tcpPort = (process.argv[2])? process.argv[2]: 8080;
app.set('port', (process.env.PORT || tcpPort));

app.use(express.static(__dirname + '/public'));

// views is directory for all template files
app.set('views', __dirname + '/views');
app.set('view engine', 'ejs');

// for parse get request
var bodyparser = require('body-parser');
app.use(bodyparser.urlencoded({extended: false}));

var usersDb = require('./users_db.json'); // import users database
var HomeStatusDb = {};

// http request handler  //////////////////////////////////////////////
app.get('/', function(request, response){
  response.render('pages/index');
});

app.get('/login', function(request, response){
  if(request.session.user){
    response.redirect('/home');
  }else{
    response.render('pages/login', {error: false} );
  }
});
app.post('/login', function(req, res){
  if(usersDb[req.body.user] && req.body.pass === usersDb[req.body.user].pass ){
    console.log('[index.js] new user login:', req.body.user, req.body.pass);
    req.session.user = req.body.user;
    res.redirect('/home');
  }else{
    res.render('pages/login', {error: true} );
  }
});

app.get('/home', function(request, response){
  if(request.session.user){
    response.render('pages/home');
  }else{
    response.redirect('/login');
  }
});

// REST api connection //////////////////////////////////////////////
app.get('/api', function(req, res){
  console.log('[index.js] new REST api call:', req.query);

  if(usersDb[req.query.user] && req.query.key == usersDb[req.query.user].pass){
    if(req.query.cmd){
      if(socketDb[req.query.user] && socketDb[req.query.user].home){
        socketDb[req.query.user].home.emit('cmd', req.query.cmd);
        res.json({'server_log': 'ok'});
      }else{
        res.json({'server_log': 'home_offline'});
      }
    }
    else{
      if(socketDb[req.query.user] && socketDb[req.query.user].home){
        res.json(HomeStatusDb[req.query.user]);
      }else{
        res.json({'server_log': 'home_offline'});
      }
    }
  }else{
    res.json({'server_log': 'error'});
  }

});



// socket connection //////////////////////////////////////////////

io.use(function(socket, next){
  console.log('[index.js] socket midelware:', socket.handshake.url);
  var socket_connectionType = (socket.handshake.query.connectionType)? socket.handshake.query.connectionType: 'users';

  // check session authentication
  if(socket.handshake.session.user && usersDb[socket.handshake.session.user]){
    var socket_user = socket.handshake.session.user;
    console.log('[index.js] socket: session user connection:', socket_user, socket_connectionType);

  // socket login and create session
  }else if(socket.handshake.query.user && usersDb[socket.handshake.query.user]
        && socket.handshake.query.pass === usersDb[socket.handshake.query.user].pass){
    var socket_user = socket.handshake.query.user;
    socket.handshake.session.user = socket_user;
    console.log('[index.js] socket: login:', socket_user, socket.handshake.query.pass);

  // not authorized connection
  }else{
    console.log('[index.js] socket: not authorized connection !');
    socket.emit('log', 'not.authorized');
    return 0;
  }

  // join rooms and set connectionType
  if(socket_connectionType === 'users'){
    socket.join('usersRoom-'+socket_user); socket.connectionType = 'users';
  }else if(socket_connectionType === 'homeServer'){
    socket.join('homeServer-'+socket_user); socket.connectionType = 'homeServer';
  }else if(socket_connectionType === 'homeCam'){
    socket.join('homeCam-'+socket_user); socket.connectionType = 'homeCam';
  }else if(socket_connectionType === 'usersCam'){
    socket.join('usersCam-'+socket_user); socket.connectionType = 'usersCam';
  }

  return next();
});

io.on('connection', (socket) => {
  console.log("[index.js] socket: authorized connection type:", socket.connectionType);
  console.log("rooms infor:", io.nsps['/'].adapter.rooms);

  if(socket.connectionType === 'users'){
    if(HomeStatusDb[socket.handshake.session.user]){
      socket.emit('elements_info_update', HomeStatusDb[socket.handshake.session.user]);
    }else{ socket.emit('server_log', 'home_offline'); }
  }
  else if(socket.connectionType === 'homeServer'){
    io.sockets.in("usersRoom-"+socket.handshake.session.user).emit('server_log', 'home_online');
  }
  else if(socket.connectionType === 'usersCam'){
    if( !HomeStatusDb[socket.handshake.session.user] ){
      console.log('[index.js] no home to serve cam');
    }else{
      console.log('[index.js] asking home for cam connection');
      io.sockets.in("homeServer-"+socket.handshake.session.user).emit('cam_cmd', 'start');
    }
  }

  socket.on('message', (data) => {
    console.log('[index.js] new message', data);
  });

  // web clients
  socket.on('elements_command', (elements_command) => {
    console.log('[index.js] new element command:', elements_command);
    io.sockets.in("homeServer-"+socket.handshake.session.user).emit('elements_command', elements_command);
  });
  socket.on('message_command', (message_command) => {
    console.log('[index.js] new message command:', message_command);
    io.sockets.in("homeServer-"+socket.handshake.session.user).emit('message_command', message_command);
  });
  socket.on('set_cam_pos', (cam_pos) => {
    console.log('[index.js] new set_cam_pos:', cam_pos);
    io.sockets.in("homeServer-"+socket.handshake.session.user).emit('set_cam_pos', cam_pos);
  });

  // home server
  socket.on('elements_info_update', (elements_info_update) => {
    console.log('[index.js] new elements_info_update:', elements_info_update);
    io.sockets.in("usersRoom-"+socket.handshake.session.user).emit('elements_info_update', elements_info_update);
    updateHomeStatusDb(socket.handshake.session.user, {'elements_info_update': elements_info_update});
  });
  socket.on('elements_status_update', (elements_status_update) => {
    console.log('[index.js] new elements_status_update:', elements_status_update);
    io.sockets.in("usersRoom-"+socket.handshake.session.user).emit('elements_status_update', elements_status_update);
    updateHomeStatusDb(socket.handshake.session.user, {'elements_status_update': elements_status_update});
  });
  socket.on('message_responce', (message_responce) => {
    console.log('[index.js] new message_responce:', message_responce);
    io.sockets.in("usersRoom-"+socket.handshake.session.user).emit('message_responce', message_responce);
  });
  socket.on('camStream', (streaming_data) => {
    io.sockets.in("usersCam-"+socket.handshake.session.user).emit('camStream', streaming_data);
  });

  socket.on('disconnect', () => {
    console.log('[index.js] Client disconnected:', socket.handshake.session.user, socket.connectionType);
    if(socket.connectionType === 'homeServer'){
      HomeStatusDb[socket.handshake.session.user] = undefined;
      io.sockets.in("usersRoom-"+socket.handshake.session.user).emit('server_log', 'home_offline');
    }
    else if(socket.connectionType === 'usersCam'
         && !io.nsps['/'].adapter.rooms['usersCam-'+socket.handshake.session.user]){
      io.sockets.in("homeServer-"+socket.handshake.session.user).emit('cam_cmd', 'stop');
    }
  });

});

server.listen(app.get('port'), function() {
  console.log('[index.js] Node app is running on port', app.get('port'));
});

////////////////////////////////////////////

function updateHomeStatusDb(user, data){
  if(!HomeStatusDb[user]){ HomeStatusDb[user] = {}; }
  if(data.elements_info_update){
    Object.keys(data.elements_info_update).forEach(function(id){
      HomeStatusDb[user][id] = data.elements_info_update[id];
    });
  }
  if(data.elements_status_update){
    Object.keys(data.elements_status_update).forEach(function(id){
      HomeStatusDb[user][id].statu = data.elements_status_update[id];
    });
  }
}
