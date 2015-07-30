var vdbBench = (function(vdbBench) {

    vdbBench.repoService = vdbBench._module.factory('repositoryService',
            function($rootScope) {
                var repoInstance = {};

                var repos = [ {
                    hostname : 'localhost'
                }, {
                    hostname : 'falcon'
                } ];

                repoInstance.selected = repos[0];

                repoInstance.repositories = function() {
                    return repos;
                }

                repoInstance.setSelected = function(selectedRepo) {
                    if (selectedRepo == null) {
                        repoInstance.selected = repos[0];
                        return;
                    }

                    repoInstance.selected = selectedRepo;

                    // Useful for broadcasting the selected repository has been updated
                    $rootScope.$broadcast("selectedRepoChanged");
                };

                return repoInstance;
            });

    return vdbBench;

})(vdbBench || {});
