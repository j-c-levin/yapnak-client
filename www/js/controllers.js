var qrScanner = angular.module('controllers', []);

qrScanner.controller('loginCtrl', function($scope,$state, $ionicPopup, $timeout,QRService, localstorage, webfactory, $ionicLoading) {

  $scope.loginData = {};

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

qrScanner.controller("QRController", function($scope,$filter,$ionicPlatform, $cordovaBarcodeScanner,QRService,$ionicPopup,$timeout,md5, webfactory, localstorage) {
  $scope.rewards=[];
  $scope.scanText='';
  $scope.valid=false;
  $scope.invalid=false;
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
      alert('Found a QR code: ' + imageData.text);
      try{
        console.log("Scan completed");
        console.log(imageData);
        checkQr(imageData.text);
      }catch(e)
      {
        popup("An error happened -> " + e);
        console.log("An error happened -> " + e);
      }
    }, function(error) {
      console.log("A real huge error occured -> " + error);
      popup("A real huge error occured -> " + error);
    });
  };

  function checkQr(qrCode) {
    alert('checking the qr code');
    try {
      var object = JSON.parse(qrCode);
    } catch (e) {
      console.log("error parsing: " + e);
      alert("error parsing: " + e);
    }
    //Need to check if ios or android here
    if (object.hash === "") {
      console.log("android");
      alert('Found an android code');
      androidQr(object);
    } else {
      console.log("iOS");
      alert('Found an iOS code');
      iosQr(object);
    }
  }

  function iosQr(object) {
    var id = object.id;
    var timestamp = new Date(object.datetime).getTime() / 1000;
    var offer = object.offer;
    console.log(id);
    console.log(timestamp);

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

      //Redeem claim
      webfactory.redeemClaim(id,localstorage.get("clientId"),offer).then(function(response){
        if (response.status === "True") {
          $ionicPopup.alert({
            title: 'Offer claimed',
            template: 'Claimed offer: ' + response.offerText
          });
        } else {
          $ionicPopup.alert({
            title: 'Something went wrong',
            template: response.message
          });
        };
      },function(error){
        $ionicPopup.alert({
          title: 'Something went wrong',
          template: 'We were unable to log the information online, but the user and their code is valid.'
        });
      });
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
      webfactory.redeemClaim(id[0],localstorage.get("clientId"),offer[0]).then(function(response){
        if (response.status === "True") {
          $ionicPopup.alert({
            title: 'Offer claimed',
            template: 'Claimed offer: ' + response.offerText
          });
        } else {
          $ionicPopup.alert({
            title: 'Something went wrong',
            template: response.message
          });
        };
      },function(error){
        $ionicPopup.alert({
          title: 'Something went wrong',
          template: 'We were unable to log the information online, but the user and their code is valid.'
        });
      });
    }
  }

  function validate(imageData){

    // imageData=[{"id":"Jame1186","isReward":"false","client":"27","offer":"217","datetime":"20150926101056","hash":"2CBA6BBD3AA3AC7D55D10ED5AB3CEF08"}];
    if(imageData != undefined ){
      imageData.rewardRedeemed="True";

      var numbers =  imageData.datetime.replace(/-/g, "").replace(/\(/g, "").replace(/\) /g, "");
      var matches =  numbers.match(/^(\d{4})(\d{2})(\d{2})(\d{2})(\d{2})(\d{2})$/);
      var QRDate=matches[2]+'/'+matches[3]+'/'+matches[1];
      var QRTime=eval((matches[4] >12?matches[4]-12:matches[4] )*60*60+matches[5]*60+matches[6]*1) ;
      var QRDateTime=$filter('date')(matches[2]+'/'+matches[3]+'/'+matches[1]+" "+matches[4]+':'+matches[5]+':'+matches[6] ,'MM/dd/yyyy hh:mm:ss');
      var currentDate= $filter('date')(new Date(),'MM/dd/yyyy');
      var currentTime= ($filter('date')(new Date(),'hh:mm:ss')).split(':');
      var currentTimeSeconds=eval(currentTime[0]*60*60+currentTime[1]*60+currentTime[2]*1);
      var timediff=currentTimeSeconds-QRTime ;




      if((QRDate+1 === currentDate)&& (timediff<= 15*60 ) && timediff>0 )
      {
        if( imageData.hash.length >0 &&  imageData.hash !== undefined ){
          QRService.QRValidate(imageData).then(function(responce){
            if(responce.status===200){
              if(responce.data.status=='True'){
                $scope.valid=true;
                $scope.invalid=false;
                $scope.rewards=responce.data;
                $scope.rewards.client=imageData.id;
                $scope.scanText='Scan Results';

              }
              else{
                popup("Offer doesn't exist");
              }
            }
            else{
              popup("System error");
            }
          })
        }
        else{
          popup('Invalid QR Code');
        }
      }
      else{
        popup('QR code Expire after 15 minutes,Please generate new one');
      }
    }
    else{
      popup('QR code error');
    }
  }


  function popup(title){
    var alertpop=$ionicPopup.alert({
      title:title

    });

    // $timeout(function() {
    //      alertpop.close(); //close the popup after 3 seconds for some reason
    //   }, 2500);

    $scope.scanText=title;
    $scope.valid=false;
    $scope.invalid=true;
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
