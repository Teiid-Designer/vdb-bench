var App;

(function (App) {
    'use strict';

    App.pluginName = 'VdbBenchApp';
    App.templatePath = 'app/';

    App._module = angular.module(App.pluginName, ['vdb-bench.core', 'pascalprecht.translate']);

    App._module.factory('AboutService', AboutService);
    AboutService.$inject = ['$http', '$location'];
    function AboutService($http, $location) {
        /*
         * Service instance to be returned
         */
        var service = {};

        service.getAbout = function() {
            var baseUrl = $location.protocol() + '://' + $location.host() + ':' + $location.port() + '/';

            var absUrl = $location.absUrl();
            var url = absUrl.replace(baseUrl, "");
            var firstSlash = url.indexOf('/');
            var context;
            if (firstSlash >= 0)
                context = url.substring(0, firstSlash);
            else
                context = url;

            url = baseUrl + context + '/about.xml';
            return $http.get(url)
                    .then(function (response) {
                        return response.data;
                    }, function (response) {
                        return response;
                    });
        };

        return service;
    }

    App._module.factory('CredentialService', CredentialService);
    CredentialService.$inject = ['localStorage', '$window'];
    function CredentialService(localStorage, $window) {
        /*
         * Service instance to be returned
         */
        var service = {};

        var user = {
            username: null,
            password: null
        };

        var loggingOut = false;

        service.loggingOut = function() {
            return loggingOut;
        };

        service.setLoggingOut = function(value) {
            loggingOut = value;
        };

        service.credentials = function() {
            if (loggingOut)
                return user;

            if (user.username === null && user.password === null) {
                if ('userPrincipal' in $window) {
                    user = $window.userPrincipal;
                    console.debug("User details loaded from parent window: ", StringHelpers.toString(user));
                }
                else if ('userPrincipal' in localStorage) {
                    user = angular.fromJson(localStorage.userPrincipal);
                    console.debug("User details loaded from local storage: ", StringHelpers.toString(user));
                }
            }

            return user;
        };

        service.reset = function() {
            user.username = null;
            user.password = null;
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

        return service;
    }

    App._module.factory('AuthService', AuthService);
    AuthService.$inject = ['CredentialService', '$rootScope', '$location', '$route', 'RepoRestService'];
    function AuthService(CredentialService, $rootScope, $location, $route, RepoRestService) {

        /*
         * Service instance to be returned
         */
        var service = {};

        var listener;

        var lastLocation = {};

        var authenticated = false;

        service.authenticated = function() {
            return authenticated;
        };

        service.lastLocation = function() {
            return lastLocation.url || '/';
        };

        var redirectCallback = function() {
            if (! service.authenticated()) {
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

        service.redirect = function() {
            if (CredentialService.isRemembered() && ! CredentialService.loggingOut()) {
                var credentials = CredentialService.credentials();
                service.login(credentials.username, credentials.password, true, redirectCallback, redirectCallback);
            } else {
                redirectCallback();
            }
        };

        service.login = function(username, password, remember, onSuccess, onFailure) {
            CredentialService.setLoggingOut(false);

            RepoRestService.testConnection(username, password)
                                    .then(
                                        function(response) {
                                            if (response === 0) {
                                                CredentialService.setCredentials(username, password, remember);
                                                authenticated = true;
                                                if (angular.isDefined(onSuccess) && onSuccess !== null)
                                                    onSuccess();
                                            } else {
                                                authenticated = false;
                                                if (angular.isDefined(onFailure) && onFailure !== null)
                                                    onFailure();
                                            }
                                        }
                                    );
        };

        service.logout = function() {
            CredentialService.reset();
            authenticated = false;
            CredentialService.setLoggingOut(true);
            service.redirect();
        };

        listener = $rootScope.$on('$routeChangeStart', function (event, args) {
            service.redirect();
        });

        return service;
    }

    App._module.config(configure);
    configure.$inject = ["$locationProvider", "$routeProvider", "$dialogProvider", "$translateProvider"];
    function configure($locationProvider, $routeProvider, $dialogProvider, $translateProvider) {
        $locationProvider.html5Mode(true);
        $dialogProvider.options({
            backdropFade: true,
            dialogFade: true
        });
        $routeProvider
            .when('/login', {
                templateUrl: App.templatePath + 'login.html'
            });
        
        // configure i18n
        $translateProvider.useSanitizeValueStrategy('sanitize');
        $translateProvider.useStaticFilesLoader({
            prefix: 'app/i18n/messages-',
            suffix: '.json'
        });
        
        // default all en_* and every other locale to en right now
        $translateProvider.registerAvailableLanguageKeys(['en'], {
            'en_*': 'en',
            'en-*': 'en',
            '*': 'en'
         });
        
        // try to get locale from browser
        var l_lang;
        if (navigator.languages !== undefined) { // Chrome
        	l_lang = navigator.languages[0];
        } else if (navigator.userLanguage) { // Explorer
            l_lang = navigator.userLanguage;
        } else if (navigator.language) { // FF
            l_lang = navigator.language;
        } else {
        	l_lang = 'en'; // fallback
        }
        
        // must set lang
        $translateProvider.preferredLanguage(l_lang);
        $translateProvider.fallbackLanguage('en');
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
            var template = "<li ng-controller=\"HawtioPreferences.MenuItemController\" ng-show=\"vm.authenticated()\">\n"+
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
    AppController.$inject = ['AuthService', 'CredentialService'];
    function AppController(AuthService, CredentialService) {
        var vm = this;

        vm.authenticated = function() {
            return AuthService.authenticated();
        };

        vm.getUsername = function() {
            return CredentialService.credentials().username || 'User';
        };

        vm.logout = function() {
            AuthService.logout();
        };
    }

    App.LoginController = App._module.controller('App.LoginController', LoginController);
    LoginController.$inject = ['$rootScope', '$location', '$scope', 'branding', 'RepoRestService', 'CredentialService', 'AuthService'];
    function LoginController ($rootScope, $location, $scope, branding, RepoRestService, CredentialService, AuthService) {
        var vm = this;

        vm.loginError = '';

        vm.entity = {
            username: '',
            password: ''
        };

        vm.rememberMe = CredentialService.isRemembered();

        var credentials = CredentialService.credentials();
        vm.entity.username = credentials.username;
        vm.entity.password = credentials.password;

        vm.branding = branding;

        var onLoginSuccessful = function() {
            vm.loginError = '';
            $location.path(AuthService.lastLocation());
            $apply($rootScope);
        };

        var onLoginFailure = function() {
            vm.loginError = "Access Denied";
        };

        vm.doLogin = function () {
            if (vm.entity.username.trim() === '') {
                vm.loginError = 'A user name is required';
            }

            AuthService.login(vm.entity.username, vm.entity.password, vm.rememberMe, onLoginSuccessful, onLoginFailure);
        };
    }
})(App || (App = {}));

hawtioPluginLoader.addModule(App.pluginName);