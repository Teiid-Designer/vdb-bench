(function () {
    'use strict';

    var pluginName = 'vdb-bench.teiid.prefs';
    var pluginDirName = 'vdb-bench-teiid-prefs';

    angular
        .module(pluginName)
        .controller('TeiidPrefsController', TeiidPrefsController);

    TeiidPrefsController.$inject = ['SYNTAX', 'CONFIG', 'RepoRestService', '$scope'];

    function TeiidPrefsController(syntax, config, RepoRestService, $scope) {
        var vm = this;

        vm.loading = true;
        vm.pingAdminResultStyleClass = "teiid-pref-pingResult-ok";
        vm.pingJdbcResultStyleClass = "teiid-pref-pingResult-ok";

        vm.teiid = {
            adminUser: 'admin',
            adminPasswd: 'admin',
            jdbcUser: 'user',
            jdbcPasswd: 'user',
            jdbcSecure: false,
        };

        vm.error = null;

        function setError(error) {
            vm.error = error;
        }

        vm.submitCredentials = function() {
            setError(null);

            try {
                RepoRestService.setTeiidCredentials(vm.teiid).then(
                    function (status) {
                    },
                    function (response) {
                        // Some kind of error has occurred
                        setError(response.message);
                    });
            } catch (error) {
                setError(error.message);
            }
        };

        function setAdminResult(status) {
            if (!status) {
                vm.adminPingResult = null;
                return;
            }

            if (status.OK === "true") {
                vm.pingAdminResultStyleClass = "teiid-pref-pingResult-ok";
                vm.adminPingResult = status.Message;
            }
            else {
                vm.pingAdminResultStyleClass = "teiid-pref-pingResult-bad";
                vm.adminPingResult = status.Message + syntax.NEWLINE + status.Exception;
            }
        }

        function setJdbcResult(status) {
            if (!status) {
                vm.jdbcPingResult = null;
                return;
            }

            if (status.OK === "true") {
                vm.pingJdbcResultStyleClass = "teiid-pref-pingResult-ok";
                vm.jdbcPingResult = status.Message;
            }
            else {
                vm.pingJdbcResultStyleClass = "teiid-pref-pingResult-bad";
                vm.jdbcPingResult = status.Message + syntax.NEWLINE + status.Exception;
            }
        }

        vm.ping = function(pingType) {
            setError(null);

            try {
                RepoRestService.ping(pingType).then(
                    function (statusObj) {
                        if (pingType === "admin")
                            setAdminResult(statusObj.Information);
                        else if (pingType === "jdbc")
                            setJdbcResult(statusObj.Information);
                    },
                    function (response) {
                        // Some kind of error has occurred
                        setError(response.message);
                    });
            } catch (error) {
                setError(error.message);
            }
        };

        vm.init = function() {
            try {
                RepoRestService.getTeiidStatus().then(
                    function (teiidStatus) {
                        vm.teiid.adminUser = teiidStatus.tko__adminUser;
                        vm.teiid.adminPasswd = teiidStatus.tko__adminPswd;
                        vm.teiid.jdbcUser = teiidStatus.tko__jdbcUser;
                        vm.teiid.jdbcPasswd = teiidStatus.tko__jdbcPswd;
                        vm.teiid.jdbcSecure = teiidStatus.tko__jdbcSecure;
                        setError(null);

                        vm.loading = false;
                    },
                    function (response) {
                        // Some kind of error has occurred
                        setError(response.message);
                        vm.loading = false;
                    });
            } catch (error) {
                setError(error.message);
                vm.loading = false;
            }
        };

        vm.init();
    }

})();