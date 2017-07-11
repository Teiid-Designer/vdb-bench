(function () {
    'use strict';

    var pluginName = 'vdb-bench.dataservice';
    var pluginDirName = 'vdb-bench-dataservice/widgets/datasource-wizard';

    angular
        .module(pluginName)
        .directive('datasourceEditWizard', DatasourceEditWizard);

    DatasourceEditWizard.$inject = ['CONFIG', 'SYNTAX'];
    DatasourceEditWizardController.$inject = ['$scope', '$rootScope', '$translate', 'RepoRestService', 'DatasourceWizardService', 
                                              'ConnectionSelectionService', 'SvcSourceSelectionService'];

    function DatasourceEditWizard(config, syntax) {
        var directive = {
            restrict: 'E',
            scope: {},
            controller: DatasourceEditWizardController,
            controllerAs: 'vm',
            templateUrl: config.pluginDir + syntax.FORWARD_SLASH +
                         pluginDirName + syntax.FORWARD_SLASH +
                         'datasourceEditWizard.html'
        };

        return directive;
    }

    function DatasourceEditWizardController($scope, $rootScope, $translate, RepoRestService, DatasourceWizardService, 
                                            ConnectionSelectionService, SvcSourceSelectionService) {
        var vm = this;
        vm.stepTitle = $translate.instant('datasourceEditWizard.stepTitle');
        vm.nextButtonTitle = $translate.instant('shared.Next');
        vm.nextEnablement = false;
        vm.currentWizardStep = "";
        vm.instructionMessage = "";
        vm.showJdbcFilterOptions = false;
        vm.allTranslators = DatasourceWizardService.allTranslators();
        vm.selectedTranslator = DatasourceWizardService.selectedTranslator();
        vm.selectedTranslatorName = "";
        vm.jdbcConnectionSelected = false;
        vm.deployInProgress = false;
        vm.wizardServiceReady = false;

        $scope.$on("wizard:stepChanged", function (e, parameters) {
            vm.currentWizardStep = parameters.step.stepId;
            updateNextEnablementAndText();
        });

        /**
         * Gets event when the DatasourceWizardService initialization has finished
         */
        $scope.$on("DatasourceWizardServiceReady", function (event) {
            initialize();
            vm.wizardServiceReady = true;
        });

        /**
         * Initialize
         */
        function initialize() {
            vm.currentWizardStep = "wizard-select-connection";
            vm.sourceName = DatasourceWizardService.sourceName();
            vm.sourceDescription = DatasourceWizardService.sourceDescription();
            vm.jdbcConnectionSelected = DatasourceWizardService.hasSelectedJdbcConnection();
            vm.selectedTranslator = DatasourceWizardService.selectedTranslator();
            vm.selectedTranslatorName = (vm.selectedTranslator === null) ? "-- Select Translator --" : vm.selectedTranslator.keng__id;
            vm.selectedTranslatorImage = DatasourceWizardService.selectedTranslatorImage();
            vm.showJdbcFilterOptions = DatasourceWizardService.showJdbcFilterOptions();
            
            updateTranslatorVisibility();
            updateFirstPageEnablementAndMessage();
        }

        /**
         * Handle Change in selected connection
         */
        $scope.$on('selectedConnectionChanged', function (event) {
            // Deselect filter checkbox
            vm.showJdbcFilterOptions = false;

            var selectedConnection = ConnectionSelectionService.selectedConnection();
            DatasourceWizardService.setSelectedConnection(selectedConnection);
            // Update whether connection type is jdbc
            vm.jdbcConnectionSelected = DatasourceWizardService.hasSelectedJdbcConnection();
            DatasourceWizardService.setShowJdbcFilterOptions(false);

            var resetTranslatorCallback = function(message) {
                vm.selectedTranslator = DatasourceWizardService.selectedTranslator();
                vm.selectedTranslatorName = (vm.selectedTranslator === null) ? $translate.instant('datasourceEditWizard.chooseTranslator') : vm.selectedTranslator.keng__id;
                vm.selectedTranslatorImage = DatasourceWizardService.selectedTranslatorImage();
                
                updateTranslatorVisibility();
                updateFirstPageEnablementAndMessage();
            };
            
            // Reset default translator requires a server call.  wait for return callback
            DatasourceWizardService.selectTranslatorDefaultForCurrentConnection(resetTranslatorCallback, resetTranslatorCallback);
        });

        /**
         * Select translator
         */
        vm.selectTranslator = function(trans) {
            DatasourceWizardService.setSelectedTranslator(trans);
            vm.selectedTranslator = DatasourceWizardService.selectedTranslator();
            vm.selectedTranslatorName = (vm.selectedTranslator === null) ? $translate.instant('datasourceEditWizard.chooseTranslator') : vm.selectedTranslator.keng__id;
            vm.selectedTranslatorImage = DatasourceWizardService.selectedTranslatorImage();
            updateFirstPageEnablementAndMessage();
        };

        /**
         * Update whether the Translator dropdown should be shown
         */
        function updateTranslatorVisibility() {
            if(DatasourceWizardService.selectedConnection() === null) {
                vm.showTranslator = false;
            } else {
                vm.showTranslator = true;
            }
        }

        /**
         * Update the instruction message
         */
        function updateInstructionMessage() {
            vm.instructionMessage = "";

            // only validate name if creating a new data source
            if ( !DatasourceWizardService.isEditing() ) {
                var name = DatasourceWizardService.sourceName();

                if( name === null || name.length === 0 ) {
                    vm.instructionMessage = $translate.instant('datasourceEditWizard.enterNameInstructionMsg');
                } else if ( !DatasourceWizardService.hasValidName() ) {
                    vm.instructionMessage = $translate.instant('datasourceEditWizard.invalidNameInstructionMsg');
                }
            }

            if ( DatasourceWizardService.hasValidName() && _.isEmpty( vm.instructionMessage ) ) {
                if (DatasourceWizardService.selectedConnection() === null) {
                    vm.instructionMessage = $translate.instant('datasourceEditWizard.selectConnectionInstructionMsg');
                } else if ( vm.selectedTranslator === null ) {
                    vm.instructionMessage = $translate.instant('datasourceEditWizard.selectTranslatorInstructionMsg');
                } else if ( vm.showJdbcFilterOptions === false ) {
                    if(DatasourceWizardService.isEditing()) {
                        vm.instructionMessage = $translate.instant('datasourceEditWizard.selectFilterOptionsOrFinishEditInstructionMsg');
                    } else {
                        vm.instructionMessage = $translate.instant('datasourceEditWizard.selectFilterOptionsOrFinishCreateInstructionMsg');
                    }
                } else if ( vm.showJdbcFilterOptions === true ) {
                    if(DatasourceWizardService.isEditing()) {
                        vm.instructionMessage = $translate.instant('datasourceEditWizard.clickNextEditInstructionMsg');
                    } else {
                        vm.instructionMessage = $translate.instant('datasourceEditWizard.clickNextCreateInstructionMsg');
                    }
                }
            }
        }

        /**
         * Determine if editing a service or creating a new service
         */
        vm.isEditing = function() {
            return DatasourceWizardService.isEditing();	
        };

        /**
         * Handle 'Show Filter Options' checkbox state changes
         */
        vm.showJdbcFilterOptionsCheckboxChanged = function() {
            DatasourceWizardService.setShowJdbcFilterOptions(this.showJdbcFilterOptions);
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
                if(DatasourceWizardService.isEditing()) {
                    updateDatasourceClicked();
                } else {
                    createDatasourceClicked();
                }
            }
        	return true;
        };

        /**
         * Cancel pressed
         */
        vm.cancelPressed = function () {
            // Change page to summary
            $rootScope.$broadcast("dataServicePageChanged", 'datasource-summary');
        };

        /**
         * Finish pressed
         */
        vm.finishPressed = function () {
        };

        /**
         * Handle sourceName changes
         */
        vm.sourceNameChanged = function() {
            DatasourceWizardService.setSourceName(vm.sourceName);	
        };

        /**
         * Handle description changes
         */
        vm.sourceDescriptionChanged = function() {
            DatasourceWizardService.setSourceDescription(vm.sourceDescription);
            updateNextEnablementAndText();
        };

        /**
         * Updates the Next button enablement and text
         * - first page changes the message, and next button enablement and text
         * - if second page, just change the button text.
         */
        function updateNextEnablementAndText() {
            if(vm.currentWizardStep === "wizard-select-connection") {
                updateFirstPageEnablementAndMessage();
            } else if(vm.currentWizardStep === "wizard-jdbc-filter-options") {
                vm.nextButtonTitle = $translate.instant('shared.Finish');
            }
        }

        /**
         * Updates the message, button enablement and button text for this page
         */
        function updateFirstPageEnablementAndMessage() {
            if ( DatasourceWizardService.hasValidName() ) {
                if( DatasourceWizardService.selectedConnection() !== null && DatasourceWizardService.selectedTranslator() !== null ) {
                    if(vm.showJdbcFilterOptions) {
                        vm.nextButtonTitle = $translate.instant('shared.Next');
                    } else {
                        vm.nextButtonTitle = $translate.instant('shared.Finish');
                    }
                    vm.nextEnablement = true;
                } else {
                    vm.nextButtonTitle = $translate.instant('shared.Next');
                    vm.nextEnablement = false;
                }
            } else {
                vm.nextButtonTitle = $translate.instant('shared.Next');
                vm.nextEnablement = false;
            }

            updateInstructionMessage();
        }

        vm.getNameErrorMessage = function() {
            return DatasourceWizardService.getNameErrorMessage();
        };

        vm.hasNameErrorMessage = function() {
            return !DatasourceWizardService.hasValidName();
        };

        /**
         * Handles next button enablement and text whenever the source name changes.
         */
        $rootScope.$on('datasourceWizardSourceNameChanged', function( value ) {
            updateFirstPageEnablementAndMessage();
        } );

        /**
         * Handles creation of the new datasource
         */
        function createDatasourceClicked() {
            var svcSourceName = DatasourceWizardService.sourceName();
            var svcSourceDescription = DatasourceWizardService.sourceDescription();
            var connectionName = DatasourceWizardService.selectedConnection().keng__id;
            var jndiName = DatasourceWizardService.selectedConnection().dv__jndiName;
            var translatorName = DatasourceWizardService.selectedTranslator().keng__id;
            var importerProperties = ConnectionSelectionService.selectedConnectionFilterProperties();

            createAndDeploySvcSourceVdb( svcSourceName, 
                                         svcSourceDescription, 
                                         connectionName, 
                                         jndiName, 
                                         translatorName, 
                                         importerProperties );
        }

        /**
         * Creates and Deploys the Service Source VDB
         */
        function createAndDeploySvcSourceVdb ( svcSourceName, svcSourceDescription, connectionName, jndiName, translatorName, importerProperties ) {
            // Set in progress status
            vm.deployInProgress = true;
            SvcSourceSelectionService.setLoading(true);
            
            // Creates the VDB.  On success, the VDB Model is added to the VDB
            try {
                RepoRestService.createVdb( svcSourceName, svcSourceDescription, true ).then(
                    function (theVdb) {
                        if(theVdb.keng__id === svcSourceName) {
                            createVdbModel( svcSourceName, connectionName, translatorName, jndiName, importerProperties );
                        }
                    },
                    function (resp) {
                        SvcSourceSelectionService.setLoading(false);
                        var sourceCreateFailedMsg = $translate.instant('datasourceEditWizard.sourceCreateFailedMsg');
                        alert(sourceCreateFailedMsg + "\n" + RepoRestService.responseMessage(resp));
                        SvcSourceSelectionService.refresh('datasource-summary');
                    });
            } catch (error) {
                SvcSourceSelectionService.setLoading(false);
                var sourceCreateFailedMsg = $translate.instant('datasourceEditWizard.sourceCreateFailedMsg');
                alert(sourceCreateFailedMsg + "\n" + error);
                SvcSourceSelectionService.refresh('datasource-summary');
            }
        }

        /**
         * Handles update of the datasource being edited
         */
        function updateDatasourceClicked() {
            var connectionName = DatasourceWizardService.selectedConnection().keng__id;
            var jndiName = DatasourceWizardService.selectedConnection().dv__jndiName;
            var translatorName = DatasourceWizardService.selectedTranslator().keng__id;
            
            var filterProperties = ConnectionSelectionService.selectedConnectionFilterProperties();

            // Set in progress status
            vm.deployInProgress = true;

            // Determine items changed
            var connectionChanged = DatasourceWizardService.connectionChanged();
            var translatorChanged = DatasourceWizardService.translatorChanged();
            var filterPropsChanged = DatasourceWizardService.filterPropsChanged();
            var descriptionChanged = DatasourceWizardService.descriptionChanged();

            try {
                
                // If a different connection was chosen, the original VdbModel must be deleted
                if(connectionChanged) {
                    RepoRestService.deleteVdbModel( vm.sourceName, DatasourceWizardService.originalConnectionName()).then(
                            function (resp) {
                                createVdbModel( vm.sourceName, connectionName, translatorName, jndiName, filterProperties );
                            },
                            function (response) {
                                var sourceUpdateFailedMsg = $translate.instant('datasourceEditWizard.sourceUpdateFailedMsg');
                                alert(sourceUpdateFailedMsg + "\n" + RepoRestService.responseMessage(response));
                                SvcSourceSelectionService.refresh('datasource-summary');
                            });
                // Connection was not changed, we can update the existing VdbModel and VdbModelSource
                } else {
                    // Filter properties changed, update the model
                    if(filterPropsChanged) {
                        RepoRestService.updateVdbModel( vm.sourceName, connectionName, true, filterProperties, "").then(
                                function (theModel) {
                                    if(vm.translatorChanged) {
                                        updateVdbModelSource( vm.sourceName, connectionName, connectionName, translatorName, jndiName );
                                    } else {
                                        updateVdbDescription( vm.sourceName, vm.sourceDescription);
                                    }
                                },
                                function (response) {
                                    var sourceUpdateFailedMsg = $translate.instant('datasourceEditWizard.sourceUpdateFailedMsg');
                                    alert(sourceUpdateFailedMsg + "\n" + RepoRestService.responseMessage(response));
                                    SvcSourceSelectionService.refresh('datasource-summary');
                                });
                    // Filter properties not changed
                    } else {
                        // Translator changed, update model source
                        if(translatorChanged) {
                            updateVdbModelSource( vm.sourceName, connectionName, connectionName, translatorName, jndiName );
                        // Translator not changed
                        } else {
                            updateVdbDescription( vm.sourceName, vm.sourceDescription);
                        }
                    }
                }
            } catch (error) {
            } finally {
            }
        }

        /**
         * Update the VDB description
         */
        function updateVdbDescription( svcSourceName, svcSourceDescription ) {
            if(DatasourceWizardService.descriptionChanged()) {
                // Creates the Model within the VDB, then add the ModelSource to the Model
                try {
                    RepoRestService.updateVdb( svcSourceName, svcSourceDescription, true ).then(
                        function (theModel) {
                            deployVdb(svcSourceName);
                        },
                        function (resp) {
                            SvcSourceSelectionService.setLoading(false);
                            var sourceUpdateFailedMsg = $translate.instant('datasourceEditWizard.sourceUpdateFailedMsg');
                            alert(sourceUpdateFailedMsg + "\n" + RepoRestService.responseMessage(resp));
                            SvcSourceSelectionService.refresh('datasource-summary');
                        });
                } catch (error) {
                    SvcSourceSelectionService.setLoading(false);
                    var sourceUpdateFailedMsg = $translate.instant('datasourceEditWizard.sourceUpdateFailedMsg');
                    alert(sourceUpdateFailedMsg + "\n" + error);
                    SvcSourceSelectionService.refresh('datasource-summary');
                }
            } else {
                deployVdb(svcSourceName);
            }
        }

        /**
         * Deploys the specified VDB to the server
         */
        function deployVdb(vdbName) {
            var connectionChanged = DatasourceWizardService.connectionChanged();
            var translatorChanged = DatasourceWizardService.translatorChanged();
            var filterPropsChanged = DatasourceWizardService.filterPropsChanged();
            var descriptionChanged = DatasourceWizardService.descriptionChanged();
            // If nothing changed, no need to redeploy the source vdb.
            if(!connectionChanged && !translatorChanged && !filterPropsChanged && !descriptionChanged) {
                SvcSourceSelectionService.refresh('datasource-summary');
                return;
            }
            // Deploy the VDB to the server.  At the end, fire notification to go to summary page
            try {
                SvcSourceSelectionService.setDeploying(true, vdbName, false, null);
                RepoRestService.deployVdb( vdbName ).then(
                    function ( result ) {
                        vm.deploymentSuccess = (result.Information.deploymentSuccess === "true");
                        if(vm.deploymentSuccess === true) {
                            var successCallback = function() {
                                SvcSourceSelectionService.setDeploying(false, vdbName, true, null);
                                // Refresh and direct to summary page
                                SvcSourceSelectionService.refresh('datasource-summary');
                            };
                            var failCallback = function(failMessage) {
                                SvcSourceSelectionService.setDeploying(false, vdbName, false, failMessage);
                                // Refresh and direct to summary page
                                SvcSourceSelectionService.refresh('datasource-summary');
                            };
                            //
                            // Monitor the source every second for 5 seconds, checking for active state
                            //
                            var pollingDurationSec = 5;
                            var pollingIntervalSec = 1;
                            RepoRestService.pollForActiveVdb(vdbName, pollingDurationSec, pollingIntervalSec, successCallback, failCallback);
                        } else {
                            SvcSourceSelectionService.setDeploying(false, vdbName, false, result.Information.ErrorMessage1);
                        }
                    },
                    function (response) {
                        SvcSourceSelectionService.setDeploying(false, vdbName, false, RepoRestService.responseMessage(response));
                        SvcSourceSelectionService.setLoading(false);
                        var sourceDeployFailedMsg = $translate.instant('datasourceEditWizard.sourceDeployFailedMsg');
                        alert(sourceDeployFailedMsg + "\n" + RepoRestService.responseMessage(response));
                        SvcSourceSelectionService.refresh('datasource-summary');
                    });
            } catch (error) {
                SvcSourceSelectionService.setLoading(false);
                var sourceDeployFailedMsg = $translate.instant('datasourceEditWizard.sourceDeployFailedMsg');
                alert(sourceDeployFailedMsg + "\n" + error);
                SvcSourceSelectionService.refresh('datasource-summary');
            }
        }
        
        /**
         * Create a Model and ModelSource within the VDB, then deploy it
         */
        function createVdbModel( svcSourceName, connectionName, translatorName, jndiName, filterProperties ) {
            // Creates the Model within the VDB, then add the ModelSource to the Model
            try {
                RepoRestService.createVdbModel( svcSourceName, connectionName, true, filterProperties).then(
                    function (theModel) {
                        if(theModel.keng__id === connectionName) {
                            createVdbModelSource( svcSourceName, connectionName, connectionName, translatorName, jndiName );
                        }
                    },
                    function (resp) {
                        SvcSourceSelectionService.setLoading(false);
                        var sourceModelCreateFailedMsg = $translate.instant('datasourceEditWizard.sourceModelCreateFailedMsg');
                        alert(sourceModelCreateFailedMsg + "\n" + RepoRestService.responseMessage(resp));
                        SvcSourceSelectionService.refresh('datasource-summary');
                    });
            } catch (error) {
                SvcSourceSelectionService.setLoading(false);
                var sourceModelCreateFailedMsg = $translate.instant('datasourceEditWizard.sourceModelCreateFailedMsg');
                alert(sourceModelCreateFailedMsg + "\n" + error);
                SvcSourceSelectionService.refresh('datasource-summary');
            }
        }

        /**
         * Create a ModelSource within the VDB Model, then deploy the VDB
         */
        function createVdbModelSource( vdbName, modelName, sourceName, translatorName, jndiName ) {
            // Creates the ModelSource within the VDB Model, then deploys the completed VDB
            try {
                RepoRestService.createVdbModelSource( vdbName, modelName, sourceName, translatorName, jndiName ).then(
                    function (theModelSource) {
                        updateVdbDescription( vm.sourceName, vm.sourceDescription);
                    },
                    function (resp) {
                        SvcSourceSelectionService.setLoading(false);
                        var sourceModelConnectionCreateFailedMsg = $translate.instant('datasourceEditWizard.sourceModelConnectionCreateFailedMsg');
                        alert(sourceModelConnectionCreateFailedMsg + "\n" + RepoRestService.responseMessage(resp));
                        SvcSourceSelectionService.refresh('datasource-summary');
                    });
            } catch (error) {
                SvcSourceSelectionService.setLoading(false);
                var sourceModelConnectionCreateFailedMsg = $translate.instant('datasourceEditWizard.sourceModelConnectionCreateFailedMsg');
                alert(sourceModelConnectionCreateFailedMsg + "\n" + error);
                SvcSourceSelectionService.refresh('datasource-summary');
            }
        }

        /**
         * Update a ModelSource within the VDB Model, then update the vdb description
         */
        function updateVdbModelSource( vdbName, modelName, sourceName, translatorName, jndiName ) {
            // Updates the ModelSource within the VDB Model, then updates the description
            try {
                RepoRestService.updateVdbModelSource( vdbName, modelName, sourceName, translatorName, jndiName ).then(
                    function (theModelSource) {
                        updateVdbDescription( vm.sourceName, vm.sourceDescription);
                    },
                    function (resp) {
                        SvcSourceSelectionService.setLoading(false);
                        var sourceUpdateFailedMsg = $translate.instant('datasourceEditWizard.sourceModelConnectionUpdateFailedMsg');
                        alert(sourceUpdateFailedMsg + "\n" + RepoRestService.responseMessage(response));
                        SvcSourceSelectionService.refresh('datasource-summary');
                    });
            } catch (error) {
                SvcSourceSelectionService.setLoading(false);
                var sourceUpdateFailedMsg = $translate.instant('datasourceEditWizard.sourceModelConnectionUpdateFailedMsg');
                alert(sourceUpdateFailedMsg + "\n" + RepoRestService.responseMessage(response));
                SvcSourceSelectionService.refresh('datasource-summary');
            }
        }

    }

})();
