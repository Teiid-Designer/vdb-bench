/**
 * Workspace Selection Service
 *
 * Provides the collection of repositories {name, host, port, baseUrl} fetched
 * from local storage and the active (selected) repository.
 */
(function () {

    'use strict';

    angular
        .module('vdb-bench.core')
        .factory('RepoSelectionService', RepoSelectionService);

    RepoSelectionService.$inject = ['CONFIG', '$rootScope', 'StorageService', '$location'];

    function RepoSelectionService(config, $rootScope, StorageService, $location) {

        var defaultWorkspace = {
            name: 'default',
            host: $location.host(),
            port: config.rest.port,
            baseUrl: config.rest.baseUrl
        };

        var repos;

        var selected = null;

        /*
         * private function for initialising the repositories from local storage
         */
        function initWorkspaces() {
            var storageRepos = StorageService.getObject('repositories', {});
            if (_.isEmpty(storageRepos)) {
                storageRepos = [defaultWorkspace];
                StorageService.setObject('repositories', storageRepos);
            }

            return storageRepos;
        }

        /*
         * private function for accessing the repositories but first checking
         * whether they have been initialised
         */
        function repositories() {
            if (_.isEmpty(repos))
                repos = initWorkspaces();

            return repos;
        }

        /*
         * private function to initialise the selected repository name
         * from local storage
         */
        function initSelectedWorkspace() {
            var selectedName = StorageService.get('selectedWorkspaceName');

            if (!selectedName) {
                selectedName = defaultWorkspace.name;
                StorageService.set('selectedWorkspaceName', selectedName);
            }

            var currRepos = repositories();
            for (var i = 0; i < currRepos.length; ++i) {
                if (currRepos[i].name == selectedName)
                    return currRepos[i];
            }

            return null;
        }

        /*
         * Service instance to be returned
         */
        var service = {};

        /*
         * Service : get selected repository
         */
        service.getSelected = function () {
            if (_.isEmpty(selected))
                selected = initSelectedWorkspace();

            return selected;
        };

        /*
         * Service : set selected repository
         */
        service.setSelected = function (selectedRepo) {
            // Save the selected repository name
            StorageService.set('selectedWorkspaceName', selectedRepo.name);

            // Set selected to the selected repository
            selected = selectedRepo;

            // Useful for broadcasting the selected repository has been
            // updated
            $rootScope.$broadcast("selectedRepoChanged");
        };

        /*
         * Service : get repositories
         */
        service.getWorkspaces = function () {
            return repositories();
        };

        /*
         * Service : is a repository selected
         */
        service.isWorkspaceSelected = function () {
            return !_.isEmpty(selected);
        };

        /*
         * Service : is the localhost repository selected
         */
        service.isDefaultSelected = function () {
            if (_.isEmpty(selected))
                return false;

            return selected.name == "default";
        };

        /*
         * Service : save the repositories to local storage
         */
        service.saveWorkspaces = function () {
            StorageService.setObject('repositories', repos);

            //
            // Need to save as well since the name of the selected repository
            // may have been edited. Ensures that next time of loading the 'new'
            // name is used to select the correct repository
            //
            var name = _.isEmpty(selected) ? '' : selected.name;
            StorageService.set('selectedWorkspaceName', name);
        };

        /*
         * Service : add a new repository to the collection
         */
        service.newWorkspace = function () {
            var baseName = "newhost";
            var currRepos = repositories();
            var newRepo = null;
            var index = 1;

            while (!newRepo) {
                var testName = baseName + index;
                var exists = false;

                for (var i = 0; i < currRepos.length; ++i) {
                    if (currRepos[i].name == testName) {
                        exists = true;
                        break;
                    }
                }

                if (!exists)
                    newRepo = {
                        name: testName,
                        host: defaultWorkspace.host,
                        port: defaultWorkspace.port,
                        baseUrl: defaultWorkspace.baseUrl
                    };
                else
                    index++;
            }

            // Add the new repository to the collection
            repos.push(newRepo);

            // Set the selected to the new repository
            service.setSelected(newRepo);

            // Save the new collection to local storage
            service.saveWorkspaces();
        };

        /*
         * Service : remove selected repository from the collection
         */
        service.removeSelected = function () {
            if (!selected)
                return;

            if (service.isDefaultSelected())
                return;

            repos.pop(selected);

            // Set the selected to the first in the collection
            service.setSelected(repos[0]);

            // Save the new collection to local storage
            service.saveWorkspaces();
        };

        /*
         * Initialise the cached vars
         */
        repos = initWorkspaces();
        selected = initSelectedWorkspace();

        return service;
    }
})();