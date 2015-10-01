angular.module('starter', ['ionic','ngCordova','angular-md5', 'factories', 'controllers'])

.run(function($ionicPlatform) {
  $ionicPlatform.ready(function() {
    // Hide the accessory bar by default (remove this to show the accessory bar above the keyboard
    // for form inputs)
    if(window.cordova && window.cordova.plugins.Keyboard) {
      cordova.plugins.Keyboard.hideKeyboardAccessoryBar(true);
    }
    if(window.StatusBar) {
      StatusBar.styleDefault();
    }
  });
})

.config(function($stateProvider, $urlRouterProvider) {
  $stateProvider

  .state('app', {
    url: '/app',
    abstract: true,
    templateUrl: 'templates/menu.html',
    controller:'AppCtrl'
  })

  .state('access',{
    url:'/access',
    template:'<ion-nav-view></ion-nav-view>'
  })

  .state('access.login',{
    url:'/login',
    templateUrl:'templates/login.html',
    controller:'loginCtrl'
  })

  .state('app.QRScanner', {
    url: '/QRScanner',
    templateUrl: 'templates/QRScanner.html',
    controller: 'QRController'
  })

  // if none of the above states are matched, use this as the fallback
  $urlRouterProvider.otherwise('/access/login');
});
