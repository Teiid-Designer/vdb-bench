(function () {
    'use strict';

    var pluginName = 'vdb-bench.dataservice';
    var pluginDirName = 'vdb-bench-dataservice';

    angular
        .module(pluginName)
        .controller('DSImportController', DSImportController);

    DSImportController.$inject = ['$rootScope', 'DSSelectionService'];

    function DSImportController($rootScope, DSSelectionService) {
        var vm = this;

        /**
         * Event handler for importing a dataservice
         */
        vm.onImportDataServiceClicked = function( ) {
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
            $rootScope.$broadcast("dataServicePageChanged", 'dataservice-summary');
        };

        /*
         * Callback called after the file has been imported
         */
        vm.onImportDone = function(result) {
            // Hide the import dialog
            vm.showImport = false;

            // Reinitialise the list of dataservices
            DSSelectionService.refresh();
            // Broadcast the pageChange
            $rootScope.$broadcast("dataServicePageChanged", 'dataservice-summary');
        };
    }

})();
