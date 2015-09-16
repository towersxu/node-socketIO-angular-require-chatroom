/**
 * Created by taox on 15-5-25.
 */
//var cluster = require('cluster');

var fs = require('fs');
var winston = require('winston');
var auth = require('./auth');
var confPath,confErrorPath;
var conf;
try{
  conf = fs.readFileSync('./package.json');
  conf = JSON.parse(conf);
  confPath = conf['warnLog'] || './chatroom-warn.log';
  confErrorPath = conf['warnError'] || './chatroom-error.log';
}catch (e){
  console.log(e);
}
var logger = new (winston.Logger)({
  transports: [
    new (winston.transports.File)({
      name: "error-file",
      filename: confErrorPath,
      level: 'error'
    }),
    new (winston.transports.File)({
      name: "warning-file",
      filename: confPath,
      level: 'warn'
    })
  ]
});
var formatBytes = function (bytes) {
  return (bytes / 1024 / 1024).toFixed(2) + 'MB';
};
exports.initChatRoom = function (server, sio) {
  var redis = require('socket.io-redis');
  var io = sio(server);
  if(conf && conf.origins && conf.origins.length>0){
    var origin='';
    for(var i=0;i<conf.origins.length;i++){
      origin +=conf.origins[i];
      origin +=' ';
    }
    io.set('origins',origin);
  }


  var userObject = {};
  //redis对socket.io进行进程通信。
  io.adapter(redis({host: 'localhost', port: 6379}));
  //定时记录日志
  setInterval(function () {
    var mem = process.memoryUsage();
    var heap;
    try{
      heap = parseInt(formatBytes(mem['heapTotal']));
    }catch (e){
      logger.log('warn','heap = parseInt failed');
      heap=0;
    }
    if(heap >800){
      logger.log('warn', 'pid %d |heapTotal %s |heapUsed %s |rss %s', process.pid, formatBytes(mem.heapTotal), formatBytes(mem.heapUsed), formatBytes(mem.rss));
    }
  }, 600000);
  //子进程接收父进程进行通信。
  process.on("message", function (m, msg) {
    if (m && m.handler == "user number") {
      delete m.handler;
      userObject = m;
    }
  });
  //定时向父进程发送当前进程各房间用户数。
  setInterval(function () {
    var rooms = io.sockets.adapter.rooms,
      roomUsers = {},
      i;
    for (i in rooms) {
      if (i.length !== 20 && Object.prototype.hasOwnProperty.call(rooms, i)) {
        roomUsers[i] = Object.keys(rooms[i]).length;
      }
    }
    process.send({handler: "user number", "roomUsers": roomUsers, pid: process.pid});
  }, 30000);

  io.on('connection', function (socket) {
    //console.log("contection");
    //console.log(io.sockets.adapter.rooms);
    socket.auth = false;
    socket.login = false;
    socket.on("onlineUser Num", function () {
      socket.emit("onlineUser Num", userObject);
    });
    socket.on('authorization',function(msg){
      console.log(msg);
      if(!msg || !(msg.g || msg.t)){
        logger.log('error', 'authorization failed! %s invalid params',msg);
        socket.disconnect();
      }
      if(typeof msg === 'string'){
        try{
          msg = JSON.parse(msg);
        }catch (e){
          logger.log('error', '%s parse string to json fail at authorization', msg);
          socket.disconnect();
        }
      }
      auth.post(msg).then(function(data){
        if(typeof data === 'string'){
          try{
            data = JSON.parse(data);
          }catch (e){
            logger.log('error', 'webserver return wrong data format %s', data);
            //socket.disconnect();
          }
        }
        if(data.b ===1){
          socket.auth = true;
          if(data.o){
            socket.login = true;
          }
        }
      },function(data){
        logger.log('error', 'connect webserver error %s ', data);
        socket.disconnect();
      });
      //var res = auth.post(msg);
      //if(res){
      //  console.log(res);
      //}
    });
    socket.on("join room", function (msg) {
      //console.log("join room");
      //console.log(typeof msg === 'string');
      if(!msg || !socket.auth){
        socket.disconnect();
      }
      if(typeof msg === 'string'){
        try{
          msg = JSON.parse(msg);
        }catch (e){
          logger.log('error', '%s parse string to json fail at join room', msg);
        }
      }
      //console.log(msg);
      //console.log(typeof msg);
      //console.log(msg["roomId"]);
      //console.log(socket.id);
      socket.join(msg["roomId"]);
    });
    socket.on("leave room", function (msg) {
      //console.log("leave room");
      //console.log(msg);
      //console.log(io.nsp);
      socket.leave(msg.roomId);
    });
    socket.on("room chat", function (msg) {
      //console.log(msg);
      if(!msg || !socket.login){
        socket.emit("error meaasge", {"error": "unauthorized"});
        socket.disconnect();
      }
      if(typeof msg === 'string'){
        try{
          msg = JSON.parse(msg);
        }catch (e){
          logger.log('error', '%s parse string to json fail at room chat', msg);
          socket.disconnect();
        }
      }
      try {
        io.to(msg.roomId).emit("room chat", msg);
      } catch (e) {
        socket.emit("error meaasge", {"error": "roomId is required"});
        socket.disconnect();
      }
    });
    socket.on("user number", function (msg) {
      if(typeof msg === 'string'){
        try{
          msg = JSON.parse(msg);
        }catch (e){
          logger.log('error', '%s parse string to json fail at user number', msg);
        }
      }
      if (msg.roomId) {
        if (!userObject[msg.roomId]) {
          userObject[msg.roomId] = 1;
        }
        socket.emit("user number", userObject[msg.roomId]);
      }
    });
  });
};


