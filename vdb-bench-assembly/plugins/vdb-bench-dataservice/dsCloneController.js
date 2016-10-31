(function () {
    'use strict';

    var pluginName = 'vdb-bench.dataservice';
    var pluginDirName = 'vdb-bench-dataservice';

    angular
        .module(pluginName)
        .controller('DSCloneController', DSCloneController);

    DSCloneController.$inject = ['$rootScope', 'RepoRestService', 'DSSelectionService'];

    function DSCloneController($rootScope, RepoRestService, DSSelectionService) {
        var vm = this;

        /**
         * Event handler for clicking the clone button
         */
        vm.onCloneDataServiceClicked = function ( dataserviceName, newDataserviceName ) {
            try {
                RepoRestService.cloneDataService( dataserviceName, newDataserviceName ).then(
                    function () {
                        // Reinitialise the list of data services
                        DSSelectionService.refresh();
                         // Broadcast the pageChange
                        $rootScope.$broadcast("dataServicePageChanged", 'dataservice-summary');
                   },
                    function (response) {
                        throw RepoRestService.newRestException("Failed to clone the dataservice. \n" + RepoRestService.responseMessage(response));
                    });
            } catch (error) {} finally {
            }
        };
    }

})();
