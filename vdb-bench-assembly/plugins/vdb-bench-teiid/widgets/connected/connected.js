(function () {
    'use strict';

    var pluginDirName = 'vdb-bench-teiid/widgets/connected';

    angular.module('adf.widget.teiid-connected', [
        'adf.provider',
        'vdb-bench.core'
    ])
        .config(config)
        .controller('TeiidConnectedController', TeiidConnectedController);

    config.$inject = ['dashboardProvider', 'CONFIG', 'SYNTAX'];

    function config(dashboardProvider, config, syntax) {
        dashboardProvider
            .widget('teiid-connected', {
                title: 'Teiid Status',
                description: 'Displays the connected status of the local Teiid Instance',
                templateUrl: config.pluginDir + syntax.FORWARD_SLASH +
                                    pluginDirName + syntax.FORWARD_SLASH +
                                    'connected.html',
                controller: 'TeiidConnectedController',
                controllerAs: 'vm'
            });
    }

    TeiidConnectedController.$inject = ['RepoRestService', '$scope'];

    function TeiidConnectedController(RepoRestService, $scope) {
        var vm = this;

        vm.loading = true;
        vm.connected = {};
        vm.available = {};

        function setClientVersion(version) {
            if (version)
                vm.clientVersion = version;
            else
                vm.clientVersion = 'Not Found';
        }

        function setRuntimeVersion(version) {
            if (version)
                vm.runtimeVersion = version;
            else
                vm.runtimeVersion = 'Not Found';
        }

        function setUrl(url) {
            if (url)
                vm.url = url;
            else
                vm.url = 'Not Found';
        }

        function setAvailable(available) {
            if (available) {
                vm.available.text = "Yes";
                vm.available.styleClass = "teiid-dashboard-widgets-connected-ok";
            } else {
                vm.available.text = "No";
                vm.available.styleClass = "teiid-dashboard-widgets-connected-bad";
            }
        }

        function setConnected(connected) {
            if (connected) {
                vm.connected.status = true;
                vm.connected.text = "Connected";
                vm.connected.styleClass = "teiid-dashboard-widgets-connected-ok";
            } else {
                vm.connected.status = false;
                vm.connected.text = "Unconnected";
                vm.connected.styleClass = "teiid-dashboard-widgets-connected-bad";
            }
        }

        function setError(error) {
            vm.error = error;
        }

        vm.init = function() {
            try {
                RepoRestService.getTeiidStatus().then(
                    function (teiidStatus) {
                        setError(null);
                        setClientVersion(teiidStatus.builtVersion);
                        setRuntimeVersion(teiidStatus.tko__version);
                        setUrl(teiidStatus.connectionUrl);
                        setConnected(teiidStatus.connected);
                        setAvailable(teiidStatus.instanceAvailable);

                        vm.loading = false;
                    },
                    function (response) {
                        // Some kind of error has occurred
                        setClientVersion(null);
                        setRuntimeVersion(null);
                        setUrl(null);
                        setConnected(false);
                        setAvailable(false);

                        setError(response.message);
                        vm.loading = false;
                    });
            } catch (error) {
                setClientVersion(null);
                setRuntimeVersion(null);
                setUrl(null);
                setConnected(false);
                setAvailable(false);

                setError(error.message);
                vm.loading = false;
            }
        };

        vm.init();
    }
    
})();
