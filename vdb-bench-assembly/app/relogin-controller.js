var VdbBenchApp = (function(App) {
    'use strict';

    App.ReLoginController = App._module.controller('App.ReLoginController', ReLoginController);
    ReLoginController.$inject = ['$rootScope', '$location', '$scope', 'branding', 'RepoRestService', 'CredentialService',
                                 'AuthService', 'RepoSelectionService', 'CONFIG'
    ];

    function ReLoginController($rootScope, $location, $scope, branding, RepoRestService, CredentialService,
                                AuthService, RepoSelectionService, CONFIG) {
        var vm = this;
        vm.branding = branding;
        vm.showRepoConfig = false;
        vm.loginError = '';

        function $apply($scope) {
            var phase = $scope.$$phase || $scope.$root.$$phase;
            if (!phase) {
                $scope.$apply();
            }
        }

        var onLoginFailure = function() {
            vm.loginError = "Access Failure.<br>The username/password are incorrect.";
        };

        var onLoginSuccessful = function() {
            vm.loginError = '';
            $location.path(AuthService.lastLocation());
            $apply($rootScope);
        };

        vm.session = CredentialService.session();

        vm.basic = {
            username: vm.session.user,
            password: '',
            rememberMe: false,
            forgotPwd: false
        };

        vm.doLogin = function() {
            if (vm.basic.username.trim() === '') {
                vm.loginError = 'No user name can be found';
            }

            CredentialService.setAuthType(vm.session.authType);
            CredentialService.setCredentials(vm.basic);

            AuthService.basicLogin(onLoginSuccessful, onLoginFailure);
        };

        vm.deleteSession = function() {
            AuthService.logout();
        };

    }

    return App;

})(VdbBenchApp || (VdbBenchApp = {}));
