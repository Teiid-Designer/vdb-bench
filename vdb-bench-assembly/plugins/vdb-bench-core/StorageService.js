/**
 * Local Storage Service
 * Convenience service to front $window.localStorage * from local storage
 * and the active (selected) repository.
 */
(function () {

    'use strict';

    angular
        .module('vdb-bench.core')
        .factory('StorageService', StorageService);

    StorageService.$inject = ['$window'];

    function StorageService($window) {
        var service = {
            set: function (key, value) {
                $window.localStorage[key] = value;
            },

            get: function (key, defaultValue) {
                return $window.localStorage[key] || defaultValue;
            },

            setObject: function (key, value) {
                var jsonValue = JSON.stringify(value);
                $window.localStorage[key] = JSON.stringify(value);
            },

            getObject: function (key, defaultValue) {
                var value = $window.localStorage[key];
                if (!value)
                    return defaultValue;

                var valueObj = JSON.parse(value);
                return valueObj;
            }
        };

        return service;
    }
})();