"use strict";

console.log("keyboard.js");

treeherder.directive('thMainKeys', [
    '$rootScope', '$timeout', 'thEvents', 'thJobNavSelectors',
    'thTabs',
    function($rootScope, $timeout, thEvents, thJobNavSelectors,
             thTabs) {
        return {link: function($scope) {
            var stopOverrides = new Map();

            console.log("Setting up key bindings");

            Mousetrap.stopCallback = function(ev, element, combo) {
                // if the element has the class "mousetrap" then no need to stop
                if (element.classList.contains('mousetrap')) {
                    return false;
                }
                var overrideFunc = stopOverrides.get(combo);
                if (overrideFunc) {
                    var override = overrideFunc(ev, element, combo);
                    if (override !== null) {
                        return override;
                    }
                }
                if ((element.tagName === 'INPUT' &&
                     element.type !== "radio" && element.type !== "checkbox") ||
                    element.tagName === 'SELECT' ||
                    element.tagName === 'TEXTAREA' ||
                    element.isContentEditable || ev.keyCode === 16) {
                    return true;
                }
                return false;
            };

            var keyShortcuts = [
                // Shortcut: toggle display in-progress jobs (pending/running)
                ['i', function() {
                    $scope.$evalAsync($scope.toggleInProgress());
                }],

                // Shortcut: select previous job
                ['left', function() {
                    $rootScope.$emit(thEvents.changeSelection,
                                     'previous',
                                     thJobNavSelectors.ALL_JOBS);
                }],

                // Shortcut: select next job
                ['right', function() {
                    $rootScope.$emit(thEvents.changeSelection,
                                     'next',
                                     thJobNavSelectors.ALL_JOBS);
                }],

                // Shortcut: select next unclassified failure
                [['j', 'n'], function() {
                    $rootScope.$emit(thEvents.changeSelection,
                                     'next',
                                     thJobNavSelectors.UNCLASSIFIED_FAILURES);
                }],

                // Shortcut: select previous unclassified failure
                [['k', 'p'], function() {
                    $rootScope.$emit(thEvents.changeSelection,
                                     'previous',
                                     thJobNavSelectors.UNCLASSIFIED_FAILURES);
                }],

                // Shortcut: retrigger selected job
                ['r', function() {
                    if ($scope.selectedJob) {
                        $scope.$evalAsync(
                            $rootScope.$emit(thEvents.jobRetrigger,
                                             $rootScope.selectedJob)
                        );
                    }
                }],

                // Shortcut: pin selected job to pinboard
                ['space', function(ev) {
                    // If a job is selected add it otherwise
                    // let the browser handle the spacebar
                    if ($scope.selectedJob) {
                        // Prevent page down propagating to the jobs panel
                        ev.preventDefault();

                        $scope.$evalAsync(
                            $rootScope.$emit(thEvents.jobPin, $rootScope.selectedJob)
                        );
                    }
                }],

                // Shortcut: display only unclassified failures
                ['u', function() {
                    $scope.$evalAsync($scope.toggleUnclassifiedFailures);
                }],

                // Shortcut: pin selected job to pinboard and add a related bug
                ['b', function(ev) {
                    if ($scope.selectedJob) {
                        $rootScope.$emit(thEvents.addRelatedBug,
                                         $rootScope.selectedJob);

                        // Prevent shortcut key overflow during focus
                        ev.preventDefault();

                        $timeout(
                            function() {
                                $("#related-bug-input").focus();
                            }, 0);
                    }
                }, function(ev, element) {
                    if (element.id === "pinboard-classification-select") {
                        return false;
                    }
                    return null;
                }],

                // Shortcut: pin selected job to pinboard and enter classification
                ['c', function(ev) {
                    if ($scope.selectedJob) {
                        $scope.$evalAsync(
                            $rootScope.$emit(thEvents.jobPin, $rootScope.selectedJob)
                        );

                        // Prevent shortcut key overflow during focus
                        ev.preventDefault();

                        $timeout(
                            function() {
                                $("#classification-comment").focus();
                            }, 0);
                    }
                }, function(ev, element) {
                    if (element.id === "pinboard-classification-select") {
                        return false;
                    }
                    return null;
                }],

                // Shortcut: enter a quick filter
                ['f', function(ev) {
                    // Prevent shortcut key overflow during focus
                    ev.preventDefault();

                    $('#quick-filter').focus();
                }],

                // Shortcut: clear the quick filter field
                ['ctrl+shift+f', function(ev) {
                    // Prevent shortcut key overflow during focus
                    ev.preventDefault();

                    $scope.$evalAsync($scope.clearFilterBox());
                }],

                // Shortcut: escape closes any open panels and clears selected job
                ['escape', function() {
                    $scope.$evalAsync($scope.setFilterPanelShowing(false));
                    $scope.$evalAsync($scope.setSettingsPanelShowing(false));
                    $scope.$evalAsync($scope.setSheriffPanelShowing(false));
                    $scope.$evalAsync($scope.closeJob());
                    $scope.$evalAsync($scope.setOnscreenShortcutsShowing(false));
                }],

                // Shortcut: clear the pinboard
                ['ctrl+shift+u', function() {
                    $scope.$evalAsync($rootScope.$emit(thEvents.clearPinboard));
                }],

                // Shortcut: save pinboard classification and related bugs
                ['ctrl+enter', function() {
                    $scope.$evalAsync($rootScope.$emit(thEvents.saveClassification));
                }],

                // Shortcut: open the logviewer for the selected job
                ['l', function() {
                    if ($scope.selectedJob) {
                        $scope.$evalAsync($rootScope.$emit(thEvents.openLogviewer));
                    }
                }],

                // Shortcut: delete classification and related bugs
                ['ctrl+backspace', function() {
                    if ($scope.selectedJob) {
                        $scope.$evalAsync($rootScope.$emit(thEvents.deleteClassification));
                    }
                }],

                // Shortcut: delete classification and related bugs
                ['s', function() {
                    if (thTabs.selectedTab === "autoClassification") {
                        $scope.$evalAsync($rootScope.$emit(thEvents.saveAllAutoclassifications));
                    }
                }],

                // Shortcut: delete classification and related bugs
                ['a', function() {
                    if (thTabs.selectedTab === "autoClassification") {
                        $scope.$evalAsync($rootScope.$emit(thEvents.ignoreOthersAutoclassifications));
                    }
                }],

                // Shortcut: display onscreen keyboard shortcuts
                ['?', function() {
                    $scope.$evalAsync($scope.setOnscreenShortcutsShowing(true));
                }]
            ];
            keyShortcuts.forEach(function(data) {
                Mousetrap.bind(data[0], data[1]);
                if (data[2]) {
                    var keys = data[0];
                    if (!Array.isArray(keys)) {
                        keys = [keys];
                    }
                    keys.forEach(function(key) {
                        stopOverrides.set(key, data[2]);
                    });
                }
            });
        }};
    }]
);
