(function () {
    'use strict';

    var pluginName = 'vdb-bench.teiid';
    var pluginDirName = 'vdb-bench-teiid';

    angular
        .module(pluginName)
        .controller('TeiidController', TeiidController);

    TeiidController.$inject = ['SYNTAX', 'CONFIG', '$scope'];

    function TeiidController(syntax, config, $scope) {
        var vm = this;

        var STATUS_SECTION = 'status';
        var VDBS_SECTION = 'vdbs';
        var TRANSLATORS_SECTION = 'translators';
        var DATA_SOURCES_SECTION = 'data-sources';
        var sections = {
            'status': {
                id: 'status',
                title: 'Status',
                template: config.pluginDir + syntax.FORWARD_SLASH +
                                    pluginDirName + syntax.FORWARD_SLASH +
                                    'status.html'
            },
            'vdbs': {
                id: 'vdbs',
                title: 'VDBs',
                template: config.pluginDir + syntax.FORWARD_SLASH +
                                    pluginDirName + syntax.FORWARD_SLASH +
                                    'vdbs.html'
            },
            'translators': {
                id: 'translators',
                title: 'Translators',
                template: config.pluginDir + syntax.FORWARD_SLASH +
                                    pluginDirName + syntax.FORWARD_SLASH +
                                    'translators.html'
            },
            'data-sources': {
                id: 'data-sources',
                title: 'Data Sources',
                template: config.pluginDir + syntax.FORWARD_SLASH +
                                    pluginDirName + syntax.FORWARD_SLASH +
                                    'data-sources.html'
            }
        };

        vm.selectSection = function(sectionId) {
            vm.selectedSection = sections[sectionId];
        };

        $scope.$watch('vm.selectedSection', function (newVal, oldVal) {
                console.log("value of selected section: " + newVal);
            });

        vm.selectSection(STATUS_SECTION);
    }

})();