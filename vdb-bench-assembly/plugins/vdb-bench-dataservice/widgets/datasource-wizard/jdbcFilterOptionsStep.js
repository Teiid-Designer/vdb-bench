(function () {
    'use strict';

    var pluginName = 'vdb-bench.dataservice';
    var pluginDirName = 'vdb-bench-dataservice/widgets/datasource-wizard';

    angular
        .module(pluginName)
        .directive('jdbcFilterOptionsStep', JdbcFilterOptionsStep);

    JdbcFilterOptionsStep.$inject = ['CONFIG', 'SYNTAX'];
    JdbcFilterOptionsStepController.$inject = ['$translate', 'DatasourceWizardService'];

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

    function JdbcFilterOptionsStepController($translate, DatasourceWizardService) {
        var vm = this;
        
        vm.stepTitle = $translate.instant('jdbcFilterOptionsStep.stepTitle');
        vm.instructionMessage = "";
        vm.nextEnablement = updateNextEnablement();

        vm.jdbcFilterOptionsStepShown = function() {
            updateNextEnablement();
        };

        /*
         * Update next enablement and instruction message
         */
        function updateNextEnablement() {
            vm.nextEnablement = true;
            if(DatasourceWizardService.isEditing()) {
                vm.instructionMessage = $translate.instant('jdbcFilterOptionsStep.clickFinishEditInstructionMsg');
            } else {
                vm.instructionMessage = $translate.instant('jdbcFilterOptionsStep.clickFinishCreateInstructionMsg');
            }
        }

    }

})();
