(function () {
    'use strict';

    var pluginDirName = 'vdb-bench-dataservice/widgets/dataservices';

    angular.module('adf.widget.ds-dataservices', [
        'ui.bootstrap',
        'angularUtils.directives.dirPagination',
        'adf.provider',
        'vdb-bench.core'
    ])
        .config(config)
        .controller('DSDataservicesController', DSDataservicesController);

    config.$inject = ['dashboardProvider', 'CONFIG', 'SYNTAX'];

    function config(dashboardProvider, config, syntax) {
        dashboardProvider
            .widget('ds-dataservices', {
                title: 'Data Services',
                description: 'Displays the current Data Services',
                templateUrl: config.pluginDir + syntax.FORWARD_SLASH +
                                    pluginDirName + syntax.FORWARD_SLASH +
                                    'dataservices.html',
                controller: 'DSDataservicesController',
                controllerAs: 'vm'
            });
    }

    DSDataservicesController.$inject = ['RepoRestService', '$scope', '$rootScope', 'DSPageService'];

    function DSDataservicesController(RepoRestService, $scope, $rootScope, DSPageService) {
        var vm = this;

        vm.loading = true;
        vm.total = {};
        vm.names = [];

        function setTotal(total) {
            vm.total = total;
        }

        function setNames(dataservices) {
            if (_.isEmpty(dataservices))
                vm.names = [];

            var names = [];
            for (var i = 0; i < dataservices.length; ++i) {
                names.push(dataservices[i].keng__id);
            }

            vm.names = names;
        }

        function setError(error) {
            vm.error = error;
        }

        vm.selectPage = function(pageId) {
            //
            // Should notify the dataPageController to change the page view
            //
            $rootScope.$broadcast("dataServicePageChanged", pageId);
        };

        vm.page = function(pageId) {
            return DSPageService.page(pageId);
        };

        vm.init = function(){
            try {
                RepoRestService.getDataServices().then(
                    function (dataservices) {
                        setError(null);
                        setTotal(dataservices.length);
                        setNames(dataservices);
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
