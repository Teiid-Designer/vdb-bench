/**
 * Datasource Wizard Service
 * - Initialize and maintain state for the datasource wizard 
 *
 */
(function () {

    'use strict';

    angular
        .module('vdb-bench.dataservice')
        .factory('DatasourceWizardService', DatasourceWizardService);

    DatasourceWizardService.$inject = ['$rootScope', '$translate', 'RepoRestService', 'SvcSourceSelectionService', 'TranslatorSelectionService', 'ConnectionSelectionService'];

    function DatasourceWizardService($rootScope, $translate, RepoRestService, SvcSourceSelectionService, TranslatorSelectionService, ConnectionSelectionService) {

        var wiz = {};

        wiz.sourceName = "";
        wiz.nameErrorMsg = "";
        wiz.sourceDescription = "";
        wiz.isEdit = false;
        wiz.showJdbcFilterOptions = false;
        wiz.allTranslators = TranslatorSelectionService.getTranslators(false);
        wiz.selectedSource = null;
        wiz.selectedConnection = null;
        wiz.selectedTranslator = null;
        wiz.selectedTranslatorImage = TranslatorSelectionService.getImageLink(null);
        wiz.originalConnectionName = null;
        wiz.originalTranslatorName = null;
        wiz.originalFilterProps = [];
        wiz.originalDescription = null;
        wiz.translatorsRefreshed = false;
        wiz.connectionsRefreshed = false;

        /**
         * Service instance to be returned
         */
        var service = {};

        /**
         * Initialize the DatasourceWizardService. 
         *   If datasource is null, reset selections.
         *   If datasource is supplied, set the initial values for the datasource.
         * 'dataServicePageChanged' is broadcast, but part of the initialization is refresh of the Connections and Translators --- when the
         *  Connections and Translators have finished updating, 'DatasourceWizardServiceReady' is then broadcast. 
         *   
         */
        service.init = function (datasource, pageId) {
            // null datasource, reset values
            if(datasource===null) {
                wiz.isEdit = false;
                resetSelections();
                // transfer control to the provided page
                if(pageId !== null) {
                    $rootScope.$broadcast("dataServicePageChanged", pageId);
                }
            // datasource supplied - set values accordingly
            } else {
                wiz.isEdit = true;
                initSourceSelections(datasource, pageId);
            }
        };

        /**
         * Reset user selections
         */
        function resetSelections ( ) {
            wiz.selectedSource = null;
            wiz.sourceDescription = "";
            wiz.showJdbcFilterOptions = false;
            // reset service name
            service.setSourceName( "" );

            service.setSelectedConnection(null);
            service.setSelectedTranslator(null);
            ConnectionSelectionService.resetFilterProperties();

            refreshConnectionsAndTranslators();
        }

        /**
         * Starts the refresh of Connections and Translators
         */
        function refreshConnectionsAndTranslators ( ) {
            wiz.connectionsRefreshed = false;
            wiz.translatorsRefreshed = false;
            if(service.isEditing()) {
                ConnectionSelectionService.refresh(false);
                TranslatorSelectionService.refresh(false);
            } else {
                ConnectionSelectionService.refresh(true);
                TranslatorSelectionService.refresh(true);
            }
        }

        /**
         * Handles event for translator loading finished
         */
        $rootScope.$on('loadingTranslatorsChanged', function (event, loading) {
            if(!loading) {
                wiz.allTranslators = TranslatorSelectionService.getTranslators(false);
                wiz.translatorsRefreshed = true;
                if(wiz.connectionsRefreshed) {
                    $rootScope.$broadcast("DatasourceWizardServiceReady");
                }
            }
        });

        /**
         * Handles event for connection loading finished
         */
        $rootScope.$on('loadingConnectionsChanged', function (event, loading) {
            if(!loading) {
                wiz.connectionsRefreshed = true;
                if(wiz.translatorsRefreshed) {
                    $rootScope.$broadcast("DatasourceWizardServiceReady");
                }
            }
        });

        /**
         * Initialize the selections for a provided datasource.
         */
        function initSourceSelections ( datasource, pageId ) {
            wiz.selectedSource = datasource;
            wiz.sourceDescription = datasource.vdb__description;
            wiz.originalDescription = datasource.vdb__description;
            wiz.showJdbcFilterOptions = false;
            service.setSourceName(datasource.keng__id);

            ConnectionSelectionService.resetFilterProperties();

            wiz.originalTranslatorName = null;
            wiz.originalConnectionName = null;
            wiz.originalFilterProps = [];
            wiz.initialCatalogFilter = "";
            wiz.initialSchemaFilter = "";
            var successCallback = function(model) {
                wiz.originalConnectionName = model.keng__id;
                var conn = ConnectionSelectionService.getConnection(model.keng__id);
                ConnectionSelectionService.selectConnection(conn, false);
                service.setSelectedConnection(conn);

                // If model has filter properties, include them
                if(angular.isDefined(model.keng__properties)) {
                    for(var key in model.keng__properties) {
                        var propName = model.keng__properties[key].name;
                        var propValue = model.keng__properties[key].value;
                        if( propName==='importer.catalog' ) {
                            wiz.initialCatalogFilter = propValue;
                            ConnectionSelectionService.setFilterProperty(propName,propValue);
                        }
                        if( propName==='importer.schemaPattern' ) {
                            wiz.initialSchemaFilter = propValue;
                            ConnectionSelectionService.setFilterProperty(propName,propValue);
                        }
                        if( propName==='importer.tableNamePattern' ) {
                            ConnectionSelectionService.setFilterProperty(propName,propValue);
                        }
                    }
                }
                var filterProps = ConnectionSelectionService.selectedConnectionFilterProperties();
                RepoRestService.copy(filterProps,wiz.originalFilterProps);  // Keep a copy of the original properties
                
                var modelSourceSuccessCallback = function(modelSource) {
                    TranslatorSelectionService.selectTranslatorName(modelSource.vdb__sourceTranslator);
                    service.setSelectedTranslator(TranslatorSelectionService.selectedTranslator());
                    wiz.originalTranslatorName = modelSource.vdb__sourceTranslator;

                    // If JDBC connection is selected and filters defined, select the checkbox
                    if(wiz.originalConnectionName!==null) {
                        // Get initial filters if initial connection selected is jdbc
                        if(wiz.initialCatalogFilter!=="" || wiz.initialSchemaFilter!=="") {
                            wiz.showJdbcFilterOptions = true;
                        } else {
                            wiz.showJdbcFilterOptions = false;
                        }
                    }

                    refreshConnectionsAndTranslators();

                    // transfer control to the provided page
                    if(pageId !== null) {
                        $rootScope.$broadcast("dataServicePageChanged", pageId);
                    }
                };
                var modelSourceFailureCallback = function(modelSourceErrorMsg) {
                    var getModelSourceFailedMsg = $translate.instant('datasourceSummaryController.getModelSourceFailedMsg');
                    alert(getModelSourceFailedMsg + "\n" + modelSourceErrorMsg);
                };
                SvcSourceSelectionService.selectedServiceSourceModelSource(modelSourceSuccessCallback,modelSourceFailureCallback);
            };
            
            var failureCallback = function(errorMsg) {
                var getModelSourceConnectionFailedMsg = $translate.instant('datasourceSummaryController.getModelSourceConnectionFailedMsg');
                alert(getModelSourceConnectionFailedMsg + "\n" + errorMsg);
            };

            SvcSourceSelectionService.selectedServiceSourceModel(successCallback, failureCallback);
        }

        /**
         * Determines if source is being edited, or new source created.
         */
        service.isEditing = function() {
            return wiz.isEdit;
        };

        /**
         * Set the datasource name
         */
        service.setSourceName = function(name) {
            if ( name ) {
                wiz.sourceName = name;
            } else {
                wiz.sourceName = "";
            }

            validateSourceName();
        };

        /**
         * Get the datasource name
         */
        service.sourceName = function() {
            return wiz.sourceName;
        };

        /**
         * Determine if Datasource has valid name
         */
        service.hasValidName = function() {
            return _.isEmpty( wiz.nameErrorMsg );
        };

        /**
         * Obtains the current name validation error message (can be empty if name is valid).
         */
        service.getNameErrorMessage = function() {
            return wiz.nameErrorMsg;
        };

        /**
         * Determine if Datasource has valid name.
         */
        function validateSourceName() {
            wiz.nameErrorMsg = "";

            // do not validate name if editing an existing data source since
            // changing the name is not allowed
            if ( wiz.isEdit ) {
                return;
            }

            if ( _.isEmpty( wiz.sourceName ) ) {
                wiz.nameErrorMsg = $translate.instant( 'datasourceWizardService.nameRequired' );
                $rootScope.$broadcast( "datasourceWizardSourceNameChanged" );
            } else {
                try {
                    var uri = encodeURIComponent( wiz.sourceName );

                    RepoRestService.validateDataSourceName( uri ).then(
                        function ( result ) {
                            wiz.nameErrorMsg = result;
                            $rootScope.$broadcast( "datasourceWizardSourceNameChanged" );
                        },
                        function ( response ) {
                            var errorMsg = $translate.instant( 'datasourceWizardService.validateDataSourceNameError' );
                            throw RepoRestService.newRestException( errorMsg + "\n" + RepoRestService.responseMessage( response ) );
                        }
                    );
                } catch ( error ) {
                    var errorMsg = $translate.instant( 'datasourceWizardService.validateDataSourceNameError' );
                    throw RepoRestService.newRestException( errorMsg + "\n" + error );
                }
            }
        }

        /**
         * Set the datasource description
         */
        service.setSourceDescription = function(description) {
            wiz.sourceDescription = description;
        };

        /**
         * Get the datasource description
         */
        service.sourceDescription = function() {
            return wiz.sourceDescription;
        };

        /**
         * Set to show JDBC filter options
         */
        service.setShowJdbcFilterOptions = function(showOptions) {
            wiz.showJdbcFilterOptions = showOptions;
            // requests the filter component to refresh
            if(showOptions) {
                $rootScope.$broadcast("resetJdbcFilters");
            } else {
                // Deselecting the filter checkbox resets the filters
                ConnectionSelectionService.resetFilterProperties();
            }
        };

        /**
         * Determine if JDBC filter options are to be shown
         */
        service.showJdbcFilterOptions = function() {
            return wiz.showJdbcFilterOptions;
        };

        /**
         * Set the selected Connection
         */
        service.setSelectedConnection = function(connection) {
            wiz.selectedConnection = connection;
        };

        /**
         * Get the selected Connection
         */
        service.selectedConnection = function() {
            return wiz.selectedConnection;
        };

        /**
         * Determine if there is a jdbc connection selected currently
         */
        service.hasSelectedJdbcConnection = function() {
            if(wiz.selectedConnection !== null && wiz.selectedConnection.dv__type===true) {
                return true;
            }
            return  false;
        };

        /**
         * Set the selected Translator.  Updates the image also
         */
        service.setSelectedTranslator = function(translator) {
            wiz.selectedTranslator = translator;
            if(translator===null) {
                wiz.selectedTranslatorImage = TranslatorSelectionService.getImageLink(null);
            } else {
                wiz.selectedTranslatorImage = TranslatorSelectionService.getImageLink(translator.keng__id);
            }
        };

        /**
         * Get the selected Translator
         */
        service.selectedTranslator = function() {
            return wiz.selectedTranslator;
        };

        /**
         * Get the selected Translator image
         */
        service.selectedTranslatorImage = function() {
            return wiz.selectedTranslatorImage;
        };

        /**
         * Get the array of all translators
         */
        service.allTranslators = function() {
            return wiz.allTranslators;
        };

        /**
         * Sets the translator for the current connection, (if it can be determined)
         */
        service.selectTranslatorDefaultForCurrentConnection = function (onSuccessCallback, onFailureCallback) {
            // check for connection not set
            if(!wiz.selectedConnection) {
                service.setSelectedTranslator(null);
                onSuccessCallback("Translator selection finished");
            }

            // Gets the default translator for the Teiid connection type and sets the selection
            try {
                RepoRestService.getDefaultTranslatorForConnection( wiz.selectedConnection.keng__id ).then(
                    function (result) {
                        var translatorName = result.Information.Translator;
                        if(translatorName === 'unknown') {
                            service.setSelectedTranslator(null);
                            onSuccessCallback("Translator selection finished");
                        } else {
                            for (var i = 0; i < wiz.allTranslators.length; i++) {
                                if (wiz.allTranslators[i].keng__id === translatorName) {
                                    service.setSelectedTranslator(wiz.allTranslators[i]);
                                    onSuccessCallback("Translator selection finished");
                                }
                            }
                        }
                    },
                    function (resp) {
                        service.setSelectedTranslator(null);
                        var fetchFailedMsg = $translate.instant('datasourceWizardService.getTranslatorsFailedMsg');
                        onFailureCallback(fetchFailedMsg + "\n" + RepoRestService.responseMessage(resp));
                    });
            } catch (error) {
                service.setSelectedTranslator(null);
                var fetchFailedMsg = $translate.instant('datasourceWizardService.getTranslatorsFailedMsg');
                onFailureCallback(fetchFailedMsg + "\n" + error);
            }
        };

        /**
         * Determine if the connection name has changed since initialization
         */
        service.connectionChanged = function() {
            return service.selectedConnection().keng__id !== wiz.originalConnectionName;
        };

        /**
         * Determine if the translator name has changed since initialization
         */
        service.translatorChanged = function() {
            return service.selectedTranslator().keng__id !== wiz.originalTranslatorName;
        };

        /**
         * Determine if the importer properties have changed since initialization
         */
        service.filterPropsChanged = function() {
            return !angular.equals(ConnectionSelectionService.selectedConnectionFilterProperties(),wiz.originalFilterProps);
        };

        /**
         * Determine if the description has changed since initialization
         */
       service.descriptionChanged = function() {
            return wiz.sourceDescription !== wiz.originalDescription;
        };

        /**
         * Get the original connection name
         */
        service.originalConnectionName = function() {
            return wiz.originalConnectionName;
        };

        return service;
    }

})();
