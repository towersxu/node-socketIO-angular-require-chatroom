/**
 * Created by taox on 15-6-1.
 */

//var assert = require("assert");
var should = require('should');
describe("mysqlConn",function(){

  it("should return array when use function unConnect",function(){
    var mysqlConn = require('../bin/dbConnection/mysqlConn');
    mysqlConn.msq.unConnect().should.be.an.instanceOf(Array);
  });
  it("should use defualt connect settings",function(){
    var mysqlConn = require('../bin/dbConnection/mysqlConn');
    mysqlConn.msq.setting({port:3306}).host.should.equal("127.0.0.1");
  });
  it("should return error that args should be an object",function(){
    var mysqlConn = require('../bin/dbConnection/mysqlConn');
    var settings = "192.168.1.106";
    mysqlConn.msq.setting(settings).status.should.equal("error");
    mysqlConn.msq.setting(settings).info.should.equal("args should be an object");
  });
  it("should set mysql connection setting",function(){
    var mysqlConn = require('../bin/dbConnection/mysqlConn');
    var settings = {
      host:"192.168.1.106",
      user:"taox",
      password:"123456",
      database:"roomDb"
    };
    mysqlConn.msq.setting(settings).host.should.equal("192.168.1.106");
    mysqlConn.msq.setting(settings).port.should.equal(3306);
  });
  it("should query from mysql use sql",function(){
    var mysqlConn = require('../bin/dbConnection/mysqlConn');
    mysqlConn.msq.query("select * from chatroom").should.be.an.instanceOf(Array);
  });

});

//describe('socketListener',function(){
//
//  it("should be a function",function(){
//    var socketListener = require('../bin/chatroomServer/socketListener');
//    socketListener.should.be.type('function');
//  });
//
//  it("create a namespace linstener",function(){
//    var socketListener = require('../bin/chatroomServer/socketListener');
//    var http = require('http');
//    var server = http.createServer(function (req, res) {
//        res.writeHead(200);
//        res.end("success");
//      });
//    var sio = require('socket.io');
//    var io = sio(server);
//    var namespace = io.of('/1');
//
//    socketListener(namespace);
//
//  })
//});