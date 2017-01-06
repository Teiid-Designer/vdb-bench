(function () {
    'use strict';

    var pluginName = 'vdb-bench.dataservice';
    var pluginDirName = 'vdb-bench-dataservice/widgets/dataservice-wizard';

    angular
        .module(pluginName)
        .directive('singleTableViewStep', SingleTableViewStep);

    SingleTableViewStep.$inject = ['CONFIG', 'SYNTAX'];
    SingleTableViewStepController.$inject = ['$translate', 'EditWizardService', 'REST_URI', 'SYNTAX'];

    function SingleTableViewStep(config, syntax) {
        var directive = {
            restrict: 'E',
            scope: {},
            bindToController: {
                wizardActive : '='
            },
            controller: SingleTableViewStepController,
            controllerAs: 'vm',
            templateUrl: config.pluginDir + syntax.FORWARD_SLASH +
                         pluginDirName + syntax.FORWARD_SLASH +
                         'singleTableViewStep.html'
        };

        return directive;
    }

    function SingleTableViewStepController($translate, EditWizardService, REST_URI, SYNTAX) {
        var vm = this;
        
        vm.stepTitle = $translate.instant('singleTableViewStep.stepTitle');
        vm.items = [];
        vm.instructionMessage = $translate.instant('singleTableViewStep.selectOneOrMoreColumnsInstructionMsg');
        vm.nextEnablement = updateNextEnablement();

        vm.viewDefinitionStepShown = function() {
            vm.items = EditWizardService.source1AvailableColumns();
            updateNextEnablement();
        };

        /*
         * Determine if the list has selected columns
         */
        function hasSelectedColumns() {
            var hasSelected = false;
            for( var i = 0; i < vm.items.length; i++ ) {
                if(vm.items[i].selected) {
                    hasSelected = true;
                    break;
                }
            }
            return hasSelected;
        }

        /*
         * Update next enablement
         */
        function updateNextEnablement() {
            if(hasSelectedColumns()) {
                vm.nextEnablement = true;
                vm.instructionMessage = $translate.instant('singleTableViewStep.clickFinishInstructionMsg');
            } else {
                vm.nextEnablement = false;
                vm.instructionMessage = $translate.instant('singleTableViewStep.selectOneOrMoreColumnsInstructionMsg');
            }
        }

        
        /**
         * List and Card Configuration
         */
        vm.listConfig = {
          showSelectBox: true,
          multiSelect: true,
          selectionMatchProp: 'keng__id',
          checkDisabled: false
        };

    }

})();
