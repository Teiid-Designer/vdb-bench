/*jshint loopfunc: true */

(function () {
    'use strict';

    var pluginName = 'vdb-bench.dataservice';
    var pluginDirName = 'vdb-bench-dataservice';

    angular
        .module(pluginName)
        .controller('DSTestController', DSTestController);

    DSTestController.$inject = ['$scope', '$translate', 'CONFIG', 'SYNTAX', 'RepoSelectionService', 'DSSelectionService',
                                                'RepoRestService', 'DSPageService', '$interval', '$filter', '$timeout'];

    function DSTestController($scope, $translate, CONFIG, SYNTAX, RepoSelectionService, DSSelectionService,
                                                RepoRestService, DSPageService, $interval, $filter, $timeout) {
        var vm = this;

        /*
         * Set a custom title to the page including the data service's id
         */
        var page = DSPageService.page(DSPageService.TEST_DATASERVICE_PAGE);
        DSPageService.setCustomTitle(page.id, page.title + " '" + DSSelectionService.selectedDataService().keng__id + "'");

        var EQUALS = $translate.instant('dsTestController.condition.equals');
        var NOT_EQUALS = $translate.instant('dsTestController.condition.notEquals');
        var GREATER_THAN = $translate.instant('dsTestController.condition.greaterThan');
        var GREATER_THAN_EQ_TO = $translate.instant('dsTestController.condition.greaterThanEqTo');
        var LESS_THAN = $translate.instant('dsTestController.condition.lessThan');
        var LESS_THAN_EQ_TO = $translate.instant('dsTestController.condition.lessThanEqTo');
        var IN = $translate.instant('dsTestController.condition.in');
        var EQUALS_CINS = $translate.instant('dsTestController.condition.equalsCaseInsensitive');
        var NOT_EQUALS_CINS = $translate.instant('dsTestController.condition.notEqualsCaseInsensitive');
        var STARTS_WITH = $translate.instant('dsTestController.condition.startsWith');
        var NO_STARTS_WITH = $translate.instant('dsTestController.condition.notStartsWith');
        var ENDS_WITH = $translate.instant('dsTestController.condition.endsWith');
        var NO_ENDS_WITH = $translate.instant('dsTestController.condition.notEndsWith');
        var CONTAINS = $translate.instant('dsTestController.condition.contains');
        var LENGTH_EQ = $translate.instant('dsTestController.condition.lengthEq');
        var BEFORE_DATE = $translate.instant('dsTestController.condition.beforeDate');
        var AFTER_DATE = $translate.instant('dsTestController.condition.afterDate');
        var BEFORE_EQ = $translate.instant('dsTestController.condition.beforeEq');
        var AFTER_EQ = $translate.instant('dsTestController.condition.afterEq');

        var NO_LIMIT = $translate.instant('dsTestController.rowLimit.none');
        var COUNT_ONLY = $translate.instant('dsTestController.rowLimit.countOnly');
        var TOP_1 = $translate.instant('dsTestController.rowLimit.top1');
        var TOP_10 = $translate.instant('dsTestController.rowLimit.top10');
        var TOP_50 = $translate.instant('dsTestController.rowLimit.top50');
        var TOP_100 = $translate.instant('dsTestController.rowLimit.top100');
        var TOP_1000 = $translate.instant('dsTestController.rowLimit.top1000');
        var TOP_10000 = $translate.instant('dsTestController.rowLimit.top10000');

        var STANDARD_TAB_ID = "Standard";
        var ADVANCED_TAB_ID = "Advanced";

        vm.visibleTabId = STANDARD_TAB_ID;

        vm.dsDeploymentInProgress = true;
        vm.dsDeploymentSuccess = false;
        vm.dsDeploymentMessage = null;
        vm.searchInProgress = false;
        vm.resultsType = 'Tabular';
        vm.pinging=true;
        vm.pinged=false;

        vm.sql = {
            refreshEditor : false
        };
        
        vm.pingJdbcResultStyleClass = "";

        function setJdbcResult(status) {
            if (!status) {
                vm.jdbcPingResult = null;
                return;
            }

            if (status.OK === "true") {
               vm.pinged = true;
            }
            else {
                vm.pinged = false;
            	vm.pingJdbcResultStyleClass = "pficon pficon-error-circle-o";
                vm.jdbcPingResult = status.Message + SYNTAX.NEWLINE + status.Exception;
            }
        }

        /**
         * Ping Teiid via JDBC URL/Credentials.
         * Set error message on failure.
         */
        vm.ping = function() {
            vm.pinging = true;
            vm.pinged = false;

            /*
             * To ensure the sql content is visible,
             * signal the sql control to refresh its
             * editor when finished. This is done by setting 
             * vm.sql.refreshEditor to true
             */

            try {
                RepoRestService.ping("jdbc").then(
                    function (statusObj) {
                        setJdbcResult(statusObj.Information);
                        vm.sql.refreshEditor = true;  // Refresh SQL Editor
                    },
                    function (response) {
                        // Some kind of error has occurred
                        setJdbcResult(response.message);
                        vm.sql.refreshEditor = true;  // Refresh SQL Editor
                    });
            } catch (error) {
                setJdbcResult(error.message);
                vm.sql.refreshEditor = true;  // Refresh SQL Editor
            }
            vm.pinging = false;
        };

        vm.odata = {
            metadata: '',
            conditions: {
                int: [EQUALS, NOT_EQUALS, GREATER_THAN, GREATER_THAN_EQ_TO, LESS_THAN, LESS_THAN_EQ_TO, IN],
                string: [
                    EQUALS, NOT_EQUALS, IN, EQUALS_CINS, NOT_EQUALS_CINS,
                    STARTS_WITH, NO_STARTS_WITH, ENDS_WITH, NO_ENDS_WITH, CONTAINS, LENGTH_EQ
                ],
                date: [EQUALS, BEFORE_DATE, AFTER_DATE, BEFORE_EQ, AFTER_EQ],
                boolean: [EQUALS, NOT_EQUALS]
            },
            queryableTypes: ['Boolean', 'String', 'Byte', 'Decimal', 'Double', 'Single', 'Float', 'Guid', 'Int16', 'Int32', 'Int64', 'SByte', 'DateTime', 'Time', 'DateTimeOffset'],
            limits: [NO_LIMIT, COUNT_ONLY, TOP_1, TOP_10, TOP_50, TOP_100, TOP_1000, TOP_10000],
            entities: [],

            /* The entity for the select component */
            entity: {
                /* The available columns for the entity */
                columns: []
            },
            /* Will contain the selected columns */
            column: [],
            /* Where clauses for query criteria */
            where: [
                /* Will contain:
                 * column
                 * condition ( one of vm.odata.conditions )
                 * value
                 */
                { column:'', condition: '', value: ''}
            ],
            /* The limit of the query results */
            limit: NO_LIMIT,
            /* Set to true if where there are where clauses */
            hasWhere: false
        };

        /**
         * Return the available columns for the selected entity
         */
        vm.odata.columns = function() {
            if (_.isEmpty(vm.odata.entity) || _.isEmpty(vm.odata.entity.columns))
                return [];

            return vm.odata.entity.columns;
        };

        /**
         * Options for the codemirror editor used for previewing raw results
         */
        vm.odata.rawResultsOptions = {
            lineWrapping: true,
            lineNumbers: true,
            readOnly: 'nocursor',
            autoRefresh: true,
            mode: {
                name: "javascript",
                json: true
            }
        };

        vm.odata.rawEditorLoaded = function(_editor) {
            if (! _editor)
                return;

            _editor.setSize(null, "70vh");

            vm.odata.rawEditor = _editor;

            //
            // Due to the nested nature of the codemirror
            // instance in the tabs, it doesnt refresh unless
            // a key is pressed. This forces a refresh after
            // a second.
            //
            $timeout(function () {
                _editor.refresh();
            }, 1000);
        };

        /**
         * Background function that searches the visible table
         * rows for any urls and attempts to replace them with
         * the target data
         */
        function bkgFetchLinkedData() {
            if (vm.linkGatherer)
                $interval.cancel(vm.linkGatherer);

            vm.resultIndex = 0;
            var rows = vm.resultGridApi.core.getVisibleRows();
            if (_.isEmpty(rows))
                return;

            vm.linkGatherer = $interval(function() {

                if (vm.resultIndex >= rows.length)
                    return;

                var row = rows[vm.resultIndex];
                if (_.isEmpty(row) || _.isEmpty(row.entity))
                    return;

                for (var i = 0; i < vm.resultGridOptions.columnDefs.length; ++i) {
                    var columnName = vm.resultGridOptions.columnDefs[i].name;
                    var value = row.entity[columnName];
                    if (! vm.isUrl(value))
                        continue;

                    vm.fetchLinkedData(value, row.entity, columnName);
                }

                vm.resultIndex++;
            }, 1000, rows.length);
        }

        /**
         * Options for results grid
         */
        vm.resultGridOptions = {
            paginationPageSizes: [25, 50, 75],
            paginationPageSize: 25,
            enableFiltering: true,
            columnDefs: [],
            onRegisterApi: function(gridApi) {
                vm.resultGridApi = gridApi;

                //
                // Each time the visible rows in the grid are updated
                // launch the fetch data function in the background to
                // try and fetch the target data of any links returned
                // in the results
                //
                gridApi.core.on.rowsVisibleChanged($scope, bkgFetchLinkedData);
            }
        };

        /**
         * Converts the limit value into the odata limit clause
         */
        function convertLimit() {
            if (_.isEmpty(vm.odata.limit))
                return SYNTAX.EMPTY_STRING;

            if (vm.odata.limits[0] === vm.odata.limit)
                return SYNTAX.EMPTY_STRING + SYNTAX.QMARK; // no limit

            if (vm.odata.limits[1] === vm.odata.limit)
                return SYNTAX.FORWARD_SLASH + '$count' + SYNTAX.QMARK; // count

            return vm.odata.limit.replace($translate.instant('dsTestController.rowLimit.topPrefix'), SYNTAX.QMARK + '$top=') + SYNTAX.AMPERSAND;
        }

        /**
         * Converts the where clauses into odata where clauses
         */
        function convertWhere() {
            if (_.isEmpty(vm.odata.where))
                return SYNTAX.EMPTY_STRING;

            var SPACE = SYNTAX.SPACE;
            var OBKT = SYNTAX.OPEN_BRACKET;
            var CBKT = SYNTAX.CLOSE_BRACKET;
            var QUOTE = SYNTAX.QUOTE;
            var COMMA = SYNTAX.COMMA;

            var prefix = '$filter=';
            var clauses = SYNTAX.EMPTY_STRING;

            for (var i = 0; i < vm.odata.where.length; ++i) {
                var where = vm.odata.where[i];
                var column = where.column;
                var condition = where.condition;
                var value = where.value;

                if (_.isEmpty(column) || _.isEmpty(value))
                    continue; // ignore incomplete where clauses

                if (clauses.length > 0 && i > 0)
                    clauses = clauses + SPACE + 'and' + SPACE;

                var clause = SYNTAX.EMPTY_STRING;
                if (condition === EQUALS)
                    clause = column.name + SPACE + 'eq' + SPACE + value;
                else if (condition === NOT_EQUALS)
                    clause = column.name + SPACE + 'ne' + SPACE + value;
                else if (condition === GREATER_THAN || condition === AFTER_DATE)
                    clause = column.name + SPACE + 'gt' + SPACE + value;
                else if (condition === GREATER_THAN_EQ_TO || condition === BEFORE_EQ)
                    clause = column.name + SPACE + 'ge' + SPACE + value;
                else if (condition === LESS_THAN || condition === BEFORE_DATE)
                    clause = column.name + SPACE + 'lt' + SPACE + value;
                else if (condition === LESS_THAN_EQ_TO || condition === AFTER_EQ)
                    clause = column.name + SPACE + 'le' + SPACE + value;
                else if (condition === EQUALS_CINS) {
                    //
                    // tolower(Description) eq tolower('value')
                    //
                    clause = 'tolower' + OBKT + column.name + CBKT +
                                  SPACE + 'eq' + SPACE +
                                  'tolower' + OBKT + QUOTE + value + QUOTE + CBKT;
                } else if (condition === NOT_EQUALS_CINS) {
                    //
                    // tolower(Description) ne tolower('value')
                    //
                    clause = 'tolower' + OBKT + column.name + CBKT +
                                  SPACE + 'ne' + SPACE +
                                  'tolower' + OBKT + QUOTE + value + QUOTE + CBKT;
                } else if (condition === STARTS_WITH) {
                    //
                    // startswith(Description, 'value')
                    //
                    clause = 'startswith' + OBKT + column.name + COMMA +
                                    QUOTE + value + QUOTE + CBKT;
                }
                else if (condition === NO_STARTS_WITH) {
                    //
                    // not startswith(Description, 'value')
                    //
                    clause = 'not startswith' + OBKT + column.name + COMMA +
                                    QUOTE + value + QUOTE + CBKT;
                }
                else if (condition === ENDS_WITH) {
                    //
                    // endswith(Description, 'value')
                    //
                    clause = 'endswith' + OBKT + column.name + COMMA +
                                    QUOTE + value + QUOTE + CBKT;
                }
                else if (condition === NO_ENDS_WITH) {
                    //
                    // not endswith(Description, 'value')
                    //
                    clause = 'not endswith' + OBKT + column.name + COMMA +
                                    QUOTE + value + QUOTE + CBKT;
                }
                else if (condition === CONTAINS) {
                    //
                    // contains(Description, 'value')
                    //
                    clause = 'contains' + OBKT + column.name + COMMA +
                                    QUOTE + value + QUOTE + CBKT;
                }
                else if (condition === LENGTH_EQ) {
                    //
                    // length(Description) eq 5
                    //
                    clause = 'length' + OBKT + column.name + CBKT +
                                    SPACE + 'eq' + SPACE + value;
                } else if (condition === IN) {
                    //
                    // in separated by ;, eg. 1;2
                    // becomes
                    // (ID eq 1 or ID eq 2)
                    //
                    clause = OBKT;
                    var values = value.split(SYNTAX.SEMI_COLON);
                    for (var j = 0; j < values.length; ++j) {
                        if (j > 0)
                            clause = clause + SPACE + 'or' + SPACE;

                        clause = clause + column.name + SPACE +
                                    'eq' + SPACE + values[j];
                    }
                    clause = clause + CBKT;
                }

                clauses = clauses + clause;
            }

            if (clauses.length > 0)
                return prefix + clauses + SYNTAX.AMPERSAND;

            return clauses;
        }

        /**
         * Converts the column array into odata select clause
         */
        function convertColumns() {
            if (_.isEmpty(vm.odata.column))
                return SYNTAX.EMPTY_STRING;

            //
            // Column selection not applicable with count only
            //
            if (vm.odata.limit === COUNT_ONLY)
                return SYNTAX.EMPTY_STRING;

            var value = '$select=';
            for (var i = 0; i < vm.odata.column.length; ++i) {
                value = value + vm.odata.column[i];

                if ((i + 1) < vm.odata.column.length)
                    value = value + SYNTAX.COMMA;
            }

            return value + SYNTAX.AMPERSAND;
        }

        /**
         * Converts the order by values into odata orderby clause
         */
        function convertOrderBy() {
            if (_.isEmpty(vm.odata.entity) || _.isEmpty(vm.odata.entity.columns))
                return SYNTAX.EMPTY_STRING;

            //
            // orderby not applicable with count only
            //
            if (vm.odata.limit === COUNT_ONLY)
                return SYNTAX.EMPTY_STRING;

            var orderbyPrefix = '$orderby=';

            var value = orderbyPrefix;
            for (var i = 0; i < vm.odata.entity.columns.length; ++i) {
                var column = vm.odata.entity.columns[i];
                if (_.isEmpty(column.sort))
                    continue;

                if ('asc' === column.sort)
                    value = value + column.name;
                else if ('desc' === column.sort)
                    value = value + column.name + ' desc';

                if ((i + 1) < vm.odata.entity.columns.length)
                    value = value + SYNTAX.COMMA;
            }

            // Remove trailing comma if applicable
            if (value.endsWith(SYNTAX.COMMA))
                value = value.substring(0, value.length - 1);

            if (value === orderbyPrefix)
                return SYNTAX.EMPTY_STRING;

            return value + SYNTAX.AMPERSAND;
        }
        
        /**
         * Initialise the control panel by fetching the metadata from
         * the odata link
         */
        function init() {
            var url = vm.rootUrl() + '$metadata';
            RepoRestService.odataGet(url).then(
                function(response) {
                    if (response.status === 200) {
                        vm.odata.metadata = response.data;
                        vm.odata.metadataFailure = false;
                    } else {
                        vm.odata.metadata = '';
                        vm.odata.metadataFailure = true;
                    }
                }
            );
        }
        
        /**
         * Tidy up the interval that might have been created
         */
        $scope.$on('$destroy', function() {
            if (vm.linkGatherer)
                $interval.cancel(vm.linkGatherer);

            delete vm.linkGatherer;
        });

        /**
         * When a data service is currently being deployed
         */
        $scope.$on('deployDataServiceChanged', function (event, dsDeployInProgress) {
            vm.dsDeploymentInProgress = dsDeployInProgress;
            vm.dsDeploymentSuccess = DSSelectionService.deploymentSuccess();
            vm.dsDeploymentMessage = DSSelectionService.deploymentMessage();
        });

        /**
         * When a data service has been (un)successfully deployed
         */
        $scope.$watch('vm.dsDeploymentSuccess', function (newValue, oldValue) {
            if (newValue === oldValue)
                return;

            if (! newValue)
                return;

            init();
        });

        $scope.$watch('vm.resultsType', function(newValue, oldValue) {
            if (newValue === oldValue)
                return;

            if (newValue ==='Raw' && vm.odata.rawEditor) {
                $timeout(function () {
                        vm.odata.rawEditor.refresh();
                    }, 100);
            }
        });

        /**
         * Extract the available columns from the entity
         * located in the $metadata xml/json
         */
        function extractColumns(entity) {
            var cvColumns = [];
            if (_.isEmpty(entity.Property))
                return cvColumns;

            var columns = entity.Property;
            if (_.isArray(columns)) {
                for (var i = 0; i < columns.length; ++i) {
                    var column = {};
                    column.name = columns[i]._Name;
                    column.type = columns[i]._Type.replace('Edm.', '');
                    cvColumns.push(column);
                }
            } else if (_.isObject(columns)) {
                var singleColumn = {};
                singleColumn.name = columns._Name;
                singleColumn.type = columns._Type.replace('Edm.', '');
                cvColumns.push(singleColumn);
            }

            return cvColumns;
        }
     
        /**
         * On receipt of the metadata traverse the node tree
         * and extract the available entities.
         */
        $scope.$watch('vm.odata.metadata', function(newMetadata, oldMetadata) {
            if (oldMetadata === newMetadata)
                return;

            vm.odata.entity = {};

            if (_.isEmpty(newMetadata) || _.isEmpty(newMetadata.Edmx) ||
                _.isEmpty(newMetadata.Edmx.DataServices) || _.isEmpty(newMetadata.Edmx.DataServices.Schema) ||
                _.isEmpty(newMetadata.Edmx.DataServices.Schema.EntityType)) {
                vm.odata.entities = [];
                return;
            }

            var entities = newMetadata.Edmx.DataServices.Schema.EntityType;
            if (_.isArray(entities)) {
                for (var i = 0; i < entities.length; ++i) {
                    var entity = {};
                    entity.name = entities[i]._Name;
                    entity.columns = extractColumns(entities[i]);
                    vm.odata.entities.push(entity);
                }
            } else if (_.isObject(entities)) {
                var singleEntity = {};
                singleEntity.name = entities._Name;
                singleEntity.columns = extractColumns(entities);
                vm.odata.entities = [singleEntity];
                vm.odata.entity = vm.odata.entities[0];
            }
        });

        /**
         * Return true if the model is ready to be query
         */
        vm.canQuery = function() {
            if (vm.dsDeploymentInProgress)
                return false; // Deployment still in progress

            if (! vm.dsDeploymentSuccess)
                return false; // Deployment failure

            if (_.isEmpty(vm.odata.metadata))
                return false;

            return !_.isEmpty(vm.odata.entity);
        };

        /**
         * Search for the results given the end point
         */
        vm.onSearchEndPoint = function() {
            var url = vm.endPointUrl();

            if (vm.odata.limit !== COUNT_ONLY) {
                //
                // Json format cannot be used with $count
                //
                if (url.indexOf(SYNTAX.QMARK) > -1)
                    // Already have parameters
                    url = url + SYNTAX.AMPERSAND + "$format=json";
                else
                    url = url + SYNTAX.QMARK + "$format=json";
            }

            if (vm.linkGatherer)
                $interval.cancel(vm.linkGatherer);

            vm.rawResults = null;
            vm.searchMsg = null;
            vm.searchInProgress = true;
            vm.showResultsTable = false;

            RepoRestService.odataGet(url).then(
                function(response) {
                    vm.showResultsTable = false;
                    vm.rawResults = null;

                    vm.resultGridOptions.columnDefs = [];
                    vm.resultGridOptions.data = [];

                    // Remove the search progress spinner
                    vm.searchInProgress = false;

                    if (response.status !== 200) {
                        vm.searchMsg = $translate.instant('dsTestController.searchErrorMsg', {responseError: response.error});
                        return;
                    }

                    if (_.isEmpty(response.data)) {
                        vm.searchMsg = $translate.instant('dsTestController.noResultsMsg');
                        return;
                    }

                    if (response.data.count) {
                        //
                        // Handles the count function by returning a
                        //
                        vm.searchMsg = $translate.instant('dsTestController.resultCountMsg', {count: response.data.count});
                        return;
                    }

                    if (response.data.value) {
                        var templateUrl = CONFIG.pluginDir + SYNTAX.FORWARD_SLASH +
                                                        pluginDirName + SYNTAX.FORWARD_SLASH +
                                                        'dataservice-test-link-value.html';

                        if (vm.odata.column.length === 0) {
                            var avCols = vm.odata.columns();
                            for (var i = 0; i < avCols.length; ++i) {
                                var col = {
                                    name: avCols[i].name,
                                    cellTemplate: templateUrl
                                };
                                vm.resultGridOptions.columnDefs.push(col);

                            }
                        } else {
                            for (var j = 0; j < vm.odata.column.length; ++j) {
                                vm.resultGridOptions.columnDefs.push({
                                    name: vm.odata.column[j],
                                    cellTemplate: templateUrl
                                });
                            }
                        }

                        vm.resultGridOptions.data = response.data.value;
                        vm.rawResults = $filter('json')(response.data.value, 2);
                        vm.showResultsTable = true;
                    }
                }
            );
        };

        /**
         * Fetch data from the given link and populate the
         * {row, columnName} value
         */
        vm.fetchLinkedData = function(link, row, columnName) {
            //
            // Closure function that retains its context, ie.
            // link, row, columnName
            //
            function populate(response) {
                if (response.status !== 200) {
                    row[columnName] = $translate.instant('dsTestController.searchErrorColumnName');
                    console.warn($translate.instant('dsTestController.searchErrorConsoleMsg',
                    		                        {link: value, responseError: response.error}));
                    return;
                }

                if (_.isEmpty(response.data)) {
                    row[columnName] = $translate.instant('dsTestController.noResultsColumnName');
                    return;
                }

                if (response.data.value) {
                    row[columnName] = response.data.value;
                }
            }

            RepoRestService.odataGet(link).then(
                function(response) {
                    populate(response);
                }
            );
        };

        /**
         * Is the given value and url
         */
        vm.isUrl = function(value) {
            if (_.isEmpty(value))
                return false;

            return value.startsWith(vm.rootUrl());
        };

        /**
         * Manually fetch the data targeted by the given link
         * and populate the {row, column}
         */
        vm.displayLinkContent = function(grid, row, column, link) {
            vm.fetchLinkedData(link, row.entity, column.field);
        };
        
        /**
         * Returns true if the odata control widgets
         * should be displayed.
         */
        vm.hasOdataAttributes = function() {
            if (vm.dsDeploymentInProgress)
                return false; // Deployment still in progress

            if (! vm.dsDeploymentSuccess)
                return false; // Deployment failure

            return ! _.isEmpty(vm.odata.metadata);
        };

        /**
         * The root part of the odata endpoint
         */
        vm.rootUrl = function() {
            var hostName = RepoSelectionService.getSelected().host;
            var portValue = RepoSelectionService.getSelected().port;

            var vdbName = DSSelectionService.selectedDataServiceVdbName();
            var vdbVersion = DSSelectionService.selectedDataServiceVdbVersion();
            var modelName = DSSelectionService.selectedDataServiceViewModel();

            if (vdbName === SYNTAX.UNKNOWN || vdbVersion === SYNTAX.UNKNOWN || modelName === SYNTAX.UNKNOWN)
                return null;

            return "https://" + hostName + SYNTAX.COLON + portValue + SYNTAX.FORWARD_SLASH +
                                    "odata4" + SYNTAX.FORWARD_SLASH + vdbName + SYNTAX.DOT + vdbVersion + SYNTAX.FORWARD_SLASH +
                                    modelName + SYNTAX.FORWARD_SLASH;
        };

        /*
         * The odata endpoint url constructed from the parameters
         */
        vm.endPointUrl = function () {
            if (vm.dsDeploymentInProgress === true)
                return $translate.instant('shared.NotAvailable');

            if (vm.dsDeploymentSuccess === false)
                return $translate.instant('shared.NotAvailable');

            var baseUrl = vm.rootUrl();
            if (baseUrl === null)
                return $translate.instant('shared.NotAvailable');

            var service = vm.odata.entity;
            if (_.isEmpty(service))
                return $translate.instant('shared.NotAvailable');

            var odataUrl = baseUrl + service.name;

            var limit = convertLimit();
            if (! _.isEmpty(limit))
                odataUrl = odataUrl + limit;

            var where = convertWhere();
            if (! _.isEmpty(where))
                odataUrl = odataUrl + where;

            var columns = convertColumns();
            if (! _.isEmpty(columns))
                odataUrl = odataUrl + columns;

            var orderBy = convertOrderBy();
            if (! _.isEmpty(orderBy))
                odataUrl = odataUrl + orderBy;

            if (odataUrl.endsWith(SYNTAX.AMPERSAND) || odataUrl.endsWith(SYNTAX.QMARK))
                odataUrl = odataUrl.substring(0, odataUrl.length - 1);

            return odataUrl;
        };

        /**
         * Used by column checkboxes to determine if a checkbox
         * should be checked.
         */
        vm.isColumnSelected = function(columnName) {
            return vm.odata.column.indexOf(columnName) >= 0;
        };

        /**
         * Updates the column selection when its checkbox has been (un)checked
         */
        vm.updateColumnSelection = function($event, columnName) {
            var checkbox = $event.target;

            if (checkbox.checked && vm.odata.column.indexOf(columnName) === -1) {
                vm.odata.column.push(columnName);
            }
            else if (! checkbox.checked && vm.odata.column.indexOf(columnName) !== -1) {
                vm.odata.column.splice(vm.odata.column.indexOf(columnName), 1);
            }
        };

        /**
         * Provides the choices to select for a where clause
         * depending on the type of column already selected
         */
        vm.whereConditions = function(where) {
            if (_.isEmpty(where) || _.isEmpty(where.column))
                return [];

            var index = _.indexOf(vm.odata.queryableTypes, where.column.type);
            if (index < 0)
                return [];
            else if (index === 0) // Boolean
                return vm.odata.conditions.boolean;
            else if (index === 1) // String
                return vm.odata.conditions.string;
            else if (index <= 11) // number
                return vm.odata.conditions.int;
            else if (index > 11) // DateTime
                return vm.odata.conditions.date;
            else
                return [];
        };

        /**
         * On changing the where column selection:
         * * Remove the where condition since it may be invalid
         * * Check the column is queryable and if not display an error
         */
        vm.onWhereColumnSelected = function(column, where) {
            if (! _.isEmpty(where) && _.isEmpty(where.condition))
                delete where.condition;

            var index = _.indexOf(vm.odata.queryableTypes, column.type);
            if (index < 0)
                where.error = $translate.instant('dsTestController.whereErrorMsg', {columnType: column.type});
            else
                where.error = null;
        };

        /**
         * Event handler for adding a where condition
         */
        vm.onAddWhereClicked = function (event) {
            try {
                var newWhere = {};
                vm.odata.where.push(newWhere);
                vm.odata.hasWhere = true;
            } catch (error) {
                // nothing to do
            } finally {
                // Essential to stop the accordion closing
                event.stopPropagation();
            }
        };

        /**
         * Event handler for removing a where condition
         */
        vm.onRemoveWhereClicked = function (event, where) {
            try {
                if (_.isEmpty(where))
                    return;

                vm.odata.where = _.reject(vm.odata.where, function(element) {
                    return element === where;
                });

                if (vm.odata.where.length === 0) {
                    //
                    // Always keep 1 empty clause so preserve buttons
                    //
                    var newWhere = {};
                    vm.odata.where.push(newWhere);
                }

            } catch (error) {
                // nothing to do
            } finally {
                // Essential to stop the accordion closing
                event.stopPropagation();
            }
        };

        /*
        * the selected data service query text
        */
        vm.selectedDataserviceQueryText = function () {
            var modelName = DSSelectionService.selectedDataServiceViewModel();
            var serviceView = DSSelectionService.selectedDataServiceView();

            if( modelName === SYNTAX.UNKNOWN || serviceView === SYNTAX.UNKNOWN )
                return "SELECT * FROM ";

            return "SELECT * FROM "+ modelName + "." + serviceView + ";";
        };

        vm.onTabSelected = function (tabId) {
            if (tabId === 'Advanced') {
            	 vm.ping();
            }
        };
    }

})();
