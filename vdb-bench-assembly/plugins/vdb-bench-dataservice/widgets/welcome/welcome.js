(function () {
    'use strict';

    var pluginDirName = 'vdb-bench-dataservice/widgets/welcome';

    angular.module('adf.widget.ds-welcome', [
        'adf.provider',
        'vdb-bench.core'
    ])
        .config(config)
        .controller('DSWelcomeController', DSWelcomeController);

    config.$inject = ['dashboardProvider', 'CONFIG', 'SYNTAX'];

    function config(dashboardProvider, config, syntax) {
        dashboardProvider
            .widget('ds-welcome', {
                title: 'Welcome',
                description: 'Displays welcome message and project page links',
                templateUrl: config.pluginDir + syntax.FORWARD_SLASH +
                                    pluginDirName + syntax.FORWARD_SLASH +
                                    'welcome.html',
                controller: 'DSWelcomeController',
                controllerAs: 'vm'
            });
    }

    DSWelcomeController.$inject = ['CredentialService'];

    function DSWelcomeController(CredentialService) {
        var vm = this;

        vm.getUsername = function() {
            return CredentialService.credentials().username; 
        };
    }
    
})();
