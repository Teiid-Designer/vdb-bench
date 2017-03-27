var VdbBenchApp = (function(App) {
    'use strict';

    App._module.factory('AuthService', AuthService);
    AuthService.$inject = ['CONFIG', 'CredentialService', '$rootScope', '$location', '$route',
                           'KCService', 'RepoRestService', 'RepoSelectionService'];

    function AuthService(CONFIG, CredentialService, $rootScope, $location, $route,
                            KCService, RepoRestService, RepoSelectionService) {

        /*
         * Service instance to be returned
         */
        var service = {};

        var listener;

        var lastLocation = {};

        var repoConnectStatus = false;

        /**
         * Is user authenticated.
         * basic: return status of connection to repository
         * kc: return status of keycloak authentication
         */
        service.authenticated = function() {
            if (CredentialService.isKCAuth()) {
                return KCService.isAuthenticated();
            }

            return repoConnectStatus;
        };

        service.authorised = function() {
            if (! CredentialService.isKCAuth())
                return true; // not applicable to basic authentication

            if (! KCService.isAuthenticated()) {
                return false; // not authenticated
            }

            /**
             * Test if user has ds-builder-access or admin roles
             */
             if (! KCService.hasAccessRole() && ! KCService.hasAdminRole()) {
                 return false; // user has no access or admin role
             }

             return true;
        };

        service.connectToRepo = function() {
            return repoConnectStatus;
        };

        /**
         * Does user have access to ds-builder and the configured repository
         * basic: is user authenticated
         * kc: is user authenticated, authorised and can connect to repository
         */
        service.hasAccess = function() {
            // Is user authenticated - true is repoConnectStatus is true
            if (! service.authenticated())
                return false;

            // Is user authorised - always true for basic
            if (! service.authorised())
                return false;

            // Can user connect to repository
            return service.connectToRepo();
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

        function repoTestConnection(onSuccess, onFailure) {
            RepoRestService.testConnection()
                .then(
                    function(response) {
                        if (response.status === 1) {
                            /*
                             * Set the connection status flag
                             */
                            repoConnectStatus = false;

                            if (angular.isDefined(onFailure) && onFailure !== null) {
                                /*
                                * Failure to authenticate or connect to reposiory
                                */
                                onFailure();
                            }

                            return;
                        }

                        /*
                         * Set the connection status flag
                         */
                        repoConnectStatus = true;

                        if (angular.isDefined(onSuccess) && onSuccess !== null) {
                            onSuccess();
                        }
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
            } else if (KCService.isAuthenticated()) {
                repoTestConnection(redirectCallback, redirectCallback);
            } else {
                redirectCallback();
            }
        };

        service.basicLogin = function(onSuccess, onFailure) {
            CredentialService.setLoggingOut(false);

            repoTestConnection(onSuccess, onFailure);
        };

        service.kcLogin = function() {
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
            var credentials = CredentialService.credentials();
            var kcOptions = {};
            kcOptions.url = credentials.url;
            kcOptions.realm = credentials.realm;
            kcOptions.clientId = CONFIG.keycloak.clientId;
            kcOptions.successCB = function() {
                testConnection(redirectCallback, redirectCallback);
            };

            KCService.init(kcOptions);
        };

        service.logout = function() {
            repoConnectStatus = false;

            CredentialService.reset();
            CredentialService.eraseOptions(CONFIG.keycloak.sessionNode);
            CredentialService.setLoggingOut(true);

            KCService.logout();

            service.redirect();
        };

        listener = $rootScope.$on('$routeChangeStart', function(event, args) {
            service.redirect();
        });

        return service;
    }

    return App;

})(VdbBenchApp || (VdbBenchApp = {}));
