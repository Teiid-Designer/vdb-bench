(function () {
    'use strict';

    var pluginName = 'vdb-bench.dataservice';
    var pluginDirName = 'vdb-bench-dataservice';

    angular
        .module(pluginName)
        .controller('DSNewController', DSNewController);

    DSNewController.$inject = ['$scope', '$translate', 'SYNTAX', 'RepoRestService', 
                               'EditWizardService', 'DSSelectionService', 'SvcSourceSelectionService'];

    function DSNewController($scope, $translate, SYNTAX, RepoRestService, EditWizardService, DSSelectionService, SvcSourceSelectionService) {
        var vm = this;
        
        vm.hasSources = SvcSourceSelectionService.getServiceSources().length>0;
        var DEFAULT_VIEW = "CREATE VIEW ServiceView ( ) AS SELECT * FROM aTable;";
        vm.viewDdl = "";
        vm.refreshViewDdl = false;
        vm.disableExpertTab = true;
        vm.sourceNames = [];
        vm.tableNames = [];
        vm.disableFinish = false;
        vm.showDdlError = false;
        vm.ddlErrorMsg = "";
        vm.treedata = [];
        vm.initialExpandedNodes = [];
        vm.readOnlyAccess = EditWizardService.isReadOnlyAccess();

        vm.editorLoaded = function(_editor) {
            if (! _editor)
                return;

            _editor.setSize(null, "30vh");

            // Change Event
            _editor.on("change", function(obj){ 
                ddlChanged(obj);
            });
        };

        /*
         * Handle change of EditWizardService tables
         */
        $scope.$on('editWizardTablesChanged', function (event) {
            vm.sourceNames = EditWizardService.sources();
            vm.tableNames = EditWizardService.sourceTables();
            setExpertTabEnablement();
        });

        $scope.$on('editWizardServiceNameChanged', function (event) {
            setExpertTabEnablement();
        });

        /**
         * Set Expert Tab enablement
         */
        function setExpertTabEnablement() {
            if(vm.tableNames.length === 0 || EditWizardService.serviceName().length === 0) {
                vm.disableExpertTab = true;
            } else {
                vm.disableExpertTab = false;
            }
        }

        /**
         * Expert tab selected.  Get selections from EditWizardService to populate text view.
         */
        vm.onExpertTabSelected = function() {
            setViewDdlFromEditor();
            loadTableColumnTree();
        };

        /**
         * Sets the View DDL based on the current editor selections
         */
        function setViewDdlFromEditor() {
            var dataserviceName = EditWizardService.serviceName();
            vm.sourceNames = EditWizardService.sources();
            vm.tableNames = EditWizardService.sourceTables();

            // -------------------------------------------------
            // One table selected
            // -------------------------------------------------
            if(vm.tableNames.length===0) {
                vm.viewDdl = DEFAULT_VIEW;
                vm.refreshViewDdl = !vm.refreshViewDdl;
            // -------------------------------------------------
            // One table selected
            // -------------------------------------------------
            } else if(vm.tableNames.length==1) {
                // --------------------------------------------
                // Success callback returns the source 1 model
                // --------------------------------------------
                var singleSuccessCallback = function(model) {
                    var selSvcSourceModelName = model.keng__id;

                    // Path to table for definition of the dataservice vdb
                    var relativeTablePath = vm.sourceNames[0]+"/"+selSvcSourceModelName+"/"+vm.tableNames[0];

                    // Columns to include in the service
                    var columnNames = [];
                    // Get column subset if not including all columns.
                    if(!vm.includeAllColumns) {
                        columnNames = EditWizardService.source1SelectedColumns();
                    }

                    try {
                        RepoRestService.getDataServiceViewDdlForSingleTable( dataserviceName, relativeTablePath, columnNames ).then(
                            function ( result ) {
                                // View info
                                vm.viewDdl = result.viewDdl;
                                vm.refreshViewDdl = !vm.refreshViewDdl;
                            },
                            function (response) {
                                vm.viewDdl = DEFAULT_VIEW;
                                vm.refreshViewDdl = !vm.refreshViewDdl;
                                 throw RepoRestService.newRestException($translate.instant('dsNewController.saveFailedMsg', 
                                                                                         {response: RepoRestService.responseMessage(response)}));
                            });
                    } catch (error) {
                        vm.viewDdl = DEFAULT_VIEW;
                        vm.refreshViewDdl = !vm.refreshViewDdl;
                    }
                };

                // Failure callback
                var singleFailureCallback = function(errorMsg) {
                    vm.viewDdl = DEFAULT_VIEW;
                    vm.refreshViewDdl = !vm.refreshViewDdl;
                    alert($translate.instant('shared.changedConnectionFailedMsg', {errorMsg: errorMsg}));
                };

                // get model for source 1
                EditWizardService.getModelForSourceVdb(EditWizardService.sources()[0], singleSuccessCallback, singleFailureCallback);
            // -------------------------------------------------
            // Two tables selected
            // -------------------------------------------------
            } else if (vm.tableNames.length==2) {
                // --------------------------------------------
                // Success callback returns the source models
                // --------------------------------------------
                var joinSuccessCallback = function(models) {
                    var lhSourceModelName = models[0].keng__id;
                    var rhSourceModelName = models[1].keng__id;

                    // Path for LH table
                    var lhRelativeTablePath = vm.sourceNames[0]+"/"+lhSourceModelName+"/"+vm.tableNames[0];
                    // Path for RH table
                    var rhRelativeTablePath = vm.sourceNames[1]+"/"+rhSourceModelName+"/"+vm.tableNames[1];
                    
                    // Columns to include in the service
                    var lhColumnNames = EditWizardService.source1SelectedColumns();
                    var rhColumnNames = EditWizardService.source2SelectedColumns();
                    
                    // Join criteria predicates
                    var criteriaPredicates = EditWizardService.criteriaPredicates();

                    
                    // Join type
                    var joinType = EditWizardService.joinType();
                    
                    try {
                        RepoRestService.getDataServiceViewDdlForJoinTables( dataserviceName, lhRelativeTablePath, lhColumnNames,
                                                                                             rhRelativeTablePath, rhColumnNames, 
                                                                                             joinType, criteriaPredicates).then(
                            function (result) {
                                // View info
                                vm.viewDdl = result.viewDdl;
                                vm.refreshViewDdl = !vm.refreshViewDdl;
                            },
                            function (response) {
                                vm.viewDdl = DEFAULT_VIEW;
                                vm.refreshViewDdl = !vm.refreshViewDdl;
                                throw RepoRestService.newRestException($translate.instant('dsNewController.saveFailedMsg', 
                                                                                          {response: RepoRestService.responseMessage(response)}));
                            });
                    } catch (error) {
                        vm.viewDdl = DEFAULT_VIEW;
                        vm.refreshViewDdl = !vm.refreshViewDdl;
                    }
                };

                // Failure callback
                var joinFailureCallback = function(errorMsg) {
                    vm.viewDdl = DEFAULT_VIEW;
                    vm.refreshViewDdl = !vm.refreshViewDdl;
                    alert($translate.instant('shared.changedConnectionFailedMsg', {errorMsg: errorMsg}));
                };

                // get models for sources
                EditWizardService.getModelsForSourceVdbs(EditWizardService.sources(), joinSuccessCallback, joinFailureCallback);
            }
        }

        // Builds the table-column tree data.  Tree contains source.table root nodes, with column children.
        // The tree control is expecting data in this form
        //    	vm.treedata =
        //    	[
        //    	    { "name" : "srcTable1", "type" : "table", "children" : [
        //    	        { "name" : "Col1", "type" : "column", "children" : [] },
        //    	        { "name" : "Col2", "type" : "column", "children" : [] }
        //    	    ]},
        //    	    { "name" : "srcTable2", "type" : "table", "children" : [
        //    	        { "name" : "Col1", "type" : "column", "children" : [] },
        //    	        { "name" : "Col2", "type" : "column", "children" : [] }
        //    	    ]},
        //    	    { "name" : "srcTable3", "type" : "table", "children" : [] }
        //    	];
        function loadTableColumnTree( ) {
            vm.initialExpandedNodes = [];

            // No tables
            if(vm.sourceNames.length === 0) {
                vm.treedata = [];
            // One or two tables
            } else {
                var treeInfo = [];
                for ( var i = 0; i < vm.sourceNames.length; ++i) {
                    var sourceTableName = vm.sourceNames[i] + "." + vm.tableNames[i];
                    // Children are the columns for the table
                    var kids = [];
                    var kidCols = [];
                    if(i === 0) {
                        kidCols = EditWizardService.source1AvailableColumns();
                    } else if(i === 1) {
                        kidCols = EditWizardService.source2AvailableColumns();
                    }
                    // Build the child column nodes
                    for(var j = 0; j < kidCols.length; ++j) {
                        var kid = {
                            name : kidCols[j].keng__id + "  [" + kidCols[j].Datatype.toLowerCase() + "]",
                            type : "column",
                            parent : sourceTableName,
                            children : []
                        };
                        kids.push(kid);
                    }
                    // Create the source-table node 
                    var sourceTableNode = {
                        name : sourceTableName,
                        type : "table",
                        children : kids
                    };
                    treeInfo.push(sourceTableNode);
                    vm.initialExpandedNodes.push(sourceTableNode);
                }
                vm.treedata = treeInfo;
            }
        }

        /**
         * Handler for finish create button
         */
        vm.finishClicked = function() {
            var svcName = EditWizardService.serviceName();
            var svcDescription = EditWizardService.serviceDescription();
            try {
                RepoRestService.createDataService( svcName, svcDescription ).then(
                    function () {
                        setDataserviceServiceVdb(svcName);
                    },
                    function (response) {
                        var errorMsg = $translate.instant('dsNewController.createDataserviceFailedMsg');
                        throw RepoRestService.newRestException(errorMsg + "\n" + RepoRestService.responseMessage(response));
                    });
            } catch (error) {
                var errorMsg = $translate.instant('dsNewController.createDataserviceFailedMsg');
                throw RepoRestService.newRestException(errorMsg + "\n" + error);
            }
        };

        /**
         * Sets the dataservice VDB based on one or two tables selected.
         */
        function setDataserviceServiceVdb( dataserviceName ) {
            // -------------------------------------------------
            // One table selected
            // -------------------------------------------------
            if(vm.tableNames.length==1) {
                var sourceName = vm.sourceNames[0];
                var tableName = vm.tableNames[0];

                // --------------------------------------------
                // Success callback returns the source 1 model
                // --------------------------------------------
                var singleSuccessCallback = function(model) {
                    var selSvcSourceModelName = model.keng__id;

                    // Path to modelSource and table for definition of the dataservice vdb
                    var relativeModelSourcePath = sourceName+"/"+selSvcSourceModelName+"/vdb:sources/"+selSvcSourceModelName;
                    var relativeTablePath = sourceName+"/"+selSvcSourceModelName+"/"+tableName;

                    setDataServiceVdbForSingleTable(dataserviceName, selSvcSourceModelName, relativeModelSourcePath, vm.viewDdl, relativeTablePath);
                };

                // Failure callback
                var singleFailureCallback = function(errorMsg) {
                    vm.viewDdl = DEFAULT_VIEW;
                    vm.refreshViewDdl = !vm.refreshViewDdl;
                    alert($translate.instant('shared.changedConnectionFailedMsg', {errorMsg: errorMsg}));
                };

                // get model for source 1
                EditWizardService.getModelForSourceVdb(EditWizardService.sources()[0], singleSuccessCallback, singleFailureCallback);
            // -------------------------------------------------
            // Two tables selected
            // -------------------------------------------------
            } else if (vm.tableNames.length==2) {
                // --------------------------------------------
                // Success callback returns the source models
                // --------------------------------------------
                var joinSuccessCallback = function(models) {
                    var lhSourceModelName = models[0].keng__id;
                    var rhSourceModelName = models[1].keng__id;

                    // Path for LH model source and table
                    var lhRelativeModelSourcePath = vm.sourceNames[0]+"/"+lhSourceModelName+"/vdb:sources/"+lhSourceModelName;
                    var lhRelativeTablePath = vm.sourceNames[0]+"/"+lhSourceModelName+"/"+vm.tableNames[0];
                    // Path for RH model source and table
                    var rhRelativeModelSourcePath = vm.sourceNames[1]+"/"+rhSourceModelName+"/vdb:sources/"+rhSourceModelName;
                    var rhRelativeTablePath = vm.sourceNames[1]+"/"+rhSourceModelName+"/"+vm.tableNames[1];

                    setDataServiceVdbForJoinTables(dataserviceName, lhSourceModelName, lhRelativeModelSourcePath, rhSourceModelName, rhRelativeModelSourcePath, vm.viewDdl,
                                                                    lhRelativeTablePath, rhRelativeTablePath);
                };

                // Failure callback
                var joinFailureCallback = function(errorMsg) {
                    alert($translate.instant('shared.changedConnectionFailedMsg', {errorMsg: errorMsg}));
                };

                // get models for sources
                EditWizardService.getModelsForSourceVdbs(EditWizardService.sources(), joinSuccessCallback, joinFailureCallback);
            }
        }

        function ddlChanged(obj) {
            // Get the new document text
            var lines = obj.doc.children[0].lines;
            var newText = "";
            for(var i=0; i<lines.length; i++) {
                newText = newText.concat(lines[i].text);
            }
            // No view definition entered
            if(newText.length===0) {
                vm.showDdlError = true;
                vm.ddlErrorMsg = $translate.instant('dsNewController.enterViewDefnMsg');
                vm.disableFinish = true;
            } else {
                vm.showDdlError = false;
                vm.ddlErrorMsg = "";
                vm.disableFinish = false;
            }
        }

        /**
         * Options for the codemirror editor used for editing ddl
         */
        vm.ddlEditorOptions = {
            lineWrapping: true,
            lineNumbers: true,
            mode: 'text/x-sql'
        };

        function setDefaultReadOnlyDataRole( dataServiceName, readOnly, model1Name, model2Name ) {
            try {
        		if ( readOnly ) {
                	// always delete since if readOnly it is not needed or if !readOnly the models may have changed
//            		RepoRestService.deleteDefaultReadOnlyDataRole( dataServiceName );

            		RepoRestService.createDefaultReadOnlyDataRole( dataServiceName, model1Name, model2Name ).then(
                        function () {
                            // Reinitialise the list of data services
                            DSSelectionService.refresh( 'dataservice-summary' );
                        },
                        function ( response ) {
                            vm.showDdlError = true;
                            vm.ddlErrorMsg = RepoRestService.responseMessage( response );
                            RepoRestService.deleteDataService( dataServiceName );
                        }
                    );
            	} else {
            		RepoRestService.deleteDefaultReadOnlyDataRole( dataServiceName ).then(
                        function () {
                            DSSelectionService.refresh( 'dataservice-summary' );
                        },
                        function ( response ) {
                            vm.showDdlError = true;
                            vm.ddlErrorMsg = RepoRestService.responseMessage( response );
                            RepoRestService.deleteDataService( dataServiceName );
                        }
                    );
            	}
            } catch ( error ) {
                vm.showDdlError = true;
                vm.ddlErrorMsg = RepoRestService.responseMessage(response);
                RepoRestService.deleteDataService( dataServiceName );
            }
        }

        /**
         * Set the dataservice VDB.  If fails, delete the dataservice
         */
        function setDataServiceVdbForSingleTable( dataserviceName, modelName, relativeModelSourcePath, ddl, relativeTablePath ) {
            try {
                RepoRestService.setDataServiceVdbForSingleTable( dataserviceName, relativeModelSourcePath, ddl, relativeTablePath, null ).then(
                    function () {
                        setDefaultReadOnlyDataRole( dataserviceName, vm.readOnlyAccess, modelName, null );
                    },
                    function (response) {
                        vm.showDdlError = true;
                        vm.ddlErrorMsg = RepoRestService.responseMessage(response);
                        RepoRestService.deleteDataService( dataserviceName );
                    });
            } catch (error) {
                vm.showDdlError = true;
                vm.ddlErrorMsg = RepoRestService.responseMessage(response);
                RepoRestService.deleteDataService( dataserviceName );
            }
        }

        /**
         * Set the dataservice VDB.  If fails, delete the dataservice
         */
        function setDataServiceVdbForJoinTables(dataserviceName, lhModelName, lhRelativeModelSourcePath, rhModelName, rhRelativeModelSourcePath, ddl,
                lhRelativeTablePath, rhRelativeTablePath) {
            try {
                RepoRestService.setDataServiceVdbForJoinTables( dataserviceName, lhRelativeModelSourcePath, rhRelativeModelSourcePath, ddl,
                                                                lhRelativeTablePath, null, rhRelativeTablePath, null, null, null, null).then(
                    function () {
                        setDefaultReadOnlyDataRole( dataserviceName, vm.readOnlyAccess, lhModelName, rhModelName );
                    },
                    function (response) {
                        vm.showDdlError = true;
                        vm.ddlErrorMsg = RepoRestService.responseMessage(response);
                        RepoRestService.deleteDataService( dataserviceName );
                    });
            } catch (error) {
                vm.showDdlError = true;
                vm.ddlErrorMsg = RepoRestService.responseMessage(response);
                RepoRestService.deleteDataService( dataserviceName );
            }
        }

        $scope.$watch( 'vm.readOnlyAccess', function( newValue, oldValue ) {
            EditWizardService.setReadOnlyAccess( newValue );
        });

    }

})();
