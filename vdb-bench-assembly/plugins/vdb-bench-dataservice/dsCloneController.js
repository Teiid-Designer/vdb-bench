(function () {
    'use strict';

    var pluginName = 'vdb-bench.dataservice';
    var pluginDirName = 'vdb-bench-dataservice';

    angular
        .module(pluginName)
        .controller('DSCloneController', DSCloneController);

    DSCloneController.$inject = ['$rootScope', '$translate', 'RepoRestService', 'DSSelectionService'];

    function DSCloneController($rootScope, $translate, RepoRestService, DSSelectionService) {
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
                	   throw RepoRestService.newRestException($translate.instant('dsCloneController.cloneFailedMsg', 
                                                                                 {response: RepoRestService.responseMessage(response)}));
                    });
            } catch (error) {} finally {
            }
        };
    }

})();
