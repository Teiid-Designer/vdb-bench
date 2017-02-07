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
        vm.instructionMessage = $translate.instant('twoTableViewStep.selectColumnsForLeftTableInstructionMsg');
        vm.nextEnablement = updateNextEnablement();
        vm.joinType = EditWizardService.joinType();
        vm.joinToolTipInner = $translate.instant('twoTableViewStep.joinToolTipInner');
        vm.joinToolTipLeftOuter = $translate.instant('twoTableViewStep.joinToolTipLeftOuter');
        vm.joinToolTipRightOuter = $translate.instant('twoTableViewStep.joinToolTipRightOuter');
        vm.joinToolTipFullOuter = $translate.instant('twoTableViewStep.joinToolTipFullOuter');
        vm.selectAllLeftColumnsEnabled = true;
        vm.deselectAllLeftColumnsEnabled = true;
        vm.selectAllRightColumnsEnabled = true;
        vm.deselectAllRightColumnsEnabled = true;

        /*
         * Join Definition step shown
         */
        vm.joinDefinitionStepShown = function() {
            vm.selectedSources = EditWizardService.sources();
            vm.selectedTables = EditWizardService.sourceTables();
            vm.lhSourceItems = EditWizardService.source1AvailableColumns();
            vm.rhSourceItems = EditWizardService.source2AvailableColumns();
            vm.joinType = EditWizardService.joinType();
            updateNextEnablement();
        };

        /*
         * Called when join type is changed
         */
        vm.selectJoinType = function(joinType) {
            EditWizardService.setJoinType(joinType);
            vm.joinType = joinType;
        };

       vm.selectAllLeftColumns = function() {
           for( var i = 0; i < vm.lhSourceItems.length; i++ ) {
               vm.lhSourceItems[i].selected = true;
           }
       };

       vm.deselectAllLeftColumns = function() {
           for( var i = 0; i < vm.lhSourceItems.length; i++ ) {
               vm.lhSourceItems[i].selected = false;
           }
       };

       vm.selectAllRightColumns = function() {
           for( var i = 0; i < vm.rhSourceItems.length; i++ ) {
               vm.rhSourceItems[i].selected = true;
           }
       };

       vm.deselectAllRightColumns = function() {
           for( var i = 0; i < vm.rhSourceItems.length; i++ ) {
               vm.rhSourceItems[i].selected = false;
           }
       };

       /*
        * Determine if all left columns selected
        */
       function hasAllLeftColumnsSelected() {
           var allSelected = true;
           for( var i = 0; i < vm.lhSourceItems.length; i++ ) {
               if(!vm.lhSourceItems[i].selected) {
                   allSelected = false;
                   break;
               }
           }
           return allSelected;
       }

       /*
        * Determine if all left columns deselected
        */
       function hasAllLeftColumnsDeselected() {
           var allDeselected = true;
           for( var i = 0; i < vm.lhSourceItems.length; i++ ) {
               if(vm.lhSourceItems[i].selected) {
               	allDeselected = false;
                   break;
               }
           }
           return allDeselected;
       }

       /*
        * Determine if all right columns selected
        */
       function hasAllRightColumnsSelected() {
           var allSelected = true;
           for( var i = 0; i < vm.rhSourceItems.length; i++ ) {
               if(!vm.rhSourceItems[i].selected) {
                   allSelected = false;
                   break;
               }
           }
           return allSelected;
       }

       /*
        * Determine if all right columns deselected
        */
       function hasAllRightColumnsDeselected() {
           var allDeselected = true;
           for( var i = 0; i < vm.rhSourceItems.length; i++ ) {
               if(vm.rhSourceItems[i].selected) {
               	allDeselected = false;
                   break;
               }
           }
           return allDeselected;
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
            if(hasAllLeftColumnsSelected()) {
                vm.selectAllLeftColumnsEnabled = false;
                vm.deselectAllLeftColumnsEnabled = true;
            } else if(hasAllLeftColumnsDeselected()) {
                vm.selectAllLeftColumnsEnabled = true;
                vm.deselectAllLeftColumnsEnabled = false;
            } else {
                vm.selectAllLeftColumnsEnabled = true;
                vm.deselectAllLeftColumnsEnabled = true;
            }
            
            if(hasAllRightColumnsSelected()) {
                vm.selectAllRightColumnsEnabled = false;
                vm.deselectAllRightColumnsEnabled = true;
            } else if(hasAllRightColumnsDeselected()) {
                vm.selectAllRightColumnsEnabled = true;
                vm.deselectAllRightColumnsEnabled = false;
            } else {
                vm.selectAllRightColumnsEnabled = true;
                vm.deselectAllRightColumnsEnabled = true;
            }
            
            if(hasAllLeftColumnsDeselected()) {
                vm.nextEnablement = false;
                vm.instructionMessage = $translate.instant('twoTableViewStep.selectColumnsForLeftTableInstructionMsg');
            } else if(hasAllRightColumnsDeselected()){
                vm.nextEnablement = false;
                vm.instructionMessage = $translate.instant('twoTableViewStep.selectColumnsForRightTableInstructionMsg');
            } else if( !joinValid() ){
                vm.nextEnablement = false;
                vm.instructionMessage = $translate.instant('twoTableViewStep.selectJoinTypeInstructionMsg');
            } else {
                vm.nextEnablement = true;
                vm.instructionMessage = $translate.instant('twoTableViewStep.clickNextJoinCriteriaInstructionMsg');
            }
        }

    }

})();
