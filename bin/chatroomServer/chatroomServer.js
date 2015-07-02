/**
 * Created by taox on 15-5-25.
 */

exports.initChatRoom = function (roomArr, server ,sio) {
  var redis = require('socket.io-redis');
  var io = sio(server);
  io.adapter(redis({host:'localhost',port:6379}));
  io.on('connection',function(socket){
    socket.on("join room",function(msg){
      socket.join(msg.roomId);
    });
    socket.on("room chat",function(msg){
      try{
        io.to(msg.roomId).emit("room chat",msg);
      }catch(e){
        socket.emit("error meaasge",{"error":"roomId is required"});
      }
      console.log(io.sockets);
    });
    setInterval(function(){
      var rooms = io.sockets.adapter.rooms;
      for(var i in rooms){
        if(i.length !== 20){
          var num = Object.keys(rooms[i]).length;
          io.to(i).emit("user number",{userNum:num,pid:process.pid});
        }
      }
    },30000);
  });
};


