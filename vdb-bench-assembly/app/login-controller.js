var VdbBenchApp = (function(App) {
    'use strict';

    App.LoginController = App._module.controller('App.LoginController', LoginController);
    LoginController.$inject = ['$rootScope', '$location', '$scope', 'branding',
        'RepoRestService', 'CredentialService', 'AuthService',
        'RepoSelectionService', 'CONFIG'
    ];

    function LoginController($rootScope, $location, $scope, branding,
        RepoRestService, CredentialService, AuthService,
        RepoSelectionService, CONFIG) {
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

        vm.toggleRepositoryConfig = function() {
            vm.showRepoConfig = !vm.showRepoConfig;
        };

        vm.isBasicAuth = function() {
            var repo = RepoSelectionService.getSelected();
            if (angular.isUndefined(repo))
                return false;

            return repo.authType === CONFIG.rest.authTypes[0];
        };

        vm.isKeycloakAuth = function() {
            var repo = RepoSelectionService.getSelected();
            if (angular.isUndefined(repo))
                return false;

            return repo.authType === CONFIG.rest.authTypes[1];
        };

        vm.selectedRepo = function() {
            var repo = RepoSelectionService.getSelected();
            if (angular.isUndefined(repo))
                return '';

            return repo.name;
        };

        vm.selectedRepoAuthType = function() {
            var repo = RepoSelectionService.getSelected();
            if (angular.isUndefined(repo))
                return '';

            return repo.authType;
        };

        var onLoginFailure = function() {
            vm.loginError = "Access Failure.<br>Either the username/password are incorrect or the repository cannot be contacted.";
        };

        var onLoginSuccessful = function() {
            vm.loginError = '';
            $location.path(AuthService.lastLocation());
            $apply($rootScope);
        };

        vm.basic = {
            username: '',
            password: '',
            rememberMe: false,
            forgotPwd: false
        };

        vm.basic.rememberMe = CredentialService.isRemembered();
        var credentials = CredentialService.credentials();
        vm.basic.username = credentials.username;
        vm.basic.password = credentials.password;

        vm.doBasicLogin = function() {
            if (vm.basic.username.trim() === '') {
                vm.loginError = 'A user name is required';
            }

            CredentialService.setAuthType(vm.selectedRepoAuthType());
            CredentialService.setCredentials(vm.basic);

            AuthService.basicLogin(onLoginSuccessful, onLoginFailure);
        };

        vm.basic.showForgotPwd = function() {
            vm.basic.forgotPwd = !vm.basic.forgotPwd;
        };

        vm.doKeycloakLogin = function() {
            var repo = RepoSelectionService.getSelected();

            var options = {
                rememberMe: false
            };
            options.url = repo.keycloakUrl;
            options.realm = repo.keycloakRealm;

            CredentialService.setAuthType(repo.authType);
            CredentialService.setCredentials(options);

            AuthService.keycloakLogin();
        };
    }

    return App;

})(VdbBenchApp || (VdbBenchApp = {}));
