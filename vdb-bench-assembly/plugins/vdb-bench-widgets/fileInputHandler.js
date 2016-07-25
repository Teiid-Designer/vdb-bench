/**
 * Allows for tracking changes to a file input object (<input type="file" ...>)
 * By adding the attribute file-input-handler and setting it to a function, its possible
 * to record the name of the file that has been selected
 */
(function () {
    'use strict';

    var pluginName = 'vdb-bench.widgets';
    var pluginDirName = 'vdb-bench-widgets';

    angular
        .module(pluginName)
        .directive('fileInputHandler', FileInputHandler);

    function FileInputHandler() {
        var directive = {
            restrict: 'A',
            link: link
        };

        return directive;

        function link(scope, element, attrs) {
            var onChangeHandler = scope.$eval(attrs.fileInputHandler);
            element.bind('change', onChangeHandler);
        }
    }
})();