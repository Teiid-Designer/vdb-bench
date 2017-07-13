/**
 * Connection Wizard Service
 * - Initialize and maintain state for the connection wizard
 *
 */
(function () {

    'use strict';

    angular
        .module('vdb-bench.dataservice')
        .factory('ConnectionWizardService', ConnectionWizardService);

    ConnectionWizardService.$inject = ['$rootScope', '$translate', 'RepoRestService', 'ConnectionSelectionService',
                                       'DriverSelectionService', 'SYNTAX', 'CONNECTION_KEYS'];

    function ConnectionWizardService($rootScope, $translate, RepoRestService, ConnectionSelectionService,
                                     DriverSelectionService, SYNTAX, CONNECTION_KEYS) {

        /**
         * Service instance to be returned
         */
        var service = {};

        var wiz = {};

        function initSettings() {
            wiz = {
                connection: {},
                template: '',
                templates: [],
                isEdit: false,
                errors: {
                    name: '',
                    jndi: ''
                },
                validating: {
                    name: false,
                    jndi: false
                }
            };
        }

        /*
         * Refactors the connection's properties from an
         * array into an object since the latter is required
         * for hawtio forms.
         *
         * Hyphenated keys cannot be used for hawtio form
         * properties hence the connection properties must
         * be converted to camel case
         */
        function refactorProperties() {
            if (_.isEmpty(wiz.connection))
                return;

            if (_.isEmpty(wiz.connection[CONNECTION_KEYS.PROPERTIES]))
                return;

            if (! _.isArray(wiz.connection[CONNECTION_KEYS.PROPERTIES]))
                return; // Already refactored nothing to do

            var refactoredProps = {};
            for (var i = 0; i < wiz.connection[CONNECTION_KEYS.PROPERTIES].length; ++i) {
                var propObj = wiz.connection[CONNECTION_KEYS.PROPERTIES][i];
                var camelKey = _.camelCase(propObj.name);
                refactoredProps[camelKey] = propObj.value;
            }

            wiz.connection[CONNECTION_KEYS.PROPERTIES] = refactoredProps;
        }

        /**
         * Initialize the ConnectionWizardService.
         *   If connection is null, reset selections.
         *   If connection is supplied, set the initial values for the connection.
         *   If driverName is supplied then attempt to set template appropriately
         *
         * 'ConnectionWizardServiceReady' is then broadcast.
         *
         */
        service.init = function (connection, pageId) {
            //
            // Ensure all of wiz has been recreated
            //
            initSettings();

            //
            // Assigns connection but could be null
            //
            wiz.connection = _.extend(connection);
            refactorProperties();
            wiz.pageId = pageId;

            // null connection, reset values
            if(_.isEmpty(connection)) {
                initSettings();

            //
            // TODO
            //
            // Cannot edit a connection since it cannot currently
            // be redeployed (deleted then recreated) without
            // refreshing teiid or restarting the JB instance
            //
            // See https://issues.jboss.org/browse/TEIID-4592
            //
            // } else {
            //     // connection supplied - set values accordingly
            //     wiz.isEdit = true;
            }

            try {
                RepoRestService.getConnectionTemplates().then(
                    function (result) {
                        wiz.templates = result;

                        //
                        // If we have a driverName then attempt to find the
                        // associated template and set it accordingly
                        //
                        var driverName = wiz.connection[CONNECTION_KEYS.DRIVER];
                        if (! _.isEmpty(driverName)) {
                            for (var i = 0; i < wiz.templates.length; ++i) {
                                var template = wiz.templates[i];
                                if (template[CONNECTION_KEYS.ID] === driverName) {
                                    service.setTemplate(template);
                                    break;
                                }
                            }
                        }

                        $rootScope.$broadcast("ConnectionWizardServiceReady");
                   },
                    function (response) {
                        throw RepoRestService.newRestException($translate.instant('connectionWizardService.templateGetFailedMsg',
                                                                                {error: RepoRestService.responseMessage(response)}));
                    });
            } catch (error) {
                throw RepoRestService.newRestException($translate.instant('connectionWizardService.templateGetFailedMsg',
                                                                        {error: error}));
            }
        };

        /**
         * Determines if connection is being edited, or new connection created.
         */
        service.isEditing = function() {
            // return wiz.isEdit;
            //
            // TODO
            //
            // Cannot edit a connection since it cannot currently
            // be redeployed (deleted then recreated) without
            // refreshing teiid or restarting the JB instance
            //
            // See https://issues.jboss.org/browse/TEIID-4592
            //
            return false;
        };

        /**
         * Determine if Connection has valid name.
         */
        function validateConnectionName() {
            wiz.errors.name = '';

            // do not validate name if editing an existing data connection since
            // changing the name is not allowed
            if (wiz.isEdit) {
                return;
            }

            wiz.validating.name = true;
            if ( _.isEmpty(service.connectionName()) ) {
                wiz.errors.name = $translate.instant('connectionWizardService.nameRequired');
                wiz.validating.name = false;
                $rootScope.$broadcast("connectionWizardConnectionNameChanged");
            } else {
                wiz.errors.name = $translate.instant('connectionWizardService.nameValidating');
                try {
                    var uri = encodeURIComponent(service.connectionName());

                    RepoRestService.validateConnectionName(uri).then(
                        function (result) {
                            wiz.errors.name = result;
                            wiz.validating.name = false;
                            $rootScope.$broadcast("connectionWizardConnectionNameChanged");
                        },
                        function (response) {
                            var errorMsg = $translate.instant('connectionWizardService.validateConnectionNameError');
                            wiz.validating.name = false;
                            throw RepoRestService.newRestException(errorMsg + "\n" + RepoRestService.responseMessage(response) );
                        }
                    );
                } catch (error) {
                    var errorMsg = $translate.instant('connectionWizardService.validateConnectionNameError');
                    wiz.validating.name = false;
                    throw RepoRestService.newRestException(errorMsg + "\n" + error);
                }
            }
        }

        /**
         * Determine if Connection has valid name
         */
        service.validName = function() {
            return !wiz.validating.name && _.isEmpty(wiz.errors.name);
        };

        /**
         * Obtains the current name validation error message (can be empty if name is valid).
         */
         service.nameErrorMessage = function() {
             return wiz.errors.name;
         };

         /**
          * Get the connection name
          */
         service.connectionName = function() {
             return wiz.connection[CONNECTION_KEYS.ID];
         };

        /**
         * Set the connection name
         */
        service.setConnectionName = function(name) {
            if (name) {
                wiz.connection[CONNECTION_KEYS.ID] = name;
            } else {
                wiz.connection[CONNECTION_KEYS.ID] = "";
            }

            validateConnectionName();
        };

        /**
         * Determine if Jndi has valid name.
         */
        function validateJndi() {
            wiz.validating.jndi = true;
            wiz.errors.jndi = "";

            if ( _.isEmpty(service.jndi()) ) {
                wiz.validating.jndi = false;
                wiz.errors.jndi = $translate.instant('connectionWizardService.jndiRequired');
                $rootScope.$broadcast("connectionWizardJndiChanged");
                return;
            }

            if (! service.jndi().startsWith(CONNECTION_KEYS.JNDI_PREFIX)) {
                wiz.validating.jndi = false;
                wiz.errors.jndi = $translate.instant('connectionWizardService.jndiPrefixRequired');
                $rootScope.$broadcast("connectionWizardJndiChanged");
                return;
            }

            var jndiComponent = service.jndi().replace(CONNECTION_KEYS.JNDI_PREFIX, '');
            if ( _.isEmpty(jndiComponent) ) {
                wiz.validating.jndi = false;
                wiz.errors.jndi = $translate.instant('connectionWizardService.jndiComponentRequired');
                $rootScope.$broadcast("connectionWizardJndiChanged");
                return;
            }

            wiz.errors.jndi = $translate.instant('connectionWizardService.jndiValidating');
            try {

                var uri = encodeURIComponent(jndiComponent);

                RepoRestService.validateValue(uri).then(
                    function (result) {
                        wiz.errors.jndi = result;
                        wiz.validating.jndi = false;
                        $rootScope.$broadcast("connectionWizardJndiChanged");
                    },
                    function (response) {
                        var errorMsg = $translate.instant('connectionWizardService.validateJndiError');
                        wiz.validating.jndi = false;
                        throw RepoRestService.newRestException(errorMsg + "\n" + RepoRestService.responseMessage(response));
                    }
                );
            } catch (error) {
                var errorMsg = $translate.instant('connectionWizardService.validateJndiError');
                wiz.validating.jndi = false;
                throw RepoRestService.newRestException(errorMsg + "\n" + error);
            }
        }

        /**
         * Determine if Connection has valid jndi id
         */
        service.validJndi = function() {
            return ! wiz.validating.jndi && _.isEmpty(wiz.errors.jndi);
        };

        /**
         * Get the jndi name
         */
        service.jndi = function() {
            if (_.isEmpty(wiz.connection[CONNECTION_KEYS.JNDI]))
                wiz.connection[CONNECTION_KEYS.JNDI] = CONNECTION_KEYS.JNDI_PREFIX;

            return wiz.connection[CONNECTION_KEYS.JNDI];
        };

        /**
         * Set the jndi name
         */
        service.setJndi = function(name) {
            if (name) {
                wiz.connection[CONNECTION_KEYS.JNDI] = name;
            } else {
                wiz.connection[CONNECTION_KEYS.JNDI] = "";
            }

            validateJndi();
        };

        /**
         * Obtains the current jndi validation error message (can be empty if jndi identifier is valid).
         */
         service.jndiErrorMessage = function() {
             return wiz.errors.jndi;
         };

        /**
         * Determine if Connection has valid jndi id
         */
        service.validTemplate = function() {
            return ! _.isEmpty(wiz.template);
        };

        /**
         * get the selected template
         */
        service.template = function() {
            return wiz.template;
        };

        /**
         * Set the template
         */
        service.setTemplate = function(template) {
            wiz.template = template;
            try {

                RepoRestService.getTemplateEntries(template[CONNECTION_KEYS.ID]).then(
                    function (result) {
                        wiz.templateEntries = result;
                        $rootScope.$broadcast("connectionWizardTemplateEntriesChanged");
                    },
                    function (response) {
                        var errorMsg = $translate.instant('connectionWizardService.cannotRetrieveTemplateEntries');
                        throw RepoRestService.newRestException(errorMsg + "\n" + RepoRestService.responseMessage(response));
                    }
                );
            } catch (error) {
                var errorMsg = $translate.instant('connectionWizardService.cannotRetrieveTemplateEntries');
                throw RepoRestService.newRestException(errorMsg + "\n" + error);
            }
        };

        /**
         * Connection templates
         */
        service.templates = function(includeNonJdbc) {
            if (includeNonJdbc)
                return wiz.templates;

            // JDBC only
            var jdbcOnly = [];
            for( var i = 0; i < wiz.templates.length; i++) {
                var template = wiz.templates[i];
                var jdbc = template[CONNECTION_KEYS.TEMPLATE_JDBC];
                if (jdbc)
                    jdbcOnly.push(template);
            }
            return jdbcOnly;
        };

        /**
         * Connection template entries
         */
        service.templateEntries = function() {
            return wiz.templateEntries;
        };

        /**
         * Connection properties created from the template entries
         */
        service.connectionProperties = function() {
            return wiz.connection[CONNECTION_KEYS.PROPERTIES];
        };

        /**
         * Set the connection properties
         */
        service.setConnectionProperties = function(connectionProperties) {
            wiz.connection[CONNECTION_KEYS.PROPERTIES] = connectionProperties;
        };

        /**
         * Creat the new connection in the workspace
         */
        service.uploadConnection = function() {
            try {

                RepoRestService.createConnection(service.connectionName(),
                                                 service.jndi(),
                                                 wiz.template[CONNECTION_KEYS.ID],
                                                 wiz.template[CONNECTION_KEYS.TEMPLATE_JDBC],
                                                 service.connectionProperties()).then(
                    function (result) {
                        var msg = $translate.instant('connectionWizardService.createConnectionSuccess');
                        $rootScope.$broadcast("connectionWorkFinished", true, msg);
                    },
                    function (response) {
                        var errorMsg = $translate.instant('connectionWizardService.createConnectionFailure');
                        errorMsg = '<p>' + errorMsg + '</p><p>' + RepoRestService.responseMessage(response)  + '</p>';
                        $rootScope.$broadcast("connectionWorkFinished", false, errorMsg);
                    }
                );
            } catch (error) {
                var errorMsg = $translate.instant('connectionWizardService.createConnectionFailure');
                errorMsg = '<p>' + errorMsg + '</p><p>' + RepoRestService.responseMessage(error)  + '</p>';
                $rootScope.$broadcast("connectionWorkFinished", false, errorMsg);
            }
        };

        /**
         * Deploy the connection to teiid
         */
        service.deployConnection = function() {
            ConnectionSelectionService.setDeploying(true, service.connectionName(), false, null);
            try {
                RepoRestService.deployConnection(service.connectionName()).then(
                    function (result) {
                        service.deploymentSuccess = result.Information.deploymentSuccess == "true";
                        if(service.deploymentSuccess === true) {
                            ConnectionSelectionService.setDeploying(false, service.connectionName(), true, null);
                            var msg = $translate.instant('connectionWizardService.deployConnectionSuccess');
                            $rootScope.$broadcast("connectionDeploymentFinished", true, msg);
                        } else {
                            ConnectionSelectionService.setDeploying(false, service.connectionName(), false, result.Information.ErrorMessage1);
                            errorMsg = '<p>' + errorMsg + '</p><p>' + result.Information.ErrorMessage1  + '</p>';
                            $rootScope.$broadcast("connectionDeploymentFinished", false, errorMsg);
                        }
                   },
                    function (response) {
                        ConnectionSelectionService.setDeploying(false, service.connectionName(), false, RepoRestService.responseMessage(response));

                        var errorMsg = $translate.instant('connectionWizardService.deployConnectionFailure');
                        errorMsg = '<p>' + errorMsg + '</p><p>' + RepoRestService.responseMessage(response)  + '</p>';
                        $rootScope.$broadcast("connectionDeploymentFinished", false, errorMsg);
                    });
            } catch (error) {
                ConnectionSelectionService.setDeploying(false, service.connectionName(), false, RepoRestService.responseMessage(error));

                var errorMsg = $translate.instant('connectionWizardService.deployConnectionFailure');
                errorMsg = '<p>' + errorMsg + '</p><p>' + RepoRestService.responseMessage(error)  + '</p>';
                $rootScope.$broadcast("connectionDeploymentFinished", false, errorMsg);
            }
        };

        //
        // Ensure wiz is fully initialised
        //
        initSettings();

        return service;
    }

})();
