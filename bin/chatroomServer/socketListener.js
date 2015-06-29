/**
 * Created by taox on 15-6-29.
 */
module.exports = function roomConnected(roomNamespace){
  console.log("init roomspace:"+roomNamespace.name);
  roomNamespace.on("connection",function(socket){
    console.log(socket.id+":"+roomNamespace.name);
    socket.emit('user number',{userNum:roomNamespace.sockets.length});
    socket.on("room chat", function (msg) {
      console.log("room chat");
      console.log(msg);
      roomNamespace.emit('room chat',msg);
    });
  });
  setInterval(function(){
    roomNamespace.emit('user number',{userNum:roomNamespace.sockets.length,pid:process.pid});
  },20000);
};