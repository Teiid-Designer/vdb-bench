/**
 * Local Storage Service
 * Convenience service to front $window.localStorage * from local storage
 * and the active (selected) repository.
 */
var vdbBench = (function(vdbBench) {

    vdbBench._module.factory('StorageService', [ '$window', function($window) {
        return {
            set : function(key, value) {
                $window.localStorage[key] = value;
            },

            get : function(key, defaultValue) {
                return $window.localStorage[key] || defaultValue;
            },

            setObject : function(key, value) {
                var jsonValue = JSON.stringify(value);
                $window.localStorage[key] = JSON.stringify(value);
            },

            getObject : function(key) {
                var value = JSON.parse($window.localStorage[key] || '{}')
                return value;
            }
        }
    } ]);

    return vdbBench;

})(vdbBench || {});
