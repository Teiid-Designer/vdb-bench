(function () {
    'use strict';

    var pluginName = 'vdb-bench.dataservice';
    var pluginDirName = 'vdb-bench-dataservice';

    angular
        .module(pluginName)
        .controller('PfViewController', PfViewController);

    PfViewController.$inject = ['RepoRestService', 'REST_URI', 'pfViewUtils'];

    function PfViewController(RepoRestService, REST_URI, pfViewUtils) {
        var vm = this;
        vm.filtersText = '';
     
        vm.allItems = [
          {
            name: "Fred Flintstone",
            age: 57,
            address: "20 Dinosaur Way, Bedrock, Washingstone",
            birthMonth: 'February'
          },
          {
            name: "John Smith",
            age: 23,
            address: "415 East Main Street, Norfolk, Virginia",
            birthMonth: 'October'
          },
          {
            name: "Frank Livingston",
            age: 71,
            address: "234 Elm Street, Pittsburgh, Pennsylvania",
            birthMonth: 'March'
          },
          {
            name: "Judy Green",
            age: 21,
            address: "2 Apple Boulevard, Cincinatti, Ohio",
            birthMonth: 'December'
          },
          {
            name: "Pat Thomas",
            age: 19,
            address: "50 Second Street, New York, New York",
            birthMonth: 'February'
          }
        ];
        vm.items = vm.allItems;
     
        var matchesFilter = function (item, filter) {
          var match = true;
     
          if (filter.id === 'name') {
            match = item.name.match(filter.value) !== null;
          } else if (filter.id === 'age') {
            match = item.age === parseInt(filter.value);
          } else if (filter.id === 'address') {
            match = item.address.match(filter.value) !== null;
          } else if (filter.id === 'birthMonth') {
            match = item.birthMonth === filter.value;
          }
          return match;
        };
     
        var matchesFilters = function (item, filters) {
          var matches = true;
     
          filters.forEach(function(filter) {
            if (!matchesFilter(item, filter)) {
              matches = false;
              return false;
            }
          });
          return matches;
        };
     
        var applyFilters = function (filters) {
          vm.items = [];
          if (filters && filters.length > 0) {
            vm.allItems.forEach(function (item) {
              if (matchesFilters(item, filters)) {
                vm.items.push(item);
              }
            });
          } else {
            vm.items = vm.allItems;
          }
        };
     
        var filterChange = function (filters) {
        vm.filtersText = "";
          filters.forEach(function (filter) {
            vm.filtersText += filter.title + " : " + filter.value + "\n";
          });
          applyFilters(filters);
          vm.toolbarConfig.filterConfig.resultsCount = vm.items.length;
        };
     
        vm.filterConfig = {
          fields: [
            {
              id: 'name',
              title:  'Name',
              placeholder: 'Filter by Name...',
              filterType: 'text'
            },
            {
              id: 'age',
              title:  'Age',
              placeholder: 'Filter by Age...',
              filterType: 'text'
            },
            {
              id: 'address',
              title:  'Address',
              placeholder: 'Filter by Address...',
              filterType: 'text'
            },
            {
              id: 'birthMonth',
              title:  'Birth Month',
              placeholder: 'Filter by Birth Month...',
              filterType: 'select',
              filterValues: ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']
            }
          ],
          resultsCount: vm.items.length,
          appliedFilters: [],
          onFilterChange: filterChange
        };
     
        var viewSelected = function(viewId) {
          vm.viewType = viewId;
        };
     
        vm.viewsConfig = {
          views: [pfViewUtils.getListView(), pfViewUtils.getCardView()],
          onViewSelect: viewSelected
        };
        vm.viewsConfig.currentView = vm.viewsConfig.views[0].id;
        vm.viewType = vm.viewsConfig.currentView;
     
        var monthVals = {
          'January': 1,
          'February': 2,
          'March': 3,
          'April': 4,
          'May': 5,
          'June': 6,
          'July': 7,
          'August': 8,
          'September': 9,
          'October': 10,
          'November': 11,
          'December': 12
        };
        var compareFn = function(item1, item2) {
          var compValue = 0;
          if (vm.sortConfig.currentField.id === 'name') {
            compValue = item1.name.localeCompare(item2.name);
          } else if (vm.sortConfig.currentField.id === 'age') {
              compValue = item1.age - item2.age;
          } else if (vm.sortConfig.currentField.id === 'address') {
            compValue = item1.address.localeCompare(item2.address);
          } else if (vm.sortConfig.currentField.id === 'birthMonth') {
            compValue = monthVals[item1.birthMonth] - monthVals[item2.birthMonth];
          }
     
          if (!vm.sortConfig.isAscending) {
            compValue = compValue * -1;
          }
     
          return compValue;
        };
     
        var sortChange = function (sortId, isAscending) {
          vm.items.sort(compareFn);
        };
     
        vm.sortConfig = {
          fields: [
            {
              id: 'name',
              title:  'Name',
              sortType: 'alpha'
            },
            {
              id: 'age',
              title:  'Age',
              sortType: 'numeric'
            },
            {
              id: 'address',
              title:  'Address',
              sortType: 'alpha'
            },
            {
              id: 'birthMonth',
              title:  'Birth Month',
              sortType: 'alpha'
            }
          ],
          onSortChange: sortChange
        };
     
        vm.actionsText = "";
        var performAction = function (action) {
          vm.actionsText = action.name + "\n" + vm.actionsText;
        };
     
        vm.actionsConfig = {
          primaryActions: [
            {
              name: 'Action 1',
              title: 'Do the first thing',
              actionFn: performAction
            },
            {
              name: 'Action 2',
              title: 'Do something else',
              actionFn: performAction
            }
          ],
          moreActions: [
            {
              name: 'Action',
              title: 'Perform an action',
              actionFn: performAction
            },
            {
              name: 'Another Action',
              title: 'Do something else',
              actionFn: performAction
            },
            {
              name: 'Disabled Action',
              title: 'Unavailable action',
              actionFn: performAction,
              isDisabled: true
            },
            {
              name: 'Something Else',
              title: '',
              actionFn: performAction
            },
            {
              isSeparator: true
            },
            {
              name: 'Grouped Action 1',
              title: 'Do something',
              actionFn: performAction
            },
            {
              name: 'Grouped Action 2',
              title: 'Do something similar',
              actionFn: performAction
            }
          ]
        };
     
        vm.toolbarConfig = {
          viewsConfig: vm.viewsConfig,
          filterConfig: vm.filterConfig,
          sortConfig: vm.sortConfig,
          actionsConfig: vm.actionsConfig
        };
     
        vm.listConfig = {
          selectionMatchProp: 'name',
          checkDisabled: false
        };
      }
})();