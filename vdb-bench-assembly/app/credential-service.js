var VdbBenchApp = (function(App) {
    'use strict';

    App._module.factory('CredentialService', CredentialService);
    CredentialService.$inject = ['StorageService', 'CONFIG', 'KCService', '$window', '$location'];

    function CredentialService(StorageService, CONFIG, KCService, $window, $location) {
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

        /*
         * Test either the given parameter for being
         * the basic authentication type or with no
         * parameter tests the CredentialService property
         */
        service.isBasicAuth = function(authType) {
            if (_.isEmpty(authType))
                authType = authenticateType;

            if (angular.isUndefined(authType))
                return false;

            return authType === CONFIG.rest.authTypes[0];
        };

        service.isKCAuth = function() {
            if (angular.isUndefined(authenticateType))
                return false;

            return authenticateType === CONFIG.rest.authTypes[1];
        };

        /**
         * Does the user have the roles for editing
         */
        service.canEdit = function() {
            if (! service.isKCAuth())
                return true; // basic users are always editors

            return KCService.hasEditorRole();
        };

        /**
         * Does the user have the roles for editing
         */
        service.canOdataTest = function() {
            if (! service.isKCAuth())
                return true; // basic users are always editors

            return KCService.hasOdataRole();
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
            StorageService.sessionSetObject('dsb-session', null);
        };

        service.setAuthType = function(type) {
            authenticateType = type;
        };

        service.setCredential = function(key, value) {
            authOptions[key] = value;
        };

        function saveSession(session) {
            if (_.isEmpty(authOptions) || _.isEmpty(authOptions.username))
                return; // Cannot do much without a user

            if (_.isEmpty(session))
                session = {};

            session.user = authOptions.username;
            session.location = $location.url();
            session.authType = service.authType();

            StorageService.sessionSetObject('dsb-session', session);
        }

        service.setCredentials = function(credentials) {
            authOptions = {};
            for (var attrname in credentials)
                { authOptions[attrname] = credentials[attrname]; } // ensure authOptions is always defined

            //
            // Will fire prior to an F5 refresh being invoked or
            // the browser exiting, thereby saving the session
            //
            $window.onbeforeunload = function (event) {
                saveSession(service.session());
                return undefined;
            };

            if (authOptions.remember)
                StorageService.sessionSetObject('userPrincipal', authOptions);
            else
                StorageService.sessionSetObject('userPrincipal', null);
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

        service.inSession = function() {
            var session = service.session();
            if (_.isEmpty(session))
                return false;

            return true;
        };

        service.session = function() {
            return StorageService.sessionGetObject('dsb-session', {});
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

    return App;

})(VdbBenchApp || (VdbBenchApp = {}));
