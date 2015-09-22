/**
 * Created by taox on 15-5-25.
 */
//var cluster = require('cluster');

var fs = require('fs');
var winston = require('winston');
var auth = require('./auth');
var access = require('./access');
var confPath, confErrorPath, confRedisPath;
var redis = require("redis"),
  client = redis.createClient();
var conf;
try {
  conf = fs.readFileSync('./package.json');
  conf = JSON.parse(conf);
  confPath = conf['warnLog'] || './chatroom-warn.log';
  confErrorPath = conf['warnError'] || './chatroom-error.log';
  confRedisPath = conf['redisError'] || './redis-error.log';
} catch (e) {
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
var redisLogger = new (winston.Logger)({
  transports: [
    new (winston.transports.File)({
      name: "redis-error",
      filename: confRedisPath,
      level: 'error'
    })
  ]
});
var formatBytes = function (bytes) {
  return (bytes / 1024 / 1024).toFixed(2) + 'MB';
};
exports.initChatRoom = function (server, sio) {
  var redis = require('socket.io-redis');
  var io = sio(server);
  //if(conf && conf.origins && conf.origins.length>0){
  //  var origin='';
  //  for(var i=0;i<conf.origins.length;i++){
  //    origin +=conf.origins[i];
  //    origin +=' ';
  //  }
  //  io.set('origins',origin);
  //}
  var userObject = {};
  //redis对socket.io进行进程通信。
  io.adapter(redis({host: 'localhost', port: 6379}));
  //每隔10分钟记录内存情况
  setInterval(function () {
    var mem = process.memoryUsage();
    var heap;
    try {
      heap = parseInt(formatBytes(mem['heapTotal']));
    } catch (e) {
      logger.log('warn', 'heap = parseInt failed');
      heap = 0;
    }
    if (heap > 800) {
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
      if (i.length !== 20 && Object.prototype.hasOwnProperty.call(rooms, i)) {  //i==20表示这是socket.id
        roomUsers[i] = Object.keys(rooms[i]).length;
      }
    }
    process.send({handler: "user number", "roomUsers": roomUsers, pid: process.pid});
  }, 30000);

  io.on('connection', function (socket) {
    socket.auth = false;
    socket.login = false;
    //socket.on("onlineUser Num", function () {
    //  socket.emit("onlineUser Num", userObject);
    //});
    socket.on('disconnect', function () {
      client.hget(['sockets',socket.id],function(err,obj){
        if(obj){
          obj = str2json(obj);
          client.hdel(['users',obj.id],function(err,obj){});
          client.hdel(['sockets',socket.id],function(err,obj){});
        }
      });
      client.hdel(['sockets', socket.id], function (err, obj) {
        if (err) {
          redisLogger.log('error', 'chatroom 103 socket disconnect hdel error %s', err);
        }
      });
      client.hget(['rooms', socket.id], function (err, roomId) {
        if (roomId) {
          client.hdel(['rooms', socket.id], function (err, res) {
          });
          client.zrem([roomId, socket.id], function () {
          });
        }
      });
    });
    /*认证，用户链接时需要将t或者g传递给webserver端认证*/
    socket.on('authorization', function (msg) {
      msg = str2json(msg);
      if (!msg || !(msg.g || msg.t)) {
        logger.log('error', 'authorization failed! %s invalid params', msg);
        socket.disconnect();
      }
      auth.post(msg).then(function (data) {
        data = str2json(data);
        if (data.b === 1) {
          socket.auth = true;
          if (data.o) {
            socket.login = true;
            client.hset(['sockets', socket.id, JSON.stringify(data.o)], function () {});
          } else {
            //游客数目加一
            socket.login = false;
          }
        } else {
          socket.auth = false;
        }
        socket.emit('authorization', {isLogin: socket.login, isAuth: socket.auth})
      }, function (data) {
        logger.log('error', 'connect webserver error %s ', data);
        socket.disconnect();
      });
    });
    /*加入房间，需要将从webserver端获取的用户信息返回给前端*/
    socket.on("join room", function (msg) {
      msg = str2json(msg);
      if(validParam(socket,msg,'roomId')){
        if (!socket.auth) {
          socket.disconnect();
        } else if (socket.login) {
          //将该用户信息存入房间管理员人员列表
          client.hget('sockets', socket.id, function (err, obj) {
            //console.log(arguments);
            if (obj) {
              var userInfo = JSON.parse(obj);
              var level = 0;
              if (userInfo.f && userInfo.f.length > 0) {  //用户是否被禁言
                for (var j = 0; j < userInfo.f.length; j++) {
                  if (userInfo.f[j] == msg["roomId"]) {
                    level = 1;
                  }
                }
              }
              if (userInfo.m && userInfo.m.length > 0) { //用户是否时该房间的管理员
                for (var i = 0; i < userInfo.m.length; i++) {
                  if (userInfo.m[i] == msg["roomId"]) {
                    level = 2;
                  }
                }
              }
              if (userInfo.cid == msg["roomId"]) {      //该用户是否时主播
                level = 3;
              }
              client.zadd([msg["roomId"], level, socket.id], function (err, res) {});
              client.hset(["rooms", socket.id, msg["roomId"]], function (err, res) {});
              client.hset(['users', userInfo.id, socket.id], function (err,res) {});
              socket.emit('join room', userInfo);
              socket.join(msg["roomId"]);
            }
          });
        } else {
          socket.join(msg["roomId"]);
        }
      }
    });
    /*获取房间用户列表*/
    socket.on('room users', function (msg) {
      //获取房间用户列表
      if (!msg || !msg["roomId"] || !socket.login) {
        socket.disconnect();
      }
      /*获取房间管理员列表*/
      client.zrangebyscore([msg["roomId"], 2, 2], function (err, data) {
        if (data && data.length > 0) {
          data.unshift('sockets');
          client.hmget(data, function (err, res) {
            socket.emit('room manager', res);
          });
        }else{
          socket.emit('room manager',[])
        }
      });
      /*获取房间被禁人员列表*/
      client.zrangebyscore([msg["roomId"], 1, 1], function (err, data) {
        if (data && data.length > 0) {
          data.unshift('sockets');
          client.hmget(data, function (err, res) {
            socket.emit('room banner', res);
          });
        }else{
          socket.emit('room banner',[])
        }
      });
    });
    /*离开房间，主要因为angular切换路由的时候并不会退出房间，所以需要提供一个接口*/
    socket.on("leave room", function (msg) {
      socket.leave(msg.roomId);
    });
    /*聊天，需要通过authorized*/
    socket.on("room chat", function (msg) {
      //console.log(msg);
      msg = str2json(msg);
      if (!msg || !socket.login || !msg.roomId) {
        socket.emit("error meaasge", {"error": "unauthorized"});
        socket.disconnect();
      }
      io.to(msg.roomId).emit("room chat", msg);
    });
    /*发送在线用户数*/
    socket.on("user number", function (msg) {
      if (typeof msg === 'string') {
        try {
          msg = JSON.parse(msg);
        } catch (e) {
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
    /*赠送礼物*/
    socket.on("send gift",function(msg){
      msg = str2json(msg);
      if (!msg || !socket.login || !msg.roomId) {
        socket.emit("error meaasge", {"error": "unauthorized"});
        socket.disconnect();
      }
      io.to(msg.roomId).emit("send gift", msg);
    });
    /*提升为管理员*/
    socket.on("set manager", function (msg) {
      msg = str2json(msg);
      if (validParam(socket, msg, 'roomId', 'uId','bId')) {
        access.socketLevel(socket.id, msg.roomId).then(function (data) {
          if (data == 3) {
            access.userLevel(msg['uId'], msg.roomId).then(function (data1){
              if(data1 == 0){  //普通用户才能被提升为管理员
                auth.post({
                  'b': msg['bId'],
                  'u': msg['uId'],
                  'c': msg['roomId']
                }, '/v/j/im/u').then(function (data) {
                  data = str2json(data);
                  if (data.b === 1) {
                    io.to(msg.roomId).emit("sys msg", msg);
                  } else {
                    socket.emit("room error", data);
                  }
                });
              }
            });
          } else {
            socket.disconnect();
            logger.log('error', 'set manager access error ', msg);
          }
        },function(err){
          console.log(err);
        });
      }
    });
    /*取消管理员*/
    socket.on("cancel manager", function (msg) {
      msg = str2json(msg);
      if (validParam(socket, msg, 'roomId', 'uId')) {
        access.socketLevel(socket.id, msg.roomId).then(function (data) {
          if (data == 3) {
            access.userLevel(msg['uId'], msg.roomId).then(function (data1){
              if(data1 == 2){  //只有是管理员才能被取消
                auth.post({
                  'b': msg['bId'],
                  'u': msg['uId'],
                  'c': msg['roomId']
                }, '/v/j/im/c').then(function (data) {
                  data = str2json(data);
                  if (data.b === 1) {
                    io.to(msg.roomId).emit("sys msg", msg);
                  } else {
                    socket.emit("room error", data);
                  }
                });
              }
            });
          } else {
            socket.disconnect();
            logger.log('error', 'set manager access error ', msg);
          }
        },function(err){
          console.log(err);
        });
      }
    });
    /*禁言*/
    socket.on("ban chat", function (msg) {
      msg = str2json(msg);
      if(validParam(socket,msg,'roomId','uId','bId')){
        access.socketLevel(socket.id, msg.roomId).then(function (data) {
          if (data == 3 || data == 2) {
            access.userLevel(msg['uId'], msg.roomId).then(function (data1){
              if(data1 == 0){  //普通用户才能被禁言
                auth.post({
                  'a': msg['bId'],
                  'u': msg['uId'],
                  'c': msg['roomId']
                }, '/v/j/im/b').then(function (data) {
                  data = str2json(data);
                  if (data.b === 1) {
                    io.to(msg.roomId).emit("sys msg", msg);
                  } else {
                    socket.emit("room error", data);
                  }
                });
              }
            });
          } else {
            socket.disconnect();
            logger.log('error', 'set manager access error ', msg);
          }
        },function(err){
          console.log(err);
        });
      }
    });
    /*解禁*/
    socket.on("unban chat", function (msg) {
      msg = str2json(msg);
      if(validParam(socket,msg,'roomId','uId','bId')){
        access.socketLevel(socket.id, msg.roomId).then(function (data) {
          if (data == 3 || data == 2) {
            access.userLevel(msg['uId'], msg.roomId).then(function (data1){
              if(data1 == 1){  //被禁言才能解除禁言
                auth.post({
                  'a': msg['bId'],
                  'u': msg['uId'],
                  'c': msg['roomId']
                }, '/v/j/im/ub').then(function (data) {
                  data = str2json(data);
                  //如果提升用户成功
                  if (data.b === 1) {
                    io.to(msg.roomId).emit("sys msg", msg);
                  } else {
                    socket.emit("room error", data);
                  }
                });
              }
            });
          } else {
            socket.disconnect();
            logger.log('error', 'set manager access error ', msg);
          }
        });
      }
    });
  });
};
function str2json(msg) {
  if (typeof msg === 'string') {
    try {
      msg = JSON.parse(msg);
    } catch (e) {
      logger.log('error', '%s parse string to json fail at set manager', msg);
      msg = {}
    }
  }
  return msg;
}
function validParam() {
  for (var i = 2; i < arguments.length; i++) {
    if (!arguments[1] || !arguments[1][arguments[i]]) {
      arguments[0].disconnect();
      logger.log('error', 'valid param failed %s', arguments);
      return false;
    }
  }
  return true;
}
/*如果满足权限认证则执行回调*/
function validAdminback() {

}

