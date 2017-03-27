var VdbBenchApp = (function(App) {
    'use strict';

    App.LoginController = App._module.controller('App.LoginController', LoginController);
    LoginController.$inject = ['$rootScope', '$location', '$scope', '$timeout', '$translate', 'branding',
        'RepoRestService', 'CredentialService', 'AuthService',
        'RepoSelectionService', 'CONFIG', 'StorageService'
    ];

    function LoginController($rootScope, $location, $scope, $timeout, $translate, branding,
        RepoRestService, CredentialService, AuthService,
        RepoSelectionService, CONFIG, StorageService) {
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

        vm.isKCAuth = function() {
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
            vm.loginError = $translate.instant( 'loginPage.basicAccessFailure' );
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
                vm.loginError = $translate.instant( 'loginPage.userNameRequired' );
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

            if (_.isEmpty(options.url)) {
                vm.loginError = $translate.instant( 'loginPage.kcServerUrlRequired' );
                return;
            }

            if (_.isEmpty(options.realm)) {
                vm.loginError = $translate.instant( 'loginPage.kcServerRealmRequired' );
                return;
            }

            CredentialService.setAuthType(repo.authType);
            CredentialService.setCredentials(options);

            AuthService.kcLogin();
        };

        vm.logout = function() {
            AuthService.logout();
        };

        /**
         * Initialise the error message for use on second-time page redirect
         */
        if (vm.isKCAuth()) {
            var sessionNode = StorageService.sessionGetObject(CONFIG.keycloak.sessionNode);

            if (_.isEmpty(sessionNode))
                return; // No attempt to login has been made yet so no login error required

            $timeout(function() {
                if (! AuthService.authenticated()) {
                    vm.loginError = $translate.instant( 'loginPage.kcAuthenticationFailure' );
                } else if (! AuthService.authorised()) {
                    vm.loginError = $translate.instant( 'loginPage.kcAuthorisationFailure' );
                } else if (! AuthService.connectToRepo()) {
                    vm.loginError = $translate.instant( 'loginPage.kcAuthRepoConnectFailure' );
                }
            }, 500); // Give the authentication a chance to complete
        }
    }

    return App;

})(VdbBenchApp || (VdbBenchApp = {}));
