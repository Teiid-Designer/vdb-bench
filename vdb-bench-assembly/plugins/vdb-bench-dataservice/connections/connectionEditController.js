(function () {
    'use strict';

    var pluginName = 'vdb-bench.dataservice';
    var pluginDirName = 'vdb-bench-dataservice';

    angular
        .module(pluginName)
        .controller('ConnectionEditController', ConnectionEditController);

    ConnectionEditController.$inject = ['$rootScope', 'RepoRestService', 'ConnectionSelectionService'];

    function ConnectionEditController($rootScope, RepoRestService, ConnectionSelectionService) {
        var vm = this;

        // Event handler for clicking the update button
        vm.onUpdateConnectionClicked = function ( jsonPayload ) {
            try {
                RepoRestService.updateDataSource( jsonPayload ).then(
                    function () {
                        // Reinitialise the list of connections
                        ConnectionSelectionService.refresh();
                        // Broadcast the pageChange
                        $rootScope.$broadcast("dataServicePageChanged", 'connection-summary');
                    },
                    function (response) {
                        throw RepoRestService.newRestException("Failed to update the connection. \n" + RepoRestService.responseMessage(response));
                    });
            } catch (error) {} finally {
            }
        };
    }

})();
