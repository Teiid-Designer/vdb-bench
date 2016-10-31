(function () {
    'use strict';

    var pluginName = 'vdb-bench.dataservice';
    var pluginDirName = 'vdb-bench-dataservice';

    angular
        .module(pluginName)
        .controller('DriverImportController', DriverImportController);

    DriverImportController.$inject = ['$rootScope', 'RepoRestService', 'DriverSelectionService'];

    function DriverImportController($rootScope, RepoRestService, DriverSelectionService) {
        var vm = this;

        /**
         * Event handler for importing a driver
         */
        vm.onImportDriverClicked = function( ) {
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
            // Broadcast the pageChange
            $rootScope.$broadcast("dataServicePageChanged", 'connection-new');
        };

        /*
         * Callback called after the file has been imported
         */
        vm.onImportDone = function(result) {
            // Hide the import dialog
            vm.showImport = false;

            if(result.success === true) {
                // On successful import, deploy the driver
                var driverName = result.Name;
                DriverSelectionService.setDeploying(true, driverName, false, null);
                try {
                    RepoRestService.deployDriver( driverName ).then(
                        function ( result ) {
                            vm.deploymentSuccess = result.Information.deploymentSuccess == "true";
                            if(vm.deploymentSuccess === true) {
                                DriverSelectionService.setDeploying(false, driverName, true, null);
                                alert("Driver Deployment Successful!");
                            } else {
                                DriverSelectionService.setDeploying(false, driverName, false, result.Information.ErrorMessage1);
                                alert("Driver Deployment Failed! \n"+result.Information.ErrorMessage1);
                            }
                       },
                        function (response) {
                            DriverSelectionService.setDeploying(false, driverName, false, RepoRestService.responseMessage(response));
                            throw RepoRestService.newRestException("Failed to deploy the driver. \n" + RepoRestService.responseMessage(response));
                        });
                } catch (error) {} finally {
                    vm.deploymentSuccess = false;
                    vm.deploymentMessage = null;
                    DriverSelectionService.setDeploying(false);
                }

                // Update the list of drivers
                DriverSelectionService.refresh();
            }
        
            // Broadcast the pageChange
            $rootScope.$broadcast("dataServicePageChanged", 'connection-new');
        };
    }

})();
