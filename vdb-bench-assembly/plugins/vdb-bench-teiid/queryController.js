(function () {
    'use strict';

    var pluginName = 'vdb-bench.teiid';
    var pluginDirName = 'vdb-bench-teiid';

    angular
        .module(pluginName)
        .controller('QueryController', QueryController);

    QueryController.$inject = ['RepoRestService', 'REST_URI', 'VdbSelectionService'];

    function QueryController(RepoRestService, REST_URI, VdbSelectionService) {
        var vm = this;

        /*
         * return selected vdb
         */
        vm.vdbSelected = function () {
            var vdb = VdbSelectionService.selected();
            return vdb;
        };
    }
})();
