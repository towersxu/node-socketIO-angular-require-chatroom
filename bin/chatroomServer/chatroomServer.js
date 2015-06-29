/**
 * Created by taox on 15-5-25.
 */

var roomNamespaceArr = [],
  roomConnected = require('./socketListener');
exports.initChatRoom = function (roomArr, server ,sio) {
  var redis = require('socket.io-redis');
  var io = sio(server);
  io.adapter(redis({host:'localhost',port:6379}));
  //io.use(function(socket,next){
  //  console.log("---------------->")
  //  console.log(socket);
  //  return next();
  //});
  for (var i = 0; i < roomArr.length; i++) {
    var roomNamespace = io.of("/"+roomArr[i].id);
    roomConnected(roomNamespace);
    //roomNamespaceArr.push(roomNamespace);
  }
  io.on('connection',function(socket){
    socket.on("create room",function(msg){
      console.log("***************");
      console.log(msg);
      var roomNamespace = io.of(msg.roomId);
      roomConnected(roomNamespace);
      socket.emit("create namespace",{status:"success"});
    });
  });
};


