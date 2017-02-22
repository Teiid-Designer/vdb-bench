(function () {
    'use strict';

    var pluginName = 'vdb-bench.dataservice';
    var pluginDirName = 'vdb-bench-dataservice';

    angular
        .module(pluginName)
        .controller('DSEditController', DSEditController);

    DSEditController.$inject = ['$scope', '$document', '$translate', '$timeout', 'SYNTAX', 'RepoRestService', 
                                'EditWizardService', 'SvcSourceSelectionService', 'DSSelectionService', 'DSPageService'];

    function DSEditController($scope, $document, $translate, $timeout, SYNTAX, 
                              RepoRestService, EditWizardService, SvcSourceSelectionService, DSSelectionService, DSPageService) {
        var vm = this;
        var DEFAULT_VIEW = "CREATE VIEW ServiceView ( ) AS SELECT * FROM aTable;";
        vm.viewDdl = "";
        vm.refreshViewDdl = false;
        vm.wizardTabActive = true;
        vm.expertTabActive = false;
        vm.disableExpertTab = EditWizardService.sourceTables().length === 0;
        vm.sourceNames = [];
        vm.tableNames = [];
        vm.disableFinish = false;
        vm.showDdlError = false;
        vm.ddlErrorMsg = "";

        /*
         * Set a custom title to the page including the data service's id
         */
        var page = DSPageService.page(DSPageService.EDIT_DATASERVICE_PAGE);
        DSPageService.setCustomTitle(page.id, page.title + " '" + DSSelectionService.selectedDataService().keng__id + "'");

        vm.svcSourcesLoading = SvcSourceSelectionService.isLoading();

        vm.editorLoaded = function(_editor) {
            if (! _editor)
                return;

            //
            // Due to the nested nature of the codemirror
            // instance in the tabs, it doesnt refresh unless
            // a key is pressed. This forces a refresh after
            // a half second.
            //
            $timeout(function () {
                _editor.refresh();
            }, 500);

            // Change Event
            _editor.on("change", function(obj){ 
                ddlChanged(obj);
            });
        };

        /*
         * Determine initial tab displayed
         */
        $document.ready(function () {
            setActiveTab();
            setViewDdlFromEditor(true);
        });

        function setActiveTab() {
            if(EditWizardService.viewEditable()) {
                vm.wizardTabActive = true;
                vm.expertTabActive = false;
            } else {
                vm.wizardTabActive = false;
                vm.expertTabActive = true;
            }
        }

        /**
         * Expert tab selected.  Get selections from EditWizardService to populate text view.
         */
        vm.onExpertTabSelected = function() {
            setViewDdlFromEditor(false);
        };

        /**
         * Sets the View DDL based on the current editor selections
         * pageInit 'true' if page first initialization (use EditWizardService viewDdl)
         * pageInit 'false' if user manually selects expert tab (uses EditWizardService params to generate new DDL)
         */
        function setViewDdlFromEditor(pageInit) {
            var dataserviceName = EditWizardService.serviceName();
            vm.sourceNames = EditWizardService.sources();
            vm.tableNames = EditWizardService.sourceTables();

            // -------------------------------------------------
            // One table selected
            // -------------------------------------------------
            if(vm.tableNames.length===0) {
                vm.viewDdl = EditWizardService.viewDdl();
                vm.refreshViewDdl = !vm.refreshViewDdl;
            // -------------------------------------------------
            // One table selected
            // -------------------------------------------------
            } else if(vm.tableNames.length==1) {
                // --------------------------------------------
                // Success callback returns the source 1 model
                // --------------------------------------------
                var singleSuccessCallback = function(model) {
                    // Page init - use EditWizardService DDL
                    if(pageInit) {
                        vm.viewDdl = EditWizardService.viewDdl();
                        vm.refreshViewDdl = !vm.refreshViewDdl;
                    // User tab change - regenerate DDL from wizard selections
                    } else {
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
            } else if (vm.tableNames.length==2) {
                // --------------------------------------------
                // Success callback returns the source models
                // --------------------------------------------
                var joinSuccessCallback = function(models) {
                    // Page init - use EditWizardService DDL
                    if(pageInit) {
                        vm.viewDdl = EditWizardService.viewDdl();
                        vm.refreshViewDdl = !vm.refreshViewDdl;
                    // User tab change - regenerate DDL from wizard selections
                    } else {
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
                    }
                };

                // Failure callback
                var joinFailureCallback = function(errorMsg) {
                    vm.viewDdl = DEFAULT_VIEW;
                    vm.refreshViewDdl = !vm.refreshViewDdl;
                    alert($translate.instant('shared.changedConnectionFailedMsg', {errorMsg: errorMsg}));
                };

                // get models for sources
                getModelsForSources(EditWizardService.sources(), joinSuccessCallback, joinFailureCallback);
            }
        }

        /**
         * Handler for finish update button
         */
        vm.finishClicked = function() {
            var svcName = EditWizardService.serviceName();
            var svcDescription = EditWizardService.serviceDescription();
            
            try {
                RepoRestService.updateDataService( svcName, svcDescription ).then(
                    function () {
                        setDataserviceServiceVdb(svcName);
                    },
                    function (response) {
                        var errorMsg = $translate.instant('dsEditController.updateDataserviceFailedMsg');
                        throw RepoRestService.newRestException(errorMsg + "\n" + RepoRestService.responseMessage(response));
                    });
            } catch (error) {
                var errorMsg = $translate.instant('dsEditController.updateDataserviceFailedMsg');
                throw RepoRestService.newRestException(errorMsg + "\n" + error);
            }
        };

        /**
         * Sets the dataservice VDB based on one or two tables selected.
         */
        function setDataserviceServiceVdb( dataserviceName ) {
            vm.sourceNames = EditWizardService.sources();
            vm.tableNames = EditWizardService.sourceTables();

            // -------------------------------------------------
            // One table selected
            // -------------------------------------------------
            if(vm.tableNames.length==1) {
                // --------------------------------------------
                // Success callback returns the source 1 model
                // --------------------------------------------
                var singleSuccessCallback = function(model) {
                    var selSvcSourceModelName = model.keng__id;

                    // Path to modelSource and temp table for definition of the dataservice vdb
                    var relativeModelSourcePath = vm.sourceNames[0]+"/"+selSvcSourceModelName+"/vdb:sources/"+selSvcSourceModelName;
                    var relativeTablePath = vm.sourceNames[0]+"/"+selSvcSourceModelName+"/"+vm.tableNames[0];

                    setDataServiceVdbForSingleTable(dataserviceName, relativeModelSourcePath, vm.viewDdl, relativeTablePath);
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

                    // Join type
                    var joinType = EditWizardService.joinType();

                    setDataServiceVdbForJoinTables(dataserviceName, lhRelativeModelSourcePath, rhRelativeModelSourcePath, vm.viewDdl,
                            lhRelativeTablePath, rhRelativeTablePath);
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
                        vm.viewDdl = DEFAULT_VIEW;
                        vm.refreshViewDdl = !vm.refreshViewDdl;
                        onFailureCallback("Failed getting VDB Models.\n" + RepoRestService.responseMessage(response));
                    });
            } catch (error) {
                vm.viewDdl = DEFAULT_VIEW;
                vm.refreshViewDdl = !vm.refreshViewDdl;
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
                vm.ddlErrorMsg = $translate.instant('dsEditController.enterViewDefnMsg');
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

        /**
         * Set the dataservice VDB.  If fails, delete the dataservice
         */
        function setDataServiceVdbForSingleTable( dataserviceName, relativeModelSourcePath, ddl, relativeTablePath ) {
            try {
                RepoRestService.setDataServiceVdbForSingleTable( dataserviceName, relativeModelSourcePath, ddl, relativeTablePath, null ).then(
                    function () {
                        // Reinitialise the list of data services
                        DSSelectionService.refresh('dataservice-summary');
                    },
                    function (response) {
                        vm.showDdlError = true;
                        vm.ddlErrorMsg = RepoRestService.responseMessage(response);
                    });
            } catch (error) {
                vm.showDdlError = true;
                vm.ddlErrorMsg = RepoRestService.responseMessage(response);
            }
        }

        /**
         * Set the dataservice VDB.  If fails, delete the dataservice
         */
        function setDataServiceVdbForJoinTables(dataserviceName, lhRelativeModelSourcePath, rhRelativeModelSourcePath, ddl,
                lhRelativeTablePath, rhRelativeTablePath) {
            try {
                RepoRestService.setDataServiceVdbForJoinTables( dataserviceName, lhRelativeModelSourcePath, rhRelativeModelSourcePath, ddl,
                                                                lhRelativeTablePath, null, rhRelativeTablePath, null, null, null, null).then(
                    function () {
                        // Reinitialise the list of data services
                        DSSelectionService.refresh('dataservice-summary');
                    },
                    function (response) {
                        vm.showDdlError = true;
                        vm.ddlErrorMsg = RepoRestService.responseMessage(response);
                    });
            } catch (error) {
                vm.showDdlError = true;
                vm.ddlErrorMsg = RepoRestService.responseMessage(response);
            }
        }

    }
    
})();
