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
            }
        };

        /*
         * Reset user selections
         */
        function resetSelections ( ) {
            wiz.serviceName = "";
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
            // Broadcast name changed
            $rootScope.$broadcast("editWizardServiceNameChanged");
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
            wiz.serviceName = name;
            // Broadcast name changed
            $rootScope.$broadcast("editWizardServiceNameChanged");
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
            if( wiz.serviceName !== null && wiz.serviceName.length > 0 ) {
                return true;
            }
            return false;
        };

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


        return service;
    }

})();
