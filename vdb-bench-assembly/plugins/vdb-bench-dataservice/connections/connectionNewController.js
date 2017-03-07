(function () {
    'use strict';

    var pluginName = 'vdb-bench.dataservice';
    var pluginDirName = 'vdb-bench-dataservice';

    angular
        .module(pluginName)
        .controller('ConnectionNewController', ConnectionNewController);

    ConnectionNewController.$inject = ['$scope', '$rootScope', 'REST_URI', 'RepoRestService', 'ConnectionSelectionService', 'DriverSelectionService'];

    function ConnectionNewController($scope, $rootScope, REST_URI, RepoRestService, ConnectionSelectionService, DriverSelectionService) {
        var vm = this;

        vm.driversLoading = DriverSelectionService.isLoading();
        vm.allDrivers = DriverSelectionService.getDrivers();

        /*
         * When the drivers have been loaded
         */
        $scope.$on('loadingDriversChanged', function (event, loading) {
            vm.driversLoading = loading;
            if(vm.driversLoading === false) {
                vm.allDrivers = DriverSelectionService.getDrivers();
           }
        });

        /**
         * Access to the collection of drivers
         */
        vm.getDrivers = function() {
            return vm.allDrivers;
        };

        
        // Event handler for clicking the create button
        vm.onCreateConnectionClicked = function ( connectionName, jndiName, driverName ) {
            try {
                RepoRestService.createConnection( connectionName, jndiName, driverName ).then(
                    function () {
                        // Reinitialise the list of data services
                        ConnectionSelectionService.refresh();
                        // Broadcast the pageChange
                        $rootScope.$broadcast("dataServicePageChanged", 'connection-summary');
                    },
                    function (response) {
                        throw RepoRestService.newRestException("Failed to create the connection. \n" + RepoRestService.responseMessage(response));
                    });
            } catch (error) {} finally {
            }
        };
    }

})();
