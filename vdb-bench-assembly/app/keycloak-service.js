var VdbBenchApp = (function(App) {
    'use strict';

    App._module.factory('KCService', KCService);
    KCService.$inject = ['CONFIG', 'SYNTAX', '$window', 'RepoSelectionService'];

    function KCService(CONFIG, SYNTAX, $window, RepoSelectionService) {

        /*
         * Service instance to be returned
         */
        var service = {};

        /**
         * Initialises the keycloak object using the values
         * defined in the options parameter
         *
         * checkOnly: Should kc be inited with check-sso rather than login-required
         * url: url of the kc server
         * realm: realm of the kc server
         * clientId: client of the kc server
         * successCB: callback function if authentication is successful
         * failureCB: callback function if authentication fails
         */
        service.init = function(options) {
            $window.keycloak = new Keycloak(options);

            $window.keycloak.onAuthSuccess = function() {
                if (angular.isDefined(options.successCB))
                    options.successCB();
            };

            $window.keycloak.onAuthError = function() {
                if (angular.isDefined(options.failureCB))
                    options.failureCB();
            };

            var onLoad = 'login-required';
            if (! _.isEmpty(options.checkOnly) && options.checkOnly)
                onLoad = 'check-sso';

            $window.keycloak.init({
                    onLoad: onLoad
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

        service.isDefined = function() {
            return angular.isDefined($window.keycloak);
        };

        service.isAuthenticated = function() {
            if (!service.isDefined())
                return false;

            if (! angular.isDefined($window.keycloak.authenticated))
                return false;

            return $window.keycloak.authenticated;
        };

        service.hasRole = function(role) {
            if (! service.isDefined())
                return false;

            return $window.keycloak.hasRealmRole(role) || $window.keycloak.hasResourceRole(role);
        };

        service.hasAccessRole = function() {
            return service.hasRole(CONFIG.keycloak.role);
        };

        service.hasAdminRole = function() {
            return service.hasRole(CONFIG.keycloak.adminRole);
        };

        service.hasEditorRole = function() {
            return service.hasRole(CONFIG.keycloak.repoEditorRole);
        };

        service.hasOdataRole = function() {
            return service.hasRole(CONFIG.keycloak.odataRole);
        };

        service.hasToken = function() {
            if (! service.isDefined())
                return false;

            return ! _.isEmpty($window.keycloak.token);
        };

        service.token = function() {
            if (! service.hasToken())
                return SYNTAX.EMPTY_STRING;

            return $window.keycloak.token;
        };

        service.userId = function() {
            if (! service.isDefined())
                return SYNTAX.EMPTY_STRING;

            return $window.keycloak.subject;
        };

        service.loadUserInfo = function(successCB) {
            if (! service.isDefined())
                return;

            $window.keycloak.loadUserInfo()
                .success(function (userInfo) {
                    successCB(userInfo);
                });
        };

        service.logout = function() {
            if (! service.isAuthenticated())
                return;

            $window.keycloak.logout();
        };

        return service;
    }

    return App;

})(VdbBenchApp || (VdbBenchApp = {}));
