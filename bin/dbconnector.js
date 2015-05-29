/**
 * Created by taox on 15-5-20.
 */
var mysql = require('mysql');
var chatserver = require('./chatserver');
var chatroomServer = require('./chatroom/chatroomServer');
exports.connect =  function(server){
  var connection = mysql.createConnection({
    host     : '192.168.1.45',
    port     :  3306,
    user     : 'taox',
    password : '123456',
    database : 'chatdb'
  });

  connection.connect();
  connection.query('SELECT * from room',function(err,rows,fields){
    if(err){
      console.log(err);
      throw  err;
    }
    //使用自定义房间方式。
    chatserver.setChatRoom(rows,server);
    //使用房间和namespace对应方式实现聊天。
    //chatroomServer.initChatRoom(rows,server);
  });

  connection.end();
};