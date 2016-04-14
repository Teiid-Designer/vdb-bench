(function () {
    'use strict';

    var pluginDirName = 'vdb-bench-teiid/widgets/vdbs';

    angular.module('adf.widget.teiid-vdbs', [
        'ui.bootstrap',
        'angularUtils.directives.dirPagination',
        'adf.provider',
        'vdb-bench.core'
    ])
        .config(config)
        .controller('TeiidVdbWidgetController', TeiidVdbWidgetController);

    config.$inject = ['dashboardProvider', 'CONFIG', 'SYNTAX'];

    function config(dashboardProvider, config, syntax) {
        dashboardProvider
            .widget('teiid-vdbs', {
                title: 'Vdbs',
                description: 'Displays the currently deployed vdbs of the local Teiid Instance',
                templateUrl: config.pluginDir + syntax.FORWARD_SLASH +
                                    pluginDirName + syntax.FORWARD_SLASH +
                                    'vdbs.html',
                controller: 'TeiidVdbWidgetController',
                controllerAs: 'vm'
            });
    }

    TeiidVdbWidgetController.$inject = ['RepoRestService', '$scope'];

    function TeiidVdbWidgetController(RepoRestService, $scope) {
        var vm = this;

        vm.loading = true;
        vm.total = {};
        vm.names = [];

        function setTotal(total) {
            vm.total = total;
        }

        function setNames(names) {
            if (names)
                vm.names = names;
            else
                vm.names = [];
        }

        function setError(error) {
            vm.error = error;
        }

        vm.init = function(){
            try {
                RepoRestService.getTeiidStatus().then(
                    function (teiidStatus) {
                        setError(null);
                        setTotal(teiidStatus.vdbSize);
                        setNames(teiidStatus.vdbNames);
                        vm.loading = false;
                    },
                    function (response) {
                        // Some kind of error has occurred
                        setTotal(0);
                        setNames(null);

                        setError(response.message);
                        vm.loading = false;
                    });
            } catch (error) {
                setTotal(0);
                setNames(null);

                setError(error.message);
                vm.loading = false;
            }
        };

        vm.init();
    }
    
})();
