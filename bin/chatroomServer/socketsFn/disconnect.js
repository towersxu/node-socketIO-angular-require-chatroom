/**
 * Created by taox on 15-9-21.
 */
var redis = require("redis"),
  client = redis.createClient();

function disconnect(socket){
  client.hdel(['sockets',socket.id],function(err,obj){
    if(err){
      redisLogger.log('error', 'chatroom 103 socket disconnect hdel error %s',err );
    }
  });
  client.hget(['rooms',socket.id],function(err,roomId){
    if(roomId){
      client.hdel(['rooms',socket.id],function(err,res){
      });
      client.zrem([roomId,socket.id],function(){
      });
    }
  });
}
exports
