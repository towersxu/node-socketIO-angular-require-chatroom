'use strict';

define([
	'angular',
	'angularRoute',
  'angularCookies',
	'components/version/version'
], function(angular) {
	angular.module('myApp.view2', ['ngRoute', 'ngCookies','myApp.version'])
	.config(['$routeProvider', function($routeProvider) {
		$routeProvider.when('/view2', {
			templateUrl: 'view2/view2.html',
			controller: 'View2Ctrl'
		});
	}])
	// We can load the controller only when needed from an external file
	.controller('View2Ctrl', ['$scope','$cookieStore', '$injector', function($scope, $cookieStore, $injector) {
		require(['view2/ctrl2'], function(ctrl2) {
			// injector method takes an array of modules as the first argument
			// if you want your controller to be able to use components from
			// any of your other modules, make sure you include it together with 'ng'
			// Furthermore we need to pass on the $scope as it's unique to this controller
			$injector.invoke(ctrl2, this, {'$scope': $scope});
		});
      $scope.username = "";
      $scope.userId = "";
      $scope.loginUser = $cookieStore.get('userinfo');
      $scope.setCookie = function () {
        var user = {};
        user.userName = $scope.username;
        user.userId = $scope.userId;
        $cookieStore.put('userinfo',user);
        window.location.reload();
      };
      //require(['socket.io.js'],function(socket){
      //  $scope.socket = socket('127.0.0.1:3000');
      //
      //  $scope.socket.on('chat message',function(msg){
      //    console.log('getMsg:'+msg)
      //  });
      //  $scope.socket.on('an event',function(msg){
      //
      //
      //  });
      //  $scope.sendMsg = function(){
      //    $scope.socket.emit('new message',$scope.msg);
      //    $scope.msg = '';
      //  }
      //});
      //$scope.msg = 'message';

	}]);
});