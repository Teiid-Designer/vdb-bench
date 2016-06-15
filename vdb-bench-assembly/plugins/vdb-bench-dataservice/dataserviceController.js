(function () {
    'use strict';

    var pluginName = 'vdb-bench.dataservice';
    var pluginDirName = 'vdb-bench-dataservice';

    angular
        .module(pluginName)
        .controller('DataserviceController', DataserviceController);

    DataserviceController.$inject = ['RepoRestService', 'REST_URI', 'SYNTAX', 'DownloadService'];

    function DataserviceController(RepoRestService, REST_URI, SYNTAX, DownloadService) {
        var vm = this;

        vm.dataservices = [];
        vm.loading = false;
        vm.init = false;
        vm.dataservice = null;
        vm.showImport = false;

        /**
         * Fetch the list of dataservices from the selected repository
         */
        function initDataServices() {
            vm.init = true;
            vm.loading = true;

            try {
                RepoRestService.getDataServices( ).then(
                    function (newDataServices) {
                        RepoRestService.copy(newDataServices, vm.dataservices);
                        vm.loading = false;
                        vm.init = false;
                    },
                    function (response) {
                        // Some kind of error has occurred
                        vm.dataservices = [];
                        vm.loading = false;
                        vm.init = false;
                        throw RepoRestService.newRestException("Failed to load data services from the host services.\n" + response.message);
                    });
            } catch (error) {
                vm.dataservices = [];
                vm.loading = false;
                vm.init = false;
                alert("An exception occurred:\n" + error.message);
            }

            // Removes any outdated dataservice
            vm.dataservice = null;
        }
        
        // Event handler for clicking the create button
        vm.onCreateDataServiceClicked = function ( dataserviceName, dataserviceDescription ) {
            try {
                RepoRestService.createDataService( dataserviceName, dataserviceDescription ).then(
                    function () {
                        // Reinitialise the list of data services
                        initDataServices();
                    },
                    function (response) {
                        throw RepoRestService.newRestException("Failed to create the dataservice. \n" + response.message);
                    });
            } catch (error) {} finally {
            }
        };
        
        // Event handler for clicking the update button
        vm.onUpdateDataServiceClicked = function ( dataserviceName, dataserviceDescription ) {
            try {
                RepoRestService.updateDataService( dataserviceName, dataserviceDescription ).then(
                    function () {
                        // Reinitialise the list of data services
                        initDataServices();
                    },
                    function (response) {
                        throw RepoRestService.newRestException("Failed to update the dataservice. \n" + response.message);
                    });
            } catch (error) {} finally {
            }
        };

        /**
         * Event handler for clicking the clone button
         */
        vm.onCloneDataServiceClicked = function ( dataserviceName, newDataserviceName ) {
            try {
                RepoRestService.cloneDataService( dataserviceName, newDataserviceName ).then(
                    function () {
                        // Reinitialise the list of data services
                        initDataServices();
                    },
                    function (response) {
                        throw RepoRestService.newRestException("Failed to clone the dataservice. \n" + response.message);
                    });
            } catch (error) {} finally {
            }
        };

        /**
         * Event handler for clicking the delete button
         */
        vm.onDeleteDataServiceClicked = function ( dataserviceName ) {
            try {
                RepoRestService.deleteDataService( dataserviceName ).then(
                    function () {
                        // Reinitialise the list of data services
                        initDataServices();
                    },
                    function (response) {
                        throw RepoRestService.newRestException("Failed to remove the dataservice. \n" + response.message);
                    });
            } catch (error) {} finally {
            }
        };

        /**
         * Event handler for exporting the dataservice
         */
        vm.onExportDataServiceClicked = function( dataservice ) {
            vm.dataservice = dataservice;
            try {
                DownloadService.download(vm.dataservice);
            } catch (error) {} finally {
            }
        };
                
        /**
         * Event handler for importing a dataservice
         */
        vm.onImportDataServiceClicked = function( ) {
            try {
                vm.showImport = true;
            } finally {
            }
        };

        /*
         * Callback called if the import has been cancelled
         */
        vm.onImportCancel = function() {
            vm.showImport = false;
        };

        /*
         * Callback called after the file has been imported
         */
        vm.onImportDone = function(result) {
            // Hide the import dialog
            vm.showImport = false;

            // Reinitialise the list of dataservices
            initDataServices();
        };
        
        /*
         * Select the given dataservices
         */
        vm.selectDataService = function (dataservice) {
            //
            // Set the selected dataservice
            //
            vm.dataservice = dataservice;
        };

        /*
         * return selected dataservice
         */
        vm.selectedDataService = function () {
            return vm.dataservice;
        };

        /*
         * return selected dataservice
         */
        vm.hasSelectedDataService = function () {
            if (! angular.isDefined(vm.dataservice))
                return false;

            if (_.isEmpty(vm.dataservice))
                return false;

            if (vm.dataservice === null)
                return false;

            return true;
        };

        // Initialise dataservice collection on loading
        initDataServices();
    }

})();
