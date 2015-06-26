/**
 * Created by taox on 15-6-25.
 */

var sticky = require('sticky-session');
sticky(function() {

  var http = require('http'),
    sio = require('socket.io');
  var server = http.createServer(function(req,res) {
    res.end('worker:'+process.env,NODE_WORKER_ID);
  });
  sio(server).of("/1").on("connection",function(socket){
    socket.emit('user number',{userNum:this.sockets.length});
    console.log("加入房间，此房间人数为:"+this.sockets.length);
  });
  return server;
}).listen(3001,function(){
  console.log('server started on 3000 port');
});