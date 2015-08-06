var vdbBench = (function(vdbBench) {

    vdbBench._module.factory('repositoryService',
             function($rootScope, $storageService) {

                var defaultRepository = {
                    hostname : 'localhost',
                    port : 3000
                };

                var reposTest = {
                    hostname : 'falcon1',
                    port : 8080
                };

                var repos;

                var selected;

                /*
                 * private function for initialising the repositories from local storage
                 */
                function initRepositories() {
                    var storageRepos = $storageService.getObject('repositories');
                    if (_.isEmpty(storageRepos)) {
                        storageRepos = [defaultRepository, reposTest];
                        $storageService.setObject('repositories', storageRepos);
                    }

                    return storageRepos;
                }

                /*
                 * private function for accessing the repositories but first checking
                 * whether they have been initialised
                 */
                function repositories() {
                    if (_.isEmpty(repos))
                        repos = initRepositories();

                    return repos;
                }

                /*
                 * private function to initialise the selected repository name
                 * from local storage
                 */
                function initSelectedRepository() {
                    var selectedName = $storageService.get('selectedRepositoryName');

                    if (selectedName == null) {
                        selectedName = defaultRepository.hostname;
                        $storageService.set('selectedRepositoryName', selectedName);
                    }

                    var currRepos = repositories();
                    for (i = 0; i < currRepos.length; ++i) {
                        if (currRepos[i].hostname == selectedName)
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
                service.getSelected = function() {
                    if (_.isEmpty(selected))
                        selected = initSelectedRepository();

                    return selected;
                };

                /*
                 * Service : set selected repository
                 */
                service.setSelected = function(selectedRepo) {
                    // Save the selected repository name
                    $storageService.set('selectedRepositoryName', selectedRepo.hostname);

                    // Set selected to the selected repository
                    selected = selectedRepo;

                    // Useful for broadcasting the selected repository has been
                    // updated
                    $rootScope.$broadcast("selectedRepoChanged");
                };

                /*
                 * Service : get repositories
                 */
                service.getRepositories = function() {
                    return repositories();
                };

                /*
                 * Service : is a repository selected
                 */
                service.isRepositorySelected = function() {
                    return _.isEmpty(selected);
                },

                /*
                 * Service : is the localhost repository selected
                 */
                service.isLocalhostSelected = function() {
                    if (_.isEmpty(selected))
                        return false;

                    return selected.hostname == "localhost";
                }

                /*
                 * Service : save the repositories to local storage
                 */
                service.saveRepositories = function() {
                    $storageService.setObject('repositories', repos);

                    //
                    // Need to save as well since the hostname of the selected repository
                    // may have been edited. Ensures that next time of loading the 'new'
                    // hostname is used to select the correct repository
                    //
                    var hostname = _.isEmpty(selected) ? '' : selected.hostname;
                    $storageService.set('selectedRepositoryName', hostname);
                };

                /*
                 * Initialise the cached vars
                 */
                repos = initRepositories();
                selected = initSelectedRepository;

                return service;
            });

    return vdbBench;

})(vdbBench || {});
