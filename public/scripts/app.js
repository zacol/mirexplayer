window.$ = window.jQuery = require('jquery');
var angular = require('angular');
var io = require('socket.io-client');
var socket = io();

var app = angular.module('app', []);

// Services
app.service('playerService', function($http, $q) {
    this.getSongList = function() {
        return $http.get('/songlist');
    };

    this.addSong = function(song) {
        return $http.post('/songlist', song);
    };

    this.removeSong = function(songId) {
        return $http.delete('/songlist/' + songId);
    };

    var deferred = $q.defer();
    this.googleApiClientReady = function (searchText) {
        gapi.client.setApiKey('AIzaSyDhdrZ1OWQD9vZQrj4ZAVCe0lEBdGt4BtU');
        gapi.client.load('youtube', 'v3', function() {
            var request = gapi.client.youtube.search.list({
                part: 'snippet',
                type: 'video',
                q: encodeURIComponent(searchText).replace(/%20/g, '+'),
                maxResults: 3,
                order: 'viewCount'
            });
            request.execute(function(response) {
                deferred.resolve(response.result);
            });
        });
        return deferred.promise;
    };
});

//Controllers
app.controller('PlayerCtrl', ['$scope', 'playerService', function($scope, playerService) {
    var tableSearch = $('.table-search');

    $scope.getSongList = function() {
        playerService.getSongList().success(function(response) {
            $scope.songList = response;
        });
    };

    $scope.addSong = function(videoId, songTitle) {
        var song = {
            videoId: videoId,
            title: songTitle
        }

        playerService.addSong(song).success(function(response) {
            socket.emit('add song');
            $scope.getSongList();
        });
    };

    $scope.removeSong = function(songId) {
        playerService.removeSong(songId).success(function(response) {
            socket.emit('remove song');
            $scope.getSongList();
        });
    };

    $scope.searchSong = function() {
        playerService.googleApiClientReady($scope.search.phrase).then(function(value) {
            $scope.search.results = value.items;
        });
    };

    $scope.getSongList();

    socket.on('get song list', function() {
        $scope.getSongList();
    });
}]);
