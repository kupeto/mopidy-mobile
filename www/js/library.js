angular.module('mopidy-mobile.library', [
  'ionic',
  'mopidy-mobile.connection',
  'mopidy-mobile.settings'
])

.config(function($stateProvider) {
  $stateProvider
    .state('tabs.library', {
      abstract: true,
      url: '/library',
      views: {
        'library': {
          template: '<ion-nav-view></ion-nav-view>',
        }
      }
    })
    .state('tabs.library.root', {
      url: '',
      templateUrl: 'templates/browse.html',
      controller: 'BrowseCtrl',
      resolve: {
        mopidy: function(connection) {
          return connection();
        },
        ref: function() {
          return null;
        },
        refs: function(connection) {
          return connection(function(mopidy) {
            return mopidy.library.browse({uri: null});
          });
        }
      }
    })
    .state('tabs.library.browse', {
      url: '/browse?type&name&uri',
      controller: 'BrowseCtrl',
      templateUrl: 'templates/browse.html',
      resolve: {
        mopidy: function(connection) {
          return connection();
        },
        ref: function($stateParams) {
          return {
            type: $stateParams.type,
            name: $stateParams.name,
            uri: $stateParams.uri,
          };
        },
        refs: function($stateParams, connection) {
          return connection(function(mopidy) {
            return mopidy.library.browse({uri: $stateParams.uri});
          });
        }
      }
    })
    .state('tabs.library.search', {
      url: '/search?q&uri',
      controller: 'SearchCtrl',
      templateUrl: 'templates/search.html',
      resolve: {
        mopidy: function(connection) {
          return connection();
        },
        q: function($stateParams) {
          return $stateParams.q;
        },
        results: function($stateParams, connection) {
          return connection(function(mopidy) {
            return mopidy.library.search({
              query: {any: $stateParams.q},
              uris: $stateParams.uri ? [$stateParams.uri] : null
            });
          });
        }
      }
    })
  ;
})

.controller('BrowseCtrl', function($scope, $state, $ionicPopover, settings, mopidy, ref, refs) {
  $scope.ref = ref;
  $scope.refs = refs;
  $scope.tracks = refs.filter(function(ref) { return ref.type === 'track'; });

  $ionicPopover.fromTemplateUrl('templates/popovers/library.html', {
    scope: $scope,
  }).then(function(popover) {
    $scope.popover = popover;
  });

  $scope.add = function() {
    mopidy.tracklist.add({
      uris: $scope.tracks.map(function(ref) { return ref.uri; })
    });
  };

  $scope.click = function(ref) {
    settings.click(mopidy, ref.uri);
  };

  $scope.play = function() {
    mopidy.tracklist.add({
      uris: $scope.tracks.map(function(ref) { return ref.uri; })
    }).then(function(tlTracks) {
      mopidy.playback.play({tl_track: tlTracks[0]});
    });
  };

  $scope.refresh = function() {
    mopidy.library.refresh({uri: $scope.ref ? $scope.ref.uri : null}).then(function() {
      $scope.$broadcast('scroll.refreshComplete');
    });
  };

  $scope.replace = function() {
    mopidy.tracklist.clear({
    }).then(function() {
      return mopidy.tracklist.add({
        uris: $scope.tracks.map(function(ref) { return ref.uri; })
      });
    }).then(function(tlTracks) {
      mopidy.playback.play({tl_track: tlTracks[0]});
    });
  };

  $scope.search = function(q) {
    $state.go('^.search', {q: q, uri: $scope.ref ? $scope.ref.uri : null});
  };
})

.controller('SearchCtrl', function($scope, settings, mopidy, q, results) {
  $scope.q = q;
  $scope.results = results;

  $scope.click = function(model) {
    settings.click(mopidy, model.uri);
  };
});