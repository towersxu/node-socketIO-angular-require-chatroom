/**
 * Created by taox on 15-6-26.
 */

var mysql = require('mysql');

var connection = {};
connection.CONN = {
  host : '127.0.0.1',
  port : 3306,
  user : "taox",
  password : '123456',
  database : 'CHATDB'
};

connection.setting  =  function(setting){
  if(typeof setting == "object") {
    connection.CONN.host = setting.host || connection.CONN.host;
    connection.CONN.port = setting.port || connection.CONN.port;
    connection.CONN.user = setting.user || connection.CONN.user;
    connection.CONN.password = setting.password || connection.CONN.password;
    connection.CONN.database = setting.database || connection.CONN.database;
  }
};
connection.query = function (sql) {
  var connection = mysql.createConnection(connection.CONN);
  connection.connect();
  connection.query(sql,function(err,rows,fields) {
    if (err) {
      return [{"error":"query error"}]
    }
    return rows;
  });
};
connection.unConnect = function (){
  var roomArr = [{"name":"杨过","id":"1","onlineUser":"100"},
    {"name":"小龙女","id":"2","onlineUser":"100"},
    {"name":"独孤求败","id":"3","onlineUser":"100"},
    {"name":"东方不败","id":"4","onlineUser":"100"},
    {"name":"令狐聪","id":"5","onlineUser":"100"},
    {"name":"韦小宝","id":"6","onlineUser":"100"},
    {"name":"雄霸天下","id":"7","onlineUser":"100"},
    {"name":"雄霸天下2","id":"17","onlineUser":"100"},
    {"name":"雄霸天下3","id":"27","onlineUser":"100"},
    {"name":"雄霸天下4","id":"37","onlineUser":"100"},
    {"name":"雄霸天下5","id":"47","onlineUser":"100"},
    {"name":"雄霸天下6","id":"57","onlineUser":"100"},
    {"name":"雄霸天下7","id":"67","onlineUser":"100"},
    {"name":"风云","id":"8","onlineUser":"100"}];
  return roomArr;
};

exports.msq = connection;
exports.unConnect = connection.unConnect;