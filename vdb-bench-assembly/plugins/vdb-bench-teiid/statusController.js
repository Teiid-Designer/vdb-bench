(function () {
        'use strict';

        var pluginName = 'vdb-bench.teiid';
        var pluginDirName = 'vdb-bench-teiid';

        angular
            .module(pluginName)
            .controller('StatusController', StatusController);

        StatusController.$inject = ['$scope', 'StorageService'];

        function StatusController($scope, storageService) {
            var vm = this;
            var name = 'teiid-status-dashboard';
            var model = storageService.getObject(name, null);
//            var model;
            if (! model) {
                model = {
                    title: "Status Dashboard",
                    structure: "6-6",
                    rows: [{
                        columns: [{
                            styleClass: "col-md-5",
                            widgets: [{
                                fullScreen: false,
                                modalSize: 'lg',
                                type: "teiid-connected"
                            }]
                        }]
                    }, {
                        columns: [{
                            styleClass: "col-md-12",
                            widgets: [{
                                fullScreen: false,
                                modalSize: 'lg',
                                type: "teiid-vdb-states"
                            }]
                        }]
                    }, {
                        columns: [{
                            styleClass: "col-md-4",
                            widgets: [{
                                fullScreen: false,
                                modalSize: 'lg',
                                type: "teiid-vdbs"
                            }]
                        }, {
                            styleClass: "col-md-4",
                            widgets: [{
                                fullScreen: false,
                                modalSize: 'lg',
                                type: "teiid-data-sources"
                            }]
                        }, {
                            styleClass: "col-md-4",
                            widgets: [{
                                fullScreen: false,
                                modalSize: 'lg',
                                type: "teiid-translators"
                            }]
                        }]
                    }]
                };
            }

            vm.model = model;

            $scope.$on('adfDashboardChanged', function(event, name, model) {
                storageService.setObject(name, model);
            });
        }
})();
