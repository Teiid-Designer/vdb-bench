var VdbBenchApp = (function(App) {
    'use strict';

    App.AppController = App._module.controller('App.AppController', AppController);
    AppController.$inject = ['AuthService', 'CredentialService'];

    function AppController(AuthService, CredentialService) {
        var vm = this;

        vm.authenticated = function() {
            return AuthService.authenticated();
        };

        vm.getUsername = function() {
            return CredentialService.credentials().username || 'User';
        };

        vm.logout = function() {
            AuthService.logout();
        };
    }

    return App;

})(VdbBenchApp || (VdbBenchApp = {}));
