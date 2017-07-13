(function () {
    'use strict';

    var pluginName = 'vdb-bench.dataservice';
    var pluginDirName = 'vdb-bench-dataservice/widgets/connection-wizard';

    angular
        .module(pluginName)
        .directive('connectionEditWizard', ConnectionEditWizard);

    ConnectionEditWizard.$inject = ['CONFIG', 'SYNTAX'];
    ConnectionEditWizardController.$inject = ['$scope', '$rootScope', '$translate', 'RepoRestService', 'ConnectionWizardService',
                                              'DSPageService', 'DriverSelectionService', 'ConnectionSelectionService',
                                              'CONNECTION_KEYS', 'HAWTIO_FORM', 'SYNTAX'];

    function ConnectionEditWizard(config, syntax) {
        var directive = {
            restrict: 'E',
            scope: {
                edit: '=',
                connection: '=',
                pageId: '='
            },
            controller: ConnectionEditWizardController,
            controllerAs: 'vm',
            templateUrl: config.pluginDir + syntax.FORWARD_SLASH +
                         pluginDirName + syntax.FORWARD_SLASH +
                         'connectionEditWizard.html'
        };

        return directive;
    }

    function ConnectionEditWizardController($scope, $rootScope, $translate, RepoRestService, ConnectionWizardService,
                                            DSPageService, DriverSelectionService, ConnectionSelectionService,
                                            CONNECTION_KEYS, HAWTIO_FORM, SYNTAX) {
        var widgetConfig = null;
        var vm = this;
        vm.step = [
            {
                id: 'wizard-connection-name-type',
                title: $translate.instant('connectionEditWizard.step1Title')
            },
            {
                id: "wizard-connection-metadata-properties",
                title: $translate.instant('connectionEditWizard.step2Title')
            },
            {
                id: "wizard-connection-deploy",
                title: $translate.instant('connectionEditWizard.step3Title')
            }
        ];

        vm.nextButtonTitle = $translate.instant('shared.Next');
        vm.nextEnablement = false;
        vm.currentWizardStep = "";
        vm.deployInProgress = false;
        vm.wizardServiceReady = false;
        vm.showAddNewDriver = false;
        vm.driverDeploying = false;
        vm.connectionProperties = {};
        vm.connectionCreating = false;

        /**
         * Updates the message, button enablement and button text for this page
         */
        function updateWizardStatus() {
            vm.instructionMessage = '';
            vm.nextButtonTitle = $translate.instant('shared.Next');

            if (vm.currentWizardStep === vm.step[0].id) {
                if (vm.templateConfig === null) {
                    vm.nextEnablement = false;
                    return;
                }

                vm.nextEnablement = ConnectionWizardService.validName() && ConnectionWizardService.validJndi() && ConnectionWizardService.validTemplate();
                return;
            }

            if (vm.currentWizardStep === vm.step[1].id) {
                vm.nextEnablement = true;

                if (_.isEmpty(vm.connectionProperties) && !_.isEmpty(vm.templateConfig) && !_.isEmpty(vm.templateConfig[HAWTIO_FORM.PROPERTIES])) {
                    vm.nextEnablement = false;
                    return;
                }

                if (_.isEmpty(vm.templateConfig))
                    return;


                for (var metadataName in vm.templateConfig[HAWTIO_FORM.PROPERTIES]) {

                    var propMetaData = vm.templateConfig[HAWTIO_FORM.PROPERTIES][metadataName];
                    if (_.isEmpty(propMetaData[HAWTIO_FORM.INPUT_ATTR]))
                        continue; // No input attr so not required

                    if (propMetaData[HAWTIO_FORM.INPUT_ATTR].required === true && _.isEmpty(vm.connectionProperties[metadataName])) {
                        // A required property has not been filled in
                        vm.nextEnablement = false;
                        vm.instructionMessage = $translate.instant('connectionEditWizard.requiredProperty', {property: _.startCase(metadataName)});
                        break;
                    }
                }
            }

            if (vm.currentWizardStep === vm.step[2].id) {
                vm.nextButtonTitle = $translate.instant('shared.Finish');
                vm.instructionsMsg = $translate.instant('connectionEditWizard.deploymentInProgress');

                vm.nextEnablement = !vm.connectionCreating && !vm.connectionDeploying;
            }
        }

        function resolveType(templateEntry) {
            if (angular.isDefined(templateEntry.masked) && templateEntry.masked === true)
                return HAWTIO_FORM.PASSWORD_TYPE;

            if (angular.isDefined(templateEntry.typeClassName))
                return templateEntry.typeClassName;

            return HAWTIO_FORM.TYPE.TEXT;
        }

        /**
         * Configuration for the hawtio-2 table of the template properties
         */
        function generatePropertiesConfig() {
            vm.templateConfig = {
                "id": 'templateProperties',
                "style": HawtioForms.FormStyle.HORIZONTAL,
                "mode": HawtioForms.FormMode.EDIT,
                "hideLegend": false,
                "disableHumanizeLabel": false,
                "type": "java.lang.String",
                "properties": {}, // to be filled in below

                // ensure that the config is unique so that different
                // entities with the same config properly update the
                // contents of the form. This is due to hawtioForm2
                // directive does not listen for changes to entity but
                // only changes to config.
                "timestamp": Date.now()
            };

            if (_.isEmpty(vm.template)) {
                return;
            }

            var configProperties = vm.templateConfig[HAWTIO_FORM.PROPERTIES];

            vm.templateConfig[HAWTIO_FORM.CONTROLS] = [SYNTAX.STAR];
            var templateEntries = ConnectionWizardService.templateEntries();
            if (_.isEmpty(templateEntries))
                return;

            for (var i = 0; i < templateEntries.length; ++i) {
                var entry = templateEntries[i];
                var propertyName = entry[CONNECTION_KEYS.ID];

                if (angular.isDefined(entry.modifiable) && entry.modifiable === false) {
                    continue; // No need to list properties that cannot be changed
                }

                var configProperty = {};

                // type
                configProperty.type = resolveType(entry);

                // default value
                if (angular.isDefined(entry.defaultValue))
                    configProperty.default = entry.defaultValue;

                // description
                if (angular.isDefined(entry.description))
                    configProperty.description = entry.description;

                // display name
                if (angular.isDefined(entry.displayName))
                    configProperty.label = _.startCase(entry.displayName);

                // Required flag
                if (angular.isDefined(entry.required) && entry.required === true) {
                    if (angular.isUndefined(configProperty[HAWTIO_FORM.INPUT_ATTR]))
                        configProperty[HAWTIO_FORM.INPUT_ATTR] = {};

                    configProperty[HAWTIO_FORM.INPUT_ATTR].required = true;
                }

                // Constrained values
                if (angular.isDefined(entry.constrainedToAllowedValues) && entry.constrainedToAllowedValues === true) {
                    configProperty[HAWTIO_FORM.ENUM] = entry.allowedValues;
                }

                configProperty.originalName = propertyName;
                var pname = _.camelCase(propertyName);
                configProperties[pname] = configProperty;
            }
        }

        /**
         * Initialize
         */
        function initialize() {
            vm.currentWizardStep = vm.step[0].id;
            vm.connectionName = ConnectionWizardService.connectionName();
            vm.connectionNameChanged();

            vm.jndi = ConnectionWizardService.jndi();
            vm.jndiChanged();

            vm.templates = ConnectionWizardService.templates();
            vm.template = ConnectionWizardService.template();

            vm.connectionProperties = ConnectionWizardService.connectionProperties();

            generatePropertiesConfig();
            updateWizardStatus();
        }

        function refreshWizardService(driverName) {
            // Close the add new drive slider
            vm.showAddNewDriver = false;
            // Show the wizard spinner to demonstrate refreshing
            vm.wizardServiceReady = false;
            // Re-initialise the connection wizard service to refresh the available templates
            $scope.connection[CONNECTION_KEYS.DRIVER] = driverName;
            ConnectionWizardService.init($scope.connection, $scope.pageId);
        }

        /**
         * Determine if editing a service or creating a new service
         */
        vm.isEditing = function() {
            //
            // TODO
            //
            // Cannot edit a connection since it cannot currently
            // be redeployed (deleted then recreated) without
            // refreshing teiid or restarting the JB instance
            //
            // See https://issues.jboss.org/browse/TEIID-4592
            //
            return ConnectionWizardService.isEditing();
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

            //
            // The step.stepId is the step being left
            //
            if (step.stepId === vm.step[1].id) {

                //
                // Set the connection properties
                //
                // Since the originals property names are not
                // compatible with angular, they had to be converted
                // to camelCase and originals stored. Create an
                // object that uses the original names with the set values
                //
                var metadata = vm.templateConfig[HAWTIO_FORM.PROPERTIES];
                var connProps = {};
                for (var key in vm.connectionProperties) {
                    var value = vm.connectionProperties[key];
                    var metadatum = metadata[key];
                    if (metadatum)
                        connProps[metadatum.originalName] = value;
                    else {
                        // If no metadatum then most likely not a config property
                        // such as dsbCreator. In which case, add back as is
                        connProps[key] = value;
                    }
                }

                ConnectionWizardService.setConnectionProperties(connProps);

                vm.connectionCreating = true;
                //
                // Start the upload, deploy will be started from
                // the callback from the signal
                //
                ConnectionWizardService.uploadConnection();
            }

        	return true;
        };

        /**
         * Cancel pressed
         */
        vm.cancelPressed = function () {
            // Change page to summary
            $rootScope.$broadcast("dataServicePageChanged", DSPageService.CONNECTION_SUMMARY_PAGE);
        };

        /**
         * Finish pressed
         */
        vm.finishPressed = function () {
            ConnectionSelectionService.refresh(true);

            // Change page to summary
            $rootScope.$broadcast("dataServicePageChanged", DSPageService.CONNECTION_SUMMARY_PAGE);
        };

        /**
         * Handle connectionName changes
         */
        vm.connectionNameChanged = function() {
            if (angular.isUndefined(vm.connectionName))
                vm.connectionName = '';

            ConnectionWizardService.setConnectionName(vm.connectionName);

            // Update the jndi with the connection name
            vm.jndi = CONNECTION_KEYS.JNDI_PREFIX + vm.connectionName;
            vm.jndiChanged();
        };

        vm.nameErrorMessage = function() {
            return ConnectionWizardService.nameErrorMessage();
        };

        vm.hasNameErrorMessage = function() {
            return ! _.isEmpty(ConnectionWizardService.nameErrorMessage());
        };

        /**
         * Handle jndi changes
         */
        vm.jndiChanged = function() {
            ConnectionWizardService.setJndi(vm.jndi);
        };

        vm.jndiErrorMessage = function() {
            return ConnectionWizardService.jndiErrorMessage();
        };

        vm.hasJndiErrorMessage = function() {
            return ! _.isEmpty(ConnectionWizardService.jndiErrorMessage());
        };

        /**
         * Handle driver type changes
         */
        vm.driverTypeChanged = function() {
            vm.templateConfig = null;
            // Reset model since new template selected
            vm.connectionProperties = {};

            ConnectionWizardService.setTemplate(vm.template);
            updateWizardStatus();
        };

        vm.hasTemplate = function() {
            return ConnectionWizardService.validTemplate();
        };

        vm.noTemplateErrorMessage = function() {
            return $translate.instant('connectionEditWizard.noTemplateInstructionMsg');
        };

        vm.toggleAddNewDriver = function() {
            vm.showAddNewDriver = !vm.showAddNewDriver;

            if (vm.showAddNewDriver) {
                vm.driverImportResponse = '';
                vm.driverDeploymentStatus = '';
                vm.driverDeploymentSuccess = false;
                DriverSelectionService.setDeploying(false);
            }
        };

        /*
         * Callback called on starting of the driver import
         */
        vm.onDriverImportStarted = function() {
            vm.driverImportResponse = '';
            vm.driverDeploymentStatus = '';
            vm.driverDeploymentSuccess = false;
            DriverSelectionService.setDeploying(false);
        };

        /*
         * Callback called after the driver has been imported
         */
        vm.onDriverImportDone = function(result) {
            if(result.success !== true)
                return;

            // On successful import, deploy the driver
            var driverName = result.Name;
            DriverSelectionService.setDeploying(true, driverName, false, null);
            try {
                RepoRestService.deployDriver(driverName).then(
                    function ( result ) {
                        vm.driverDeploymentSuccess = result.Information.deploymentSuccess;
                        if(vm.driverDeploymentSuccess === "true") {
                            DriverSelectionService.setDeploying(false, driverName, true, null);
                            vm.driverDeploymentStatus = "Driver Deployment Successful";
                            vm.deploymentDriverStyleClass = "import-control-response-ok";
                        } else {
                            DriverSelectionService.setDeploying(false, driverName, false, result.Information[driverName]);
                            vm.driverDeploymentStatus = "Driver Deployment Failed:<p>" + result.Information[driverName] + "</p>";
                            vm.deploymentDriverStyleClass = "import-control-response-bad";
                        }

                        // Update the list of drivers
                        DriverSelectionService.refresh();

                        // Refresh the connection wizard service
                        refreshWizardService(driverName);
                   },
                    function (response) {
                        DriverSelectionService.setDeploying(false, driverName, false, RepoRestService.responseMessage(response));
                        vm.driverDeploymentStatus = "Failed to deploy the driver. \n" + RepoRestService.responseMessage(response);
                        vm.deploymentDriverStyleClass = "import-control-response-bad";
                    });
            } catch (error) {
                vm.driverDeploymentStatus = "Failed to deploy the driver. \n" + error.message;
                vm.deploymentDriverStyleClass = "import-control-response-bad";
            }
        };

        /**
         * Gets event when the ConnectionWizardService initialization has finished
         */
        $scope.$on("ConnectionWizardServiceReady", function (event) {
            initialize();
            vm.wizardServiceReady = true;
        });

        /**
         * Update the wizard status when a value of connection properties is modified.
         * The 'true' paramater checks the object for equality rather than reference so
         * can track its own property changes.
         */
        $scope.$watch('vm.connectionProperties', function(newObj, oldObj) {
            if (newObj === oldObj)
                return;

            updateWizardStatus();
        }, true);

        /**
         * Handles next button enablement and text whenever the source name changes.
         */
        $scope.$on("connectionWizardConnectionNameChanged", function (event) {
            updateWizardStatus();
        });

        /**
         * Handles next button enablement and text whenever the jndi name changes.
         */
        $scope.$on("connectionWizardJndiChanged", function (event) {
            updateWizardStatus();
        });

        /**
         * Handles updating the properties once template entries have been downloaded
         */
        $scope.$on('connectionWizardTemplateEntriesChanged', function( value ) {
            generatePropertiesConfig();
            updateWizardStatus();
        });

        /**
         * Handles updating the wizard once the wizard changes step
         */
        $scope.$on("wizard:stepChanged", function (e, parameters) {
            vm.currentWizardStep = parameters.step.stepId;
            updateWizardStatus();
        });

        /**
         * Tracks the DriverSelectionService deployDriverChanged signal
         */
        $scope.$on('deployDriverChanged', function (event, drvDeploying) {
            vm.driverDeploying = drvDeploying;
        });

        /**
         * Tracks the connection work signal
         */
        $scope.$on('connectionWorkFinished', function (event, status, msg) {
            vm.connectionCreating = false;
            vm.newConnectionCreateStatus = msg;

            if (status) {
                vm.newConnectionCreateStyleClass = "import-control-response-ok";

                vm.connectionDeploying = true;
                ConnectionWizardService.deployConnection();
            } else
                vm.newConnectionCreateStyleClass = "import-control-response-bad";

            updateWizardStatus();
        });

        /**
         * Tracks the create connection signal
         */
        $scope.$on('connectionDeploymentFinished', function (event, status, msg) {
            vm.connectionDeploying = false;
            vm.newConnectionDeployStatus = msg;

            if (status)
                vm.newConnectionDeployStyleClass = "import-control-response-ok";
            else
                vm.newConnectionDeployStyleClass = "import-control-response-bad";

            updateWizardStatus();
        });

        /**
         * Initialize the connection wizard service which should
         * complete the initialisation of this controller
         */
        ConnectionWizardService.init($scope.connection, $scope.pageId);
    }

})();
