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
  //for (var i = 0; i < roomArr.length; i++) {
  //  var roomNamespace = io.of("/"+roomArr[i].id);
  //  roomConnected(roomNamespace);
  //  //roomNamespaceArr.push(roomNamespace);
  //}
  var roomUserNum = {};
  io.on('connection',function(socket){
    socket.on("join room",function(msg){
      socket.join(msg.roomId);
      //console.log(socket);
      //console.log(io);
      //console.log(socket.adapter.rooms);
      //var rooms = io.sockets.adapter.rooms;
      //for(var i in rooms){
      //  console.log(i.length);
      //}
      //io.to(msg.roomId).emit("user number",{userNum:Object.keys(socket.adapter.rooms[msg.roomId]).length,pid:process.pid});
    });
    socket.on("room chat",function(msg){
      io.to(msg.roomId).emit("room chat",msg);
    });

    //var roomUserNum = {};
    setInterval(function(){
      var rooms = io.sockets.adapter.rooms;
      //console.log(rooms);
      for(var i in rooms){
        if(i.length !== 20 ){
          var num = Object.keys(rooms[i]).length;
          io.to(i).emit("user number",{userNum:num,pid:process.pid});
        }
      }
    },30000);

    socket.on("create room",function(msg){
      console.log("***************");
      console.log(msg);
      var roomNamespace = io.of(msg.roomId);
      roomConnected(roomNamespace);
      socket.emit("create namespace",{status:"success"});
    });
  });
};


