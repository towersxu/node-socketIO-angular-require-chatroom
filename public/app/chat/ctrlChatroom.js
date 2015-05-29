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

    $scope.isShowBottom = false;
    $scope.chatMethods = [{"method":"当前房间","chatType":"roomChat","value":$scope.roomId},
                          {"method":"公告","chatType":"announcement"},
                          {"method":"私聊","chatType":"private","value":$scope.loginUser.userId}];
    $scope.selectedChatMethod = $scope.chatMethods[0];
    $scope.chatContentType = ["文字","图片","视频","音乐"];
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

    function suitChatList(msg){
      var e_chatlist = document.getElementById('chatlist'),
        e_chatRoom = document.getElementById('chatRoom'),
        chatListHeight,chatRoomHeight,extraHeight,imgObj;
      if(e_chatlist && e_chatRoom){
        chatListHeight = e_chatlist.offsetHeight;
        chatRoomHeight = e_chatRoom.offsetHeight;
        extraHeight = 0;
        if(msg && msg.img){
          imgObj = new Image();
          imgObj.src = msg.img;
          imgObj.onload = function(){
            if(imgObj.width > 320){
              extraHeight = (320/imgObj.width)*imgObj.height;
            }
            if(chatListHeight+extraHeight >= chatRoomHeight){
              $scope.isShowBottom = true;
              $scope.$apply();
            }
          }
        }
        if(msg && (msg.music || msg.video)){
          extraHeight = 320;
        }
        if(chatListHeight+extraHeight >= chatRoomHeight){
          $scope.isShowBottom = true;
          $scope.$apply();
        }
      }

    }
    function hiddenUnUseElement(msg){
      var type = msg.msgType;
      msg.isHidden = true;
      msg.isMusicHidden = true;
      if(type == "video"){
        msg.video = msg.filePath;
        msg.isHidden = false;
      }
      if(type == "music"){
        msg.music = msg.filePath;
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
      suitChatList()
    });
    $scope.socket.on('room users',function(msg){
      $scope.roomUsers = msg;
      $scope.myRoomUsers = msg[0];
      $scope.$apply();
      suitChatList()
    });
    //用户聊天
    $scope.socket.on('room chat',function(msg){
      msg = hiddenUnUseElement(msg);
      $scope.msgContent.push(msg);
      $scope.$apply();
      suitChatList(msg);
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
      suitChatList();
    });

    $scope.sendAll = function(){
      var message = {};
      message.form = "管理员";
      message.content = "demo.png";
      message.msgHeader = "公告";
      message.type = "video";
      $scope.socket.emit("public message",message);
    };
    $scope.socket.on('public message',function(msg){
      msg = hiddenUnUseElement(msg);
      console.log(msg);
      $scope.msgContent.push(msg);
      $scope.$apply();
      suitChatList();
    });

    $scope.sendMedia = function(files,type){
      if(files.length > 0){
        $scope.upload(files,type);
      }
    };

    function findNameInChatMethod(name){
      for(var i=0;i<$scope.chatMethods.length;i++){
        if($scope.chatMethods[i].method == name){
          return i;
        }
      }
      return -1;
    }
    //$scope.$watch($scope.chatMethods,function(){
    //  console.log("watch chatMethods change");
    //});
    $scope.selectUser = function(roomUser){
      var chatMethodsLength = $scope.chatMethods.length,
        index = findNameInChatMethod(roomUser.userName);
      if(index == -1){
        $scope.chatMethods.push({"method":roomUser.userName,"chatType":"private"});
        $scope.selectedChatMethod = $scope.chatMethods[chatMethodsLength];
      }else{
        $scope.selectedChatMethod = $scope.chatMethods[index];
      }
      console.log($scope.selectedChatMethod);
    };

    $scope.sendChatMsg = function(){
      console.log($scope.chatMethods);
      console.log($scope.selectedChatMethod);
    };
    // because this has happened asynchroneusly we've missed
    // Angular's initial call to $apply after the controller has been loaded
    // hence we need to explicityly call it at the end of our Controller constructor
    $scope.$apply();
    suitChatList();
  }];
});