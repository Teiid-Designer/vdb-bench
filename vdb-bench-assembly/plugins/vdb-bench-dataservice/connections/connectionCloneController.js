(function () {
    'use strict';

    var pluginName = 'vdb-bench.dataservice';
    var pluginDirName = 'vdb-bench-dataservice';

    angular
        .module(pluginName)
        .controller('ConnectionCloneController', ConnectionCloneController);

    ConnectionCloneController.$inject = ['$rootScope', 'RepoRestService', 'ConnectionSelectionService'];

    function ConnectionCloneController($rootScope, RepoRestService, ConnectionSelectionService) {
        var vm = this;

        /**
         * Event handler for clicking the clone button
         */
        vm.onCloneConnectionClicked = function ( connectionName, newConnectionName ) {
            try {
                RepoRestService.cloneConnection( connectionName, newConnectionName ).then(
                    function () {
                        // Reinitialise the list of data services
                        ConnectionSelectionService.refresh(true);
                         // Broadcast the pageChange
                        $rootScope.$broadcast("dataServicePageChanged", 'connection-summary');
                   },
                    function (response) {
                        throw RepoRestService.newRestException("Failed to clone the connection. \n" + RepoRestService.responseMessage(response));
                    });
            } catch (error) {} finally {
            }
        };
    }

})();
