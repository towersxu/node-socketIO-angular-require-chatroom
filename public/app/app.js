'use strict';

define([
	'angular',
	'angularRoute',
	'view1/view1',
	'view2/view2',
  'chat/chatList'
], function(angular) {
	// Declare app level module which depends on views, and components
	return angular.module('myApp', [
		'ngRoute',
		'myApp.view1',
		'myApp.view2',
    'myApp.chatList'
	]).
	config(['$routeProvider', function($routeProvider) {
		$routeProvider.otherwise({redirectTo: '/view1'});
	}]);
});

