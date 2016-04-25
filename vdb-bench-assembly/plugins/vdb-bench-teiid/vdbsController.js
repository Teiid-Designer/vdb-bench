(function () {
    'use strict';

    var pluginName = 'vdb-bench.teiid';
    var pluginDirName = 'vdb-bench-teiid';

    angular
        .module(pluginName)
        .controller('VdbsController', VdbsController);

    VdbsController.$inject = ['RepoRestService', 'SYNTAX', 'REST_URI', 'VDB_KEYS'];

    function VdbsController(RepoRestService, SYNTAX, REST_URI, VDB_KEYS) {
        var vm = this;
    }
})();
