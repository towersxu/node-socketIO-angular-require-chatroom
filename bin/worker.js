/**
 * Created by taox on 15-6-25.
 */

var sticky = require('sticky-session');
var process_num =10;
var process_server = sticky(process_num, function () {

  var http = require('http'),
    sio = require('socket.io'),
    msq = require('./dbConnection/mysqlConn').msq,
    chatroomServer = require('./chatroomServer/chatroomServer');
  var server = http.createServer(function (req, res) {
      //console.log(req);
      res.writeHead(200);
      res.end("success");
    //res.end('worker:' + process.env, NODE_WORKER_ID);
  }),
  roomArr = msq.unConnect();
  chatroomServer.initChatRoom(roomArr,server,sio);
  return server;
});
process_server.listen(3001, function () {
  console.log('server started on 3001 port');
});