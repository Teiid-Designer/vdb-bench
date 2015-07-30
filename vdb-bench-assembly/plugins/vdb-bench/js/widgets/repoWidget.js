var vdbBench = (function(vdbBench) {
    vdbBench._module.directive('repoWidget', function() {
        return {
            // used as element only
            restrict : 'E',
            // markup this directive generates
            templateUrl : vdbBench.widgetPath + '/repoWidget.html',
            // isolated scope
            scope : {
                edit : '='
            }
        };
    });

    return vdbBench;

})(vdbBench || {});