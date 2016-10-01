angular.module('codeCafe')
  .controller('DashboardCtrl',['$scope', 'codesService', 'firstPageCodes', 'languageIcons', '$localStorage', '$timeout', function($scope, codesService, firstPageCodes, languageIcons, $localStorage, $timeout){

    var dash = this;
    dash.websites = firstPageCodes.websites,
    dash.icons = languageIcons
    dash.totalPages = 10;
    dash.init = function (){
      console.log("came here", dash.websites);
      var page = 2
      if(!$localStorage.pages || $localStorage.pages < 10){
        while( page <= dash.totalPages){
          codesService.getCodes({'page' : page}).then(function(res){
            dash.websites.push(res.websites)
          })
          page++
          $localStorage.pages = page;
        }
      }
      $localStorage.websites = dash.websites
      dash.allWebsites = dash.websites
      for( var code in dash.allWebsites){
        dash.cCount = (dash.allWebsites[code].match(/c /g) || []).length;
      }
    }
    dash.init();

    dash.updateFilter = function(){
      dash.status = {
        'accept' : dash.accept,
        'skip': dash.skip,
        'memoryExceed': dash.memeoryExceed,
        'error': dash.error,
        'wrong': dash.wrong
      }
      dash.statusArray = []
      dash.websites = []
      if(dash.status.accept)
        dash.statusArray.push('Accept')
      if(dash.status.skip)
        dash.statusArray.push('skip')
      if(dash.status.memoryExceed)
        dash.statusArray.push('memory')
      if(dash.status.error)
        dash.statusArray.push('error')
      if(dash.status.wrong)
        dash.statusArray.push('Wrong')
      if(dash.statusArray.length > 0){
        for (var i in dash.allWebsites){
          for(var j in dash.statusArray){
            if(dash.allWebsites[i].compiler_status.indexOf(dash.statusArray[j]) !== -1){
              dash.websites.push(dash.allWebsites[i])
            }
          }
          console.log("dash.allWebsites", dash.websites, dash.statusArray);
        }
      }
      else{
        dash.websites = dash.allWebsites;
      }
      $timeout(function(){
        $scope.$apply()
      },10)
    }
  }])
