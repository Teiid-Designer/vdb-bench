(function () {
    'use strict';

    var pluginName = 'vdb-bench.dataservice';
    var pluginDirName = 'vdb-bench-dataservice';

    angular
        .module(pluginName)
        .controller('DSEditController', DSEditController);

    DSEditController.$inject = ['$rootScope', 'RepoRestService', 'DSSelectionService'];

    function DSEditController($rootScope, RepoRestService, DSSelectionService) {
        var vm = this;

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
