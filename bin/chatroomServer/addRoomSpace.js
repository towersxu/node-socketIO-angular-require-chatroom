/**
 * Created by taox on 15-6-29.
 */
var roomConnected = require('./socketListener');
var redis = require('socket.io-redis');
exports.addChatRoom = function (roomId, server ,sio) {
  console.log("init room");
  var io = sio(server);
  io.adapter(redis({host:'localhost',port:6379}));
  io.on('connection',function(socket){
    console.log("===========================>");
    console.log(arguments);
  });
  var roomNamespace = io.of("/"+roomId);
  roomConnected(roomNamespace);

  return roomNamespace;
};
