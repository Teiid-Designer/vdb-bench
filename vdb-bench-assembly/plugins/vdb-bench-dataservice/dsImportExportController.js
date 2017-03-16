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

    DSImportExportController.$inject = ['$translate', 
                                        'CONFIG', 
                                        'SYNTAX', 
                                        'RepoRestService', 
                                        '$scope', 
                                        'DSPageService',
                                        'DSSelectionService',
                                        'ImportExportService'];

    function DSImportExportController($translate, 
                                      config, 
                                      syntax, 
                                      RepoRestService, 
                                      $scope, 
                                      DSPageService,
                                      DSSelectionService,
                                      ImportExportService) {
        var vm = this;

        vm.storageTypes = [];
        vm.storageType = {};
        vm.gitWizard = false;

        /**
         * Final location of all the parameters
         * populated by the wizard
         */
        vm.repo = {
            parameters: {}
        };

        vm.backCallback = function (step) {
            return true;
        };

        $scope.$on("wizard:stepChanged", function (e, parameters) {
            if ( parameters.step.stepId == 'data-service-export' ) {
                vm.nextButtonTitle = $translate.instant( 'shared.Export' );
            } else if (parameters.step.stepId.endsWith('-final')) {
                vm.nextButtonTitle = $translate.instant('shared.Finish');
            } else {
                vm.nextButtonTitle = $translate.instant('shared.Next');
            }
        });
        
        // since this controller is for both import and export set both when storage type changes
        var updatePageHelpId = function() {
            var suffix = vm.storageType.name;

            // set import page help ID
            var importPage = DSPageService.page( DSPageService.IMPORT_DATASERVICE_PAGE );
            DSPageService.setCustomHelpId( importPage.id, "dataservice-import-" + suffix );

            // set export page help ID
            var exportPage = DSPageService.page( DSPageService.EXPORT_DATASERVICE_PAGE );
            DSPageService.setCustomHelpId( exportPage.id, "dataservice-export-" + suffix );
        };

        function init() {
            vm.storageTypes = ImportExportService.storageTypes();
            vm.storageType = vm.storageTypes.length > 0 ? vm.storageTypes[ 0 ] : {};

            vm.gitWizard = vm.storageType.name === 'git' ? true : false;

            // update page help ID when storage type changes
            updatePageHelpId();
        }

        init();
    }

})();
