var App;

(function (App) {
    'use strict';

    App.pluginName = 'VdbBenchApp';
    App.templatePath = 'app/';

    App._module = angular.module(App.pluginName, ['vdb-bench.core']);

    App._module.factory('AuthService', AuthService);
    AuthService.$inject = ['$rootScope', '$location', '$route', '$window', 'localStorage'];
    function AuthService($rootScope, $location, $route, $window, localStorage) {

        /*
         * Service instance to be returned
         */
        var service = {};

        var listener;

        var lastLocation = {};

        var user = {
            username: null,
            password: null
        };

        var loggingOut = false;

        service.credentials = function() {
            if (loggingOut)
                return user;

            if ('userPrincipal' in $window) {
                user = $window.userPrincipal;
                console.debug("User details loaded from parent window: ", StringHelpers.toString(user));
            }
            else if ('userPrincipal' in localStorage) {
                user = angular.fromJson(localStorage.userPrincipal);
                console.debug("User details loaded from local storage: ", StringHelpers.toString(user));
            }

            return user;
        };

        service.setCredentials = function(username, password, remember) {
            user.username = username;
            user.password = password;

            if (remember)
                localStorage.userPrincipal = angular.toJson(user);
            else
                delete localStorage.userPrincipal;
        };

        service.isRemembered = function() {
            return 'userPrincipal' in localStorage;
        };

        service.isAuthenticated = function() {
            return user.password !== null;
        };

        service.lastLocation = function() {
            return lastLocation.url || '/';
        };

        service.redirect = function() {
            if (! service.isAuthenticated()) {
                var currentUrl = $location.url();
                if (!currentUrl.startsWith('/login')) {
                    lastLocation.url = currentUrl;
                    $location.url('/login');
                }
                else {
                    if (!$rootScope.reloaded) {
                        $route.reload();
                        $rootScope.reloaded = true;
                    }
                }

                loggingOut = false;
            }
            else {
                if ($location.url().startsWith('/login')) {
                    var url = '/';
                    if (angular.isDefined(lastLocation.url)) {
                        url = lastLocation.url;
                    }
                    $location.url(url);
                }
            }
        };

        service.logout = function() {
            user = {
                username: null,
                password: null
            };

            service.redirect();
            loggingOut = true;
        };

        listener = $rootScope.$on('$routeChangeStart', function (event, args) {
            service.redirect();
        });

        return service;
    }

    App._module.config(configure);
    configure.$inject = ["$locationProvider", "$routeProvider", "$dialogProvider"];
    function configure($locationProvider, $routeProvider, $dialogProvider) {
        $locationProvider.html5Mode(true);
        $dialogProvider.options({
            backdropFade: true,
            dialogFade: true
        });
        $routeProvider
            .when('/login', {
                templateUrl: App.templatePath + 'login.html'
            });
    }

    App._module.run(run);
    run.$inject = ['HawtioExtension', '$compile'];
    function run(HawtioExtension, $compile) {
        //
        // Configure the hawtio nav bar to show a logout menu-item once user is authenticated
        // This plugs into the hawtio-extension-service that allows for abitrary elements to be added
        // to named extension points.
        //
        HawtioExtension.add("hawtio-user", function(scope){
            var template = "<li ng-controller=\"HawtioPreferences.MenuItemController\" ng-show=\"vm.isAuthenticated()\">\n"+
                        "<a href=\"\" ng-click=\"vm.logout()\">Log out</a>\n" +
                        "</li>";
            return $compile(template)(scope);
        });
    }

    function $apply($scope) {
        var phase = $scope.$$phase || $scope.$root.$$phase;
        if (!phase) {
            $scope.$apply();
        }
    }

    App.AppController = App._module.controller('App.AppController', AppController);
    AppController.$inject = ['AuthService'];
    function AppController(AuthService) {
        var vm = this;

        vm.isAuthenticated = function() {
            return AuthService.isAuthenticated();
        };

        vm.getUsername = function() {
            return AuthService.credentials().username || 'User';
        };

        vm.logout = function() {
            AuthService.logout();
        };
    }

    App.LoginController = App._module.controller('App.LoginController', LoginController);
    LoginController.$inject = ['$rootScope', '$location', '$scope', 'branding', 'RepoRestService', 'AuthService'];
    function LoginController ($rootScope, $location, $scope, branding, RepoRestService, AuthService) {
        var vm = this;

        vm.loginError = '';

        vm.entity = {
            username: '',
            password: ''
        };

        vm.rememberMe = AuthService.isRemembered();

        var credentials = AuthService.credentials();
        vm.entity.username = credentials.username;
        vm.entity.password = credentials.password;

        vm.branding = branding;

        vm.doLogin = function () {
            if (vm.entity.username.trim() === '') {
                vm.loginError = 'A user name is required';
            }

            RepoRestService.testConnection(vm.entity.username, vm.entity.password)
                                    .then(
                                        function(response) {
                                            if (response === 0) {
                                                vm.loginError = '';
                                                AuthService.setCredentials(vm.entity.username, vm.entity.password, vm.rememberMe);
                                                $location.path(AuthService.lastLocation());
                                                $apply($rootScope);

                                            } else {
                                                vm.loginError = "Access Denied";
                                            }
                                        }
                                    );
        };
    }
})(App || (App = {}));

hawtioPluginLoader.addModule(App.pluginName);