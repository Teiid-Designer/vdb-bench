(function () {
    'use strict';

    var pluginName = 'vdb-bench.dataservice';
    var pluginDirName = 'vdb-bench-dataservice';
    var templatesDirName =  'templates';
    var exportDirName = 'export';
    var wizard = 'wizard';

    angular
        .module(pluginName)
        .controller('DSExportController', DSExportController);

    DSExportController.$inject = ['CONFIG', 'SYNTAX', 'RepoRestService', '$scope'];

    function DSExportController(config, syntax, RepoRestService, $scope) {
        var vm = this;

        vm.storageTypes = {};
        vm.exportType = {};
        vm.fileWizard = false;
        vm.gitWizard = false;

        vm.exportTypeSet = function() {
            if (angular.isUndefined(vm.exportType))
                vm.exportType = {};

            vm.fileWizard = vm.exportType.name === 'file' ? true : false;
            vm.gitWizard = vm.exportType.name === 'git' ? true : false;
        };

        $scope.$watch('vm.exportType', function(value) {
            vm.exportTypeSet();
        });

        function init() {
            try {
                 RepoRestService.availableStorageTypes().then(
                function (storageTypes) {
                    vm.storageTypes = storageTypes;
                },
                function (response) {
                    alert(response.data.error);
                });
            } finally {
            }
        }

        init();
    }

})();
