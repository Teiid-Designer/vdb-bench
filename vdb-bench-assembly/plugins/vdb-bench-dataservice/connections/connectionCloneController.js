(function () {
    'use strict';

    var pluginName = 'vdb-bench.dataservice';
    var pluginDirName = 'vdb-bench-dataservice';

    angular
        .module(pluginName)
        .controller('ConnectionCloneController', ConnectionCloneController);

    ConnectionCloneController.$inject = ['$scope', '$rootScope', '$translate', '$timeout', 'RepoRestService',
                                        'ConnectionSelectionService', 'CredentialService', 'DSPageService',
                                        'CONNECTION_KEYS'];

    function ConnectionCloneController($scope, $rootScope, $translate, $timeout, RepoRestService,
                                        ConnectionSelectionService, CredentialService, DSPageService,
                                        CONNECTION_KEYS) {
        var vm = this;
        vm.cloneConnInProgress = false;
        vm.cloneOperationFinished = false;
        vm.connName = '';
        vm.nameErrorMsg = '';

        /*
         * Set a custom title to the page including the service source's id
         */
        var page = DSPageService.page(DSPageService.CLONE_CONNECTION_PAGE);
        DSPageService.setCustomTitle(page.id, page.title + " '" + ConnectionSelectionService.selectedConnection().keng__id + "'");

        /**
         * Indicates if the connection name is invalid.
         */
        vm.hasInvalidName = function() {
            return !_.isEmpty( vm.nameErrorMsg );
        };

        /**
         * Handler for changes to the connection name.
         */
        vm.connNameChanged = function() {
            if ( _.isEmpty( vm.connName ) ) {
                vm.nameErrorMsg = $translate.instant( 'connectionWizardService.nameRequired' );
            } else {
                try {
                    var name = encodeURIComponent( vm.connName );

                    RepoRestService.validateConnectionName( name ).then(
                        function ( result ) {
                            vm.nameErrorMsg = result;
                        },
                        function ( response ) {
                            var errorMsg = $translate.instant( 'connectionWizardService.validateConnectionNameError' );
                            throw RepoRestService.newRestException( errorMsg + "\n" + RepoRestService.responseMessage( response ) );
                        }
                    );
                } catch ( error ) {
                    var errorMsg = $translate.instant( 'connectionWizardService.validateConnectionNameError' );
                    throw RepoRestService.newRestException( errorMsg + "\n" + error );
                }
            }
        };

        /*
         * When loading finishes on copy / deploy
         */
        $scope.$on('loadingConnectionsChanged', function (event, loadingState) {
            if(loadingState === false) {
                vm.cloneConnInProgress = false;
            }
        });

        /**
         * Updates the status and any error messages.
         * Will be called at several points in the clone operation so provided
         * with an inProgress flag to indicate whether the entire operation has
         * completed.
         */
        function updateStatus(status, inProgress, msg) {
            vm.cloneConnInProgress = inProgress;
            vm.connectionCloneStatus = msg;

            if (status)
                vm.connectionCloneStyleClass = "import-control-response-ok";
            else
                vm.connectionCloneStyleClass = "import-control-response-bad";

            if (!inProgress) {
                vm.cloneOperationFinished = true;
                ConnectionSelectionService.setLoading(false);

                if (status) {
                    $timeout(function () {
                        // Reinitialise the list of connections
                        ConnectionSelectionService.refresh(true);

                        $rootScope.$broadcast("dataServicePageChanged", DSPageService.CONNECTION_SUMMARY_PAGE);
                    }, 1000);
                }
            }


        }

        /**
         * Updates the connection's properties in preparation for deployment
         * - sets the owner to the current user
         * - sets the jndi name to the name of the connection (since no deployment will take place otherwise)
         */
        function updateConnection(connectionName) {
            var owner = CredentialService.credentials().username;

            try {
                var oldConnection = ConnectionSelectionService.selectedConnection();
                var jndiName = CONNECTION_KEYS.JNDI_PREFIX + connectionName;
                var driver = oldConnection[CONNECTION_KEYS.DRIVER];
                var isJdbc = oldConnection[CONNECTION_KEYS.TYPE];
                var properties = oldConnection[CONNECTION_KEYS.PROPERTIES];

                var parameters = {};
                for (var i = 0; i < properties.length; ++i) {
                    var propObj = properties[i];
                    parameters[propObj.name] = propObj.value;
                }

                RepoRestService.updateConnection(connectionName, jndiName, driver, isJdbc, parameters).then(
                    function (result) {
                        var msg = $translate.instant('connectionCloneController.createConnectionSuccess');
                        updateStatus(true, true, msg);

                        deployConnection(connectionName);
                    },
                    function (response) {
                        var errorMsg = $translate.instant('connectionCloneController.createConnectionFailure');
                        errorMsg = '<p>' + errorMsg + '</p><p>' + RepoRestService.responseMessage(response)  + '</p>';
                        updateStatus(false, false, errorMsg);
                    });
            } catch (error) {
                var errorMsg = $translate.instant('connectionCloneController.createConnectionFailure');
                errorMsg = '<p>' + errorMsg + '</p><p>' + RepoRestService.responseMessage(error)  + '</p>';
                updateStatus(false, false, errorMsg);
            }
        }

        /**
         * Deploys the specified Connection to the server
         */
        function deployConnection(connectionName) {
            // Deploy the connection to the server.  At the end, fire notification to go to summary page
            try {
                ConnectionSelectionService.setDeploying(true, connectionName, false, null);
                RepoRestService.deployConnection(connectionName).then(
                    function (result) {
                        vm.deploymentSuccess = (result.Information.deploymentSuccess == "true");
                        if(vm.deploymentSuccess === true) {
                            ConnectionSelectionService.setDeploying(false, connectionName, true, null);
                            var msg = $translate.instant('connectionCloneController.deployConnectionSuccess');
                            updateStatus(true, false, msg);
                        } else {
                            ConnectionSelectionService.setDeploying(false, connectionName, false, result.Information.ErrorMessage1);
                            var errorMsg = $translate.instant('connectionCloneController.deployConnectionFailure');
                            errorMsg = '<p>' + errorMsg + '</p><p>' + result.Information.ErrorMessage1  + '</p>';
                            updateStatus(false, false, errorMsg);
                        }
                   },
                    function (response) {
                        ConnectionSelectionService.setDeploying(false, connectionName, false, RepoRestService.responseMessage(response));

                        var errorMsg = $translate.instant('connectionCloneController.deployConnectionFailure');
                        errorMsg = '<p>' + errorMsg + '</p><p>' + RepoRestService.responseMessage(response)  + '</p>';
                        updateStatus(false, false, errorMsg);
                    });
            } catch (error) {
                ConnectionSelectionService.setDeploying(false, connectionName, false, RepoRestService.responseMessage(error));

                var errorMsg = $translate.instant('connectionCloneController.deployConnectionFailure');
                errorMsg = '<p>' + errorMsg + '</p><p>' + RepoRestService.responseMessage(error)  + '</p>';
                updateStatus(false, false, errorMsg);
            }
        }

        /**
         * Event handler for clicking the clone button
         */
        vm.onCloneConnectionClicked = function ( connectionName, newConnectionName ) {
            // Set loading true for modal popup
           vm.cloneConnInProgress = true;
           ConnectionSelectionService.setLoading(true);
           var connection = ConnectionSelectionService.selectedConnection();

           try {
                RepoRestService.cloneConnection( connectionName, newConnectionName ).then(
                    function () {
                        updateConnection(newConnectionName);
                    },
                    function (response) {
                        var errorMsg = $translate.instant('connectionCloneController.createConnectionFailure');
                        errorMsg = '<p>' + errorMsg + '</p><p>' + RepoRestService.responseMessage(response)  + '</p>';
                        updateStatus(false, false, errorMsg);
                    });
            } catch (error) {
                var errorMsg = $translate.instant('connectionCloneController.createConnectionFailure');
                errorMsg = '<p>' + errorMsg + '</p><p>' + RepoRestService.responseMessage(error)  + '</p>';
                updateStatus(false, false, errorMsg);
            }
        };

        vm.connNameChanged();

    }

})();
