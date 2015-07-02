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
      userObject = m;
    }
  });
  //io.on("lala",function(msg){
  //  console.log(msg);
  //});
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
    setInterval(function(){
      var i;
      for(i in userObject){
        if(i !== "handler" && Object.prototype.hasOwnProperty.call(userObject,i)){
          io.to(i).emit("user number",{userNum:userObject[i]});
        }
      }
    });
  });
};


