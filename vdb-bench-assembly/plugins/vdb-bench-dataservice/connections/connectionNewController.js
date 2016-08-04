(function () {
    'use strict';

    var pluginName = 'vdb-bench.dataservice';
    var pluginDirName = 'vdb-bench-dataservice';

    angular
        .module(pluginName)
        .controller('ConnectionNewController', ConnectionNewController);

    ConnectionNewController.$inject = ['$rootScope', 'RepoRestService', 'ConnectionSelectionService'];

    function ConnectionNewController($rootScope, RepoRestService, ConnectionSelectionService) {
        var vm = this;

        // Event handler for clicking the create button
        vm.onCreateConnectionClicked = function ( connectionName ) {
            try {
                RepoRestService.createDataSource( connectionName ).then(
                    function () {
                        // Reinitialise the list of data services
                        ConnectionSelectionService.refresh();
                        // Broadcast the pageChange
                        $rootScope.$broadcast("dataServicePageChanged", 'connection-summary');
                    },
                    function (response) {
                        throw RepoRestService.newRestException("Failed to create the connection. \n" + response.message);
                    });
            } catch (error) {} finally {
            }
        };
    }

})();
