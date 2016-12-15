(function () {
    'use strict';

    var pluginDirName = 'vdb-bench-dataservice/widgets/app-about';

    angular.module('adf.widget.app-about', [
        'adf.provider',
        'vdb-bench.core'
    ])
        .config(config)
        .controller('AppAboutController', AppAboutController);

    config.$inject = ['dashboardProvider', 'CONFIG', 'SYNTAX'];

    function config(dashboardProvider, config, syntax) {
        dashboardProvider
            .widget('app-about', {
                title: 'About',
                description: 'Displays the basic application details',
                templateUrl: config.pluginDir + syntax.FORWARD_SLASH +
                                    pluginDirName + syntax.FORWARD_SLASH +
                                    'about.html',
                controller: 'AppAboutController',
                controllerAs: 'vm'
            });
    }

    AppAboutController.$inject = ['RepoRestService', 'AboutService', '$scope'];

    function AppAboutController(RepoRestService, AboutService, $scope) {
        var vm = this;

        vm.client = {
            loading: true
        };

        vm.repo = {
            loading: true
        };

        function setClientVersion(version) {
            if (version)
                vm.client.version = version;
            else
                vm.client.version = 'Not Found';
        }

        function setClientName(name) {
            if (name)
                vm.client.name = name;
            else
                vm.client.name = 'Not Found';
        }

        function setClientTitle(title) {
            if (title)
                vm.client.title = title;
            else
                vm.client.title = 'Not Found';
        }

        function setRepoVersion(version) {
            if (version)
                vm.repo.version = version;
            else
                vm.repo.version = 'Not Found';
        }

        function setRepoName(name) {
            if (name)
                vm.repo.name = name;
            else
                vm.repo.name = 'Not Found';
        }

        function setRepoTitle(title) {
            if (title)
                vm.repo.title = title;
            else
                vm.repo.title = 'Not Found';
        }

        vm.init = function() {
            try {
                AboutService.getAbout().then(
                    function (about) {
                        vm.client.error = null;

                        var x2js = new X2JS();
                        var aboutObj = x2js.xml_str2json(about);

                        setClientName(aboutObj.about.name);
                        setClientTitle(aboutObj.about.title);
                        setClientVersion(aboutObj.about.version);

                        vm.client.loading = false;
                    },
                    function (response) {
                        // Some kind of error has occurred
                        setClientName(null);
                        setClientTitle(null);
                        setClientVersion(null);

                        vm.client.error = response.message;
                        vm.client.loading = false;
                    });
            } catch (error) {
                setClientName(null);
                setClientTitle(null);
                setClientVersion(null);

                vm.client.error = error.message;
                vm.client.loading = false;
            }

            try {
                RepoRestService.getAbout().then(
                    function (about) {
                        vm.repo.error = null;
                        setRepoName(about.Information['App Name']);
                        setRepoTitle(about.Information['App Title']);
                        setRepoVersion(about.Information['App Version']);

                        vm.repo.loading = false;
                    },
                    function (response) {
                        // Some kind of error has occurred
                        setRepoName(null);
                        setRepoTitle(null);
                        setRepoVersion(null);

                        vm.repo.error = response.message;
                        vm.repo.loading = false;
                    });
            } catch (error) {
                setRepoName(null);
                setRepoTitle(null);
                setRepoVersion(null);

                vm.repo.error = error.message;
                vm.repo.loading = false;
            }
        };

        vm.init();
    }
    
})();
