(function () {
    'use strict';

    var pluginDirName = 'vdb-bench-teiid/widgets/translators';

    angular.module('adf.widget.teiid-translators', [
        'ui.bootstrap',
        'angularUtils.directives.dirPagination',
        'adf.provider',
        'vdb-bench.core'
    ])
        .config(config)
        .controller('TeiidTranslatorController', TeiidTranslatorController);

    config.$inject = ['dashboardProvider', 'CONFIG', 'SYNTAX'];

    function config(dashboardProvider, config, syntax) {
        dashboardProvider
            .widget('teiid-translators', {
                title: 'Translators',
                description: 'Displays the current translators of the local Teiid Instance',
                templateUrl: config.pluginDir + syntax.FORWARD_SLASH +
                                    pluginDirName + syntax.FORWARD_SLASH +
                                    'translators.html',
                controller: 'TeiidTranslatorController',
                controllerAs: 'vm'
            });
    }

    TeiidTranslatorController.$inject = ['RepoRestService', '$scope'];

    function TeiidTranslatorController(RepoRestService, $scope) {
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
                        setTotal(teiidStatus.translatorSize);
                        setNames(teiidStatus.translatorNames);
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
