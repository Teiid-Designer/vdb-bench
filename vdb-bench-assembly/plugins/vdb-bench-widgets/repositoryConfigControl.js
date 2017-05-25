(function () {
    'use strict';

    var pluginName = 'vdb-bench.widgets';
    var pluginDirName = 'vdb-bench-widgets';

    angular
        .module(pluginName)
        .directive('repositoryConfigControl', repositoryConfigControl);

    repositoryConfigControl.$inject = ['CONFIG', 'SYNTAX'];

    function repositoryConfigControl(config, syntax) {
        var directive = {
            // used as element only
            restrict: 'E',
            // markup this directive generates
            templateUrl: config.pluginDir + syntax.FORWARD_SLASH +
                pluginDirName + syntax.FORWARD_SLASH +
                'repositoryConfigControl.html',
            // isolated scope
            scope: {},
            bindToController: {

            },
            controller: RepositoryConfigController,
            controllerAs: 'vm',
        };

        return directive;
    }

    RepositoryConfigController.$inject = ['REST_URI', 'CONFIG', 'RepoSelectionService', '$scope'];

    function RepositoryConfigController(REST_URI, CONFIG, RepoSelectionService, $scope) {
        var vm = this;

        var repoEditBaseConfig = {
            'id': 'repoEditForm',
            'style': HawtioForms.FormStyle.HORIZONTAL,
            'mode': HawtioForms.FormMode.EDIT,
            'disableHumanizeLabel': false,
            'hideLegend': false,
            'controls': ['*'],
            'properties': {
                'name': {
                    'type': 'text',
                    'label': 'Display Name',
                    'input-attributes': {
                        'required': 'true',
                    }
                },
                'host': {
                    'type': 'text',
                    'label': 'Host Name',
                    'input-attributes': {
                        'required': 'true',
                    }
                },
                'portRequired': {
                    'type': 'boolean',
                    'label': 'Port Required?',
                    'default': 'true'
                },
                'port': {
                    'type': 'Integer',
                    'label': 'Port',
                    'input-attributes': {
                        'required': 'true',
                        'min': 1000,
                        'max': 65535
                    },
                    'control-group-attributes': {
                        'ng-hide': "entity.portRequired != true"
                    }
                },
                'baseUrl': {
                    'type': 'text',
                    'label': 'Base URL',
                    'input-attributes': {
                        'required': 'true',
                        'placeholder': REST_URI.BASE_URL
                    }
                },
                'authType': {
                    'type': 'string',
                    'label': 'Authentication Scheme',
                    'enum': CONFIG.rest.authTypes
                },
                'keycloakUrl': {
                    'type': 'string',
                    'label': 'Server Url',
                    'control-group-attributes': {
                        'class': 'keycloak-control',
                        'ng-hide': "entity.authType != 'keycloak'"
                    }
                },
                'keycloakRealm': {
                    'type': 'string',
                    'label': 'Server Realm',
                    'default': 'vdb',
                    'control-group-attributes': {
                        'class': 'keycloak-control',
                        'ng-hide': "entity.authType != 'keycloak'"
                    }
                }
            },
            'description': 'Settings',
            'type': 'java.lang.String'
        };

        // Use dot object to avoid javascript scope issue
        vm.repo = {};

        // model variable, supplies initial selected value
        vm.repo.selected = RepoSelectionService.getSelected();

        function getRepoEditConfig() {
            var repoEditConfig = _.clone(repoEditBaseConfig, true);
            var nameExt = {
                'properties': {
                    'name': {
                        'type': 'text',
                        'label': 'Workspace Name',
                        'input-attributes': {
                            'required': 'true',
                            'readOnly': 'true'
                        }
                    }
                }
            };

            if (RepoSelectionService.isDefaultSelected()) {
                repoEditConfig = _.merge(repoEditConfig, nameExt);
            }

            return repoEditConfig;
        }

        vm.repo.editConfig = getRepoEditConfig();

        // Watch the selectedRepo so that if its properties change
        // they need to be preserved by the repository service
        $scope.$watch('vm.repo.selected', function (newValue, oldValue) {
            RepoSelectionService.saveWorkspaces();
        }, true);

        // If the service changes its selection then it
        // should notify this controller
        $scope.$on('selectedRepoChanged', function () {
            // Refresh the selected repo field to in turn refresh
            // any controls depending on it.
            if (vm.repo.selected != RepoSelectionService.getSelected())
                vm.repo.selected = RepoSelectionService.getSelected();

            vm.repo.editConfig = getRepoEditConfig();
        });
    }
})();
