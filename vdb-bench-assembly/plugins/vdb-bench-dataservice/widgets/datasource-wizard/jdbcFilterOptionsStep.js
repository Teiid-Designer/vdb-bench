(function () {
    'use strict';

    var pluginName = 'vdb-bench.dataservice';
    var pluginDirName = 'vdb-bench-dataservice/widgets/datasource-wizard';

    angular
        .module(pluginName)
        .directive('jdbcFilterOptionsStep', JdbcFilterOptionsStep);

    JdbcFilterOptionsStep.$inject = ['CONFIG', 'SYNTAX'];
    JdbcFilterOptionsStepController.$inject = ['$scope', '$translate', 'DatasourceWizardService'];

    function JdbcFilterOptionsStep(config, syntax) {
        var directive = {
            restrict: 'E',
            scope: {},
            bindToController: {
                wizardActive : '='
            },
            controller: JdbcFilterOptionsStepController,
            controllerAs: 'vm',
            templateUrl: config.pluginDir + syntax.FORWARD_SLASH +
                         pluginDirName + syntax.FORWARD_SLASH +
                         'jdbcFilterOptionsStep.html'
        };

        return directive;
    }

    function JdbcFilterOptionsStepController($scope, $translate, DatasourceWizardService) {
        var vm = this;
        
        vm.stepTitle = $translate.instant('jdbcFilterOptionsStep.stepTitle');
        vm.instructionMessage = "";
        vm.nextEnablement = updateNextEnablement();
        vm.numSelectedTables = 0;

        /*
         * Receive notifications when jdbc filter options have changed.
         */
        $scope.$on('jdbcFilterOptionTablesChanged', function (event, nTables) {
            vm.numSelectedTables = nTables;
            updateNextEnablement();
        });

        vm.jdbcFilterOptionsStepShown = function() {
            updateNextEnablement();
        };

        /*
         * Update next enablement and instruction message
         */
        function updateNextEnablement() {
            if(vm.numSelectedTables>0) {
                vm.nextEnablement = true;
            } else {
                vm.nextEnablement = false;
            }

            if(DatasourceWizardService.isEditing()) {
                vm.instructionMessage = $translate.instant('jdbcFilterOptionsStep.clickFinishEditInstructionMsg');
            } else {
                vm.instructionMessage = $translate.instant('jdbcFilterOptionsStep.clickFinishCreateInstructionMsg');
            }
        }

    }

})();
