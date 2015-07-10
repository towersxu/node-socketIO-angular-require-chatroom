/**
 * Created by taox on 15-6-25.
 */

var sticky = require('./sticky-session');
var process_num = 10;
var process_server = sticky(process_num, function () {

  var http = require('http'),
    sio = require('socket.io'),
    chatroomServer = require('./chatroomServer/chatroomServer');

  var server = http.createServer(function (req, res) {
      res.writeHead(200);
      res.end("success");
    });
  chatroomServer.initChatRoom(server, sio);
  return server;
});
process_server.listen(3000, function () {
  console.log('server started on 3000 port');
});

