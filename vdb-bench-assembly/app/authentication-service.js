var VdbBenchApp = (function(App) {
    'use strict';

    App._module.factory('AuthService', AuthService);
    AuthService.$inject = ['CONFIG', 'CredentialService', '$rootScope', '$location', '$route', '$window', 'RepoRestService', 'RepoSelectionService'];

    function AuthService(CONFIG, CredentialService, $rootScope, $location, $route, $window, RepoRestService, RepoSelectionService) {

        /*
         * Service instance to be returned
         */
        var service = {};

        var listener;

        var lastLocation = {};

        var authenticated = false;

        service.authorised = function() {
            if (! CredentialService.isKeycloakAuth())
                return true; // not applicable to basic authentication

            if (! angular.isDefined($window.keycloak)) {
                return false; // no keycloak object
            }

            if (! $window.keycloak.authenticated)
                return false; // not authenticated

            /**
             * Test if user has ds-builder-access
             */
             if (! $window.keycloak.hasRealmRole(CONFIG.keycloak.role)) {
                 return false;
             }

             return true;
        };

        service.authenticated = function() {
            if (CredentialService.isKeycloakAuth() && angular.isDefined($window.keycloak)) {
                authenticated = $window.keycloak.authenticated;
            }

            return authenticated;
        };

        service.hasAccess = function() {
            if (service.authenticated()) {
                return service.authorised();
            }

            return false;
        };

        service.lastLocation = function() {
            return lastLocation.url || '/';
        };

        var redirectCallback = function() {
            if (!service.hasAccess()) {
                var currentUrl = $location.url();

                if (!currentUrl.startsWith('/login')) {
                    lastLocation.url = currentUrl;
                    $location.url('/login');
                } else {
                    if (!$rootScope.reloaded) {
                        $route.reload();
                        $rootScope.reloaded = true;
                    }
                }
            } else {
                if ($location.url().startsWith('/login')) {
                    var url = '/';
                    if (angular.isDefined(lastLocation.url)) {
                        url = lastLocation.url;
                    }
                    $location.url(url);
                }
            }
        };

        function keycloakTestConnection(onSuccess, onFailure) {
            var options = {};
            var repo = RepoSelectionService.getSelected();
            if (angular.isDefined(repo.keycloakUrl))
                options.url = repo.keycloakUrl;

            if (angular.isDefined(repo.keycloakRealm))
                options.realm = repo.keycloakRealm;

            RepoRestService.testConnection(options)
                .then(
                    function(response) {
                        if (response.status === 1) {
                            /*
                             * Failure to authenticate or connect to reposiory
                             */
                            onFailure();

                            return;
                        }

                        onSuccess();
                    }
                );
        }

        service.redirect = function() {
            if (CredentialService.loggingOut()) {
                redirectCallback();
                return;
            }

            var credentials = CredentialService.credentials();
            if (CredentialService.isRemembered()) {
                //
                // Only basic authentication is remembered
                //
                // Checks that connection can be made to repository through rest and BASIC Authentiation
                //
                service.basicLogin(redirectCallback, redirectCallback);
            } else if (!_.isEmpty($window.keycloak) && $window.keycloak.authenticated) {
                keycloakTestConnection(redirectCallback, redirectCallback);
            } else {
                redirectCallback();
            }
        };

        service.basicLogin = function(onSuccess, onFailure) {
            CredentialService.setLoggingOut(false);

            RepoRestService.testConnection()
                .then(
                    function(response) {
                        if (response.status === 0) {
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

        service.keycloakLogin = function(onSuccess, onFailure) {
            var credentials = CredentialService.credentials();
            CredentialService.setLoggingOut(false);

            //
            // Write these options to local storage for use with keycloak authentication
            //
            CredentialService.persistOptions(CONFIG.keycloak.sessionNode);

            //
            // This keycloak is used to explicitly login when the 'Authenticate'
            // button is clicked. Logging-in will redirect the page to the keycloak
            // page then redirect back.
            //
            var keyOptions = {};
            keyOptions.url = credentials.url;
            keyOptions.realm = credentials.realm;
            keyOptions.clientId = CONFIG.keycloak.clientId;

            $window.keycloak = new Keycloak(keyOptions);

            $window.keycloak.authSuccess = function() {
                keycloakTestConnection(redirectCallback, redirectCallback);
            };

            $window.keycloak.init({
                    onLoad: 'login-required'
                })
                .success(function(response) {
                    //
                    // If logging-in for the first time then this will never be called
                    //
                    console.debug("keycloak successfully inited");
                })
                .error(function(response) {
                    console.debug("keycloak init failed");
                });
        };

        service.logout = function() {
            authenticated = false;

            CredentialService.reset();
            CredentialService.eraseOptions(CONFIG.keycloak.sessionNode);
            CredentialService.setLoggingOut(true);

            if (angular.isDefined($window.keycloak.authenticated) && $window.keycloak.authenticated)
                $window.keycloak.logout();

            service.redirect();
        };

        listener = $rootScope.$on('$routeChangeStart', function(event, args) {
            service.redirect();
        });

        return service;
    }

    return App;

})(VdbBenchApp || (VdbBenchApp = {}));
