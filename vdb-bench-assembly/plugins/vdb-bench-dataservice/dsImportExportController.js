(function () {
    'use strict';

    var pluginName = 'vdb-bench.dataservice';
    var pluginDirName = 'vdb-bench-dataservice';
    var templatesDirName =  'templates';
    var exportDirName = 'export';
    var wizard = 'wizard';

    angular
        .module(pluginName)
        .controller('DSImportExportController', DSImportExportController);

    DSImportExportController.$inject = ['$translate', 'CONFIG', 'SYNTAX', 'RepoRestService', '$scope', 'DSPageService'];

    function DSImportExportController($translate, config, syntax, RepoRestService, $scope, DSPageService) {
        var vm = this;

        vm.storageTypes = {};
        vm.storageType = {};
        vm.fileWizard = false;
        vm.gitWizard = false;

        vm.backCallback = function (step) {
            return true;
        };

        $scope.$on("wizard:stepChanged", function (e, parameters) {
            if (parameters.step.stepId.endsWith('-final')) {
                vm.nextButtonTitle = $translate.instant('shared.Finish');
            } else {
                vm.nextButtonTitle = $translate.instant('shared.Next');
            }
        });
        
        var updatePageHelpId = function() {
            var suffix = vm.storageType.name;
            var page = DSPageService.page( DSPageService.IMPORT_DATASERVICE_PAGE );
            DSPageService.setCustomHelpId( page.id, "dataservice-import-" + suffix );
        };

        vm.storageTypeSet = function() {
            if (angular.isUndefined(vm.storageType))
                vm.storageType = {};

            vm.fileWizard = vm.storageType.name === 'file' ? true : false;
            vm.gitWizard = vm.storageType.name === 'git' ? true : false;
        };

        $scope.$watch('vm.storageType', function(value) {
            vm.storageTypeSet();

            // update page help ID when storage type changes
            updatePageHelpId();
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
