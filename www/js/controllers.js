var qrScanner = angular.module('controllers', []);

qrScanner.controller('loginCtrl', function($scope,$state, $ionicPopup, $timeout,QRService, localstorage, webfactory, $ionicLoading) {

  $scope.loginData = {};
  console.log(localstorage.get("clientId"));
  if (localstorage.get("clientId") !== undefined && localstorage.get("clientId") !== "") {
    //Login
    $state.go("app.QRScanner");
  }

  $scope.login = function() {
    console.log($scope.loginData);
    if ($scope.loginData.email === "" || $scope.loginData.email === undefined || $scope.loginData.password === "" || $scope.loginData.password === undefined) {
      $ionicPopup.alert({
        title: 'Login details missing',
        template: 'Please check you\'ve entered both a valid email and a password'
      });
    } else {
      $ionicLoading.show({
        template: 'Authenticating...'
      });
      webfactory.authenticateClient($scope.loginData.email, $scope.loginData.password).then(function(response){
        $ionicLoading.hide();
        if (response.status === "True") {
          localstorage.set("clientId",response.clientId);
          $state.go("app.QRScanner");
        } else {
          $ionicPopup.alert({
            title: 'Login failed',
            template: 'Something went wrong: ' + response.message
          });
        }
      }, function(error) {
        $ionicLoading.hide();
        $ionicPopup.alert({
          title: 'Login failed',
          template: 'Something went wrong: ' + response
        });
      });
    }
  }

});

qrScanner.controller("QRController", function($scope,$filter,$ionicPlatform, $cordovaBarcodeScanner,QRService,$ionicPopup,$timeout,md5, webfactory, localstorage, $ionicLoading) {
  $scope.rewards={};
  $scope.scanText='';

  $ionicPlatform.ready(function() {
    scanBarcode();
  });

  $scope.reScan=function(){
    $ionicPlatform.ready(function() {
      scanBarcode();
    });
  }

  function scanBarcode() {
    $cordovaBarcodeScanner.scan().then(function(imageData) {
      console.log(imageData);
      if (imageData.cancelled == false) {
        try {
          console.log("Scan completed");
          console.log(imageData);
          checkQr(imageData.text);
        } catch(e) {
          popup("An error happened -> " + e);
          console.log("An error happened -> " + e);
        }
      } else {
        console.log("cancelled");
      }
    }, function(error) {
      console.log("A real huge error occured -> " + error);
      popup("A real huge error occured -> " + error);
    });
  };

  function checkQr(qrCode) {
    try {
      var object = JSON.parse(qrCode);
    } catch (e) {
      console.log("error parsing: " + e);
      alert("error parsing: " + e);
    }
    //Need to check if ios or android here
    if (object.hash === "") {
      console.log("android");
      androidQr(object);
    } else {
      console.log("iOS");
      iosQr(object);
    }
  }

  function iosQr(object) {
    var id = object.id;
    var timestamp = object.datetime;
    timestamp = timestamp.split("");
    timestamp.splice(12,0,":");
    timestamp.splice(10,0,":");
    timestamp.splice(8,0,"T");
    timestamp.splice(6,0,"-");
    timestamp.splice(4,0,"-");
    timestamp = timestamp.join("");
    timestamp = new Date(timestamp).getTime() / 1000;
    console.log("timestamp");
    console.log(timestamp);
    var offer = object.offer;

    //Check datetime
    var currentTime = Math.floor(Date.now() / 1000);
    if ((currentTime - (15*60)) > timestamp) {
      //QR is too old
      console.log("old");
      $ionicPopup.alert({
        title: 'QR code out of date',
        template: 'The QR code is too old, please ask the user to regenerate the code'
      });
    } else {
      //QR is good
      console.log("good");

      //Check hash in future

      redeemClaim(id,localstorage.get("clientId"),offer);
    }
  }

  function androidQr(object) {
    var id = object.id.split("\/");
    var offer = object.offer.split("\/");
    console.log(id);

    //Check datetime
    var currentTime = Math.floor(Date.now() / 1000);
    if ((currentTime - (15*60)) > (id[1]/1000)) {
      //QR is too old
      console.log("old");
      $ionicPopup.alert({
        title: 'QR code out of date',
        template: 'The QR code is too old, please ask the user to regenerate the code'
      });
    } else {
      //QR is good
      console.log("good");

      //Check hash in future

      //Redeem claim
      redeemClaim(id[0],localstorage.get("clientId"),offer[0]);
    }
  }

  function redeemClaim(userId,clientId,offerId) {
    $ionicLoading.show({
      template: 'Redeeming...'
    });
    webfactory.redeemClaim(userId,clientId,offerId).then(function(response){
      $ionicLoading.hide();
      if (response.status === "True") {
        $ionicPopup.alert({
          title: 'Offer claimed',
          template: 'Claimed offer: ' + response.offerText
        });
        $scope.rewards.loyaltyRedeemedLevel = "None";
        $scope.rewards.loyaltyPoints = response.loyaltyPoints;
        $scope.rewards.offerText = response.offerText;
        $scope.rewards.recommended = response.recommended;
      } else {
        if (response.message !== undefined) {
          $ionicPopup.alert({
            title: 'Something went wrong',
            template: response.message
          });
        } else {
          $ionicPopup.alert({
            title: 'Something went wrong',
            template: 'Probably an internet connection error.'
          });
        }
      };
    },function(error){
      $ionicLoading.hide();
      $ionicPopup.alert({
        title: 'Something went wrong',
        template: 'We were unable to log the information online, but the user and their code is valid.'
      });
    });
  }

});

qrScanner.controller('AppCtrl', function($scope, $ionicModal, $timeout,$state) {

  // With the new view caching in Ionic, Controllers are only called
  // when they are recreated or on app start, instead of every page change.
  // To listen for when this page is active (for example, to refresh data),
  // listen for the $ionicView.enter event:
  //$scope.$on('$ionicView.enter', function(e) {
  //});

  $scope.logout=function () {
    window.localStorage['user'] = undefined;
    $state.go('access.login')
  }






});

qrScanner.service('QRService',['$http', function ($http){
  var rootUrl="https://yapnak-app.appspot.com/_ah/api/clientEndpointApi/v1/";
  this.QRValidate = function (QRReader) {
    var data="userId="+QRReader.id +"&clientId="+QRReader.client +"&offerId="+QRReader.offer+"&rewardRedeemed="+QRReader.rewardRedeemed;
    return $http({
      method: "POST",
      url: rootUrl+"qrRedeem",
      data: data,
      crossDomain: true,
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
    }).success(function (data) {
      console.log(data);
    }).error(function (data, status, headers, config,statusText) {
      console.log(data);
    });

  };

  this.authenticateClient=function(loginData){
    var data ='email='+loginData.email+'&password='+loginData.password;
    return $http({
      method: "POST",
      url: rootUrl + "authenticateClient ",
      data: data,
      crossDomain: true,
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
    }).success(function (response) {

      console.log(response);

    }).error(function (error) {
      console.log(error);
    });
  };

}])
