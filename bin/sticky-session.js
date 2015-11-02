var net = require('net'),
  cluster = require('cluster');
var fs = require('fs');
var winston = require('winston');
var confPath,confErrorPath;
try{
  var conf = fs.readFileSync('./package.json');
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
function hash(ip, seed) {
  var hash = ip.reduce(function (r, num) {
    r += parseInt(num, 10);
    r %= 2147483648;
    r += (r << 10);
    r %= 2147483648;
    r ^= r >> 6;
    return r;
  }, seed);

  hash += hash << 3;
  hash %= 2147483648;
  hash ^= hash >> 11;
  hash += hash << 15;
  hash %= 2147483648;

  return hash >>> 0;
}

module.exports = function sticky(num, callback) {
  var server;

  // `num` argument is optional
  if (typeof num !== 'number') {
    callback = num;
    num = require('os').cpus().length;
  }

  // Master will spawn `num` workers
  if (cluster.isMaster) {

    //var coreNum = require('os').cpus().length;
    //logger.log('warn', 'cpu core num(%d)',coreNum);
    //if(coreNum !== num){
    //  logger.log('warn', 'cpu core num(%d) not equal process num(%d)',coreNum,num);
    //}

    var workers = [];
    for (var i = 0; i < num; i++) {
      !function spawn(i) {
        workers[i] = cluster.fork();
        // Restart worker on exit
        workers[i].on('exit', function (worker, code, signal) {
          logger.log('error', 'sticky-session: worker died:%d', process.pid);
          spawn(i);
        });
        //监听子进程的用户数.
        //workers[i].on('message', function (msg) {
        //  if ("user number" === msg.handler) {
        //    sumUserNum(msg);
        //  }
        //})
      }(i);
    }

    var sumUserObject = {};

    function sumUserNum(msg) {
      sumUserObject[msg.pid] = msg.roomUsers;
    }

    //计算所有的用户数,定时向子进程发送总的用户数.这2个对象遍历我不想承认是为写的.
    //setInterval(function () {
    //  var i, j, userObject = {};
    //  userObject.handler = "user number";
    //  for (i in sumUserObject) {
    //    if (Object.prototype.hasOwnProperty.call(sumUserObject, i)) {
    //      for (j in sumUserObject[i]) {
    //        if (Object.prototype.hasOwnProperty.call(sumUserObject[i], j)) {
    //          if (!userObject[j]) {
    //            userObject[j] = 0;
    //          }
    //          userObject[j] = userObject[j] + sumUserObject[i][j];
    //        }
    //      }
    //    }
    //  }
    //  sendToWork(userObject);
    //}, 30000);
    //function sendToWork(msg) {
    //  for (var i = 0; i < num; i++) {
    //    workers[i].send(msg)
    //  }
    //}

    var seed = ~~(Math.random() * 1e9);
    server = net.createServer(function (c) {
      // Get int31 hash of ip
      var worker,
        ipHash = hash((c.remoteAddress || '').split(/\./g), seed);
      // Pass connection to worker
      worker = workers[ipHash % workers.length];
      //console.log("worker :"+ipHash % workers.length);
      worker.send('sticky-session:connection', c);
    });
  } else {
    server = typeof callback === 'function' ? callback() : callback;

    // Worker process
    process.on('message', function (msg, socket) {
      if (msg !== 'sticky-session:connection') {
        return;
      }
      server.emit('connection', socket);
    });

    if (!server) throw new Error('Worker hasn\'t created server!');

    // Monkey patch server to do not bind to port
    var oldListen = server.listen;
    server.listen = function listen() {
      var lastArg = arguments[arguments.length - 1];

      if (typeof lastArg === 'function') lastArg();

      return oldListen.call(this, null);
    };
  }

  return server;
};
