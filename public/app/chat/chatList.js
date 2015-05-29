/**
 * Created by taox on 15-5-20.
 */
'use strict';

define([
  'angular',
  'angularRoute',
  'angularCookies',
  'ngFileUpload'
], function(angular) {
  angular.module('myApp.chatList', ['ngRoute','ngCookies','ngFileUpload'])
    .config(['$routeProvider', function($routeProvider) {
      $routeProvider.when('/chatList', {
        templateUrl: 'chat/chatlist.html',
        controller: 'chatListCtrl'
      }).when('/room/:roomId',{
        templateUrl:'chat/room.html',
        controller:'chatroomCtrl'
      });
    }])
    .controller('chatListCtrl', ['$scope', '$rootScope','$injector', function($scope,$rootScope, $injector) {

      require(['chat/ctrlChatlist'],function(ctrlChatlist){
        $injector.invoke(ctrlChatlist, this, {'$scope': $scope});
      });

    }])
    .directive('chatroomList',function(){
      return{
        restrict:'E',
        templateUrl:'chat/directive/chatlist/chatroomList.html'
      }
    })
    .filter('isConnect',function(){
      return function(input){
        if(input === true){
          return '已连接';
        }else{
          return '断开';
        }
      }
    })
    .controller('chatroomCtrl',['$scope','$rootScope','$routeParams','$window','$location','$cookieStore','$injector','Upload',
      function($scope,$rootScope,$routeParams,$window,$location,$cookieStore,$injector,Upload){
        console.log($scope.roomId);
        $scope.roomId = $routeParams.roomId;
        $rootScope.loginUser = $cookieStore.get('userinfo');
        if(!$rootScope.loginUser){
          window.location.href="#/view2";
          return;
        }
        $scope.msgContent = [];
        console.log("当前登陆用户：");
        console.log($scope.loginUser);
        require(['chat/ctrlChatroom'],function(ctrlChatroom){
          $injector.invoke(ctrlChatroom, this, {'$scope': $scope});
        });

        $scope.msgs = $rootScope.msgs;

        //$scope.$watch('files',function(){
        //  $scope.upload($scope.files);
        //});
        
        $scope.upload = function(files,type,chatType){
          if(files && files.length){
            for(var i = 0;i<files.length;i++){
              var file = files[i];
              Upload.upload({
                url:"http://192.168.1.45:3000/file-upload",
                fields:{
                  'msgType':type
                },
                file:file
              }).progress(function (evt){
                console.log(evt);
              }).success(function(res){
                if(res.isSuccess){
                  if(chatType == "roomChat"){
                    $scope.sendMsg(res);
                  }
                  if(chatType == "private"){
                    res.toUser = $scope.selectedChatMethod.value;
                    $scope.sendPrivate(res);
                  }
                  if(chatType == "announcement"){
                    $scope.sendAll(res);
                  }
                }
              });
            }
          }else{
            console.log("no files");
          }
        }
      }
    ])
    .directive('chatroom',function(){
      return {
        restrict:'E',
        templateUrl:'chat/directive/chatroom/chatroom.html'
      }
    })
    .directive('chatimg',function(){
      return {
        restrict:'E',
        templateUrl:'chat/directive/chatroom/chatimg.html'
      }
    }).filter('trusted',['$sce',function($sce){
      return function(url) {
        return $sce.trustAsResourceUrl(url);
      }
    }]);
});