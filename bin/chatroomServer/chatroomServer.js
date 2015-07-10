/**
 * Created by taox on 15-5-25.
 */
//var cluster = require('cluster');
var winston = require('winston');
var logger = new (winston.Logger)({
  transports: [
    new (winston.transports.File)({
      name: "info-file",
      filename: "filelog-info-7-9.2.log",
      level: 'info'
    })
  ]
});
var formatBytes = function (bytes) {
  return (bytes / 1024 / 1024).toFixed(2) + 'MB';
};
exports.initChatRoom = function (server, sio) {
  var redis = require('socket.io-redis');
  var io = sio(server);
  var userObject = {};
  //redis对socket.io进行进程通信。
  io.adapter(redis({host: 'localhost', port: 6379}));
  //定时记录日志
  setInterval(function () {
    var mem = process.memoryUsage();
    logger.log('info', 'pid %d |heapTotal %s |heapUsed %s |rss %s', process.pid, formatBytes(mem.heapTotal), formatBytes(mem.heapUsed), formatBytes(mem.rss));
  }, 60000);
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
    socket.on("onlineUser Num", function () {
      socket.emit("onlineUser Num", userObject);
    });
    socket.on("join room", function (msg) {
      socket.join(msg.roomId);
    });
    socket.on("room chat", function (msg) {
      try {
        io.to(msg.roomId).emit("room chat", msg);
      } catch (e) {
        socket.emit("error meaasge", {"error": "roomId is required"});
      }
    });
    socket.on("user number", function (msg) {
      if (msg.roomId) {
        if (!userObject[msg.roomId]) {
          userObject[msg.roomId] = 1;
        }
        socket.emit("user number", userObject[msg.roomId]);
      }
    });
  });
};


