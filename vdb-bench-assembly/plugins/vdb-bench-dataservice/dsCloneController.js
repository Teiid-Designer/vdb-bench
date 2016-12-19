(function () {
    'use strict';

    var pluginName = 'vdb-bench.dataservice';
    var pluginDirName = 'vdb-bench-dataservice';

    angular
        .module(pluginName)
        .controller('DSCloneController', DSCloneController);

    DSCloneController.$inject = ['$rootScope', '$translate', 'RepoRestService', 'DSSelectionService', 'DSPageService'];

    function DSCloneController($rootScope, $translate, RepoRestService, DSSelectionService, DSPageService) {
        var vm = this;

        /*
         * Set a custom title to the page including the data service's id
         */
        var page = DSPageService.page(DSPageService.CLONE_DATASERVICE_PAGE);
        DSPageService.setCustomTitle(page.id, page.title + " '" + DSSelectionService.selectedDataService().keng__id + "'");

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
