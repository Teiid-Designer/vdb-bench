var VdbBenchApp = (function(App) {
    'use strict';

    App._module.factory('CredentialService', CredentialService);
    CredentialService.$inject = ['StorageService', 'CONFIG', '$window'];

    function CredentialService(StorageService, CONFIG, $window) {
        /*
         * Service instance to be returned
         */
        var service = {};

        var authenticateType = '';

        var authOptions = {};

        var loggingOut = false;

        service.loggingOut = function() {
            return loggingOut;
        };

        service.setLoggingOut = function(value) {
            loggingOut = value;
        };

        service.authType = function() {
            return authenticateType;
        };

        service.isBasicAuth = function() {
            if (angular.isUndefined(authenticateType))
                return false;

            return authenticateType === CONFIG.rest.authTypes[0];
        };

        service.isKeycloakAuth = function() {
            if (angular.isUndefined(authenticateType))
                return false;

            return authenticateType === CONFIG.rest.authTypes[1];
        };

        service.credential = function(key) {
            return authOptions[key];
        };

        service.credentials = function() {
            if (loggingOut)
                return authOptions;

            if (_.isEmpty(authOptions.username) && _.isEmpty(authOptions.password)) {
                var userPrincipal = StorageService.sessionGet('userPrincipal');
                if (userPrincipal) {
                    for (var attrname in userPrincipal)
                        { authOptions[attrname] = userPrincipal[attrname]; }

                    console.debug("User details loaded from local storage: ", StringHelpers.toString(authOptions));
                }
            }

            return authOptions;
        };

        service.reset = function() {
            authOptions = {};
        };

        service.setAuthType = function(type) {
            authenticateType = type;
        };

        service.setCredential = function(key, value) {
            authOptions[key] = value;
        };

        service.setCredentials = function(credentials) {
            authOptions = {};
            for (var attrname in credentials)
                { authOptions[attrname] = credentials[attrname]; } // ensure authOptions is always defined

            if (authOptions.remember)
                StorageService.sessionSet('userPrincipal', angular.toJson(authOptions));
            else
                StorageService.sessionSet('userPrincipal', null);
        };

        service.isRemembered = function() {
            return StorageService.sessionGet('userPrincipal');
        };

        service.persistOptions = function(key) {
            StorageService.sessionSetObject(key, authOptions);
        };

        service.eraseOptions = function(key) {
            StorageService.sessionSetObject(key, null);
        };

        return service;
    }

    return App;

})(VdbBenchApp || (VdbBenchApp = {}));
