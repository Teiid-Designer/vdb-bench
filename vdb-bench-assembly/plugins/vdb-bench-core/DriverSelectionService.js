/**
 * Driver Service
 *
 * Provides simple API for managing drivers
 */
(function () {

    'use strict';

    angular
        .module('vdb-bench.core')
        .factory('DriverSelectionService', DriverSelectionService);

    DriverSelectionService.$inject = ['SYNTAX', 'REST_URI', 'RepoRestService', 'DownloadService', '$rootScope'];

    function DriverSelectionService(SYNTAX, REST_URI, RepoRestService, DownloadService, $rootScope) {

        var drvr = {};
        drvr.loading = true;
        drvr.drivers = [];
        drvr.teiidDrivers = [];
        drvr.localDriverNames = [];
        drvr.selectedDriver = null;
        drvr.deploymentInProgress = false;
        drvr.deploymentDriverName = null;
        drvr.deploymentSuccess = false;
        drvr.deploymentMessage = null;

        /*
         * Service instance to be returned
         */
        var service = {};

        function setLoading(loading) {
            drvr.loading = loading;

            // Broadcast the loading value for any interested clients
            $rootScope.$broadcast("loadingDriversChanged", drvr.loading);
        }

        /**
         * Fetch the drivers for the repository
         */
        function initDrivers() {
            setLoading(true);

            // Load the workspace and teiidCached drivers
            try {
                RepoRestService.getDrivers(REST_URI.WKSP_SERVICE).then(
                    function (newDrivers) {
                        // copy workspace drivers into drivers
                        RepoRestService.copy(newDrivers, drvr.drivers);
                        // copy local names
                        var driversLength = drvr.drivers.length;
                        for (var i = 0; i < driversLength; i++) {
                            drvr.localDriverNames.push(drvr.drivers[i].name);
                        }                                    
                        // Get the teiid drivers
                        RepoRestService.getDrivers(REST_URI.TEIID_SERVICE).then(
                            function (teiidDrivers) {
                                RepoRestService.copy(teiidDrivers, drvr.teiidDrivers);
                                // copy non-duplicate from teiidDrivers into drivers
                                var teiidLength = drvr.teiidDrivers.length;
                                for (var i = 0; i < teiidLength; i++) {
                                    if(!contains(drvr.localDriverNames,drvr.teiidDrivers[i].name)) {
                                        drvr.drivers.push(drvr.teiidDrivers[i]);
                                    }
                                }                                    
                                setLoading(false);
                            },
                            function (response) {
                                // Some kind of error has occurred
                                drvr.teiidDrivers = [];
                                throw RepoRestService.newRestException("Failed to load drivers from the host services.\n" + response.message);
                            });
                        setLoading(false);
                    },
                    function (response) {
                        // Some kind of error has occurred
                        drvr.drivers = [];
                        setLoading(false);
                        throw RepoRestService.newRestException("Failed to load drivers from the host services.\n" + response.message);
                    });
            } catch (error) {
                drvr.drivers = [];
                setLoading(false);
                alert("An exception occurred:\n" + error.message);
            }

            // Removes any outdated selections
            service.selectDriver(null);
        }
        
        function contains(a, obj) {
            for (var i = 0; i < a.length; i++) {
                if (a[i] === obj) {
                    return true;
                }
            }
            return false;
        }
        
        /*
         * Are the drivers currently loading
         */
        service.isLoading = function() {
            return drvr.loading;
        };

        /*
         * Is the drivers deployment flag set
         */
        service.isDeploying = function() {
            return drvr.deploymentInProgress;
        };
        
        /*
         * Returns deployment driver name
         */
        service.deploymentDriverName = function() {
            return drvr.deploymentDriverName;
        };
        
        /*
         * Returns driver deployment success state
         */
        service.deploymentSuccess = function() {
            return drvr.deploymentSuccess;
        };
        
        /*
         * Returns driver deployment message
         */
        service.deploymentMessage = function() {
            return drvr.deploymentMessage;
        };

        /*
         * Set the deployment flag
         */
        service.setDeploying = function(deploying, driverName, deploymentSuccess, message) {
            drvr.deploymentInProgress = deploying;
            drvr.deploymentDriverName = driverName;
            drvr.deploymentSuccess = deploymentSuccess;
            drvr.deploymentMessage = message;

            $rootScope.$broadcast("deployDriverChanged", drvr.deploymentInProgress);
        };

        /*
         * Get the drivers
         */
        service.getDrivers = function() {
            return drvr.drivers;
        };

        /*
         * Get the driver state
         */
        service.getDriverState = function(driver) {
            return "New";
        };

        /*
         * Select the given driver
         */
        service.selectDriver = function(driver) {
            //
            // Set the selected driver
            //
            drvr.selectedDriver = driver;

            // Useful for broadcasting the selected driver has been updated
            $rootScope.$broadcast("selectedDriverChanged", drvr.selectedDriver);
        };

        /*
         * return selected driver
         */
        service.selectedDriver = function() {
            return drvr.selectedDriver;
        };

        /*
         * return selected driver
         */
        service.hasSelectedDriver = function() {
            if (! angular.isDefined(drvr.selectedDriver))
                return false;

            if (_.isEmpty(drvr.selectedDriver))
                return false;

            if (drvr.selectedDriver === null)
                return false;

            return true;
        };

        /*
         * Refresh the collection of drivers
         */
        service.refresh = function() {
            initDrivers();
        };

        // Initialise driver collection on loading
        service.refresh();

        return service;
    }

})();
