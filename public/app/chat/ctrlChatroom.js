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
                          {"method":"公告","chatType":"announcement"}];
    $scope.selectedChatMethod = $scope.chatMethods[0];
    $scope.chatContentType = ["文字","图片","视频","音乐"];
    $scope.inputContent = "";
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
        isFlashHidden:msg.isFlashHidden,
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
        if(msg &&  msg.video){
          extraHeight = 320;
        }
        if(msg &&  msg.music){
          extraHeight = 30;
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
      msg.isFlashHidden = true;
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
      if(type == "flash"){
        msg.flash = msg.filePath;
        msg.isFlashHidden = false;
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
        isFlashHidden:msg.isFlashHidden,
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
    $scope.sendPrivate=function(msg){
      if(!msg){
        msg = {};
      }
      msg.form = $rootScope.loginUser;
      msg.to = msg.toUser || $scope.myRoomUsers;
      msg.content = msg.content || $scope.msg;
      $scope.socket.emit("private message",msg);
    };
    $scope.socket.on('private message',function(msg){
      msg = hiddenUnUseElement(msg);
      msg.userName = msg.form.userName;
      msg.msgHeader = "私聊";
      $scope.msgContent.push(msg);
      $scope.$apply();
      suitChatList();
    });

    $scope.sendAll = function(msg){
      if(!msg){
        msg = {};
      }
      var message = {};
      msg.form = "管理员";
      msg.content = msg.content || "";
      msg.msgHeader = "公告";
      $scope.socket.emit("public message",msg);
    };
    $scope.socket.on('public message',function(msg){
      msg = hiddenUnUseElement(msg);
      console.log(msg);
      $scope.msgContent.push(msg);
      $scope.$apply();
      suitChatList();
    });

    $scope.sendMedia = function(files,type){
      var chatType = "words";
      if($scope.selectedChatMethod.chatType == "roomChat"){
        chatType="roomChat";
      }
      if($scope.selectedChatMethod.chatType == "private"){
        chatType="private";
        //$scope.sendPrivate({content:$scope.inputContent,toUser:$scope.selectedChatMethod.value});
      }
      if($scope.selectedChatMethod.chatType == "announcement"){
        chatType="announcement";
      }
      if(files.length > 0){
        $scope.upload(files,type,chatType);
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
        $scope.chatMethods.push({"method":roomUser.userName,"chatType":"private","value":roomUser});
        $scope.selectedChatMethod = $scope.chatMethods[chatMethodsLength];
      }else{
        $scope.selectedChatMethod = $scope.chatMethods[index];
      }
      console.log($scope.selectedChatMethod);
    };

    $scope.sendChatMsg = function(){

      if($scope.selectedChatMethod.chatType == "roomChat"){
        $scope.sendMsg({content:$scope.inputContent});
      }
      if($scope.selectedChatMethod.chatType == "private"){
        $scope.sendPrivate({content:$scope.inputContent,toUser:$scope.selectedChatMethod.value});
      }
      if($scope.selectedChatMethod.chatType == "announcement"){
        $scope.sendAll({content:$scope.inputContent,type:"words"});
      }
      $scope.inputContent = "";
    };
    // because this has happened asynchroneusly we've missed
    // Angular's initial call to $apply after the controller has been loaded
    // hence we need to explicityly call it at the end of our Controller constructor
    $scope.$apply();
    suitChatList();
  }];
});