/**
 * Translator Service
 *
 * Provides simple API for managing translators
 */
(function () {

    'use strict';

    angular
        .module('vdb-bench.core')
        .factory('TranslatorSelectionService', TranslatorSelectionService);

    TranslatorSelectionService.$inject = ['SYNTAX', 'REST_URI', 'RepoRestService', '$rootScope'];

    function TranslatorSelectionService(SYNTAX, REST_URI, RepoRestService, $rootScope) {

        var tran = {};
        tran.loading = false;
        tran.translators = [];
        tran.translator = null;
        tran.deploymentInProgress = false;
        tran.deploymentTranslatorName = null;
        tran.deploymentSuccess = false;
        tran.deploymentMessage = null;

        /*
         * Service instance to be returned
         */
        var service = {};

        function setLoading(loading) {
            tran.loading = loading;

            // Broadcast the loading value for any interested clients
            $rootScope.$broadcast("loadingTranslatorsChanged", tran.loading);
        }

        /**
         * Fetch the translators from CachedTeiid
         */
        function initTranslators() {
            setLoading(true);

            try {
                RepoRestService.getTranslators(REST_URI.TEIID_SERVICE, null).then(
                    function (newTranslators) {
                        RepoRestService.copy(newTranslators, tran.translators);
                        setLoading(false);
                    },
                    function (response) {
                        // Some kind of error has occurred
                        tran.translators = [];
                        setLoading(false);
                        throw RepoRestService.newRestException("Failed to load translators from the host services.\n" + response.message);
                    });
            } catch (error) {
                tran.translators = [];
                setLoading(false);
                alert("An exception occurred:\n" + error.message);
            }

            // Removes any outdated selection
            service.selectTranslator(null);
        }
        
        /*
         * Are the translators currently loading
         */
        service.isLoading = function() {
            return tran.loading;
        };

        /*
         * Is the translators deployment flag set
         */
        service.isDeploying = function() {
            return tran.deploymentInProgress;
        };
        
        /*
         * Returns deployment translator name
         */
        service.deploymentTranslatorName = function() {
            return tran.deploymentTranslatorName;
        };
        
        /*
         * Returns translator deployment success state
         */
        service.deploymentSuccess = function() {
            return tran.deploymentSuccess;
        };
        
        /*
         * Returns translator deployment message
         */
        service.deploymentMessage = function() {
            return tran.deploymentMessage;
        };

        /*
         * Set the deployment flag
         */
        service.setDeploying = function(deploying, translatorName, deploymentSuccess, message) {
            tran.deploymentInProgress = deploying;
            tran.deploymentTranslatorName = translatorName;
            tran.deploymentSuccess = deploymentSuccess;
            tran.deploymentMessage = message;

            $rootScope.$broadcast("deployTranslatorChanged", tran.deploymentInProgress);
        };

        /*
         * Get the translators
         */
        service.getTranslators = function() {
            return tran.translators;
        };

        /*
         * Get the translator statue
         */
        service.getTranslatorState = function(translator) {
            return "New";
        };

        /*
         * Select the given translator
         */
        service.selectTranslator = function(translator) {
            //
            // Set the selected translator
            //
            tran.translator = translator;

            // Useful for broadcasting the selected translator has been updated
            $rootScope.$broadcast("selectedTranslatorChanged", tran.translator);
        };

        /*
         * return selected translator
         */
        service.selectedTranslator = function() {
            return tran.translator;
        };

        /*
         * return selected translator
         */
        service.hasSelectedTranslator = function() {
            if (! angular.isDefined(tran.translator))
                return false;

            if (_.isEmpty(tran.translator))
                return false;

            if (tran.translator === null)
                return false;

            return true;
        };

        /*
         * Refresh the collection of translators
         */
        service.refresh = function() {
            initTranslators();
        };

        // Initialise translator collection on loading
        service.refresh();

        return service;
    }

})();
