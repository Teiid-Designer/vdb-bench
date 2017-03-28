(function () {
    'use strict';

    var pluginName = 'vdb-bench.dataservice';
    var pluginDirName = 'vdb-bench-dataservice';

    angular
        .module(pluginName)
        .controller('SvcSourceEditController', SvcSourceEditController);

    SvcSourceEditController.$inject = [ 'SvcSourceSelectionService', 'DSPageService'];

    function SvcSourceEditController( SvcSourceSelectionService, DSPageService) {
        var vm = this;

        /*
         * Set a custom title to the page including the service source's id
         */
        var page = DSPageService.page(DSPageService.SERVICESOURCE_EDIT_PAGE);
        DSPageService.setCustomTitle(page.id, page.title + " '" + SvcSourceSelectionService.selectedServiceSource().keng__id + "'");

    }

})();
