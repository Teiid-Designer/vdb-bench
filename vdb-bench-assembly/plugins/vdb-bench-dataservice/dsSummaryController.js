(function () {
    'use strict';

    var pluginName = 'vdb-bench.dataservice';
    var pluginDirName = 'vdb-bench-dataservice';

    angular
        .module(pluginName)
        .controller('DSSummaryController', DSSummaryController);

    DSSummaryController.$inject = ['$scope', 'RepoRestService', 'REST_URI', 'SYNTAX', 'DSSelectionService', 'DownloadService'];

    function DSSummaryController($scope, RepoRestService, REST_URI, SYNTAX, DSSelectionService, DownloadService) {
        var vm = this;

        vm.dsLoading = false;

        /*
         * When the data services have been loaded
         */
        $scope.$on('loadingDataServicesChanged', function (event, loading) {
            vm.dsLoading = loading;
        });

        /**
         * Access to the collection of data services
         */
        vm.getDataServices = function() {
            return DSSelectionService.getDataServices();
        };

        /**
         * Event handler for clicking the delete button
         */
        vm.onDeleteDataServiceClicked = function ( dataserviceName ) {
            try {
                RepoRestService.deleteDataService( dataserviceName ).then(
                    function () {
                        // Reinitialise the list of data services
                        DSSelectionService.refresh();
                    },
                    function (response) {
                        throw RepoRestService.newRestException("Failed to remove the dataservice. \n" + response.message);
                    });
            } catch (error) {} finally {
            }
        };

        /**
         * Event handler for clicking the deploy button
         */
        vm.onDeployDataServiceClicked = function ( dataserviceName ) {
            DSSelectionService.setDeploying(true);
            try {
                RepoRestService.deployDataService( dataserviceName ).then(
                    function ( result ) {
                        DSSelectionService.setDeploying(false);
                    },
                    function (response) {
                        DSSelectionService.setDeploying(false);
                        throw RepoRestService.newRestException("Failed to deploy the dataservice. \n" + response.message);
                    });
            } catch (error) {} finally {
                DSSelectionService.setDeploying(false);
            }
        };

        /**
         * Event handler for exporting the dataservice
         */
        vm.onExportDataServiceClicked = function( dataservice ) {
            DSSelectionService.selectDataService(dataservice);
            try {
                DownloadService.download(dataservice);
            } catch (error) {} finally {
            }
        };
    }

})();
