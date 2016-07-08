(function () {
    'use strict';

    var pluginName = 'vdb-bench.dataservice';
    var pluginDirName = 'vdb-bench-dataservice';

    angular
        .module(pluginName)
        .controller('DSTestController', DSTestController);

    DSTestController.$inject = ['$scope', 'DSSelectionService'];

    function DSTestController($scope, DSSelectionService) {
        var vm = this;

        vm.dsDeployInProgress = true;
        
        /*
         * When a data service is currently being deployed
         */
        $scope.$on('deployDataServiceChanged', function (event, dsDeployInProgress) {
            vm.dsDeployInProgress = dsDeployInProgress;
        });
    }

})();
