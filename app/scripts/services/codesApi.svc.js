(function () {
  'use strict';

  angular.module('codeCafe')
    .factory('codesService', codesService)

    codesService.$inject = ['$http', '$q']

    function codesService($http, $q){
      var CODE_API_LOCATION = 'http://hackerearth.0x10.info/api/ctz_coders?type=json&query=list_submissions&page=1',
          ICON_API_LOCATION = 'http://hackerearth.0x10.info/api/ctz_coders?type=json&query=list_compiler_image'
      return {
        getCodes : getCodes,
        getImages : getImages
      }

      function getCodes(page){
        var deferred = $q.defer();

        $http({
            url: CODE_API_LOCATION,
            method: 'GET',
            params: page
          })
          .success(function (data) {
            deferred.resolve(data);
          })
          .error(function () {
            deferred.reject();
          });

        return deferred.promise;
      }

      function getImages(){
        var deferred = $q.defer();

        $http({
            url: ICON_API_LOCATION,
            method: 'GET'
          })
          .success(function (data) {
            deferred.resolve(data);
          })
          .error(function () {
            deferred.reject();
          });

        return deferred.promise;
      }
    }
})();
