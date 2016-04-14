(function () {
    'use strict';

    var pluginDirName = 'vdb-bench-teiid/widgets/vdb-states';
    var elementId = 'pieChart';

    var ACTIVE_COLOUR = "#4a9148";
    var LOADING_COLOUR = "#146cad";
    var FAILED_COLOUR = "#f72c33";

    angular.module('adf.widget.teiid-vdb-states', [
        'ui.bootstrap',
        'adf.provider',
        'vdb-bench.core'
    ])
        .config(config)
        .controller('TeiidVdbStatesController', TeiidVdbStatesController);

    config.$inject = ['dashboardProvider', 'CONFIG', 'SYNTAX'];

    // TODO
    // * Add a table beneath that shows any errors and their respective vdbs

    function config(dashboardProvider, config, syntax) {
        dashboardProvider
            .widget('teiid-vdb-states', {
                title: 'State of Deployed Vdbs',
                description: 'Displays the state of vdbs of the local Teiid Instance',
                templateUrl: config.pluginDir + syntax.FORWARD_SLASH +
                    pluginDirName + syntax.FORWARD_SLASH +
                    'vdb-states.html',
                controller: 'TeiidVdbStatesController',
                controllerAs: 'vm'
            });
    }

    TeiidVdbStatesController.$inject = ['RepoRestService', '$uibModal', 'CONFIG', 'SYNTAX'];

    function TeiidVdbStatesController(RepoRestService, $uibModal, config, syntax) {
        var vm = this;

        vm.loading = true;
        vm.vdbs = [];

        function setError(error) {
            vm.error = error;
        }

        vm.hasVdbs = function() {
            return ! _.isEmpty(vm.vdbs);
        };

        vm.state = function(vdb) {
            if (! vdb)
                return '';

            if (vdb.active)
                return "Active";

            if (vdb.loading)
                return "Loading";

            if (vdb.failed)
                return "Failed";

            return "Unknown";
        };

        vm.stateStyle = function(vdb) {
            if (! vdb)
                return {};

            if (vdb.active)
                return { color: ACTIVE_COLOUR };

            if (vdb.loading)
                return { color: LOADING_COLOUR };

            if (vdb.failed)
                return { color: FAILED_COLOUR };

            return {};
        };

        vm.hasErrors = function(vdb) {
            if (!vdb)
                return false;

            if (_.isEmpty(vdb.errors))
                return false;

            return true;
        };

        vm.showErrors = function(vdb) {
            if (!vdb)
                return;

            var modal = $uibModal.open({
                animation: 'true',
                backdrop: 'false',
                templateUrl: config.pluginDir + syntax.FORWARD_SLASH +
                                    pluginDirName + syntax.FORWARD_SLASH +
                                    'vdb-error-modal.html',                
                controller: ['$uibModalInstance', 'name', 'errors', function ($uibModalInstance, name, errors) {
                    var mvm = this;
                    mvm.name = name;
                    mvm.errors = errors;

                    mvm.ok = function () {
                        $uibModalInstance.dismiss();
                    };
                }],
                controllerAs: 'mvm',
                resolve: {
                    name: function () {
                        return vdb.name;
                    },
                    errors: function() {
                        return vdb.errors;
                    }
                }
            });
        };

        vm.init = function () {
            try {
                RepoRestService.getTeiidVdbStatus().then(
                    function (teiidVdbStatus) {
                        setError(null);

                        if (! teiidVdbStatus)
                            return;

                        vm.vdbs = teiidVdbStatus.vdbs;
                        generatePieChart(vm.vdbs);

                        vm.loading = false;
                    },
                    function (response) {
                        // Some kind of error has occurred
                        setError(response.message);
                        vm.vdbs = [];
                        vm.loading = false;
                    });
            } catch (error) {
                setError(error.message);
                vm.vdbs = [];
                vm.loading = false;
            }
        };

        vm.init();

        //
        // Created using generator
        // see http://d3pie.org for details
        //
        function generatePieChart(vdbs) {
            if (! vdbs) {
                return;
            }

            var active = 0;
            var loading = 0;
            var failed = 0;
            vdbs.forEach(function(vdb) {
                if (vdb.active)
                    active++;
                if (vdb.loading)
                    loading++;
                if (vdb.failed)
                    failed++;
            });

            //
            // Pie chart attaches to the div id
            // designated by elementId
            //
            var pie = new d3pie(elementId, {
                "size": {
                    "canvasHeight": 250,
                    "canvasWidth": 350,
                    "pieOuterRadius": "90%"
                },
                "data": {
                    "smallSegmentGrouping": {
                        "enabled": true
                    },
                    "content": [
                        {
                            "label": "Active",
                            "value": active,
                            "color": ACTIVE_COLOUR
			             },
                        {
                            "label": "Loading",
                            "value": loading,
                            "color": LOADING_COLOUR
			             },
                        {
                            "label": "Failed",
                            "value": failed,
                            "color": FAILED_COLOUR
			             }
		              ]
                },
                "labels": {
                    "outer": {
                        "pieDistance": 15
                    },
                    "inner": {
                        "format": "value"
                    },
                    "mainLabel": {
                        "font": "verdana"
                    },
                    "percentage": {
                        "color": "#e1e1e1",
                        "font": "verdana",
                        "decimalPlaces": 0
                    },
                    "value": {
                        "color": "#e1e1e1",
                        "font": "verdana"
                    },
                    "lines": {
                        "enabled": true,
                        "color": "#cccccc"
                    },
                    "truncation": {
                        "enabled": true
                    }
                },
                "effects": {
                    "pullOutSegmentOnClick": {
                        "effect": "linear",
                        "speed": 400,
                        "size": 8
                    }
                },
                "misc": {
                    "colors": {
                        "background": "#ffffff"
                    }
                }
            });
        }
    }

})();
