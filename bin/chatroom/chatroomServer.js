/**
 * Created by taox on 15-5-25.
 */

var socketIO = require('socket.io');
exports.initChatRoom = function (roomArr, server) {
  var io = socketIO(server);
  for (var i = 0; i < roomArr.length; i++) {
    var roomNamespace = io.of("/"+roomArr[i].id);
    roomConnected(roomNamespace);
  }
};
function roomConnected(roomNamespace){
  console.log("init namespace"+roomNamespace);
  roomNamespace.on("connection",function(socket){
    console.log("a user connected");
    console.log(socket.id);
  });
}