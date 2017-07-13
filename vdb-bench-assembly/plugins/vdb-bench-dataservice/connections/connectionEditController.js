(function () {
    'use strict';

    var pluginName = 'vdb-bench.dataservice';
    var pluginDirName = 'vdb-bench-dataservice';

    angular
        .module(pluginName)
        .controller('ConnectionEditController', ConnectionEditController);

    ConnectionEditController.$inject = ['$rootScope', 'RepoRestService', 'ConnectionSelectionService'];

    function ConnectionEditController($rootScope, RepoRestService, ConnectionSelectionService) {
        var vm = this;
    }

})();
