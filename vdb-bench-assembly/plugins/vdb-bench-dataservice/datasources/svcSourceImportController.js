(function () {
    'use strict';

    var pluginName = 'vdb-bench.dataservice';
    var pluginDirName = 'vdb-bench-dataservice';

    angular
        .module(pluginName)
        .controller('SvcSourceImportController', SvcSourceImportController);

    SvcSourceImportController.$inject = ['$rootScope', 'SvcSourceSelectionService'];

    function SvcSourceImportController($rootScope, SvcSourceSelectionService) {
        var vm = this;

        /**
         * Event handler for importing a service source
         */
        vm.onImportSvcSourceClicked = function( ) {
            try {
                vm.showImport = true;
            } finally {
            }
        };

        /*
         * Callback called if the import has been cancelled
         */
        vm.onImportCancel = function() {
            vm.showImport = false;
            // Broadcast the pageChange
            $rootScope.$broadcast("dataServicePageChanged", 'datasource-summary');
        };

        /*
         * Callback called after the file has been imported
         */
        vm.onImportDone = function(result) {
            // Hide the import dialog
            vm.showImport = false;
            
            //TODO : Deploy the imported source

            // Reinitialise the list of service sources
            SvcSourceSelectionService.refresh("datasource-summary");
        };
    }

})();
