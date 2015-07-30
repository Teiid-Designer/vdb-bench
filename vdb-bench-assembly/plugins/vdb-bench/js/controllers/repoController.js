var vdbBench = (function(vdbBench) {

    vdbBench.RepoController = vdbBench._module.controller('vdbBench.RepoController',
            [
                 '$scope',
                 function($scope) {
                     $scope.repositories = [
                             {hostname : 'localhost'},
                             {hostname : 'falcon'}
                     ];
                     $scope.repository = $scope.repositories[0];
                 }
             ]);
    return vdbBench;

})(vdbBench || {});