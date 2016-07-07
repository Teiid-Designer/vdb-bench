(function () {
    'use strict';

    var pluginName = 'vdb-bench.dataservice';
    var pluginDirName = 'vdb-bench-dataservice';

    angular
        .module(pluginName)
        .controller('DSCloneController', DSCloneController);

    DSCloneController.$inject = ['RepoRestService', 'DSSelectionService'];

    function DSCloneController(RepoRestService, DSSelectionService) {
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
                    },
                    function (response) {
                        throw RepoRestService.newRestException("Failed to clone the dataservice. \n" + response.message);
                    });
            } catch (error) {} finally {
            }
        };
    }

})();
