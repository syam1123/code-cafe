angular.module('codeCafe')
  .controller('DashboardCtrl',['$scope', 'codesService', 'firstPageCodes', 'languageIcons', '$localStorage', function($scope, codesService, firstPageCodes, languageIcons, $localStorage){

    var dash = this;
    dash.websites = firstPageCodes.websites,
    dash.icons = languageIcons
    dash.totalPages = 10;
    dash.init = function (){
      console.log("came here", dash.websites);
      var page = 2
      while( page <= dash.totalPages){
        if(!$localStorage.websites){
          codesService.getCodes({'page' : page}).then(function(res){
            dash.websites.push(res.websites)
          })
          page++
        }
      }
      $localStorage.websites = dash.websites
    }
    dash.init();
  }])
