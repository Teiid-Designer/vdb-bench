(function () {
    'use strict';

    var pluginName = 'vdb-bench.dataservice';
    var pluginDirName = 'vdb-bench-dataservice';

    angular
        .module(pluginName)
        .controller('DSTestController', DSTestController);

    DSTestController.$inject = ['$scope', 'SYNTAX', 'RepoSelectionService', 'DSSelectionService'];

    function DSTestController($scope, SYNTAX, RepoSelectionService, DSSelectionService) {
        var vm = this;

        vm.dsDeploymentInProgress = true;
        vm.dsDeploymentSuccess = false;
        vm.dsDeploymentMessage = null;
        
        /*
         * When a data service is currently being deployed
         */
        $scope.$on('deployDataServiceChanged', function (event, dsDeployInProgress) {
            vm.dsDeploymentInProgress = dsDeployInProgress;
            vm.dsDeploymentSuccess = DSSelectionService.deploymentSuccess();
            vm.dsDeploymentMessage = DSSelectionService.deploymentMessage();
        });

        /*
         * the selected data service OData Link
         */
        vm.selectedDataserviceODataLinkValid = function () {
            var vdbName = DSSelectionService.selectedDataServiceVdbName();
            var vdbVersion = DSSelectionService.selectedDataServiceVdbVersion();
            var modelName = DSSelectionService.selectedDataServiceViewModel();
            var serviceView = DSSelectionService.selectedDataServiceView();
            
            if( vdbName === SYNTAX.UNKNOWN || vdbVersion === SYNTAX.UNKNOWN || modelName === SYNTAX.UNKNOWN || serviceView === SYNTAX.UNKNOWN )
                return false;
            
            return true;
        };

        /*
         * the selected data service OData Link
         */
        vm.selectedDataserviceODataLink = function () {
            var hostName = RepoSelectionService.getSelected().host;
            var portValue = RepoSelectionService.getSelected().port;
            
            var vdbName = DSSelectionService.selectedDataServiceVdbName();
            var vdbVersion = DSSelectionService.selectedDataServiceVdbVersion();
            var modelName = DSSelectionService.selectedDataServiceViewModel();
            var serviceView = DSSelectionService.selectedDataServiceView();
            
            if( vdbName === SYNTAX.UNKNOWN || vdbVersion === SYNTAX.UNKNOWN || modelName === SYNTAX.UNKNOWN || serviceView === SYNTAX.UNKNOWN )
                return "Not Available";
            
            return "https://" + hostName + ":" + portValue + "/odata4/"+ vdbName + "." + vdbVersion + "/" + modelName + "/" + serviceView + "?$format=JSON";
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
        
    }

})();
