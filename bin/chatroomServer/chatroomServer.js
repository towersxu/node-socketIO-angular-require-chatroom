/**
 * Created by taox on 15-5-25.
 */
//var cluster = require('cluster');
exports.initChatRoom = function (roomArr, server ,sio) {
  var redis = require('socket.io-redis');
  var io = sio(server);
  var userObject = {};
  io.adapter(redis({host:'localhost',port:6379}));
  process.on("message",function(m,msg){
    if(m && m.handler == "user number"){
      delete m.handler;
      userObject = m;
    }
  });
  io.on('connection',function(socket){
    socket.on("onlineUser Num",function(){
      socket.emit("onlineUser Num",userObject);
    });
    socket.on("join room",function(msg){
      socket.join(msg.roomId);
    });
    socket.on("room chat",function(msg){
      try{
        io.to(msg.roomId).emit("room chat",msg);
      }catch(e){
        socket.emit("error meaasge",{"error":"roomId is required"});
      }
    });
    socket.on("user number",function(msg){
      if(msg.roomId){
        if(!userObject[msg.roomId]){
          userObject[msg.roomId] = 1;
        }
        socket.emit("user number",userObject[msg.roomId]);
      }
    });
    setInterval(function(){
      var rooms = io.sockets.adapter.rooms,
        roomUsers = {},
        i;
      for(i in rooms){
        if(i.length !== 20 && Object.prototype.hasOwnProperty.call(rooms,i)){
          roomUsers[i] = Object.keys(rooms[i]).length;
        }
      }
      process.send({handler:"user number","roomUsers":roomUsers,pid:process.pid});
    },30000);
  });
};


