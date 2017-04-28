(function () {
    'use strict';

    var pluginName = 'vdb-bench.dataservice';
    var pluginDirName = 'vdb-bench-dataservice';

    angular
        .module(pluginName)
        .controller('DSCloneController', DSCloneController);

    DSCloneController.$inject = ['$translate', 'RepoRestService', 'DSSelectionService', 'DSPageService'];

    function DSCloneController($translate, RepoRestService, DSSelectionService, DSPageService) {
        var vm = this;
        vm.serviceName = '';
        vm.nameErrorMsg = '';

        /*
         * Set a custom title to the page including the data service's id
         */
        var page = DSPageService.page(DSPageService.CLONE_DATASERVICE_PAGE);
        DSPageService.setCustomTitle(page.id, page.title + " '" + DSSelectionService.selectedDataService().keng__id + "'");

        /**
         * Indicates if the data service name is invalid.
         */
        vm.hasInvalidName = function() {
            return !_.isEmpty( vm.nameErrorMsg );
        };

        /**
         * Handler for changes to the data service name.
         */
        vm.serviceNameChanged = function() {
            if ( _.isEmpty( vm.serviceName ) ) {
                vm.nameErrorMsg = $translate.instant( 'editWizardService.nameRequired' );
            } else {
                try {
                    var name = encodeURIComponent( vm.serviceName );

                    RepoRestService.validateDataServiceName( name ).then(
                        function ( result ) {
                            vm.nameErrorMsg = result;
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
        };

        /**
         * Event handler for clicking the clone button
         */
        vm.onCloneDataServiceClicked = function ( dataserviceName, newDataserviceName ) {
            try {
                RepoRestService.cloneDataService( dataserviceName, newDataserviceName ).then(
                    function () {
                        // Reinitialise the list of data services
                        DSSelectionService.refresh('dataservice-summary');
                    },
                    function (response) {
                	   throw RepoRestService.newRestException($translate.instant('dsCloneController.cloneFailedMsg', 
                                                                                 {response: RepoRestService.responseMessage(response)}));
                    });
            } catch (error) {} finally {
            }
        };

        vm.serviceNameChanged();
    }

})();
