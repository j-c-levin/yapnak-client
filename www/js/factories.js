angular.module('factories', [])

.factory('localstorage', ['$window', function ($window) {
    return {
        set: function (key, value) {
            $window.localStorage[key] = value;
        },
        get: function (key) {
            return $window.localStorage[key] || undefined;
        },
        setObject: function (key, value) {
            $window.localStorage[key] = JSON.stringify(value);
        },
        getObject: function (key) {
            return JSON.parse($window.localStorage[key] || '{}');
        }
    }
}])

.factory('webfactory', ['$http', function ($http) {
  var result = {};

  result.redeemClaim = function(userId,clientId,offerId) {
    var req = {
      method: 'POST',
      url: 'https://yapnak-app.appspot.com/_ah/api/clientEndpointApi/v1/qrRedeem?userId='.concat(userId).concat("&clientId=").concat(clientId).concat("&offerId=").concat(offerId)
      // url: 'http://localhost:8080/_ah/api/clientEndpointApi/v1/qrRedeem?userId='.concat(userId).concat("&clientId=").concat(clientId).concat("&offerId=").concat(offerId)
    }
    return $http(req).then(function(response) {
      if (response.data.status == "True") {
        console.log("Offer claim success");
        console.log(response);
        return response.data;
      } else {
        console.log("FAILED Offer claim");
        console.log(response);
        return response.data;
      }
    }, function(error){
      console.log("REALLY FAILED Offer claim");
      console.log(error);
      return -1
    });
  }

  result.authenticateClient = function(email,password) {
    var req = {
      method: 'POST',
      url: 'https://yapnak-app.appspot.com/_ah/api/clientEndpointApi/v1/authenticateClient?email='.concat(email).concat("&password=").concat(password)
      // url: 'http://localhost:8080/_ah/api/clientEndpointApi/v1/authenticateClient?email='.concat(email).concat("&password=").concat(password)
    }
    return $http(req).then(function(response) {
      if (response.data.status == "True") {
        console.log("Authenticated client success");
        console.log(response);
        return response.data;
      } else {
        console.log("FAILED Authenticated client");
        console.log(response);
        return response.data;
      }
    }, function(error){
      console.log("REALLY FAILED Authenticated client");
      console.log(error);
      return -1
    });
  }

  return result;
}])
