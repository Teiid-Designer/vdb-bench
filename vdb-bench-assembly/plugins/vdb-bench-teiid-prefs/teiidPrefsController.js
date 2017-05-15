(function () {
    'use strict';

    var pluginName = 'vdb-bench.teiid.prefs';
    var pluginDirName = 'vdb-bench-teiid-prefs';

    angular
        .module(pluginName)
        .controller('TeiidPrefsController', TeiidPrefsController);

    TeiidPrefsController.$inject = ['SYNTAX', 'CONFIG', 'RepoRestService', '$scope', '$translate'];

    function TeiidPrefsController(syntax, config, RepoRestService, $scope, $translate) {
        var vm = this;

        vm.loading = true;
        vm.pingAdminResultStyleClass = "";
        vm.pingJdbcResultStyleClass = "";

        vm.teiid = {
            adminUser: 'admin',
            adminPasswd: 'admin',
            jdbcUser: 'user',
            jdbcPasswd: 'user',
            jdbcSecure: false,
        };

        vm.oldTeiid = _.clone(vm.teiid);
        vm.error = null;

        function setError(error) {
            vm.error = error;
        }

        vm.needsUpdate = function() {
            if (vm.loading === true)
                return false;

            var same = vm.teiid.adminUser === vm.oldTeiid.adminUser &&
                vm.teiid.adminPasswd === vm.oldTeiid.adminPasswd &&
                vm.teiid.jdbcUser === vm.oldTeiid.jdbcUser &&
                vm.teiid.jdbcPasswd === vm.oldTeiid.jdbcPasswd &&
                vm.teiid.jdbcSecure === vm.oldTeiid.jdbcSecure;

            return !same;
        };

        vm.submitCredentials = function() {
            setError(null);

            try {
                RepoRestService.setTeiidCredentials(vm.teiid).then(
                    function (status) {
                        vm.oldTeiid = _.clone(vm.teiid);
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
                vm.pingAdminResultStyleClass = "pficon pficon-ok";
                vm.adminPingResult = $translate.instant('teiidPrefsController.pingSuccessMsg');
            }
            else {
                vm.pingAdminResultStyleClass = "pficon pficon-error-circle-o";
                vm.adminPingResult = status.Message + syntax.NEWLINE + status.Exception;
            }
        }

        function setJdbcResult(status) {
            if (!status) {
                vm.jdbcPingResult = null;
                return;
            }

            if (status.OK === "true") {
                vm.pingJdbcResultStyleClass = "pficon pficon-ok";
                vm.jdbcPingResult = $translate.instant('teiidPrefsController.pingSuccessMsg');
            }
            else {
                vm.pingJdbcResultStyleClass = "pficon pficon-error-circle-o";
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

                        vm.oldTeiid = _.clone(vm.teiid);

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