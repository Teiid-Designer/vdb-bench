(function () {
    'use strict';

    var pluginName = 'vdb-bench.widgets';
    var pluginDirName = 'vdb-bench-widgets';

    angular
        .module(pluginName)
        .directive('jdbcFilterOptions', JdbcFilterOptions);

    JdbcFilterOptions.$inject = ['CONFIG', 'SYNTAX'];
    JdbcFilterOptionsController.$inject = ['$scope', '$rootScope', '$document', '$translate', 'RepoRestService', 
                                           'REST_URI', 'SYNTAX', 'JDBC_FILTER', 'ConnectionSelectionService'];

    function JdbcFilterOptions(config, syntax) {
        var directive = {
            restrict: 'E',
            scope: {},
            controller: JdbcFilterOptionsController,
            controllerAs: 'vm',
            templateUrl: config.pluginDir + syntax.FORWARD_SLASH +
                pluginDirName + syntax.FORWARD_SLASH +
                'jdbcFilterOptions.html'
        };

        return directive;
    }

    function JdbcFilterOptionsController($scope, $rootScope, $document, $translate, RepoRestService, 
                                         REST_URI, SYNTAX, JDBC_FILTER, ConnectionSelectionService) {
        var vm = this;

        vm.selectedConn = null;
        vm.optionsResetting = false;
        vm.jdbcConnectionSelected = false;
        vm.initialNodeSelection = null;
        vm.initialExpandedNodes = null;
        vm.supportsCatalogOrSchema = true;
        vm.tablesLoading = false;
        vm.tables = [];
        vm.allTables = [];
        vm.hasTableFetchError = false;
        vm.tableFetchErrorMsg = "";
        vm.treedata = [];
        vm.treeLoading = false;
        vm.hasTreeFetchError = false;
        vm.treeFetchErrorMsg = "";
        vm.selectedTreeNode = null;
        vm.catalogFilter = JDBC_FILTER.BLANK;
        vm.schemaFilter = JDBC_FILTER.BLANK;
        vm.tableFilter = JDBC_FILTER.WILD_CARD;

        /*
         * Set initial source selection
         */
        $document.ready(function () {
            resetFilterOptions();
        });

        /*
         * Request to reset the filters
         */
        $scope.$on('resetJdbcFilters', function (event) {
            resetFilterOptions();
        });

        function resetFilterOptions() {
            vm.optionsResetting = true;
            vm.selectedConn = ConnectionSelectionService.selectedConnection();

            // Initialize filters if available
            var filterProperties = ConnectionSelectionService.selectedConnectionFilterProperties();
            vm.catalogFilter = JDBC_FILTER.BLANK;
            vm.schemaFilter = JDBC_FILTER.BLANK;
            vm.tableFilter = JDBC_FILTER.WILD_CARD;
            if(angular.isDefined(filterProperties) && filterProperties.length > 0) {
                for(var key in filterProperties) {
                    var propName = filterProperties[key].name;
                    var propValue = filterProperties[key].value;
                    if(propName==JDBC_FILTER.KEY_CATALOG) {
                        vm.catalogFilter = propValue;
                    } else if(propName==JDBC_FILTER.KEY_SCHEMA_PATTERN) {
                        vm.schemaFilter = propValue;
                    } else if(propName==JDBC_FILTER.KEY_TABLE_NAME_PATTERN) {
                        vm.tableFilter = propValue;
                    }
                }
            }
            // Reset the filter patterns
            updateFilterProperties(vm.catalogFilter,vm.schemaFilter,vm.tableFilter);

            // Determine if the selected connection is jdbc
            if(vm.selectedConn !== null && vm.selectedConn.dv__type === true) {
                vm.jdbcConnectionSelected = true;
                updateCatalogSchemaTree(vm.selectedConn);
            } else {
                vm.tables = [];
                vm.allTables = [];
                vm.treedata = [];
                vm.jdbcConnectionSelected = false;
                vm.optionsResetting = false;
            }
        }

        // Builds the tree control data.  The tree control is expecting data in this form
        //    	vm.treedata =
        //    	[
        //    	    { "name" : "Catalog1", "type" : "Catalog", "children" : [
        //    	        { "name" : "Cat1Schema1", "type" : "Schema", "children" : [] },
        //    	        { "name" : "Cat1Schema2", "type" : "Schema", "children" : [] }
        //    	    ]},
        //    	    { "name" : "Catalog2", "type" : "Catalog", "children" : [
        //    	        { "name" : "Cat2Schema1", "type" : "Schema", "children" : [] },
        //    	        { "name" : "Cat2Schema2", "type" : "Schema", "children" : [] }
        //    	    ]},
        //    	    { "name" : "Catalog3", "type" : "Catalog", "children" : [] }
        //    	];
        function updateCatalogSchemaTree(connection) {
            vm.supportsCatalogOrSchema = true; // shows empty tree container while loading

            // Update the catalog - schema tree
            vm.tables = [];
            vm.allTables = [];
            vm.treeLoading = true;
            vm.hasTreeFetchError = false;
            try {
                RepoRestService.getJdbcConnectionCatalogSchemaInfo( connection.keng__id ).then(
                    function ( result ) {
                        var hasCatalogs = false;
                        if(result.length === 0) {
                            vm.treedata = [];
                            vm.supportsCatalogOrSchema = false;
                        } else {
                            var treeInfo = [];
                            vm.supportsCatalogOrSchema = true;
                            for (var r = 0; r < result.length; ++r) {
                                var schemaKids = result[r].schemaNames;
                                var kids = [];
                                if(!angular.isUndefined(schemaKids) && result[r].schemaKids !== null) {
                                    for(var i = 0; i < schemaKids.length; ++i) {
                                        var kid = {
                                            name : schemaKids[i],
                                            type : JDBC_FILTER.SCHEMA,
                                            parent : result[r].name,
                                            children : []
                                        };
                                        kids.push(kid);
                                    }
                                }
                                var resultItem = {
                                    name : result[r].name,
                                    type : result[r].type,
                                    parent : null,
                                    children : kids
                                };
                                if(result[r].type === JDBC_FILTER.CATALOG) {
                                    hasCatalogs = true;
                                }
                                // teiid handling - dont show SYS, SYSADMIN, pg_catalog schemas
                                if(connection.dv__driverName === "teiid") {
                                    if(resultItem.type==="Schema" && 
                                        (resultItem.name!=="SYS" && resultItem.name!=="SYSADMIN" && resultItem.name!=="pg_catalog")) {
                                        treeInfo.push(resultItem);
                                    }
                                } else {
                                    treeInfo.push(resultItem);
                                }
                            }
                            // filters available - use to set initial selections
                            if(vm.catalogFilter!==JDBC_FILTER.BLANK || vm.schemaFilter!==JDBC_FILTER.BLANK) {
                                determineExpandedAndSelectedNodesUsingFilters(treeInfo,vm.catalogFilter,vm.schemaFilter);
                                updateTableListUsingSelections();
                            } else {
                                var userName = null;
                                if(angular.isDefined(connection.keng__properties)) {
                                    for(var key in connection.keng__properties) {
                                        var propName = connection.keng__properties[key].name;
                                        var propValue = connection.keng__properties[key].value;
                                        if(propName==JDBC_FILTER.USER_NAME) {
                                            userName = propValue;
                                            break;
                                        }
                                    }
                                }
                                determineExpandedAndSelectedNodesUsingUsername(treeInfo, userName);
                            }
                            vm.treedata = treeInfo;
                        }
                        vm.optionsResetting = false;
                        vm.treeLoading = false;

                        if(vm.initialNodeSelection !== null && hasCatalogs === false) {
                            vm.setTreeSelection(vm.initialNodeSelection, true);
                        }
                    },
                    function (response) {
                        vm.optionsResetting = false;
                        vm.treeLoading = false;
                        vm.treedata = [];
                        vm.hasTreeFetchError = true;
                        vm.treeFetchErrorMsg = RepoRestService.responseMessage(response);
                    });
            } catch (error) {
                vm.optionsResetting = false;
                vm.treeLoading = false;
                vm.treedata = [];
                vm.hasTreeFetchError = true;
                vm.treeFetchErrorMsg = error.message;
            } finally {
            }
        }

        /**
         * Determines the nodes to expand and the node selections in the tree
         */
        function determineExpandedAndSelectedNodesUsingFilters(treeInfo, catalogFilter, schemaFilter) {
            vm.initialExpandedNodes = [];
            vm.initialNodeSelection = null;
            for (var r = 0; r < treeInfo.length; ++r) {
                // Expand the catalogs
                if(treeInfo[r].type === JDBC_FILTER.CATALOG) {
                    if(angular.isDefined(catalogFilter) && catalogFilter !== null) {
                        if(treeInfo[r].name.toUpperCase() === catalogFilter.toUpperCase()) {
                            vm.initialExpandedNodes.push(treeInfo[r]);
                            if(angular.isDefined(treeInfo[r].children) && treeInfo[r].children.length>0) {
                                for(var c = 0; c <treeInfo[r].children.length; ++c) {
                                    if(treeInfo[r].children[c].name.toUpperCase() === schemaFilter.toUpperCase()) {
                                        vm.initialNodeSelection = treeInfo[r].children[c];
                                        break;
                                    }
                                }
                            } else if(treeInfo[r].name.toUpperCase() === catalogFilter.toUpperCase()){
                                vm.initialNodeSelection = treeInfo[r];
                            }
                        }
                    }
                } else if(treeInfo[r].type === JDBC_FILTER.SCHEMA) {
                    if(angular.isDefined(schemaFilter) && schemaFilter !== null) {
                        if(treeInfo[r].name.toUpperCase() === schemaFilter.toUpperCase()) {
                            vm.initialNodeSelection = treeInfo[r];
                        }
                    }
                }
            }
        }

        /**
         * Determines the nodes to expand and the node selections in the tree
         */
        function determineExpandedAndSelectedNodesUsingUsername(treeInfo, userName) {
            vm.initialExpandedNodes = [];
            vm.initialNodeSelection = null;
            for (var r = 0; r < treeInfo.length; ++r) {
                // Expand the catalogs
                if(treeInfo[r].type === JDBC_FILTER.CATALOG) {
                    if(angular.isDefined(userName) && userName !== null) {
                        if(treeInfo[r].name.toUpperCase() === userName.toUpperCase()) {
                            vm.initialExpandedNodes.push(treeInfo[r]);
                        }
                    }
                } else if(treeInfo[r].type === JDBC_FILTER.SCHEMA) {
                    if(angular.isDefined(userName) && userName !== null) {
                        if(treeInfo[r].name.toUpperCase() === userName.toUpperCase()) {
                            vm.initialNodeSelection = treeInfo[r];
                        }
                    }
                }
            }
        }
        
        /**
         * Set the tree selection when node is selected
         */
        vm.setTreeSelection = function(theNode, isSelected) {
            vm.selectedTreeNode = theNode;
            vm.catalogFilter = JDBC_FILTER.BLANK;
            vm.schemaFilter = JDBC_FILTER.BLANK;

            // If this is a leaf node, update the tables list
            if( angular.isDefined(vm.selectedTreeNode) && vm.selectedTreeNode!==null && vm.selectedTreeNode.children.length===0 && isSelected) {
                // Catalog and Schema Filter based on node selection
                if(vm.selectedTreeNode.type === JDBC_FILTER.SCHEMA) {
                    vm.schemaFilter = vm.selectedTreeNode.name;
                    if(vm.selectedTreeNode.parent !== null) {
                        vm.catalogFilter = vm.selectedTreeNode.parent;
                    }
                } else if(vm.selectedTreeNode.type === JDBC_FILTER.CATALOG) {
                    vm.catalogFilter = vm.selectedTreeNode.name;
                }
                updateFilterProperties(vm.catalogFilter, vm.schemaFilter, vm.tableFilter);
                // Update the table list
                updateTableListUsingSelections();
            } else {
                updateFilterProperties(vm.catalogFilter, vm.schemaFilter, vm.tableFilter);
                vm.allTables = [];
                vm.tables = [];
            }
        };

        function updateTableListUsingSelections() {
            // Update the table list
            var tblFilter = JDBC_FILTER.BLANK;
            if(vm.tableFilter === null || vm.tableFilter === JDBC_FILTER.BLANK) {
                tblFilter = JDBC_FILTER.WILD_CARD;
            } else {
                tblFilter = vm.tableFilter;
            }
            updateTableNames(vm.catalogFilter, vm.schemaFilter, tblFilter, vm.selectedConn);
        }

        function updateTableNames(catFilter, schFilter, tblFilter, connection) {
            vm.hasTableFetchError = false;
            vm.tableFetchErrorMsg = "";
            vm.tablesLoading = true;
            if(connection === null) {
                vm.allTables = [];
                vm.tables = [];
                vm.tablesLoading = false;
                vm.hasTableFetchError = true;
                vm.tableFetchErrorMsg = $translate.instant('jdbcFilterOptions.tableFetchNoConnectionErrorMsg');
                return;
            }

            // Update the tables using the Repo scratch object
            try {
                RepoRestService.getJdbcConnectionTables( catFilter, schFilter, tblFilter, connection.keng__id ).then(
                    function ( result ) {
                        var tableNames = [];
                        var i = 1;
                        var tableKey = 'Table'+i;
                        var tableName = result.Information[tableKey];
                        while ( !angular.isUndefined(tableName) && tableName !== null) {
                            tableNames.push(tableName);
                            i++;
                            tableKey = 'Table'+i;
                            tableName = result.Information[tableKey];
                        }                        
                        vm.allTables = tableNames;
                        vm.tables = vm.allTables;
                        vm.tablesLoading = false;
                    },
                    function (response) {
                        vm.hasTableFetchError = true;
                        vm.tableFetchErrorMsg = RepoRestService.responseMessage(response);
                        vm.tablesLoading = false;
                    });
            } catch (error) {
                vm.tablesLoading = false;
                vm.hasTableFetchError = true;
                vm.tableFetchErrorMsg = error.message;
            } finally {
            }
        }

        function updateFilterProperties(catalog, schemaPattern, tablePattern) {
            // Basic properties
            ConnectionSelectionService.resetFilterProperties();

            // Add catalog pattern
            if(catalog!==null) {
                ConnectionSelectionService.setFilterProperty(JDBC_FILTER.KEY_CATALOG, catalog);
            }

            // Add schema Pattern
            if(schemaPattern!==null) {
                ConnectionSelectionService.setFilterProperty(JDBC_FILTER.KEY_SCHEMA_PATTERN, schemaPattern);
            }

            // Add table Pattern
            var tblPattern = JDBC_FILTER.BLANK;
            if(tablePattern===null || tablePattern.length===0) {
                tblPattern = JDBC_FILTER.WILD_CARD;
            } else {
                tblPattern = tablePattern;
            }
            ConnectionSelectionService.setFilterProperty(JDBC_FILTER.KEY_TABLE_NAME_PATTERN, tablePattern);
        }

        /**
         * handler for refresh of filter text
         */
        vm.tableFilterRefresh = function() {
            updateFilterProperties(vm.catalogFilter, vm.schemaFilter, vm.tableFilter);
            updateTableListUsingSelections();
        };

        /**
         * Filter checkbox selection changed.
         */
        vm.filterCheckboxChanged = function( ) {
            updateCatalogSchemaTree(vm.selectedConn);
        };

        /**
         * Access to the collection of filtered data services
         */
        vm.getTables = function() {
            return vm.tables;
        };

        /**
         * Access to the collection of filtered data services
         */
        vm.getAllTables = function() {
            return vm.allTables;
        };

        /**
         * List Configuration
         */
        vm.listConfig = {
          showSelectBox: false,
          multiSelect: true,
          checkDisabled: false
        };

    }

})();
