(function () {
    'use strict';

    var pluginName = 'vdb-bench.dataservice';
    var pluginDirName = 'vdb-bench-dataservice/widgets/dataservice-wizard';

    angular
        .module(pluginName)
        .directive('twoTableViewStep', TwoTableViewStep);

    TwoTableViewStep.$inject = ['CONFIG', 'SYNTAX'];
    TwoTableViewStepController.$inject = ['$translate', 'EditWizardService', 'REST_URI', 'SYNTAX', 'JOIN'];

    function TwoTableViewStep(config, syntax) {
        var directive = {
            restrict: 'E',
            scope: {},
            bindToController: {
                wizardActive : '='
            },
            controller: TwoTableViewStepController,
            controllerAs: 'vm',
            templateUrl: config.pluginDir + syntax.FORWARD_SLASH +
                         pluginDirName + syntax.FORWARD_SLASH +
                         'twoTableViewStep.html'
        };

        return directive;
    }

    function TwoTableViewStepController($translate, EditWizardService, REST_URI, SYNTAX, JOIN) {
        var vm = this;

        vm.stepTitle = $translate.instant('twoTableViewStep.stepTitle');
        vm.selectedSources = [];
        vm.selectedTables = [];
        vm.lhSourceItems = [];
        vm.rhSourceItems = [];
        vm.lhCriteriaCol = null;
        vm.rhCriteriaCol = null;
        vm.instructionMessage = $translate.instant('twoTableViewStep.selectColumnsForLeftTableInstructionMsg');
        vm.nextEnablement = updateNextEnablement();
        vm.joinType = EditWizardService.joinType();
        vm.joinToolTipInner = $translate.instant('twoTableViewStep.joinToolTipInner');
        vm.joinToolTipLeftOuter = $translate.instant('twoTableViewStep.joinToolTipLeftOuter');
        vm.joinToolTipRightOuter = $translate.instant('twoTableViewStep.joinToolTipRightOuter');
        vm.joinToolTipFullOuter = $translate.instant('twoTableViewStep.joinToolTipFullOuter');

        /*
         * Join Definition step shown
         */
        vm.joinDefinitionStepShown = function() {
            vm.selectedSources = EditWizardService.sources();
            vm.selectedTables = EditWizardService.sourceTables();
            vm.lhSourceItems = EditWizardService.source1AvailableColumns();
            vm.rhSourceItems = EditWizardService.source2AvailableColumns();
            vm.joinType = EditWizardService.joinType();
            vm.lhCriteriaCol = EditWizardService.source1CriteriaColumn();
            vm.rhCriteriaCol = EditWizardService.source2CriteriaColumn();
            updateNextEnablement();
        };

        /*
         * Called when join type is changed
         */
        vm.selectJoinType = function(joinType) {
            EditWizardService.setJoinType(joinType);
            vm.joinType = joinType;
        };

        /*
         * Called when left criteria column is changed
         */
        vm.lhCriteriaColumnChanged = function() {
            EditWizardService.setSource1CriteriaColumn(vm.lhCriteriaCol);
        };

        /*
         * Called when right criteria column is changed
         */
        vm.rhCriteriaColumnChanged = function() {
            EditWizardService.setSource2CriteriaColumn(vm.rhCriteriaCol);
        };

        /*
         * Determine if left table has any selected columns
         */
        function lhHasSelectedColumns() {
            var hasSelected = false;
            for( var i = 0; i < vm.lhSourceItems.length; i++ ) {
                if(vm.lhSourceItems[i].selected) {
                    hasSelected = true;
                    break;
                }
            }
            return hasSelected;
        }

       /*
        * Determine if right table has any selected columns
        */
       function rhHasSelectedColumns() {
            var hasSelected = false;
            for( var i = 0; i < vm.rhSourceItems.length; i++ ) {
                if(vm.rhSourceItems[i].selected) {
                    hasSelected = true;
                    break;
                }
            }
            return hasSelected;
        }

       /*
        * Determine if valid join type is selected
        */
       function joinValid() {
           if ( angular.isDefined(vm.joinType) && vm.joinType !== null && 
                (vm.joinType === JOIN.INNER || vm.joinType === JOIN.LEFT_OUTER || 
                 vm.joinType === JOIN.RIGHT_OUTER || vm.joinType === JOIN.FULL_OUTER) ) {
               return true;
           }
           return false;
       }

        /*
         * Update next enablement
         */
        function updateNextEnablement() {
            if(!lhHasSelectedColumns()) {
                vm.nextEnablement = false;
                vm.instructionMessage = $translate.instant('twoTableViewStep.selectColumnsForLeftTableInstructionMsg');
            } else if(!rhHasSelectedColumns()){
                vm.nextEnablement = false;
                vm.instructionMessage = $translate.instant('twoTableViewStep.selectColumnsForRightTableInstructionMsg');
            } else if( !joinValid() ){
                vm.nextEnablement = false;
                vm.instructionMessage = $translate.instant('twoTableViewStep.selectJoinTypeInstructionMsg');
            } else if( !vm.lhCriteriaCol ){
                vm.nextEnablement = false;
                vm.instructionMessage = $translate.instant('twoTableViewStep.selectLeftTableCriteriaColumnInstructionMsg');
            } else if( !vm.rhCriteriaCol ){
                vm.nextEnablement = false;
                vm.instructionMessage = $translate.instant('twoTableViewStep.selectRightTableCriteriaColumnInstructionMsg');
            } else {
                vm.nextEnablement = true;
                vm.instructionMessage = $translate.instant('twoTableViewStep.clickFinishInstructionMsg');
            }
        }

    }

})();
