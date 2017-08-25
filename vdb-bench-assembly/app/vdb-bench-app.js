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
    CredentialService.$inject = ['localStorage', '$location', '$window'];
    function CredentialService(localStorage, $location, $window) {
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
            $window.sessionStorage.removeItem('dsb-session');
        };

        function saveSession(session) {
            if (_.isEmpty(user) || _.isEmpty(user.username))
                return; // Cannot do much without a user

            if (_.isEmpty(session))
                session = {};

            session.user = user.username;
            session.location = $location.url();

            $window.sessionStorage.setItem('dsb-session', angular.toJson(session));
        }

        service.setCredentials = function(username, password, remember) {
            user.username = username;
            user.password = password;

            //
            // Will fire prior to an F5 refresh being invoked or
            // the browser exiting, thereby saving the session
            //
            $window.onbeforeunload = function (event) {
                saveSession(service.session());
                return undefined;
            };

            if (remember)
                localStorage.userPrincipal = angular.toJson(user);
            else
                delete localStorage.userPrincipal;
        };

        service.isRemembered = function() {
            return 'userPrincipal' in localStorage;
        };

        service.inSession = function() {
            var session = service.session();
            if (_.isEmpty(session))
                return false;

            return true;
        };

        service.session = function() {
            var session = $window.sessionStorage.getItem('dsb-session');
            if (_.isEmpty(session))
                return {};

            return angular.fromJson(session);
        };

        service.addSessionProperty = function(key, value) {
            var session = service.session();
            session[key] = value;
            saveSession(session);
        };

        service.sessionProperty = function(key) {
            var session = service.session();
            if (_.isEmpty(session))
                return '';

            return session[key];
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

        service.setLastLocation = function(location) {
            lastLocation = location;
        };

        service.lastLocation = function() {
            return lastLocation.url || '/';
        };

        function isLoginPage(url) {
            if (_.isEmpty(url))
                return false;

            return url.startsWith('/login') || url.startsWith('/re-login');
        }

        var redirectCallback = function() {
            var currentUrl = $location.url();
            if (service.authenticated()) {
                //
                // Already authenticated
                //
                if (isLoginPage(currentUrl)) {
                    var url = '/';
                    if (angular.isDefined(lastLocation.url)) {
                        //
                        // Possible that previous url was the re-login page if user
                        // has clicked the 'delete session' link and reverted to the
                        // login page.
                        //
                        if (! isLoginPage(lastLocation.url))
                            url = lastLocation.url;
                    }
                    $location.url(url);
                } else if (CredentialService.inSession()) {
                    //
                    // Have logged in from the re-login page
                    // so try and return to the page we left
                    //
                    var session = CredentialService.session();
                    $location.url(session.location);
                }
            }
            else if (CredentialService.inSession()) {
                //
                // Previously authenticated but refreshed browser
                //
                $location.url('/re-login');
            }
            else {
                //
                // Not authenticated
                //
                if (currentUrl.startsWith('/login')) {
                    //
                    // Not much required as already on login page
                    //
                    if (!$rootScope.reloaded) {
                        $route.reload();
                        $rootScope.reloaded = true;
                    }
                }
                else {
                    //
                    // Some other url attempted but not authenticated
                    //
                    lastLocation.url = currentUrl;
                    $location.url('/login');
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
            authenticated = false;
            CredentialService.reset();
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
            })
            .when('/re-login', {
                templateUrl: App.templatePath + 're-login.html'
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
        vm.userPwdForgotten = false;
        vm.showRepoConfig = false;
        vm.authorizing = false;

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
            vm.authorizing = false;
            vm.loginError = '';
            $location.path(AuthService.lastLocation());
            $apply($rootScope);
        };

        var onLoginFailure = function() {
            vm.authorizing = false;
            vm.loginError = "Access Failure.<br>Either the username/password are incorrect or the repository cannot be contacted.";
        };

        vm.doLogin = function () {
            if (vm.entity.username.trim() === '') {
                vm.loginError = 'A user name is required';
            }

            vm.authorizing = true;

            try {
                AuthService.login(vm.entity.username, vm.entity.password, vm.rememberMe, onLoginSuccessful, onLoginFailure);
        	} finally {
        		vm.authorizing = false;
        	}
        };

        vm.showForgottenUserPwd = function() {
            vm.userPwdForgotten = !vm.userPwdForgotten;
        };

        vm.toggleRepositoryConfig = function() {
            vm.showRepoConfig = !vm.showRepoConfig;
        };
    }

    App.ReLoginController = App._module.controller('App.ReLoginController', ReLoginController);
    ReLoginController.$inject = ['$rootScope', '$location', '$scope', 'branding', 'CredentialService', 'AuthService'];
    function ReLoginController ($rootScope, $location, $scope, branding, CredentialService, AuthService) {
        var vm = this;

        vm.authorizing = false;
        vm.loginError = '';
        vm.entity = {
            username: '',
            password: ''
        };

        var session = CredentialService.session();
        vm.entity.username = session.user;

        var onLoginSuccessful = function() {
            vm.authorizing = false;
            vm.loginError = '';
            $location.path(AuthService.lastLocation());
            $apply($rootScope);
        };

        var onLoginFailure = function() {
            vm.authorizing = false;
            vm.loginError = "Access Failure.<br>The username/password are incorrect.";
        };

        vm.doLogin = function () {
            vm.authorizing = true;
            
            try {
            	AuthService.login(vm.entity.username, vm.entity.password, CredentialService.isRemembered(), onLoginSuccessful, onLoginFailure);
            } finally {
                vm.authorizing = false;
            }
        };

        vm.deleteSession = function() {
            AuthService.logout();
        };
    }
})(App || (App = {}));

hawtioPluginLoader.addModule(App.pluginName);
