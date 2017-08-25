/**
 * DataService Edit Wizard business object
 *
 */
(function () {

    'use strict';

    angular
        .module('vdb-bench.dataservice')
        .factory('EditWizardService', EditWizardService);

    EditWizardService.$inject = ['$rootScope', '$translate', 'RepoRestService', 'JOIN'];

    function EditWizardService($rootScope, $translate, RepoRestService, JOIN) {

        var wiz = {};
        var DEFAULT_PREDICATE = 
            { id : 0,
              lhColName : "",
              rhColName : "",
              operatorName : "=",
              combineKeyword : "AND"
            };

        wiz.serviceName = "";
        wiz.nameErrorMsg = "";
        wiz.serviceDescription = "";
        wiz.sources = [];
        wiz.sourceTables = [];
        wiz.src1AvailableColumns = [];
        wiz.src2AvailableColumns = [];
        wiz.isEdit = false;
        wiz.selectedJoin = JOIN.INNER;
        wiz.src1SelectedColumnNames = [];
        wiz.src2SelectedColumnNames = [];
        wiz.includeAllSource1Columns = true;
        wiz.viewEditable = false;
        wiz.viewDdl = "";
        wiz.criteriaPredicates = [DEFAULT_PREDICATE];

        wiz.readOnlyAccessOriginal = true;
        wiz.readOnlyAccess = wiz.readOnlyAccessOriginal;

        /*
         * Service instance to be returned
         */
        var service = {};

        /*
         * Init the wizard service
         *   If dataservice is null, reset selections.
         *   If dataservice is supplied, init values for the dataservice.
         */
        service.init = function (dataservice, pageId) {
            // null dataservice, reset values
            if(dataservice===null) {
                resetSelections();
                // transfer control to the provided page
                if(pageId !== null) {
                    $rootScope.$broadcast("dataServicePageChanged", pageId);
                }
            // dataservice supplied - set values accordingly
            } else {
                wiz.serviceName = dataservice.keng__id;
                wiz.serviceDescription = dataservice.tko__description;
                initServiceSelections(dataservice.keng__id, pageId);
                initDataRole( dataservice.keng__id );
            }
        };

        function initDataRole( dataServiceName ) {
            try {
                RepoRestService.getDefaultReadOnlyDataRole( dataServiceName ).then(
                    function( dataRole ) {
                        wiz.readOnlyAccessOriginal = true;
                        wiz.readOnlyAccess = wiz.readOnlyAccessOriginal;
                    },
                    function( response ) {
                    	if ( response.status === 404 ) {
                            wiz.readOnlyAccessOriginal = false;
                            wiz.readOnlyAccess = wiz.readOnlyAccessOriginal;
                    	} else {
                    		var errorMsg = $translate.instant( 'editWizardService.initTableSelectionsFailedMsg' );
                    		throw RepoRestService.newRestException( errorMsg + "\n" + RepoRestService.responseMessage( response ) );
                        }
                    }
                );
            } catch ( error ) {
                var errMsg = $translate.instant( 'editWizardService.initTableSelectionsFailedMsg' );
                throw RepoRestService.newRestException( errMsg + "\n" + error );
            }
        }
        
        /*
         * Reset user selections
         */
        function resetSelections ( ) {
            wiz.serviceDescription = "";
            wiz.sources = [];
            wiz.sourceTables = [];
            wiz.src1AvailableColumns = [];
            wiz.src2AvailableColumns = [];
            wiz.selectedJoin = JOIN.INNER;
            wiz.src1SelectedColumnNames = [];
            wiz.src2SelectedColumnNames = [];
            wiz.includeAllSource1Columns = true;
            wiz.viewEditable = false;
            wiz.viewDdl = "";
            resetPredicates();
            // Broadcast table change
            $rootScope.$broadcast("editWizardTablesChanged");

            // reset service name
            service.setServiceName( "" );

            wiz.readOnlyAccessOriginal = true;
            wiz.readOnlyAccess = wiz.readOnlyAccessOriginal;
        }

        /*
         * Reset predicates to default
         */
        function resetPredicates() {
            wiz.criteriaPredicates = [DEFAULT_PREDICATE];
            wiz.criteriaPredicates[0].id = 0;
            wiz.criteriaPredicates[0].lhColName = "";
            wiz.criteriaPredicates[0].rhColName = "";
            wiz.criteriaPredicates[0].operatorName = "=";
            wiz.criteriaPredicates[0].combineKeyword = "AND";
        }

        /*
         * Set the mode (edit or create)
         */
        service.setEditing = function(isEditing) {
            wiz.isEdit = isEditing;
        };

        /*
         * Get the mode (isEdit)
         */
        service.isEditing = function() {
            return wiz.isEdit;
        };

        /*
         * Indicates if the data sources can only be accessed in a read-only mode.
         */
        service.isReadOnlyAccess = function() {
            return wiz.readOnlyAccess;
        };

        /*
         * Sets the data source read-only access.
         */
        service.setReadOnlyAccess = function( readOnly ) {
            wiz.readOnlyAccess = readOnly;
        };

        /*
         * Set Include all source 1 columns (for single source case)
         */
        service.setIncludeAllSource1Columns = function(includeAll) {
            wiz.includeAllSource1Columns = includeAll;
        };

        /*
         * Determine whether all source 1 columns are to be included
         */
        service.includeAllSource1Columns = function() {
            return wiz.includeAllSource1Columns;
        };

        /*
         * Set the dataservice name
         */
        service.setServiceName = function(name) {
            if ( name ) {
                wiz.serviceName = name;
            } else {
                wiz.serviceName = "";
            }

            validateServiceName();
        };

        /*
         * Get the dataservice name
         */
        service.serviceName = function() {
            return wiz.serviceName;
        };

        /*
         * Determine if Dataservice has valid name
         */
        service.hasValidName = function() {
            return _.isEmpty( wiz.nameErrorMsg );
        };

        /*
         * Obtains the current name validation error message (can be empty if name is valid).
         */
        service.getNameErrorMessage = function() {
            return wiz.nameErrorMsg;
        };

        /*
         * Determine if Dataservice has valid name.
         */
        function validateServiceName() {
            wiz.nameErrorMsg = "";

            // do not validate name if editing an existing data service since
            // changing the name is not allowed
            if ( wiz.isEdit ) {
                return;
            }

            if ( _.isEmpty( wiz.serviceName ) ) {
                wiz.nameErrorMsg = $translate.instant( 'editWizardService.nameRequired' );
                $rootScope.$broadcast( "editWizardServiceNameChanged" );
            } else {
                try {
                    var uri = encodeURIComponent( wiz.serviceName );

                    RepoRestService.validateDataServiceName( uri ).then(
                        function ( result ) {
                            wiz.nameErrorMsg = result;
                            $rootScope.$broadcast( "editWizardServiceNameChanged" );
                        },
                        function ( response ) {
                            var errorMsg = $translate.instant( 'editWizardService.validateDataServiceNameError' );
                            throw RepoRestService.newRestException( errorMsg + "\n" + RepoRestService.responseMessage( response ) );
                        }
                    );
                } catch ( error ) {
                    var errorMsg = $translate.instant( 'editWizardService.validateDataServiceNameError' );
                    throw RepoRestService.newRestException( errorMsg + "\n" + error );
                }
            }
        }

        /*
         * Set the dataservice description
         */
        service.setServiceDescription = function(description) {
            wiz.serviceDescription = description;
        };

        /*
         * Get the dataservice description
         */
        service.serviceDescription = function() {
            return wiz.serviceDescription;
        };

        /*
         * Set the dataservice view DDL
         */
        service.setViewDdl = function(ddl) {
            wiz.viewDdl = ddl;
        };

        /*
         * Get the dataservice description
         */
        service.viewDdl = function() {
            return wiz.viewDdl;
        };

        /*
         * Set the dataservice view editable status
         */
        service.setViewEditable = function(editable) {
            wiz.viewEditable = editable;
        };

        /*
         * Get the dataservice view editable status
         */
        service.viewEditable = function() {
            return wiz.viewEditable;
        };

        /*
         * Reset the source tables
         */
        service.resetSourceTables = function() {
            wiz.sources = [];
            wiz.sourceTables = [];
            wiz.src1AvailableColumns = [];
            wiz.src2AvailableColumns = [];
            // Reset the criteria
            resetPredicates();
            
            wiz.readOnlyAccessOriginal = true;
            wiz.readOnlyAccess = wiz.readOnlyAccessOriginal;

            // Broadcast table change
            $rootScope.$broadcast("editWizardTablesChanged");
        };

        /*
         * Add a source table
         */
        service.addSourceTable = function(source, sourceTable) {
            if( wiz.sourceTables.length===0 ) {
                wiz.sources.push(source);
                wiz.sourceTables.push(sourceTable);
                // Broadcast table change
                $rootScope.$broadcast("editWizardTablesChanged");
            } else if ( wiz.sourceTables.length===1 && ( source !== wiz.sources[0] || sourceTable !== wiz.sourceTables[0] ) ) {
                wiz.sources.push(source);
                wiz.sourceTables.push(sourceTable);
                // If no criteria predicates have been set, attempt to set based on the table selections
                if(!service.criteriaComplete()) {
                  setCriteriaPredicatesFromTables(wiz.sourceTables[0],wiz.sourceTables[1]);
                }
                // Broadcast table change
                $rootScope.$broadcast("editWizardTablesChanged");
            }
        };

        /*
         * Remove source table 1
         */
        service.removeSourceTable1 = function() {
            wiz.sources.splice(0,1);
            wiz.sourceTables.splice(0,1);
            // Move source2 columns to source1
            wiz.src1AvailableColumns = wiz.src2AvailableColumns;
            // Reset the criteria
            resetPredicates();
            // Broadcast table change
            $rootScope.$broadcast("editWizardTablesChanged");
        };

        /*
         * Remove source table2
         */
        service.removeSourceTable2 = function() {
            wiz.sources.splice(1,1);
            wiz.sourceTables.splice(1,1);
            // Clears source2 columns
            wiz.src2AvailableColumns = [];
            // Reset the criteria
            resetPredicates();
            // Broadcast table change
            $rootScope.$broadcast("editWizardTablesChanged");
        };

        /*
         * Get the sources
         */
        service.sources = function() {
            return wiz.sources;
        };

        /*
         * Get the source tables
         */
        service.sourceTables = function() {
            return wiz.sourceTables;
        };

        /*
         * Get source 1 available columns
         */
        service.source1AvailableColumns = function() {
            return wiz.src1AvailableColumns;
        };

        /*
         * Get all source1 columns
         */
        service.selectAllSource1Columns = function() {
            wiz.src1SelectedColumnNames = [];
            refreshSource1SelectedColumns();
        };

        /*
         * Set source 1 available columns
         */
        service.setSource1AvailableColumns = function(columns) {
            wiz.src1AvailableColumns = columns;
            refreshSource1SelectedColumns();
        };

        /**
         * Refresh the source 1 column selections based on src1SelectedColumnNames
         */
        function refreshSource1SelectedColumns ( ) {
            // If src1 selections were not initialized, selected all columns
            if(wiz.src1SelectedColumnNames.length===0) {
                // select all available columns
                for(var i=0; i<wiz.src1AvailableColumns.length; i++) {
                    wiz.src1AvailableColumns[i].selected = true;
                }
                wiz.includeAllSource1Columns = true;
            } else {
                for(var iCol=0; iCol<wiz.src1SelectedColumnNames.length; iCol++) {
                    // Find and set the available column selected
                    for(var j=0; j<wiz.src1AvailableColumns.length; j++) {
                        if(wiz.src1AvailableColumns[j].keng__id === wiz.src1SelectedColumnNames[iCol]) {
                            wiz.src1AvailableColumns[j].selected = true;
                        }
                    }
                }
                // Set 'includeAll' state based on selected columns.
                if(service.source1AllColumnsSelected()) {
                    wiz.includeAllSource1Columns = true;
                }  else {
                    wiz.includeAllSource1Columns = false;
                }
            }
        }

        /*
         * Get source1 selected column names
         */
        service.source1SelectedColumns = function() {
            var selectedColNames = [];
            for(var i=0; i<wiz.src1AvailableColumns.length; i++) {
                if(wiz.src1AvailableColumns[i].selected) {
                    selectedColNames.push(wiz.src1AvailableColumns[i].keng__id);
                }
            }
            return selectedColNames;
        };

        /*
         * Determine if all source1 columns are selected
         */
        service.source1AllColumnsSelected = function() {
            var allSelected = true;
            for(var i=0; i<wiz.src1AvailableColumns.length; i++) {
                if(!wiz.src1AvailableColumns[i].selected) {
                    allSelected = false;
                    break;
                }
            }
            return allSelected;
        };

        /*
         * Get the source2 available columns
         */
        service.source2AvailableColumns = function() {
            return wiz.src2AvailableColumns;
        };

        /*
         * Select all source2 columns
         */
        service.selectAllSource2Columns = function() {
            wiz.src2SelectedColumnNames = [];
            refreshSource2SelectedColumns();
        };

        /*
         * Set the source2 available columns
         */
        service.setSource2AvailableColumns = function(columns) {
            wiz.src2AvailableColumns = columns;
            refreshSource2SelectedColumns();
        };

        /**
         * Refresh the source 2 column selections based on src2SelectedColumnNames
         */
        function refreshSource2SelectedColumns ( ) {
            // If src2 selections were not initialized, selected all columns
            if(wiz.src2SelectedColumnNames.length===0) {
                // select all available columns
                for(var i=0; i<wiz.src2AvailableColumns.length; i++) {
                    wiz.src2AvailableColumns[i].selected = true;
                }
            } else {
                for(var iCol=0; iCol<wiz.src2SelectedColumnNames.length; iCol++) {
                    // Find and set the available column selected
                    for(var j=0; j<wiz.src2AvailableColumns.length; j++) {
                        if(wiz.src2AvailableColumns[j].keng__id === wiz.src2SelectedColumnNames[iCol]) {
                            wiz.src2AvailableColumns[j].selected = true;
                        }
                    }
                } 
            }
        }

        /*
         * Get the source2 selected columns
         */
        service.source2SelectedColumns = function() {
            var selectedColNames = [];
            for(var i=0; i<wiz.src2AvailableColumns.length; i++) {
                if(wiz.src2AvailableColumns[i].selected) {
                    selectedColNames.push(wiz.src2AvailableColumns[i].keng__id);
                }
            }
            return selectedColNames;
        };

        /*
         * Determine if all source2 columns selected
         */
        service.source2AllColumnsSelected = function() {
            var allSelected = true;
            for(var i=0; i<wiz.src2AvailableColumns.length; i++) {
                if(!wiz.src2AvailableColumns[i].selected) {
                    allSelected = false;
                    break;
                }
            }
            return allSelected;
        };

        /*
         * Get the join type
         */
        service.joinType = function() {
            return wiz.selectedJoin;
        };

        /*
         * Set the join type
         */
        service.setJoinType = function(join) {
            wiz.selectedJoin = join;
        };

        /*
         * Update a criteria predicate, if a predicate with the id is found.
         */
        service.updateCriteriaPredicate = function(predicate) {
            for(var i=0; i<wiz.criteriaPredicates.length; i++) {
                if(wiz.criteriaPredicates[i].id === predicate.id) {
                    wiz.criteriaPredicates[i].lhColName = predicate.lhColName;
                    wiz.criteriaPredicates[i].rhColName = predicate.rhColName;
                    wiz.criteriaPredicates[i].operatorName = predicate.operatorName;
                    wiz.criteriaPredicates[i].combineKeyword = predicate.combineKeyword;
                    // Broadcast table change
                    $rootScope.$broadcast("editWizardJoinCriteriaChanged");
                }
            }
        };

        /*
         * Resets the criteria predicates to the supplied set of predicates.
         */
        service.setCriteriaPredicates = function(predicates) {
            if( !predicates || predicates.length === 0 ) {
                resetPredicates();
            } else {
                wiz.criteriaPredicates = predicates;
            }
            // Broadcast table change
            $rootScope.$broadcast("editWizardJoinCriteriaChanged");
        };

        /*
         * get the criteria predicates.
         */
        service.criteriaPredicates = function( ) {
            return wiz.criteriaPredicates;
        };

        /*
         * 'true' if criteria predicates are complete.  'complete' currently means they are fully defined
         * TODO: add more validation for the individual predicates
         */
        service.criteriaComplete = function( ) {
            if(wiz.criteriaPredicates.length===0) return false;

            for(var i=0; i<wiz.criteriaPredicates.length; i++) {
                // Left and Right Columns must be defined.  Operator must be defined.
                if(   !wiz.criteriaPredicates[i].lhColName || wiz.criteriaPredicates[i].lhColName.length<1 ||
                      !wiz.criteriaPredicates[i].rhColName || wiz.criteriaPredicates[i].rhColName.length<1 ||
                      !wiz.criteriaPredicates[i].operatorName || wiz.criteriaPredicates[i].operatorName.length<1 ) {
                    return false;
                }
                // AND | OR keyword must be defined unless its the last predicate
                if ( i < wiz.criteriaPredicates.length-1 &&
                     (!wiz.criteriaPredicates[i].combineKeyword || wiz.criteriaPredicates[i].combineKeyword.length<1) ) {
                    return false;
                }
            }
            return true;
        };

        /*
         * 'true' if wizard selections are complete.  'complete' means the selections are defined enough to generate valid DDL.
         */
        service.selectionsComplete = function( ) {
            // Service Name must be defined
            if(wiz.serviceName.length===0) return false;

            // Must have at least one table selection
            if(!wiz.sourceTables || wiz.sourceTables.length===0) return false;

            // One source, must have at least one selected Column
            if(wiz.sourceTables.length===1) {
                if (!wiz.includeAllSource1Columns) {
                    if(!hasSrc1ColumnSelection()) {
                        return false;
                    }
                } 
            // If two source table selections, must be 
            //   - columns selected from source 1 or source 2
            //   - a completed join criteria
            } else {
                if( ( !hasSrc1ColumnSelection() && !hasSrc2ColumnSelection() ) || !service.criteriaComplete() ) {
                    return false;
                }
            }

            return true;
        };

        /**
         * Determine if at least one src1 column is selected
         */
        function hasSrc1ColumnSelection() {
            var hasOne = false;
            for(var i=0; i<wiz.src1AvailableColumns.length; i++) {
                if(wiz.src1AvailableColumns[i].selected) {
                    hasOne = true;
                    break;
                }
            }
            return hasOne;
        }

        /**
         * Determine if at least one src1 column is selected
         */
        function hasSrc2ColumnSelection() {
            var hasOne = false;
            for(var i=0; i<wiz.src2AvailableColumns.length; i++) {
                if(wiz.src2AvailableColumns[i].selected) {
                    hasOne = true;
                    break;
                }
            }
            return hasOne;
        }

        /**
         * Sets the predicate criteria based on the currently selected tables.
         * This will make a REST call to use the PK - FK relationships on the tables to determine the join criteria.
         */
        function setCriteriaPredicatesFromTables(table1, table2) {
            resetPredicates();
            // --------------------------------------------
            // Success callback returns the source models
            // --------------------------------------------
            var joinSuccessCallback = function(models) {
                var lhSourceModelName = models[0].keng__id;
                var rhSourceModelName = models[1].keng__id;

                // Path for LH table
                var lhRelativeTablePath = wiz.sources[0]+"/"+lhSourceModelName+"/"+table1;
                // Path for RH table
                var rhRelativeTablePath = wiz.sources[1]+"/"+rhSourceModelName+"/"+table2;

                try {
                    RepoRestService.getJoinCriteriaForTables( lhRelativeTablePath, rhRelativeTablePath ).then(
                        function ( result ) {
                            // Criteria predicates
                            if(result.infoType==="CRITERIA") {
                                if(result.criteriaPredicates.length > 0) {
                                    wiz.criteriaPredicates = [];
                                }
                                // Add criteria predicates
                                for(var j=0; j<result.criteriaPredicates.length; j++) {
                                    var newPredicate = 
                                    { id : j,
                                      lhColName : result.criteriaPredicates[j].lhColumn,
                                      rhColName : result.criteriaPredicates[j].rhColumn,
                                      operatorName : result.criteriaPredicates[j].operator,
                                      combineKeyword : result.criteriaPredicates[j].combineKeyword
                                    };
                                    wiz.criteriaPredicates.push(newPredicate);
                                }
                            }
                        },
                        function (response) {
                            var errMsg = $translate.instant('editWizardService.getJoinCriteriaFailedMsg');
                            throw RepoRestService.newRestException(errMsg + "\n" + RepoRestService.responseMessage(response));
                        });
                } catch (error) {
                    var errMsg = $translate.instant('editWizardService.getJoinCriteriaFailedMsg');
                    throw RepoRestService.newRestException(errMsg + "\n" + error);
                }
            };

            // Failure callback
            var joinFailureCallback = function(errorMsg) {
                var errMsg = $translate.instant('editWizardService.getJoinCriteriaFailedMsg');
                alert(errMsg + "\n" + errorMsg);
            };

            // get models for source vdbs
            service.getModelsForSourceVdbs(wiz.sources, joinSuccessCallback, joinFailureCallback);
        }

        /**
         * Initialize the selections for the dataservice
         */
        function initServiceSelections ( dataServiceName, pageId ) {
            // Reset selections
            service.resetSourceTables();

            // Gets the teiid model schema.  If successful, update model using the schema
            try {
                RepoRestService.getViewInfoForDataService( dataServiceName ).then(
                    function ( result ) {
                        // Keeps track of left vs right info
                        var lhSourceName = null;
                        var lhTableName = null;
                        var lhTableColumns = [];
                        var rhSourceName = null;
                        var rhTableName = null;
                        var rhTableColumns = [];
                        // process result
                        for( var i = 0; i < result.length; i++) {
                            // View info
                            var infoType = result[i].infoType;
                            if(infoType==="LHTABLE") {
                                lhSourceName = result[i].sourceVdbName;
                                lhTableName = result[i].tableName;
                                if(angular.isDefined(result[i].columnNames)) {
                                    lhTableColumns = result[i].columnNames;
                                }
                            } else if(infoType==="RHTABLE"){
                                rhSourceName = result[i].sourceVdbName;
                                rhTableName = result[i].tableName;
                                if(angular.isDefined(result[i].columnNames)) {
                                    rhTableColumns = result[i].columnNames;
                                }
                            } else if(infoType==="CRITERIA") {
                                wiz.selectedJoin = result[i].joinType;
                                // Add criteria predicates
                                wiz.criteriaPredicates = [];
                                for(var j=0; j<result[i].criteriaPredicates.length; j++) {
                                    var newPredicate = 
                                    { id : j,
                                      lhColName : result[i].criteriaPredicates[j].lhColumn,
                                      rhColName : result[i].criteriaPredicates[j].rhColumn,
                                      operatorName : result[i].criteriaPredicates[j].operator,
                                      combineKeyword : result[i].criteriaPredicates[j].combineKeyword
                                    };
                                    wiz.criteriaPredicates.push(newPredicate);
                                }
                            } else if(infoType==="DDL") {
                                wiz.viewDdl = result[i].viewDdl;
                                wiz.viewEditable = result[i].viewEditable;
                            }
                        }
                        // Sources must be added in order (left then right)
                        service.addSourceTable(lhSourceName,lhTableName);
                        wiz.src1SelectedColumnNames = lhTableColumns;
                        if(rhTableName) {
                            service.addSourceTable(rhSourceName,rhTableName);
                            wiz.src2SelectedColumnNames = rhTableColumns;
                        }

                        // When ready, transfer control to the provided page
                        if(pageId !== null) {
                            $rootScope.$broadcast("dataServicePageChanged", pageId);
                        }
                    },
                    function (response) {
                        var errMsg = $translate.instant('editWizardService.initTableSelectionsFailedMsg');
                        throw RepoRestService.newRestException(errMsg + "\n" + RepoRestService.responseMessage(response));
                    });
            } catch (error) {
                var errMsg = $translate.instant('editWizardService.initTableSelectionsFailedMsg');
                throw RepoRestService.newRestException(errMsg + "\n" + error);
            }
        }

        /**
         * Get the Vdb model table columns
         */
        function setSourceTableColumns(nSrc,vdbName,modelName,tableName) {
            // Update the items
            try {
                RepoRestService.getVdbModelTableColumns( vdbName, modelName, tableName ).then(
                    function ( result ) {
                        if(nSrc===1) {
                            EditWizardService.setSource1AvailableColumns(result);
                        } else if(nSrc===2) {
                            EditWizardService.setSource2AvailableColumns(result);
                        }
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
         * Service: get the source VDB model.  (There is only one model within a sourceVDB)
         * success callback has the model for the requested source
         * failure callback has the failure message
         */
        service.getModelForSourceVdb = function(sourceVdbName, onSuccessCallback, onFailureCallback) {
            try {
                RepoRestService.getVdbModels(sourceVdbName).then(
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
        };

        /**
         * Service: get models for the supplied source VDBs.  (An array of 2 vdb names is expected)
         * success callback has the models for the requested sources
         */
        service.getModelsForSourceVdbs = function(sourceVdbNames, onSuccessCallback, onFailureCallback) {
            if(sourceVdbNames.length !== 2) {
                onFailureCallback("Failed getting VDB Models - array of size 2 is expected.");
            }
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
                
                service.getModelForSourceVdb(sourceVdbNames[1], innerSuccessCallback, innerFailureCallback);
            };

            // Failure callback
            var failureCallback = function(errorMsg) {
                onFailureCallback("An exception occurred: \n" + errorMsg.message);
            };

            service.getModelForSourceVdb(sourceVdbNames[0], successCallback, failureCallback);
        };

        return service;
    }

})();
