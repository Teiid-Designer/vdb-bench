/**
 * DataService Edit Wizard business object
 *
 */
(function () {

    'use strict';

    angular
        .module('vdb-bench.dataservice')
        .factory('EditWizardService', EditWizardService);

    EditWizardService.$inject = ['$rootScope', 'RepoRestService', 'JOIN'];

    function EditWizardService($rootScope, RepoRestService, JOIN) {

        var wiz = {};
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
        wiz.src1CriteriaColumnName = "";
        wiz.src2CriteriaColumnName = "";
        wiz.src1CriteriaColumn = null;
        wiz.src2CriteriaColumn = null;

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
            // clear temporary models
            clearTemporaryModels();

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
                initSourceAndTableSelections(dataservice.keng__id, pageId);
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
            wiz.src1CriteriaColumnName = "";
            wiz.src2CriteriaColumnName = "";
            wiz.src1CriteriaColumn = null;
            wiz.src2CriteriaColumn = null;
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
         * Reset the source tables
         */
        service.resetSourceTables = function() {
            wiz.sources = [];
            wiz.sourceTables = [];
            wiz.src1AvailableColumns = [];
            wiz.src2AvailableColumns = [];
        };

        /*
         * Add a source table
         */
        service.addSourceTable = function(source, sourceTable) {
            if( wiz.sourceTables.length===0 ) {
                wiz.sources.push(source);
                wiz.sourceTables.push(sourceTable);
            } else if ( wiz.sourceTables.length===1 && ( source !== wiz.sources[0] || sourceTable !== wiz.sourceTables[0] ) ) {
                wiz.sources.push(source);
                wiz.sourceTables.push(sourceTable);
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
        };

        /*
         * Remove source table2
         */
        service.removeSourceTable2 = function() {
            wiz.sources.splice(1,1);
            wiz.sourceTables.splice(1,1);
            // Clears source2 columns
            wiz.src2AvailableColumns = [];
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
            } else {
                for(var iCol=0; iCol<wiz.src1SelectedColumnNames.length; iCol++) {
                    // Find and set the available column selected
                    for(var j=0; j<wiz.src1AvailableColumns.length; j++) {
                        if(wiz.src1AvailableColumns[j].keng__id === wiz.src1SelectedColumnNames[iCol]) {
                            wiz.src1AvailableColumns[j].selected = true;
                        }
                    }
                } 
            }

            // refresh the source 1 criteria column
            for(var k=0; k<wiz.src1AvailableColumns.length; k++) {
                if(wiz.src1AvailableColumns[k].keng__id === wiz.src1CriteriaColumnName) {
                    wiz.src1CriteriaColumn = wiz.src1AvailableColumns[k];
                    break;
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

            // refresh the source 2 criteria column
            for(var k=0; k<wiz.src2AvailableColumns.length; k++) {
                if(wiz.src2AvailableColumns[k].keng__id === wiz.src2CriteriaColumnName) {
                    wiz.src2CriteriaColumn = wiz.src2AvailableColumns[k];
                    break;
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
         * Get the source1 criteria column
         */
        service.source1CriteriaColumn = function() {
            return wiz.src1CriteriaColumn;
        };

        /*
         * Get the source2 criteria column
         */
        service.source2CriteriaColumn = function() {
            return wiz.src2CriteriaColumn;
        };

        /*
         * Set the source1 criteria column
         */
        service.setSource1CriteriaColumn = function(column) {
            wiz.src1CriteriaColumn = column;
        };

        /*
         * Set the source2 criteria column
         */
        service.setSource2CriteriaColumn = function(column) {
            wiz.src2CriteriaColumn = column;
        };

        /**
         * Clears any temp models that may exist in the workspace
         */
        function clearTemporaryModels() {
            // TODO:  clean up temp models
        }

        /**
         * Initialize the source and table selections for the dataservice
         */
        function initSourceAndTableSelections ( dataServiceName, pageId ) {
            // Reset selections
            service.resetSourceTables();

            // Gets the teiid model schema.  If successful, create a temp model using the schema
            try {
                RepoRestService.getViewInfoForDataService( dataServiceName ).then(
                    function ( result ) {
                        for( var i = 0; i < result.length; i++) {
                            // View info
                            var infoType = result[i].infoType;
                            if(infoType==="LHTABLE" || infoType==="RHTABLE") {
                                var sourceName = result[i].sourceVdbName;
                                var tableName = result[i].tableName;
                                var tableColumns = [];
                                if(angular.isDefined(result[i].columnNames)) {
                                    tableColumns = result[i].columnNames;
                                }
                                service.addSourceTable(sourceName,tableName);
                                if(i===0) {
                                    wiz.src1SelectedColumnNames = tableColumns;
                                } else if(i===1) {
                                    wiz.src2SelectedColumnNames = tableColumns;
                                }
                            } else if(infoType==="CRITERIA") {
                                wiz.src1CriteriaColumnName = result[i].lhCriteriaCol;
                                wiz.src2CriteriaColumnName = result[i].rhCriteriaCol;
                                wiz.selectedJoin = result[i].joinType;
                            }
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
            // Update the items using the Repo scratch object
            try {
                RepoRestService.getVdbModelTableColumns( SYNTAX.TEMP+vdbName, modelName, tableName ).then(
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
                var removeSourceFailedMsg = $translate.instant('dataserviceEditWizard.getColumnsFailedMsg');
                throw RepoRestService.newRestException(errorMsg + "\n" + error);
            }
        }


        return service;
    }

})();
