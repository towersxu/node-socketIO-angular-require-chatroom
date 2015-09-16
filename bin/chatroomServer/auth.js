/**
 * Created by taox on 15-9-16.
 */
var http =require('http');
var Q = require('q');
function post(data){
  var opt = {
    method: "POST",
    host: "localhost",
    port: 3000,
    path: "/v/j/im/v",
    headers: {
      "Content-Type": 'application/json'
    }
  };
  data = JSON.stringify(data);
  var deferred = Q.defer();
  var req = http.request(opt, function (res) {
    if (res.statusCode == 200) {
      res.on('data',function(data){
        deferred.resolve(data.toString());
      });
    } else {
      deferred.reject(e.toString());
    }
  });
  req.on('error',function(e){
    deferred.reject(e.toString());
  });
  req.write(data + "\n");
  req.end();
  return deferred.promise;
}
var auth = {};
auth.post = post;
module.exports = auth;
