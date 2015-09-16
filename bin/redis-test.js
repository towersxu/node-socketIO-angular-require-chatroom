/**
 * Created by taox on 15-9-15.
 */
//var redis = require("redis"),
//  client = redis.createClient();
//client.on("error", function (err) {
//  console.log("Error " + err);
//});
//
//client.set("string key", "string val", redis.print);
//client.hset("hash key", "hashtest 1", "some value", redis.print);
//client.hset(["hash key", "hashtest 2", "some other value"], redis.print);
//client.hkeys("hash key", function (err, replies) {
//  console.log(replies.length + " replies:");
//  replies.forEach(function (reply, i) {
//    console.log("    " + i + ": " + reply);
//  });
//  client.quit();
//});

//var http = require('http');
//var options =
//{
//  hostname : 'www.baidu.com',
//  port : 80,
//  method : 'GET',
//  handers:{
//
//  }
//};
//var req = http.request(options,function(res){
//  console.log(res);
//  console.log('STATUS:' + res.statusCode);
//  console.log('HEADERS:' + JSON.stringify(res.headers));
//  res.setEncoding('utf8');
//  res.on('data',function(chunk){
//    console.log('BODY' + chunk);
//  });
//});
//
//req.on('response',function(){
//  console.log(arguments);
//});
//
//req.on('connect',function(){
//
//});
//
//req.on('socket',function(){
//
//});
//
//req.on('upgrade',function(){
//
//});
//req.on('error',function(e){
//  console.log(e.message);
//});

var http =require('http');
var data = {
  address: 'test@test.com',
  subject: "test"
};

data = JSON.stringify(data);
console.log(data);
var opt = {
  method: "POST",
  host: "localhost",
  port: 3000,
  path: "/v/j/im/v",
  headers: {
    "Content-Type": 'application/json'
  }
};

var req = http.request(opt, function (serverFeedback) {
  if (serverFeedback.statusCode == 200) {
    console.log(serverFeedback);
    serverFeedback.on('data',function(data){
      console.log('>>>>>>>>>>');
      console.log(data);
      console.log(data.toString());
    });
  } else {
    console.log('url wrong');
  }
});
req.on('error',function(e){
  console.log(e.message);
});
req.write(data + "\n");
req.end();
