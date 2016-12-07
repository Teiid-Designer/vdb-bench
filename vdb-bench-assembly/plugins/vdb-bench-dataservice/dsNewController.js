(function () {
    'use strict';

    var pluginName = 'vdb-bench.dataservice';
    var pluginDirName = 'vdb-bench-dataservice';

    angular
        .module(pluginName)
        .controller('DSNewController', DSNewController);

    DSNewController.$inject = ['SvcSourceSelectionService'];

    function DSNewController(SvcSourceSelectionService) {
        var vm = this;
        
        vm.hasSources = SvcSourceSelectionService.getServiceSources().length>0;

    }

})();
