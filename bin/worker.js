/**
 * Created by taox on 15-6-25.
 */

var sticky = require('./sticky-session');
var process_num = 15;
var process_port = 8888;
var process_server = sticky(process_num, function () {

  var http = require('http'),
    sio = require('socket.io'),
    chatroomServer = require('./chatroomServer/chatroomServer');

  var server = http.createServer(function (req, res) {
      res.writeHead(200);
      res.end("chat server is running.");
    });
  chatroomServer.initChatRoom(server, sio);
  return server;
});
process_server.listen(process_port, function () {
  console.log('server started on '+process_port+' port');
});

