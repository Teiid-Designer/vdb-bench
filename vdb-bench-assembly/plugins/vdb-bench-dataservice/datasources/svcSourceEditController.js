(function () {
    'use strict';

    var pluginName = 'vdb-bench.dataservice';
    var pluginDirName = 'vdb-bench-dataservice';

    angular
        .module(pluginName)
        .controller('SvcSourceEditController', SvcSourceEditController);

    SvcSourceEditController.$inject = ['$scope', '$rootScope', '$translate', '$document', 'REST_URI', 'SYNTAX', 'RepoRestService', 
                                       'SvcSourceSelectionService', 'ConnectionSelectionService', 'TranslatorSelectionService', 'DSPageService'];

    function SvcSourceEditController($scope, $rootScope, $translate, $document, REST_URI, SYNTAX, RepoRestService, 
                                      SvcSourceSelectionService, ConnectionSelectionService, TranslatorSelectionService, DSPageService) {
        var vm = this;

        vm.initialConnectionName = null;
        vm.initialConnectionJndi = null;
        vm.connectionInit = true;
        vm.selectedSource = SvcSourceSelectionService.selectedServiceSource();
        vm.selectedConnection = null;
        vm.selectedJdbcConnection = null;
        vm.selectedTranslator = TranslatorSelectionService.selectedTranslator();
        vm.selectedTranslatorImage = null;
        vm.selectedJdbcConnection = null;
        vm.transLoading = TranslatorSelectionService.isLoading();
        vm.connsLoading = ConnectionSelectionService.isLoading();
        vm.allTranslators = TranslatorSelectionService.getTranslators(false);
        vm.filterSchema = false;
        vm.updateAndDeployInProgress = false;
        vm.originalConnectionName = null;
        vm.originalTranslatorName = null;
        vm.originalFilterProps = [];
        vm.originalDescription = null;
        vm.connectionChanged = false;
        vm.translatorChanged = false;
        vm.filterPropsChanged = false;
        vm.descriptionChanged = false;

        /*
         * Set a custom title to the page including the service source's id
         */
        var page = DSPageService.page(DSPageService.SERVICESOURCE_EDIT_PAGE);
        DSPageService.setCustomTitle(page.id, page.title + " '" + SvcSourceSelectionService.selectedServiceSource().keng__id + "'");

        /*
         * Set initial source selection
         */
        $document.ready(function () {
            // Get the initial selections for the service source.
            var srcEditInfo = SvcSourceSelectionService.getEditSourceInfo();
            if(angular.isDefined(srcEditInfo)) {
                for(var key in srcEditInfo) {
                    var propName = srcEditInfo[key].name;
                    var propValue = srcEditInfo[key].value;
                    if(propName=='connectionName') {
                        vm.initialConnectionName = propValue;
                    } else if (propName=='sourceJndiName') {
                        vm.initialConnectionJndi = propValue;
                    }
                }
            }
            
            // Get the initial filter values if available
            var filterInfo = ConnectionSelectionService.selectedConnectionFilterProperties();
            var initialCatalogFilter = "";
            var initialSchemaFilter = "";
            if(angular.isDefined(filterInfo)) {
                for(var pKey in filterInfo) {
                    var pName = filterInfo[pKey].name;
                    var pValue = filterInfo[pKey].value;
                    if(pName=='importer.catalog') {
                        initialCatalogFilter = pValue;
                    } else if (pName=='importer.schemaPattern') {
                        initialSchemaFilter = pValue;
                    }
                }
            }
            
            vm.selectedTranslator = TranslatorSelectionService.selectedTranslator();
            vm.selectedTranslatorImage = TranslatorSelectionService.getImageLink(vm.selectedTranslator.keng__id);
            vm.selectedSource = SvcSourceSelectionService.selectedServiceSource();
            vm.selectedJdbcConnection=ConnectionSelectionService.getConnection(vm.initialConnectionName);
            
            // Save original values for later comparison
            vm.originalTranslatorName = vm.selectedTranslator.keng__id;
            vm.originalConnectionName = vm.initialConnectionName;
            RepoRestService.copy(filterInfo,vm.originalFilterProps);  // Keep a copy of the original properties
            vm.originalDescription = vm.selectedSource.vdb__description;
            
            // If JDBC connection is selected and filters defined, select the checkbox
            if(vm.selectedJdbcConnection!==null && vm.selectedJdbcConnection.dv__type===true) {
                // Get initial filters if initial connection selected is jdbc
                if(initialCatalogFilter!=="" || initialSchemaFilter!=="") {
                    ConnectionSelectionService.selectConnection(vm.selectedJdbcConnection, false);
                    vm.filterSchema = true;
                } else {
                    vm.filterSchema = false;
                }
            }
        });
        
        /*
         * Handler for selected connection changes
         */
        $scope.$on('selectedConnectionChanged', function (event) {
            vm.selectedConnection = ConnectionSelectionService.selectedConnection();
            // The initial Connection selection is cleared after the first change event
            if (vm.connectionInit===false) {
                vm.initialConnectionName = null;
                vm.initialConnectionJndi = null;
                if(vm.selectedConnection !== null) {
                    selectTranslatorDefaultForConnection(vm.selectedConnection.keng__id);
                    if(vm.selectedConnection.dv__type === true) {
                        vm.selectedJdbcConnection = vm.selectedConnection;
                    } else {
                        vm.selectedJdbcConnection = null;
                    }
                } else {
                    vm.selectedJdbcConnection = null;
                    vm.selectedTranslator = null;
                    vm.selectedTranslatorImage = TranslatorSelectionService.getImageLink(null);
                }
                vm.filterSchema = false;
            }
            vm.connectionInit = false;
        });

        /*
         * Handler for connection loading changes
         */
        $scope.$on('loadingConnectionsChanged', function (event, loading) {
            vm.connsLoading = loading;
        });

        /*
         * Handler for translator loading changes
         */
        $scope.$on('loadingTranslatorsChanged', function (event, loading) {
            vm.transLoading = loading;
        });

        /*
         * When loading finishes on create / deploy
         */
        $scope.$on('loadingServiceSourcesChanged', function (event, loadingState) {
            if (vm.updateAndDeployInProgress === loadingState)
                return;

            if(loadingState === false) {
                vm.updateAndDeployInProgress = false;
            }
        });

        /**
         * handles translator change
         */
        vm.translatorChanged = function() {
            if(vm.selectedTranslator===null) {
                vm.selectedTranslatorImage = TranslatorSelectionService.getImageLink(null);
            } else {
                vm.selectedTranslatorImage = TranslatorSelectionService.getImageLink(vm.selectedTranslator.keng__id);
            }
        };

        /**
         * handles filter checkbox change
         */
        vm.filterCheckboxChanged = function() {
            // requests the filter component to refresh
            if(vm.filterSchema) {
                $rootScope.$broadcast("resetJdbcFilters");
            } else {
                // Deselecting the filter checkbox resets the filters
                ConnectionSelectionService.resetFilterProperties();
            }
        };

        /**
         * Set the selected translator default
         */
        function selectTranslatorDefaultForConnection ( connectionName ) {
            
            // Gets the suggested translator for the Teiid connection type and sets the selection
            try {
                RepoRestService.getDefaultTranslatorForConnection( connectionName ).then(
                    function (result) {
                        var translatorName = result.Information.Translator;
                        if(translatorName === 'unknown') {
                            vm.selectedTranslator = null;
                            vm.selectedTranslatorImage = TranslatorSelectionService.getImageLink(null);
                        } else {
                            for (var i = 0; i < vm.allTranslators.length; i++) {
                                if (vm.allTranslators[i].keng__id === translatorName) {
                                    vm.selectedTranslator = vm.allTranslators[i];
                                    vm.selectedTranslatorImage = TranslatorSelectionService.getImageLink(vm.selectedTranslator.keng__id);
                                    break;
                                }
                            }
                        }
                    },
                    function (resp) {
                        var fetchFailedMsg = $translate.instant('svcSourceEditController.getTranslatorsFailedMsg');
                        throw RepoRestService.newRestException(fetchFailedMsg + "\n" + RepoRestService.responseMessage(resp));
                    });
            } catch (error) {
                var fetchFailedMsg = $translate.instant('svcSourceEditController.getTranslatorsFailedMsg');
                throw RepoRestService.newRestException(fetchFailedMsg + "\n" + error);
            }
        }

        /**
         * Can a source be updated
         */
        vm.canUpdateSvcSource = function() {
            if (angular.isUndefined(vm.svcSourceName) ||
                vm.svcSourceName === null || vm.svcSourceName === SYNTAX.EMPTY_STRING)
                return false;

            if (vm.initialConnectionName !== null && vm.intialConnectionJndi !== null && vm.selectedTranslator !== null) {
                return true;
            }

            if (angular.isUndefined(vm.selectedConnection) || vm.selectedConnection === null)
                return false;

            if (angular.isUndefined(vm.selectedTranslator) || vm.selectedTranslator === null)
                return false;

            return true;
        };

        // Event handler for clicking the save button
        vm.onEditSvcSourceClicked = function () {
            if (! vm.canUpdateSvcSource())
                return;

            var connectionName = null;
            var jndiName = null;
            var translatorName = null;
            if (vm.initialConnectionName !== null && vm.intialConnectionJndi !== null && vm.selectedTranslator !== null) {
                connectionName = vm.initialConnectionName;
                jndiName = vm.initialConnectionJndi;
                translatorName = vm.selectedTranslator.keng__id;
            } else {
                connectionName = vm.selectedConnection.keng__id;
                jndiName = vm.selectedConnection.dv__jndiName;
                translatorName = vm.selectedTranslator.keng__id;
            }
            
            var filterProperties = ConnectionSelectionService.selectedConnectionFilterProperties();

            // Set in progress status
            vm.updateAndDeployInProgress = true;

            // Determine items changed
            vm.connectionChanged = connectionName !== vm.originalConnectionName;
            vm.translatorChanged = translatorName !== vm.originalTranslatorName;
            vm.filterPropsChanged = !angular.equals(filterProperties,vm.originalFilterProps);
            vm.descriptionChanged = vm.svcSourceDescription !== vm.originalDescription;

            try {
                
                // If a different connection was chosen, the original VdbModel must be deleted
                if(vm.connectionChanged) {
                    RepoRestService.deleteVdbModel( vm.svcSourceName, vm.originalConnectionName).then(
                            function (resp) {
                                createVdbModel( vm.svcSourceName, connectionName, translatorName, jndiName, filterProperties );
                            },
                            function (response) {
                                var sourceUpdateFailedMsg = $translate.instant('svcSourceEditController.sourceUpdateFailedMsg');
                                alert(sourceUpdateFailedMsg + "\n" + RepoRestService.responseMessage(response));
                                SvcSourceSelectionService.refresh('datasource-summary');
                            });
                // Connection was not changed, we can update the existing VdbModel and VdbModelSource
                } else {
                    // Filter properties changed, update the model
                    if(vm.filterPropsChanged) {
                        RepoRestService.updateVdbModel( vm.svcSourceName, connectionName, true, filterProperties).then(
                                function (theModel) {
                                    if(vm.translatorChanged) {
                                        updateVdbModelSource( vm.svcSourceName, connectionName, connectionName, translatorName, jndiName );
                                    } else {
                                        updateVdbDescription( vm.svcSourceName, vm.svcSourceDescription);
                                    }
                                },
                                function (response) {
                                    var sourceUpdateFailedMsg = $translate.instant('svcSourceEditController.sourceUpdateFailedMsg');
                                    alert(sourceUpdateFailedMsg + "\n" + RepoRestService.responseMessage(response));
                                    SvcSourceSelectionService.refresh('datasource-summary');
                                });
                    // Filter properties not changed
                    } else {
                        // Translator changed, update model source
                        if(vm.translatorChanged) {
                            updateVdbModelSource( vm.svcSourceName, connectionName, connectionName, translatorName, jndiName );
                        // Translator not changed
                        } else {
                            updateVdbDescription( vm.svcSourceName, vm.svcSourceDescription);
                        }
                    }
                }
            } catch (error) {
            } finally {
            }
        };

        /**
         * Update the VDB description
         */
        function updateVdbDescription( svcSourceName, svcSourceDescription ) {
            if(vm.descriptionChanged) {
                // Creates the Model within the VDB, then add the ModelSource to the Model
                try {
                    RepoRestService.updateVdb( svcSourceName, svcSourceDescription, true ).then(
                        function (theModel) {
                            deployVdb(svcSourceName);
                        },
                        function (resp) {
                            SvcSourceSelectionService.setLoading(false);
                            var sourceUpdateFailedMsg = $translate.instant('svcSourceEditController.sourceUpdateFailedMsg');
                            alert(sourceUpdateFailedMsg + "\n" + RepoRestService.responseMessage(resp));
                            SvcSourceSelectionService.refresh('datasource-summary');
                        });
                } catch (error) {
                    SvcSourceSelectionService.setLoading(false);
                    var sourceUpdateFailedMsg = $translate.instant('svcSourceEditController.sourceUpdateFailedMsg');
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
            // If nothing changed, no need to redeploy the source vdb.
            if(!vm.connectionChanged && !vm.translatorChanged && !vm.filterPropsChanged && !vm.descriptionChanged) {
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
                            // Monitors the source vdb to determine when its active
                            //
                            RepoRestService.pollForActiveVdb(vdbName, successCallback, failCallback);
                        } else {
                            SvcSourceSelectionService.setDeploying(false, vdbName, false, result.Information.ErrorMessage1);
                        }
                    },
                    function (response) {
                        SvcSourceSelectionService.setDeploying(false, vdbName, false, RepoRestService.responseMessage(response));
                        SvcSourceSelectionService.setLoading(false);
                        var sourceDeployFailedMsg = $translate.instant('svcSourceEditController.sourceDeployFailedMsg');
                        alert(sourceDeployFailedMsg + "\n" + RepoRestService.responseMessage(response));
                        SvcSourceSelectionService.refresh('datasource-summary');
                    });
            } catch (error) {
                SvcSourceSelectionService.setLoading(false);
                var sourceDeployFailedMsg = $translate.instant('svcSourceEditController.sourceDeployFailedMsg');
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
                        var sourceModelCreateFailedMsg = $translate.instant('svcSourceEditController.sourceModelCreateFailedMsg');
                        alert(sourceModelCreateFailedMsg + "\n" + RepoRestService.responseMessage(resp));
                        SvcSourceSelectionService.refresh('datasource-summary');
                    });
            } catch (error) {
                SvcSourceSelectionService.setLoading(false);
                var sourceModelCreateFailedMsg = $translate.instant('svcSourceEditController.sourceModelCreateFailedMsg');
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
                        updateVdbDescription( vm.svcSourceName, vm.svcSourceDescription);
                    },
                    function (resp) {
                        SvcSourceSelectionService.setLoading(false);
                        var sourceModelConnectionCreateFailedMsg = $translate.instant('svcSourceEditController.sourceModelConnectionCreateFailedMsg');
                        alert(sourceModelConnectionCreateFailedMsg + "\n" + RepoRestService.responseMessage(resp));
                        SvcSourceSelectionService.refresh('datasource-summary');
                    });
            } catch (error) {
                SvcSourceSelectionService.setLoading(false);
                var sourceModelConnectionCreateFailedMsg = $translate.instant('svcSourceEditController.sourceModelConnectionCreateFailedMsg');
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
                        updateVdbDescription( vm.svcSourceName, vm.svcSourceDescription);
                    },
                    function (resp) {
                        SvcSourceSelectionService.setLoading(false);
                        var sourceUpdateFailedMsg = $translate.instant('svcSourceEditController.sourceModelConnectionUpdateFailedMsg');
                        alert(sourceUpdateFailedMsg + "\n" + RepoRestService.responseMessage(response));
                        SvcSourceSelectionService.refresh('datasource-summary');
                    });
            } catch (error) {
                SvcSourceSelectionService.setLoading(false);
                var sourceUpdateFailedMsg = $translate.instant('svcSourceEditController.sourceModelConnectionUpdateFailedMsg');
                alert(sourceUpdateFailedMsg + "\n" + RepoRestService.responseMessage(response));
                SvcSourceSelectionService.refresh('datasource-summary');
            }
        }

    }

})();
