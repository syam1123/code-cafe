angular.module('codeCafe',[
  'ui.router',
  'ngMaterial',
  'ngStorage'
])
  .config(['$locationProvider', '$stateProvider', '$urlRouterProvider', '$localStorageProvider', '$httpProvider', function ($locationProvider, $stateProvider, $urlRouterProvider, $localStorageProvider, $httpProvider) {
    $locationProvider.html5Mode(true);

    $urlRouterProvider
      .otherwise('/');

    $stateProvider
      .state('home', {
        url: '/',
        templateUrl: 'views/dashboard.tmpl.html',
        controller: 'DashboardCtrl',
        controllerAs: 'dash',
        resolve : {
          firstPageCodes : ['codesService', '$localStorage', function(codesService, $localStorage){
            return codesService.getCodes({'page' : '1'}).then(function(res){
              return res;
            })
          }],
          languageIcons: ['codesService', function(codesService){
            return codesService.getImages().then(function(res){
              return res;
            })
          }]
        }
      })
  }])
