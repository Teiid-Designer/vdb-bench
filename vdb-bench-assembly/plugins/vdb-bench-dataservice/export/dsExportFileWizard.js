(function () {
    'use strict';

    var pluginDirName = 'vdb-bench-dataservice';
    var pluginName = 'vdb-bench.dataservice';
    var exportDir = 'export';

    angular
        .module(pluginName)
        .directive('dsExportFileWizard', DSExportFileWizard);

    DSExportFileWizard.$inject = ['CONFIG', 'SYNTAX'];
    DSExportFileWizardController.$inject = ['DSSelectionService', 'DownloadService', '$scope'];

    function DSExportFileWizard(config, syntax) {
        var directive = {
            restrict: 'E',
            scope: {},
            bindToController: {
                'wizardActive': '='
            },
            controller: DSExportFileWizardController,
            controllerAs: 'vm',
            templateUrl: config.pluginDir + syntax.FORWARD_SLASH +
                pluginDirName + syntax.FORWARD_SLASH +
                exportDir + syntax.FORWARD_SLASH +
                'file-export-wizard.html'
        };

        return directive;
    }

    function DSExportFileWizardController(DSSelectionService, DownloadService, $scope) {
        var vm = this;

        /**
         * Event handler for exporting the dataservice as a file
         */
        vm.onExportDataServiceClicked = function() {
            var dataservice = DSSelectionService.selectedDataService();
            try {
                DownloadService.download(dataservice);
            } catch (error) {} finally {
            }
        };
    }
})();
