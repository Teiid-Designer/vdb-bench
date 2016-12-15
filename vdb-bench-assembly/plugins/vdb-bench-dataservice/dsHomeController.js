(function () {
    'use strict';

    var pluginName = 'vdb-bench.dataservice';
    var pluginDirName = 'vdb-bench-dataservice';

    angular
        .module(pluginName)
        .controller('DSHomeController', DSHomeController);

    DSHomeController.$inject = ['$scope', 'StorageService'];

    function DSHomeController($scope, StorageService) {
        var vm = this;
        vm.name = 'dv-home-dashboard';

        var model = StorageService.getObject(vm.name, null);
        if (! model) {
            model = {
                title: " ",
                structure: "6-6",
                rows: [{
                    columns: [{
                        styleClass: "col-md-8",
                        widgets: [{
                            fullScreen: false,
                            modalSize: 'lg',
                            type: "ds-welcome"
                        }]
                    }, {
                        styleClass: "col-md-3",
                        widgets: [{
                            fullScreen: false,
                            modalSize: 'lg',
                            type: "app-about"
                        }]
                    }]
                }, {
                    columns: [{
                        styleClass: "col-md-5",
                        widgets: [{
                            fullScreen: false,
                            modalSize: 'lg',
                            type: "teiid-connected"
                        }]
                    }, {
                        styleClass: "col-md-3",
                        widgets: [{
                            fullScreen: false,
                            modalSize: 'lg',
                            type: "ds-dataservices"
                        }]
                    }, {
                        styleClass: "col-md-3",
                        widgets: [{
                            fullScreen: false,
                            modalSize: 'lg',
                            type: "ds-svcsources"
                        }]
                    }]
                }]
            };
        }

        vm.model = model;

        $scope.$on('adfDashboardChanged', function(event, name, model) {
            if (vm.name !== name)
                return;

            StorageService.setObject(name, model);
        });
    }

})();