/**
 * Created by taox on 15-9-21.
 */
var Q = require('q');
var redis = require("redis"),
  client = redis.createClient();
/*包括broadcaster和manager*/
/**
 *根据socketid,判断该用户在该房间是否有操作权限
 * @param socketId
 * @param rId 房间id
 * @returns {*|promise}
 */
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
/**
 * 获取用户在该房间的角色等级(主播,管理员,用户,游客)
 * @param uId
 * @param rId
 * @returns {*|promise}
 */
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
