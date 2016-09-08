(function () {
    'use strict';

    var pluginName = 'vdb-bench.dataservice';
    var pluginDirName = 'vdb-bench-dataservice';

    angular
        .module(pluginName)
        .controller('DSEditController', DSEditController);

    DSEditController.$inject = ['$rootScope', 'RepoRestService', 'DSSelectionService', 'SvcSourceSelectionService'];

    function DSEditController($rootScope, RepoRestService, DSSelectionService, SvcSourceSelectionService) {
        var vm = this;
        
        vm.svcSourcesLoading = SvcSourceSelectionService.isLoading();
        vm.svcSources = SvcSourceSelectionService.getServiceSources();
        
        // Gets the available service sources
        vm.getSvcSources = function() {
            return vm.svcSources;
        };

        // Event handler for clicking the update button
        vm.onUpdateDataServiceClicked = function ( dataserviceName, dataserviceDescription ) {
            try {
                RepoRestService.updateDataService( dataserviceName, dataserviceDescription ).then(
                    function () {
                        // Reinitialise the list of data services
                        DSSelectionService.refresh();
                        // Broadcast the pageChange
                        $rootScope.$broadcast("dataServicePageChanged", 'dataservice-summary');
                    },
                    function (response) {
                        throw RepoRestService.newRestException("Failed to update the dataservice. \n" + response.message);
                    });
            } catch (error) {} finally {
            }
        };
    }

})();
