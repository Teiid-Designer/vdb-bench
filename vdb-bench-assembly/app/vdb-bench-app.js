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
    run.$inject = ['CONFIG', 'HawtioExtension', '$compile', 'KCService', 'StorageService', 'AuthService', 'CredentialService'];
    function run(CONFIG, HawtioExtension, $compile, KCService, StorageService, AuthService, CredentialService) {

        //
        // Configure the hawtio nav bar to show a logout menu-item once user is authenticated
        // This plugs into the hawtio-extension-service that allows for abitrary elements to be added
        // to named extension points.
        //
        HawtioExtension.add("hawtio-user", function(scope){
            var template = "<li ng-controller=\"HawtioPreferences.MenuItemController\" ng-show=\"vm.hasAccess()\">\n"+
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

        var kcOptions = {
            checkOnly: true,
            url: sessionNode.url,
            realm: sessionNode.realm,
            clientId: CONFIG.keycloak.clientId,
        };

        kcOptions.successCB = function() {
            console.debug("Authentication Success for keyloak => check-sso");

            //
            // The username is in fact the user id, eg. b5655e6b-6ea3-4aea-a8da-2fcbfa5d8c88
            // The preferred username is the proper name of the user, eg. pj
            //
            // The user name though must remain the user id since that is what is tramsmitted
            // within the token to vdb-builder and what the latter uses as the username when
            // constructing the home path of the user.
            //
            CredentialService.setCredential('username', KCService.userId());

            var userInfoCB = function(userInfo) {
                CredentialService.setCredential('preferredUsername', userInfo.preferred_username);
            };
            KCService.loadUserInfo(userInfoCB);

            AuthService.redirect();
        };

        kcOptions.failureCB = function() {
            console.debug("Authentication Failure for keycloak => check-sso");
            AuthService.redirect();
        };

        KCService.init(kcOptions);
    }

    return App;

})(VdbBenchApp || (VdbBenchApp = {}));

hawtioPluginLoader.addModule(VdbBenchApp.pluginName);
