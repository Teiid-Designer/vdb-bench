(function () {
    'use strict';

    var pluginName = 'vdb-bench.dataservice';
    var pluginDirName = 'vdb-bench-dataservice';

    angular
        .module(pluginName)
        .controller('ConnectionNewController', ConnectionNewController);

    ConnectionNewController.$inject = [ ];

    function ConnectionNewController( ) {
        var vm = this;

    }

})();
