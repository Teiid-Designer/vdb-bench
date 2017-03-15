var VdbBenchApp = (function (App) {
    'use strict';

    App.pluginName = 'VdbBenchApp';
    App.templatePath = 'app/';

    App._module = angular.module(App.pluginName, ['vdb-bench.core', 'pascalprecht.translate']);

    /**
     * Inteceptor for handling expired keycloak tokens
     */
    App._module.factory('authInterceptor', authInterceptor);
    authInterceptor.$inject = ['$q', '$window'];
    function authInterceptor($q, $window) {

        var factory = {};

        factory.request = function (config) {
            var deferred = $q.defer();
            if ($window.keycloak && $window.keycloak.token) {
                $window.keycloak.updateToken(5)
                    .success(function() {
                        config.headers = config.headers || {};
                        config.headers.Authorization = 'Bearer ' + $window.keycloak.token;

                        deferred.resolve(config);
                    })
                    .error(function() {
                        deferred.reject('Failed to refresh token');
                    });
            } else {
                deferred.resolve(config);
            }

            return deferred.promise;
        };

        return factory;
    }

    /**
     * Module Configure function
     */
    App._module.config(configure);
    configure.$inject = ["$locationProvider", "$routeProvider", "$dialogProvider", "$translateProvider", "$httpProvider"];
    function configure($locationProvider, $routeProvider, $dialogProvider, $translateProvider, $httpProvider) {
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

        $httpProvider.interceptors.push('authInterceptor');
    }

    /**
     * Module Run function
     */
    App._module.run(run);
    run.$inject = ['CONFIG', 'HawtioExtension', '$compile', '$window', 'StorageService', 'AuthService', 'CredentialService'];
    function run(CONFIG, HawtioExtension, $compile, $window, StorageService, AuthService, CredentialService) {

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

        var sessionNode = StorageService.sessionGetObject(CONFIG.keycloak.sessionNode);

        if (_.isEmpty(sessionNode))
            return;

        //
        // Will attempt to authenticate with keycloak (without showing login page)
        // after the login page has redirected back from a successful login, ie.
        // when the page loads for the second time after credentials have been entered
        //

        var options = {};
        options.rememberMe = false;
        options.url = sessionNode.url;
        options.realm = sessionNode.realm;

        CredentialService.setAuthType(CONFIG.rest.authTypes[1]);
        CredentialService.setCredentials(options);

        $window.keycloak = new Keycloak({
            url: sessionNode.url,
            realm: sessionNode.realm,
            clientId: 'ds-builder'
        });

        $window.keycloak.onAuthSuccess = function() {
            console.debug("Authentication Success for keyloak => check-sso");
            AuthService.redirect();
        };

        $window.keycloak.onAuthError = function() {
            console.debug("Authentication Failure for keycloak => check-sso");
            AuthService.redirect();
        };

        $window.keycloak.init({ onLoad: 'check-sso' });
    }

    return App;

})(VdbBenchApp || (VdbBenchApp = {}));

hawtioPluginLoader.addModule(VdbBenchApp.pluginName);
