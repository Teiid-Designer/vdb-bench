(function () {
    'use strict';

    var pluginName = 'vdb-bench.dataservice';
    var pluginDirName = 'vdb-bench-dataservice';

    angular
        .module(pluginName)
        .controller('SvcSourceCloneController', SvcSourceCloneController);

    SvcSourceCloneController.$inject = ['$scope', '$rootScope', 'RepoRestService', 'SvcSourceSelectionService'];

    function SvcSourceCloneController($scope, $rootScope, RepoRestService, SvcSourceSelectionService) {
        var vm = this;
        var cloneVdbInProgress = false;

        /*
         * When loading finishes on copy / deploy
         */
        $scope.$on('loadingServiceSourcesChanged', function (event, loadingState) {
            if(loadingState === false) {
                vm.cloneVdbInProgress = false;
            }
        });

        /**
         * Event handler for clicking the clone button
         */
        vm.onCloneSvcSourceClicked = function ( svcSourceName, newSvcSourceName ) {
            // Set loading true for modal popup
           vm.cloneVdbInProgress = true;
           SvcSourceSelectionService.setLoading(true);
            
           try {
                RepoRestService.cloneVdb( svcSourceName, newSvcSourceName ).then(
                    function () {
                        deployVdb(newSvcSourceName);
                    },
                    function (response) {
                        throw RepoRestService.newRestException("Failed to clone the service source. \n" + response.message);
                    });
            } catch (error) {} finally {
            }
        };
        
        /**
         * Deploys the specified VDB to the server
         */
        function deployVdb(vdbName) {
            // Deploy the VDB to the server.  At the end, fire notification to go to summary page
            try {
                SvcSourceSelectionService.setDeploying(true, vdbName, false, null);
                RepoRestService.deployVdb( vdbName ).then(
                    function ( result ) {
                        vm.deploymentSuccess = (result.Information.deploymentSuccess === "true");
                        if(vm.deploymentSuccess === true) {
                            SvcSourceSelectionService.setDeploying(false, vdbName, true, null);
                        } else {
                            SvcSourceSelectionService.setDeploying(false, vdbName, false, result.Information.ErrorMessage1);
                        }
                        // Reinitialise the list of service sources
                        SvcSourceSelectionService.refresh('datasource-summary');
                   },
                    function (response) {
                        SvcSourceSelectionService.setDeploying(false, vdbName, false, response.message);
                        throw RepoRestService.newRestException("Failed to deploy the ServiceSource. \n" + response.message);
                    });
            } catch (error) {} finally {
            }
        }

    }

})();
