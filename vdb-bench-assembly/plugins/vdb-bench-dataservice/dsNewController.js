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
                getModelsForSources(EditWizardService.sources(), joinSuccessCallback, joinFailureCallback);
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
                        var errorMsg = $translate.instant('dataserviceEditWizard.createDataserviceFailedMsg');
                        throw RepoRestService.newRestException(errorMsg + "\n" + RepoRestService.responseMessage(response));
                    });
            } catch (error) {
                var errorMsg = $translate.instant('dataserviceEditWizard.createDataserviceFailedMsg');
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

                    try {
                        RepoRestService.setDataServiceVdbForSingleTable( dataserviceName, relativeModelSourcePath, vm.viewDdl, relativeTablePath, null ).then(
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

                    try {
                        RepoRestService.setDataServiceVdbForJoinTables( dataserviceName, lhRelativeModelSourcePath, rhRelativeModelSourcePath, vm.viewDdl,
                                                                        lhRelativeTablePath, null, rhRelativeTablePath, null, null, null, null).then(
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

        /**
         * Options for the codemirror editor used for editing ddl
         */
        vm.ddlEditorOptions = {
            lineWrapping: true,
            lineNumbers: true,
            mode: 'text/x-sql'
        };

        vm.ddlEditorLoaded = function(_editor) {
            // Nothing to do at the moment
        };

    }

})();
