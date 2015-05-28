/**
 * Created by taox on 15-5-21.
 */
'use strict';

define(['chat/socket.io'], function(socket) {
  return ['$scope','$rootScope','$window', function($scope,$rootScope,$window) {
    // You can access the scope of the controller from here
    console.log('this is chat list');
    if(!$rootScope.socket){
      $rootScope.socket = socket('192.168.1.39:3000');

    }
    if($rootScope.socket.connected ===false){
      $rootScope.socket.connect();
    }
    $scope.socket = $rootScope.socket;
    $scope.socket.emit("room list",{});
    $scope.socket.on('room info',function(msg){
      console.log(msg);
      $scope.msgs = msg;
      $rootScope.msgs = $scope.msgs;
      if($scope.roomlist){
        for(var i=0;i<$scope.roomlist.length;i++){
          $scope.msgs[$scope.roomlist[i]].isConnect = true;
        }
      }
      $scope.msg = 'davice';
      $scope.$apply();
    });
    $scope.socket.on("roomlist user",function(msg){
      if($scope.msgs && $scope.roomlist){
        for(var j=0;j<$scope.roomlist.length;j++){
          $scope.msgs[$scope.roomlist[j]].isConnect = false;
        }
      }
      $scope.roomlist = msg;
      for(var i=0;i<msg.length;i++){
        $scope.msgs[msg[i]].isConnect = true;
      }
      $scope.$apply();
    });

    //退出房间
    $scope.logoutRoom = function(roomId,isConnect){
      if(isConnect){
        $scope.socket.emit("leave room",{userId:$rootScope.loginUser.userId,roomId:roomId});
        if($scope.roomId == roomId){
          $window.location.href = "#/chatList";
        }
      }else{
        alert("你已经离开了这个房间");
      }
    };
    // because this has happened asynchroneusly we've missed
    // Angular's initial call to $apply after the controller has been loaded
    // hence we need to explicityly call it at the end of our Controller constructor
    $scope.$apply();
  }];
});