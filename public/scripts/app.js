window.$ = window.jQuery = require('jquery');
var angular = require('angular');

var app = angular.module('app', []);

// Services
app.service('playerService', function($http) {
    this.getSongList = function() {
        return $http.get('/songlist');
    };

    this.addSong = function(song) {
        return $http.post('/songlist', song);
    };

    this.removeSong = function(songId) {
        return $http.delete('/songlist/' + songId);
    };
});

//Controllers
app.controller('PlayerCtrl', ['$scope', 'playerService', function($scope, playerService) {
    $scope.getSongList = function() {
        playerService.getSongList().success(function(response) {
            $scope.songList = response;
        });
    }

    $scope.addSong = function() {
        playerService.addSong($scope.song).success(function(response) {
            $scope.getSongList();
        });
    };

    $scope.removeSong = function(songId) {
        playerService.removeSong(songId).success(function(response) {
            $scope.getSongList();
        });
    };

    $scope.getSongList();
}]);
