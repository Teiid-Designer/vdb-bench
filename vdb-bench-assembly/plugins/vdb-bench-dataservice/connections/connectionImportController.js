(function () {
    'use strict';

    var pluginName = 'vdb-bench.dataservice';
    var pluginDirName = 'vdb-bench-dataservice';

    angular
        .module(pluginName)
        .controller('ConnectionImportController', ConnectionImportController);

    ConnectionImportController.$inject = ['$rootScope', 'ConnectionSelectionService'];

    function ConnectionImportController($rootScope, ConnectionSelectionService) {
        var vm = this;

        /**
         * Event handler for importing a connection
         */
        vm.onImportConnectionClicked = function( ) {
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
            $rootScope.$broadcast("dataServicePageChanged", 'connection-summary');
        };

        /*
         * Callback called after the file has been imported
         */
        vm.onImportDone = function(result) {
            // Hide the import dialog
            vm.showImport = false;

            // Reinitialise the list of connections
            ConnectionSelectionService.refresh();
            // Broadcast the pageChange
            $rootScope.$broadcast("dataServicePageChanged", 'connection-summary');
        };
    }

})();
