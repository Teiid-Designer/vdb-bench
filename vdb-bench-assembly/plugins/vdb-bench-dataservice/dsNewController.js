(function () {
    'use strict';

    var pluginName = 'vdb-bench.dataservice';
    var pluginDirName = 'vdb-bench-dataservice';

    angular
        .module(pluginName)
        .controller('DSNewController', DSNewController);

    DSNewController.$inject = ['$rootScope', 'RepoRestService', 'DSSelectionService'];

    function DSNewController($rootScope, RepoRestService, DSSelectionService) {
        var vm = this;

        // Event handler for clicking the create button
        vm.onCreateDataServiceClicked = function ( dataserviceName, dataserviceDescription ) {
            try {
                RepoRestService.createDataService( dataserviceName, dataserviceDescription ).then(
                    function () {
                        // Reinitialise the list of data services
                        DSSelectionService.refresh();
                        // Broadcast the pageChange
                        $rootScope.$broadcast("dataServicePageChanged", 'dataservice-summary');
                    },
                    function (response) {
                        throw RepoRestService.newRestException("Failed to create the dataservice. \n" + response.message);
                    });
            } catch (error) {} finally {
            }
        };
    }

})();
