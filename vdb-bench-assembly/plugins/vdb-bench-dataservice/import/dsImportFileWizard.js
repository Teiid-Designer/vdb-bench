(function () {
    'use strict';

    var pluginDirName = 'vdb-bench-dataservice';
    var pluginName = 'vdb-bench.dataservice';
    var importDir = 'import';

    angular
        .module(pluginName)
        .directive('dsImportFileWizard', DSImportFileWizard);

    DSImportFileWizard.$inject = ['CONFIG', 'SYNTAX'];
    DSImportFileWizardController.$inject = ['$rootScope', 'DSSelectionService'];

    function DSImportFileWizard(config, syntax) {
        var directive = {
            restrict: 'E',
            scope: {},
            bindToController: {
                'wizardActive': '='
            },
            controller: DSImportFileWizardController,
            controllerAs: 'vm',
            templateUrl: config.pluginDir + syntax.FORWARD_SLASH +
                pluginDirName + syntax.FORWARD_SLASH +
                importDir + syntax.FORWARD_SLASH +
                'file-import-wizard.html'
        };

        return directive;
    }

    function DSImportFileWizardController($rootScope, DSSelectionService) {
        var vm = this;

        /*
         * Callback called after the file has been imported
         */
        vm.onImportDone = function(result) {
            // Reinitialise the list of dataservices
            DSSelectionService.refresh();
        };
    }
})();
