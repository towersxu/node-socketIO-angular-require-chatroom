/**
 * Created by taox on 15-5-21.
 */
'use strict';

define(['chat/socket.io'], function(socket) {
  return ['$scope','$rootScope','$window' ,function($scope,$rootScope,$window) {
    // You can access the scope of the controller from here
    console.log('this is chat room');
    if(!$rootScope.socket){
      $rootScope.socket = socket('192.168.1.39:3000');
    }
    if($rootScope.socket.connected ===false){
      $rootScope.socket.connect();
    }
    $scope.socket = $rootScope.socket;
    if(!$scope.roomId){
      console.log("roomId undefined!");
    }
    $scope.socket.emit('join room',{
      roomId:$scope.roomId,
      userId:$rootScope.loginUser.userId,
      userName:$rootScope.loginUser.userName
    });
    //接收用户加入房间信息。
    $scope.socket.on('user join',function(msg){
      msg = hiddenUnUseElement(msg);
      $scope.msgContent.push({
        userName:msg.userName,
        msgHeader:msg.msgHeader,
        isHidden:msg.isHidden,
        isMusicHidden:msg.isMusicHidden,
        content:"加入房间"
      });
      $scope.$apply();
    });

    function hiddenUnUseElement(msg){
      var type = msg.msgType;
      msg.isHidden = true;
      msg.isMusicHidden = true;
      if(type == "video"){
        msg.video = msg.filePath;;
        msg.isHidden = false;
      }
      if(type == "music"){
        msg.music = msg.filePath;;
        msg.isMusicHidden = false;
      }
      if(type == "img"){
        msg.img = msg.filePath;
      }
      return msg;
    }
    //接收用户leave房间信息。
    $scope.socket.on('user leave',function(msg){
      msg = hiddenUnUseElement(msg);
      $scope.msgContent.push({
        userName:msg.userName,
        msgHeader:msg.msgHeader,
        isHidden:msg.isHidden,
        isMusicHidden:msg.isMusicHidden,
        content:"离开房间"
      });
      $scope.$apply();
    });
    $scope.socket.on('room users',function(msg){
      $scope.roomUsers = msg;
      $scope.myRoomUsers = msg[0];
      $scope.$apply();
    });
    //用户聊天
    $scope.socket.on('room chat',function(msg){
      msg = hiddenUnUseElement(msg);
      $scope.msgContent.push(msg);
      $scope.$apply();
    });
    $scope.sendMsg =function(msg){
      if(!msg){
        msg = {};
      }
      msg.roomId = $scope.roomId;
      msg.userId = $rootScope.loginUser.userId;
      msg.userName = $rootScope.loginUser.userName;
      msg.content = msg.content || $scope.msg;
      $scope.socket.emit('room chat',msg)
    };
    $scope.sendPrivate=function(){
      var message = {};
      message.form = $rootScope.loginUser;
      message.to = $scope.myRoomUsers;
      message.content = $scope.msg;
      $scope.socket.emit("private message",message);
    };
    $scope.socket.on('private message',function(msg){
      msg = hiddenUnUseElement(msg);
      var privateMsg = {};
      privateMsg.userName = msg.form.userName;
      privateMsg.content = msg.content;
      privateMsg.msgHeader = "私聊";
      privateMsg.isHidden = msg.isHidden;
      privateMsg.isMusicHidden = msg.isMusicHidden;
      $scope.msgContent.push(privateMsg);
      $scope.$apply();
    });

    $scope.sendAll = function(){
      var message = {};
      message.form = "管理员";
      message.content = "http://127.0.0.1:3000/images/demo.png";
      message.msgHeader = "公告";
      message.type = "video";
      $scope.socket.emit("public message",message);
    };
    $scope.socket.on('public message',function(msg){
      msg = hiddenUnUseElement(msg);
      console.log(msg);
      $scope.msgContent.push(msg);
      $scope.$apply();
    });

    $scope.sendMedia = function(files,type){
      if(files.length > 0){
        $scope.upload(files,type);
      }
    };

    // because this has happened asynchroneusly we've missed
    // Angular's initial call to $apply after the controller has been loaded
    // hence we need to explicityly call it at the end of our Controller constructor
    $scope.$apply();
  }];
});