(function () {
    'use strict';

    var pluginName = 'vdb-bench.dataservice';
    var pluginDirName = 'vdb-bench-dataservice/widgets/dataservice-wizard';

    angular
        .module(pluginName)
        .directive('dataserviceEditWizard', DataserviceEditWizard);

    DataserviceEditWizard.$inject = ['CONFIG', 'SYNTAX'];
    DataserviceEditWizardController.$inject = ['$scope', '$rootScope', '$document', '$translate',
                                               'RepoRestService', 'EditWizardService', 'DSSelectionService', 'SvcSourceSelectionService', 'REST_URI', 'SYNTAX'];

    function DataserviceEditWizard(config, syntax) {
        var directive = {
            restrict: 'E',
            scope: {},
            controller: DataserviceEditWizardController,
            controllerAs: 'vm',
            templateUrl: config.pluginDir + syntax.FORWARD_SLASH +
                         pluginDirName + syntax.FORWARD_SLASH +
                         'dataserviceEditWizard.html'
        };

        return directive;
    }

    function DataserviceEditWizardController($scope, $rootScope, $document, $translate,
                                             RepoRestService, EditWizardService, DSSelectionService, SvcSourceSelectionService, REST_URI, SYNTAX) {
        var vm = this;
        vm.stepTitle = $translate.instant('dataserviceEditWizard.stepTitle');
        vm.nextButtonTitle = $translate.instant('shared.Next');
        vm.treedata = [];
        vm.treeLoading = false;
        vm.hasTreeFetchError = false;
        vm.treeFetchErrorMsg = "";
        vm.selectedTable = null;
        vm.initialTreeNodeSelection = null;
        vm.initialTreeExpandedNodes = [];
        vm.nextEnablement = false;
        vm.currentWizardStep = "";
        vm.includeAllColumns = true;
        vm.instructionMessage = "";
        vm.expandingTreeNode = null;
        vm.selectedSources = [];   // Dont remove - html page uses this
        
        vm.selectedTables = [];    // Dont remove - html page uses this
        
        vm.buildVdbs = [];
        vm.buildVdbIndex = 0;

        /*
         * page init here
         */
        $document.ready(function () {
            // Set the initial state
            initialize();
        });

        $scope.$on("wizard:stepChanged", function (e, parameters) {
            vm.currentWizardStep = parameters.step.stepId;
            updateInstructionMessage();
            updateNextEnablementAndText();
        });

        /*
         * Initialize the Dataservice Edit Wizard
         */
        function initialize() {
            vm.serviceName = EditWizardService.serviceName();
            vm.serviceDescription = EditWizardService.serviceDescription();

            // Determine editing or creating new.
            if(EditWizardService.serviceName().length>0) {
                EditWizardService.setEditing(true);
            } else {
                EditWizardService.setEditing(false);
            }
            vm.currentWizardStep = "wizard-select-tables";

            // Update instructions and next button enablement
            updateInstructionMessage();
            updateNextEnablementAndText();

            // Initialize the tree with available sources
            initSourceTableTree();
        }

        /*
         * Update the instruction message
         */
        function updateInstructionMessage() {
            var name = EditWizardService.serviceName();
            if( name === null || name.length === 0 ) {
                vm.instructionMessage = $translate.instant('dataserviceEditWizard.enterNameInstructionMsg');
            } else if ( vm.selectedTables.length === 0 ) {
                vm.instructionMessage = $translate.instant('dataserviceEditWizard.clickSourceTableInstructionMsg');
            } else if ( vm.selectedTables.length === 1 ) {
                if(vm.includeAllColumns) {
                    vm.instructionMessage = $translate.instant('dataserviceEditWizard.clickFinishInstructionMsg');
                } else {
                    vm.instructionMessage = $translate.instant('dataserviceEditWizard.clickNextSingleTableInstructionMsg');
                }
            } else if ( vm.selectedTables.length === 2 ) {
                vm.instructionMessage = $translate.instant('dataserviceEditWizard.clickNextTwoTablesInstructionMsg');
            }
        }

        /**
         * Determine if editing a service or creating a new service
         */
        vm.isEditing = function() {
            return EditWizardService.isEditing();	
        };

        /**
         * Called when the 'Include All Columns' checkbox state changes
         */
        vm.includeAllColumnsCheckboxChanged = function() {
            EditWizardService.setIncludeAllSource1Columns(this.includeAllColumns);
            updateInstructionMessage();
            updateNextEnablementAndText();
        };

        /**
         * Called when the tree node selection changes
         */
        vm.treeSelectionChanged = function(theNode, isSelected, parentNode) {
            vm.selectedTable = null;
            if(isSelected) {
                // Node is a table (no children)
                if(theNode.children.length===0) {
                    vm.selectedTable = theNode.name;
                    EditWizardService.addSourceTable(parentNode.name,theNode.name);
                    if(EditWizardService.sources()[0]===parentNode.name && EditWizardService.sourceTables()[0]===theNode.name) {
                        setSourceTableColumns(1, parentNode.name, theNode.sourceModel, theNode.name);
                    } else if(EditWizardService.sources()[1]===parentNode.name && EditWizardService.sourceTables()[1]===theNode.name) {
                        setSourceTableColumns(2, parentNode.name, theNode.sourceModel, theNode.name);
                    }
                }
            } else {
                updateInstructionMessage();
                updateNextEnablementAndText();
            }
        };

        /**
         * Determine if any tables are selected
         */
        vm.hasTableSelection = function() {
            return vm.selectedTables.length>0;	
        };

        /**
         * Called when the tree node expansion changes
         */
        vm.treeExpansionChanged = function(theNode, isExpanded) {
            if(isExpanded) {
                var nodesToExpand = [];
                nodesToExpand.push(theNode);
                expandSourceNodes(nodesToExpand);
            }
        };

        /**
         * Called when click to remove table 1
         */
        vm.removeTable1Selection = function() {
            EditWizardService.removeSourceTable1();
            vm.selectedSources = EditWizardService.sources();
            vm.selectedTables = EditWizardService.sourceTables();
            // No remaining tables - set include all columns
            if(vm.selectedTables.length===0) {
                EditWizardService.setIncludeAllSource1Columns(true);
                vm.includeAllColumns = EditWizardService.includeAllSource1Columns();
            }
            updateInstructionMessage();
            updateNextEnablementAndText();
        };

        /**
         * Called when click to remove table 2
         */
        vm.removeTable2Selection = function() {
            EditWizardService.removeSourceTable2();
            vm.selectedSources = EditWizardService.sources();
            vm.selectedTables = EditWizardService.sourceTables();
            // update checkbox based on the new source1
            vm.includeAllColumns = EditWizardService.includeAllSource1Columns();
            updateInstructionMessage();
            updateNextEnablementAndText();
        };

        /**
         * Back button callback
         */
        vm.backCallback = function (step) {
            return true;
        };

        /**
         * Next button callback
         */
        vm.nextCallback = function (step) {
            if(vm.nextButtonTitle === $translate.instant('shared.Finish')) {
                if(EditWizardService.isEditing()) {
                    updateDataserviceClicked();
                } else {
                    createDataserviceClicked();
                }
            }
        	return true;
        };

        /**
         * Cancel pressed
         */
        vm.cancelPressed = function () {
            // Change page to summary
            $rootScope.$broadcast("dataServicePageChanged", 'dataservice-summary');
        };

        /**
         * Finish pressed
         */
        vm.finishPressed = function () {
        };

        /**
         * Handler for changes to the dataservice name
         */
        vm.serviceNameChanged = function() {
            EditWizardService.setServiceName(vm.serviceName);
            updateInstructionMessage();
            updateNextEnablementAndText();
        };

        /**
         * Handler for changes to the dataservice description
         */
        vm.serviceDescriptionChanged = function() {
            EditWizardService.setServiceDescription(vm.serviceDescription);
            updateInstructionMessage();
            updateNextEnablementAndText();
        };

        /*
         * Updates the Next button enablement and text
         */
        function updateNextEnablementAndText() {
            vm.nextEnablement = false;
            if(vm.currentWizardStep === "wizard-select-tables") {
                if( EditWizardService.hasValidName() ) {
                    if( EditWizardService.sourceTables().length === 1 ) {
                        if(vm.includeAllColumns) {
                            vm.nextButtonTitle = $translate.instant('shared.Finish');
                        } else {
                            vm.nextButtonTitle = $translate.instant('shared.Next');
                        }
                        vm.nextEnablement = true;
                    } else {
                        vm.nextButtonTitle = $translate.instant('shared.Next');
                        if ( EditWizardService.sourceTables().length === 0 ) {
                            vm.nextEnablement = false;
                        } else {
                            vm.nextEnablement = true;
                        }
                    }
                } else {
                    vm.nextButtonTitle = $translate.instant('shared.Next');
                    vm.nextEnablement = false;
                }
            } else if(vm.currentWizardStep === "wizard-view-definition") {
                vm.nextButtonTitle = $translate.instant('shared.Finish');
            } else if(vm.currentWizardStep === "wizard-join-definition") {
                vm.nextButtonTitle = $translate.instant('shared.Next');
            } else if(vm.currentWizardStep === "wizard-join-criteria") {
                vm.nextButtonTitle = $translate.instant('shared.Finish');
            }
        }

        // Builds the tree control data.  The tree control is expecting data in this form
        //    	vm.treedata =
        //    	[
        //    	    { "name" : "Source1", "type" : "source", "children" : [
        //    	        { "name" : "Table1", "type" : "table", children" : [] },
        //    	        { "name" : "Table2", "type" : "table", "children" : [] }
        //    	    ]},
        //    	    { "name" : "Source2", "type" : "source", "children" : [
        //    	        { "name" : "Table1", "type" : "table", "children" : [] },
        //    	        { "name" : "Table2", "type" : "table", "children" : [] }
        //    	    ]},
        //    	    { "name" : "Source3", "type" : "source", "children" : [] }
        //    	];
        function initSourceTableTree( ) {
            // All Available sources
            var serviceSources = SvcSourceSelectionService.getServiceSources();
            var activeSources = getActiveSources(serviceSources);
            var hasActiveSources = activeSources.length>0;

            // Initial Source and Table selections
            vm.selectedSources = EditWizardService.sources();
            vm.selectedTables = EditWizardService.sourceTables();

            vm.intialTreeExpandedNodes = [];
            if(!hasActiveSources) {
                vm.treedata = [];
            } else {
                var treeInfo = [];
                for ( var i = 0; i < activeSources.length; ++i) {
                    var sourceNode = {
                        name : activeSources[i].keng__id,
                        children : [{name : "", type : "loading", children : []}]
                    };
                    treeInfo.push(sourceNode);
                }
                vm.treedata = treeInfo;
                
                if(vm.selectedSources.length>0) {
                    setInitialTreeSelections();
                }
            }
        }

        function getActiveSources(datasources) {
            var activeSources = [];
            for( var i = 0; i < datasources.length; ++i) {
                if(angular.isDefined(datasources[i].keng__properties)) {
                    for(var key in datasources[i].keng__properties) {
                        var propName = datasources[i].keng__properties[key].name;
                        var propValue = datasources[i].keng__properties[key].value;
                        if(propName==='dsbTeiidStatus' && propValue==='Active') {
                            activeSources.push(datasources[i]);
                        }
                    }
                }
            }
            return activeSources;
        }
        
        /**
         * Initialize the tree selections
         */
        function setInitialTreeSelections() {
            for( var iSrc = 0; iSrc < vm.selectedSources.length; ++iSrc ) {
                for( var i = 0; i < vm.treedata.length; ++i) {
                    if(vm.treedata[i].name === vm.selectedSources[iSrc]) {
                        //expandSourceNode(vm.treedata[i]);
                        vm.initialTreeExpandedNodes.push(vm.treedata[i]);
                    }
                }
            }

            // Expand the nodes which have not yet been expanded
            var nodesToExpand = [];
            for(var j=0; j<vm.initialTreeExpandedNodes.length; ++j) {
                if(!hasBeenExpanded(vm.initialTreeExpandedNodes[j])) {
                    nodesToExpand.push(vm.initialTreeExpandedNodes[j]);
                }
            }
            expandSourceNodes(nodesToExpand);
        }

        /*
         * Expand the specified source nodes
         */
        function expandSourceNodes(treeNodes) {
            vm.buildVdbs = treeNodes;
            vm.buildVdbIndex = 0;
            buildTempVdbsAndModels();
        }

        /*
         * Determine if source node has previously been expanded
         */
        function hasBeenExpanded(theNode) {
            if(theNode.children.length === 1 && theNode.children[0].type==="loading") {
                return false;
            }
            return true;
        }

        /**
         * Generates local temp copy of vdb/model 
         */
        function buildTempVdbsAndModels( ) {
            vm.expandingTreeNode = vm.buildVdbs[vm.buildVdbIndex];
            var vdbName = vm.buildVdbs[vm.buildVdbIndex].name;
            try {
                RepoRestService.getVdbModels(vdbName).then(
                    function (models) {
                        if (_.isEmpty(models) || models.length === 0) {
                            //onFailureCallback("Failed getting VDB Connection name.\nThe source model is not available");
                            return;
                        }
                        updateVdbModelFromDdl(vdbName, models[0].keng__id);
                    },
                    function (response) {
                        var getModelsFailedMsg = $translate.instant('dataserviceEditWizard.getVdbModelsFailedMsg');
                        throw RepoRestService.newRestException(getModelsFailedMsg + "\n" + RepoRestService.responseMessage(response));
                    });
            } catch (error) {
                var getModelsFailedMsg = $translate.instant('dataserviceEditWizard.getVdbModelsFailedMsg');
                throw RepoRestService.newRestException(getModelsFailedMsg + "\n" + error);
            }
        }

        /**
         * Creates a temp model in the workspace from teiid DDL.  Temp model is used to build the Views
         */
        function updateVdbModelFromDdl ( vdbName, modelName ) {
            // Updates the selected VdbModel using the specified teiid model schema.
            try {
                RepoRestService.updateVdbModelFromDdl( vdbName, modelName, vdbName, modelName ).then(
                        function ( result ) {
                            getTempVdbModels( vdbName );
                        },
                        function (response) {
                            var updateVdbFailedMsg = $translate.instant('dataserviceEditWizard.updateVdbFromDdlFailedMsg');
                            throw RepoRestService.newRestException(updateVdbFailedMsg + "\n" + RepoRestService.responseMessage(response));
                        });
            } catch (error) {
                var updateVdbFailedMsg = $translate.instant('dataserviceEditWizard.updateVdbFromDdlFailedMsg');
                throw RepoRestService.newRestException(updateVdbFailedMsg + "\n" + error);
            }
        }

        /**
         * Get the Vdb models
         */
        function getTempVdbModels(srcVdbName) {
            try {
                RepoRestService.getVdbModels(srcVdbName).then(
                    function (models) {
                        if (_.isEmpty(models) || models.length === 0) {
                            //onFailureCallback("Failed getting VDB Connection name.\nThe source model is not available");
                            return;
                        }
                        getVdbModelTables(srcVdbName, models[0].keng__id);
                    },
                    function (response) {
                        var getVdbModelsFailedMsg = $translate.instant('dataserviceEditWizard.getVdbModelsFailedMsg');
                        throw RepoRestService.newRestException(getVdbModelsFailedMsg + "\n" + RepoRestService.responseMessage(response));
                    });
            } catch (error) {
                var getVdbModelsFailedMsg = $translate.instant('dataserviceEditWizard.getVdbModelsFailedMsg');
                throw RepoRestService.newRestException(getVdbModelsFailedMsg + "\n" + error);
            }
        	
        }

        /**
         * Get the Vdb model tables
         */
        function getVdbModelTables(vdbName, modelName) {
            // Update the items using the Repo scratch object
            try {
                RepoRestService.getVdbModelTables( vdbName, modelName ).then(
                    function ( result ) {
                        var kids = [];
                        for (var i = 0; i < result.length; i++) {
                            kids.push({name : result[i].keng__id, type : "table", sourceModel : modelName, children : []});
                        }
                        vm.expandingTreeNode.children = kids;
                        
                        // If more than one node to expand, increment the index and expand the second
                        if(vm.buildVdbIndex === 0 && vm.buildVdbs.length>1) {
                            vm.buildVdbIndex++;
                            buildTempVdbsAndModels();
                        } else {
                            vm.selectedTable = EditWizardService.sourceTables()[0];
                            var selTables = EditWizardService.sourceTables();
                            var selSources = EditWizardService.sources();
                            selectTableNodes(selSources, selTables);
                        }
                   },
                    function (response) {
                       var getTablesFailedMsg = $translate.instant('dataserviceEditWizard.getVdbModelTablesFailedMsg');
                       throw RepoRestService.newRestException(getTablesFailedMsg + "\n" + RepoRestService.responseMessage(response));
                    });
            } catch (error) {
                var getTablesFailedMsg = $translate.instant('dataserviceEditWizard.getVdbModelTablesFailedMsg');
                throw RepoRestService.newRestException(getTablesFailedMsg + "\n" + error);
            }
        }

        /**
         * Select the source/table combinations
         */
        function selectTableNodes(sourceNames, tableNames) {
            for( var iTable = 0; iTable < tableNames.length; ++iTable) {
                for( var i = 0; i < vm.treedata.length; ++i) {
                    if(vm.treedata[i].name === sourceNames[iTable]) {
                        var sourceNode = vm.treedata[i];
                        for( var j = 0; j < sourceNode.children.length; ++j) {
                            if(sourceNode.children[j].name === tableNames[iTable]) {
                                vm.initialTreeNodeSelection = sourceNode.children[j];
                                setSourceTableColumns(iTable+1, 
                                                      sourceNode.name, 
                                                      vm.initialTreeNodeSelection.sourceModel, 
                                                      vm.initialTreeNodeSelection.name);
                            }
                        }
                    }
                }
            }
        }

        /**
         * Get the Vdb model table columns
         */
        function setSourceTableColumns(nSrc,vdbName,modelName,tableName) {
            // Update the items using the specified repo table
            try {
                RepoRestService.getVdbModelTableColumns( vdbName, modelName, tableName ).then(
                    function ( result ) {
                        if(nSrc===1) {
                            EditWizardService.setSource1AvailableColumns(result);
                            vm.includeAllColumns = EditWizardService.includeAllSource1Columns();
                        } else if(nSrc===2) {
                            EditWizardService.setSource2AvailableColumns(result);
                        }
                        vm.selectedSources = EditWizardService.sources();
                        vm.selectedTables = EditWizardService.sourceTables();
                        updateInstructionMessage();
                        updateNextEnablementAndText();
                   },
                    function (response) {
                        var errorMsg = $translate.instant('dataserviceEditWizard.getColumnsFailedMsg');
                        throw RepoRestService.newRestException(errorMsg + "\n" + RepoRestService.responseMessage(response));
                    });
            } catch (error) {
                var errorMsg = $translate.instant('dataserviceEditWizard.getColumnsFailedMsg');
                throw RepoRestService.newRestException(errorMsg + "\n" + error);
            }
        }

        /**
         * Handler to update the dataservice
         */
        function updateDataserviceClicked() {
            var svcName = EditWizardService.serviceName();
            var svcDescription = EditWizardService.serviceDescription();
            
            try {
                RepoRestService.updateDataService( svcName, svcDescription ).then(
                    function () {
                        setDataserviceServiceVdb(svcName);
                    },
                    function (response) {
                        var errorMsg = $translate.instant('dataserviceEditWizard.updateDataserviceFailedMsg');
                        throw RepoRestService.newRestException(errorMsg + "\n" + RepoRestService.responseMessage(response));
                    });
            } catch (error) {
                var errorMsg = $translate.instant('dataserviceEditWizard.updateDataserviceFailedMsg');
                throw RepoRestService.newRestException(errorMsg + "\n" + error);
            }
        }

        /**
         * Handler to create the dataservice.
         */
        function createDataserviceClicked() {
            var svcName = EditWizardService.serviceName();
            var svcDescription = EditWizardService.serviceDescription();
            
            try {
                RepoRestService.createDataService( svcName, svcDescription ).then(
                    function () {
                        setDataserviceServiceVdb(svcName);
                    },
                    function (response) {
                        var errorMsg = $translate.instant('dataserviceEditWizard.createDataserviceFailedMsg');
                        throw RepoRestService.newRestException(errorMsg + "\n" + RepoRestService.responseMessage(response));
                    });
            } catch (error) {
                var errorMsg = $translate.instant('dataserviceEditWizard.createDataserviceFailedMsg');
                throw RepoRestService.newRestException(errorMsg + "\n" + error);
            }
        }
        
        /**
         * Sets the dataservice VDB based on one or two tables selected.
         */
        function setDataserviceServiceVdb( dataserviceName ) {
            var sourceNames = EditWizardService.sources();
            var tableNames = EditWizardService.sourceTables();

            // -------------------------------------------------
            // One table selected
            // -------------------------------------------------
            if(tableNames.length==1) {
                var sourceName = sourceNames[0];
                var tableName = tableNames[0];

                // --------------------------------------------
                // Success callback returns the source 1 model
                // --------------------------------------------
                var singleSuccessCallback = function(model) {
                    var selSvcSourceModelName = model.keng__id;

                    // Path to modelSource and table for definition of the dataservice vdb
                    var relativeModelSourcePath = sourceName+"/"+selSvcSourceModelName+"/vdb:sources/"+selSvcSourceModelName;
                    var relativeTablePath = sourceName+"/"+selSvcSourceModelName+"/"+tableName;
                    
                    // Columns to include in the service
                    var columnNames = [];
                    // Get column subset if not including all columns.
                    if(!vm.includeAllColumns) {
                        columnNames = EditWizardService.source1SelectedColumns();
                    }
                    
                    try {
                        RepoRestService.setDataServiceVdbForSingleTable( dataserviceName, relativeModelSourcePath, null, relativeTablePath, columnNames ).then(
                            function () {
                                // Reinitialise the list of data services
                                DSSelectionService.refresh('dataservice-summary');
                            },
                            function (response) {
                                throw RepoRestService.newRestException($translate.instant('dsNewController.saveFailedMsg', 
                                                                                          {response: RepoRestService.responseMessage(response)}));
                            });
                    } catch (error) {
                    }
                };

                // Failure callback
                var singleFailureCallback = function(errorMsg) {
                    alert($translate.instant('shared.changedConnectionFailedMsg', {errorMsg: errorMsg}));
                };

                // get model for source 1
                getModelForSource(EditWizardService.sources()[0], singleSuccessCallback, singleFailureCallback);
            // -------------------------------------------------
            // Two tables selected
            // -------------------------------------------------
            } else if (tableNames.length==2) {
                var lhSourceName = sourceNames[0];
                var lhTableName = tableNames[0];
                var rhSourceName = sourceNames[1];
                var rhTableName = tableNames[1];

                // --------------------------------------------
                // Success callback returns the source models
                // --------------------------------------------
                var joinSuccessCallback = function(models) {
                    var lhSourceModelName = models[0].keng__id;
                    var rhSourceModelName = models[1].keng__id;

                    // Path for LH model source and table
                    var lhRelativeModelSourcePath = lhSourceName+"/"+lhSourceModelName+"/vdb:sources/"+lhSourceModelName;
                    var lhRelativeTablePath = lhSourceName+"/"+lhSourceModelName+"/"+lhTableName;
                    // Path for RH model source and temp table
                    var rhRelativeModelSourcePath = rhSourceName+"/"+rhSourceModelName+"/vdb:sources/"+rhSourceModelName;
                    var rhRelativeTablePath = rhSourceName+"/"+rhSourceModelName+"/"+rhTableName;
                    
                    // Columns to include in the service
                    var lhColumnNames = EditWizardService.source1SelectedColumns();
                    var rhColumnNames = EditWizardService.source2SelectedColumns();
                    
                    // Join criteria predicates
                    var criteriaPredicates = EditWizardService.criteriaPredicates();
                    
                    // Join type
                    var joinType = EditWizardService.joinType();
                    
                    try {
                        RepoRestService.setDataServiceVdbForJoinTables( dataserviceName, lhRelativeModelSourcePath, rhRelativeModelSourcePath, null,
                                                                                         lhRelativeTablePath, lhColumnNames,
                                                                                         rhRelativeTablePath, rhColumnNames, 
                                                                                         joinType, criteriaPredicates).then(
                            function () {
                                // Reinitialise the list of data services
                                DSSelectionService.refresh('dataservice-summary');
                            },
                            function (response) {
                                throw RepoRestService.newRestException($translate.instant('dsNewController.saveFailedMsg', 
                                                                                          {response: RepoRestService.responseMessage(response)}));
                            });
                    } catch (error) {
                    }
                };

                // Failure callback
                var joinFailureCallback = function(errorMsg) {
                    alert($translate.instant('shared.changedConnectionFailedMsg', {errorMsg: errorMsg}));
                };

                // get models for sources
                getModelsForSources(EditWizardService.sources(), joinSuccessCallback, joinFailureCallback);
            }
        }

        /*
         * success callback has the model for the requested source
         */
        function getModelForSource(sourceName, onSuccessCallback, onFailureCallback) {
            try {
                RepoRestService.getVdbModels(sourceName).then(
                    function (models) {
                        if (_.isEmpty(models) || models.length === 0) {
                            onFailureCallback("Failed getting VDB Models.\nThe source model is not available");
                            return;
                        }

                        onSuccessCallback(models[0]);
                    },
                    function (response) {
                        onFailureCallback("Failed getting VDB Models.\n" + RepoRestService.responseMessage(response));
                    });
            } catch (error) {
                onFailureCallback("An exception occurred:\n" + error.message);
            }
        }

        /*
         * success callback has the models for the requested sources
         */
        function getModelsForSources(sourceNames, onSuccessCallback, onFailureCallback) {
            var resultModels = [];

            // Success callback returns the source 1 model
            var successCallback = function(model) {
                resultModels.push(model);
                
                // Call again to get the second model
                var innerSuccessCallback = function(model) {
                    resultModels.push(model);
                    onSuccessCallback(resultModels);
                };
                var innerFailureCallback = function(errorMsg) {
                    onFailureCallback("An exception occurred: \n" + errorMsg.message);
                };
                
                getModelForSource(sourceNames[1], innerSuccessCallback, innerFailureCallback);
            };

            // Failure callback
            var failureCallback = function(errorMsg) {
                alert($translate.instant('shared.changedConnectionFailedMsg', {errorMsg: errorMsg}));
            };
            
            getModelForSource(sourceNames[0], successCallback, failureCallback);
        }

    }

})();
