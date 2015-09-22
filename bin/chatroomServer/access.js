/**
 * Created by taox on 15-9-21.
 */
var Q = require('q');
var redis = require("redis"),
  client = redis.createClient();
/*包括broadcaster和manager*/

function socketLevel(socketId, rId) {
  var deferred = Q.defer();
  var level = 0;
  var id = 0;
  //console.log('通过socket.id获取用户信息');
  //console.log(socketId);
  //console.log(rId);
  client.zscore([rId,socketId],function(err,data){
    deferred.resolve(data);
  });
  return deferred.promise;
}
function userLevel(uId, rId) {
  var deferred = Q.defer();
  client.hget(['users',uId],function(err,data) {
    client.zscore([rId,data],function(err,data){
      deferred.resolve(data);
    });
  });
  return deferred.promise;
}
var access = {};
access.socketLevel = socketLevel;
access.userLevel = userLevel;
module.exports = access;
