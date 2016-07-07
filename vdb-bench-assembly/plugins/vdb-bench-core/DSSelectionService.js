/**
 * DS (DataService) Service
 *
 * Provides simple API for managing data services
 */
(function () {

    'use strict';

    angular
        .module('vdb-bench.core')
        .factory('DSSelectionService', DSSelectionService);

    DSSelectionService.$inject = ['RepoRestService', 'DownloadService', '$rootScope'];

    function DSSelectionService(RepoRestService, DownloadService, $rootScope) {

        var ds = {};
        ds.loading = false;
        ds.dataservices = [];
        ds.dataservice = null;
        ds.deploymentInProgress = false;

        /*
         * Service instance to be returned
         */
        var service = {};

        function setLoading(loading) {
            ds.loading = loading;

            // Broadcast the loading value for any interested clients
            $rootScope.$broadcast("loadingDataServicesChanged", ds.loading);
        }

        /**
         * Fetch the data services for the repository
         */
        function initDataServices() {
            setLoading(false);

            try {
                RepoRestService.getDataServices( ).then(
                    function (newDataServices) {
                        RepoRestService.copy(newDataServices, ds.dataservices);
                        setLoading(false);
                    },
                    function (response) {
                        // Some kind of error has occurred
                        ds.dataservices = [];
                        setLoading(false);
                        throw RepoRestService.newRestException("Failed to load data services from the host services.\n" + response.message);
                    });
            } catch (error) {
                ds.dataservices = [];
                setLoading(false);
                alert("An exception occurred:\n" + error.message);
            }

            // Removes any outdated dataservice
            service.selectDataService(null);
        }

        /*
         * Are the data services currently loading
         */
        service.isLoading = function() {
            return ds.loading;
        };

        /*
         * Is the service's deployment flag set
         */
        service.isDeploying = function() {
            return ds.deploymentInProgress;
        };

        /*
         * Set the deployment flag
         */
        service.setDeploying = function(deploying) {
            ds.deploymentInProgress = deploying;

            $rootScope.$broadcast("deployDataServiceChanged", ds.deploymentInProgress);
        };

        /*
         * Select the given dataservice
         */
        service.getDataServices = function() {
            return ds.dataservices;
        };

        /*
         * Select the given dataservice
         */
        service.selectDataService = function(dataservice) {
            //
            // Set the selected dataservice
            //
            ds.dataservice = dataservice;

            // Useful for broadcasting the selected data service has been updated
            $rootScope.$broadcast("selectedDataServiceChanged", ds.dataservice);
        };

        /*
         * return selected dataservice
         */
        service.selectedDataService = function() {
            return ds.dataservice;
        };

        /*
         * return selected dataservice
         */
        service.hasSelectedDataService = function() {
            if (! angular.isDefined(ds.dataservice))
                return false;

            if (_.isEmpty(ds.dataservice))
                return false;

            if (ds.dataservice === null)
                return false;

            return true;
        };

        /*
         * Refresh the collection of data services
         */
        service.refresh = function() {
            initDataServices();
        };

        // Initialise dataservice collection on loading
        service.refresh();

        return service;
    }

})();
