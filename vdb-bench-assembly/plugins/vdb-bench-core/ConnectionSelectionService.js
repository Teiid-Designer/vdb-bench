/**
 * Connection Service
 *
 * Provides simple API for managing connections
 */
(function () {

    'use strict';

    angular
        .module('vdb-bench.core')
        .factory('ConnectionSelectionService', ConnectionSelectionService);

    ConnectionSelectionService.$inject = ['SYNTAX', 'REST_URI', 'RepoRestService', 'DownloadService', '$rootScope'];

    function ConnectionSelectionService(SYNTAX, REST_URI, RepoRestService, DownloadService, $rootScope) {

        var conn = {};
        conn.loading = false;
        conn.connections = [];
        conn.connection = null;
        conn.deploymentInProgress = false;
        conn.deploymentConnectionName = null;
        conn.deploymentSuccess = false;
        conn.deploymentMessage = null;
        conn.filterProperties = [];

        /*
         * Service instance to be returned
         */
        var service = {};

        function setLoading(loading) {
            conn.loading = loading;

            // Broadcast the loading value for any interested clients
            $rootScope.$broadcast("loadingConnectionsChanged", conn.loading);
        }

        /**
         * Fetch the connections from CachedTeiid
         */
        function initConnections() {
            setLoading(true);

            try {
                RepoRestService.getDataSources(REST_URI.TEIID_SERVICE).then(
                    function (newDataSources) {
                        RepoRestService.copy(newDataSources, conn.connections);
                        conn.connections = sortByKey(conn.connections, 'keng__id');
                        setLoading(false);
                    },
                    function (response) {
                        // Some kind of error has occurred
                        conn.connections = [];
                        setLoading(false);
                        throw RepoRestService.newRestException("Failed to load connections from the host services.\n" + response.message);
                    });
            } catch (error) {
                conn.connections = [];
                setLoading(false);
                alert("An exception occurred:\n" + error.message);
            }

            // Removes any outdated selection
            service.selectConnection(null, true);
        }

        function sortByKey(array, key) {
            return array.sort(function(a, b) {
                var x = a[key]; var y = b[key];
                return ((x < y) ? -1 : ((x > y) ? 1 : 0));
            });
        }

        /*
         * Are the connections currently loading
         */
        service.isLoading = function() {
            return conn.loading;
        };

        /*
         * Is the connections deployment flag set
         */
        service.isDeploying = function() {
            return conn.deploymentInProgress;
        };
        
        /*
         * Returns deployment connection name
         */
        service.deploymentConnectionName = function() {
            return conn.deploymentConnectionName;
        };
        
        /*
         * Returns connection deployment success state
         */
        service.deploymentSuccess = function() {
            return conn.deploymentSuccess;
        };
        
        /*
         * Returns connection deployment message
         */
        service.deploymentMessage = function() {
            return conn.deploymentMessage;
        };

        /*
         * Set the deployment flag
         */
        service.setDeploying = function(deploying, connectionName, deploymentSuccess, message) {
            conn.deploymentInProgress = deploying;
            conn.deploymentConnectionName = connectionName;
            conn.deploymentSuccess = deploymentSuccess;
            conn.deploymentMessage = message;

            $rootScope.$broadcast("deployConnectionChanged", conn.deploymentInProgress);
        };

        /*
         * Get the connections
         */
        service.getConnections = function() {
            return conn.connections;
        };

        /*
         * Get the connection with the requested name
         */
        service.getConnection = function(connName) {
            var result = null;
            for (var i = 0; i < conn.connections.length; ++i) {
                if(conn.connections[i].keng__id === connName) {
                    result = conn.connections[i];
                    break;
                }
            }
            return result;
        };

        /*
         * Get the connection statue
         */
        service.getConnectionState = function(connection) {
            return "New";
        };

        /*
         * Select the given connection
         */
        service.selectConnection = function(connection, broadcast) {
            //
            // Set the selected connection
            //
            conn.connection = connection;

            // Useful for broadcasting the selected connection has been updated
            if(broadcast) {
                $rootScope.$broadcast("selectedConnectionChanged");
            }
        };

        /*
         * return selected connection
         */
        service.selectedConnection = function() {
            return conn.connection;
        };

        /*
         * Resets the filter properties to defaults
         */
        service.resetFilterProperties = function() {
            conn.filterProperties = [{ "name": "importer.TableTypes",
                                       "value": "TABLE"},
                                     { "name": "importer.UseFullSchemaName",
                                       "value": "false"},
                                     { "name": "importer.UseQualifiedName",
                                       "value": "false"},
                                     { "name": "importer.UseCatalogName",
                                       "value": "false"}];
        };

        /*
         * Adds the specified filter property
         */
        service.addFilterProperty = function(propName, propValue) {
            if(angular.isDefined(propValue) && propValue!==null && propValue.length>0 ) {
                conn.filterProperties.push({ 
                    "name" : propName,
                    "value": propValue
                });
            }
        };

        /*
         * return selected connection filter properties
         */
        service.selectedConnectionFilterProperties = function() {
            return conn.filterProperties;
        };

        /*
         * return selected connection
         */
        service.hasSelectedConnection = function() {
            if (! angular.isDefined(conn.connection))
                return false;

            if (_.isEmpty(conn.connection))
                return false;

            if (conn.connection === null)
                return false;

            return true;
        };

        /*
         * Refresh the collection of connections
         */
        service.refresh = function() {
            initConnections();
        };

        // Initialise connection collection on loading
        service.refresh();

        return service;
    }

})();
