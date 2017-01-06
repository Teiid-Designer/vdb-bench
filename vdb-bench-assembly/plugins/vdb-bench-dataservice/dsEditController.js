(function () {
    'use strict';

    var pluginName = 'vdb-bench.dataservice';
    var pluginDirName = 'vdb-bench-dataservice';

    angular
        .module(pluginName)
        .controller('DSEditController', DSEditController);

    DSEditController.$inject = ['SvcSourceSelectionService', 'DSSelectionService', 'DSPageService'];

    function DSEditController(SvcSourceSelectionService, DSSelectionService, DSPageService) {
        var vm = this;
        
        /*
         * Set a custom title to the page including the data service's id
         */
        var page = DSPageService.page(DSPageService.EDIT_DATASERVICE_PAGE);
        DSPageService.setCustomTitle(page.id, page.title + " '" + DSSelectionService.selectedDataService().keng__id + "'");

        vm.svcSourcesLoading = SvcSourceSelectionService.isLoading();

    }
    
})();
