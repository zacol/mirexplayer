window.$ = window.jQuery = require('jquery');
var angular = require('angular');
var io = require('socket.io-client');
var socket = io();
var YouTubeIframeLoader = require('youtube-iframe');

var app = angular.module('app', [require('angular-ui-router')]);

// Services
app.service('playerService', function($http, $q) {
    this.getSongList = function() {
        return $http.get('/songlist');
    };

    this.addSong = function(song) {
        return $http.post('/songlist', song);
    };

    this.updateSong = function(song) {
        return $http.put('/songlist/' + song._id, song);
    };

    this.removeSong = function(songId) {
        return $http.delete('/songlist/' + songId);
    };

    this.searchSong = function (searchText) {
        var deferred = $q.defer();
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
    $scope.shuffleMode = true;

    $scope.initPlayer = function() {
        YouTubeIframeLoader.load(function(YT) {
            $scope.player = new YT.Player('player', {
                height: '390',
                width: '640',
                events: {
                    'onReady': $scope.onPlayerReady,
                    'onStateChange': $scope.onPlayerStateChange
                }
            });
        });
    };

    $scope.onPlayerReady = function() {
        $scope.playerActive = true;

        if ($scope.shuffleMode) {
            $scope.currentSong = $scope.randomizeNextSong();
        } else {
            $scope.currentSong = $scope.songList[0];
        }

        $scope.player.loadVideoById($scope.currentSong.videoId);
    };

    $scope.onPlayerStateChange = function(event) {
        if (event.data === YT.PlayerState.PLAYING) {
            if ($scope.nextSong === undefined || $scope.nextSong === false) {
                if ($scope.shuffleMode) {
                    $scope.updateSong($scope.currentSong);
                    $scope.nextSong = $scope.randomizeNextSong();
                } else {
                    $scope.nextSong = $scope.orderedNextSong();
                }
                
                $scope.setPlayerInfo($scope.currentSong, $scope.nextSong);
            }
        } else if (event.data === YT.PlayerState.ENDED) {
            $scope.songList.forEach(function(song) {
                if (song._id === $scope.nextSong._id) {
                    $scope.currentSong = song;
                }
            });
            $scope.nextSong = false;
            $scope.player.loadVideoById($scope.currentSong.videoId);
        }
    };

    $scope.setPlayerInfo = function(currentSong, nextSong) {
        if (!$scope.playerActive) {
            return;
        }
        socket.emit('set player info', {
            currentSong: currentSong,
            nextSong: nextSong
        });
    };

    $scope.getSongList = function() {
        playerService.getSongList().success(function(response) {
            $scope.songList = response;
            if ($scope.currentSong === undefined && $scope.nextSong === undefined) {
                return;
            }
            $scope.songList.forEach(function(song) {
                if (song._id === $scope.currentSong._id) {
                    song.nowPlaying = true;
                }
                if (song._id === $scope.nextSong._id) {
                    song.nextPlaying = true;
                }
            });
        });
    };

    $scope.addSong = function(videoId, songTitle) {
        var song = {
            videoId: videoId,
            title: songTitle,
            plays: $scope.getLowerPlaysCounter(),
            lastPlayed: 0
        };

        playerService.addSong(song).success(function(response) {
            socket.emit('add song', song);

            $scope.search.phrase = '';
            $scope.search.results = [];
            
            $scope.songList.push(response);

        });
    };

    $scope.updateSong = function(song) {
        song.plays++;
        song.lastPlayed = Math.floor(Date.now() / 1000);
        playerService.updateSong(song);
    };

    $scope.removeSong = function(songId) {
        playerService.removeSong(songId).success(function() {
            socket.emit('remove song', songId);

            $scope.songList = $scope.songList.filter(function(song) {
                return song._id !== songId;
            });
        });
    };

    $scope.searchSong = function() {
        playerService.searchSong($scope.search.phrase).then(function(value) {
            $scope.search.results = value.items;
        });
    };

    $scope.randomizeNextSong = function() {
        var lowerPlaysCounter = $scope.getLowerPlaysCounter();

        var songWithLowerPlays = $scope.songList.filter(function(song) {
            return song.plays === lowerPlaysCounter;
        });

        songWithLowerPlays.sort(function (firstSong, secondSong) {
            if (firstSong.lastPlayed > secondSong.lastPlayed) {
                return 1;
            }
            if (firstSong.lastPlayed < secondSong.lastPlayed) {
                return -1;
            }
            return 0;
        });

        return songWithLowerPlays[0];
    };

    $scope.orderedNextSong = function() {
        for(var index = 0; index < $scope.songList.length; index += 1) {
            if($scope.songList[index]['_id'] === $scope.currentSong._id) {
                if (index === $scope.songList.length - 1) {
                    $scope.playedSongs = [];
                    $scope.shuffledPlaylistId = [];
                    return $scope.songList[0];
                } else {
                    return $scope.songList[index + 1];
                }
            }
        }
    };

    $scope.getLowerPlaysCounter = function() {
        var lowerPlaysCounter = Number.POSITIVE_INFINITY;
        $scope.songList.forEach(function(song) {
            if (song.plays < lowerPlaysCounter) {
                lowerPlaysCounter = song.plays;
            }
        });
        return lowerPlaysCounter;
    };

    $scope.getSongList();
    $scope.initPlayer();

    socket.on('new user', function() {
        $scope.setPlayerInfo($scope.currentSong, $scope.nextSong);
    });

    socket.on('added song', function(data) {
        $scope.songList.push(data);
        $scope.$apply();
    });

    socket.on('removed song', function(data) {
        $scope.songList = $scope.songList.filter(function(song) {
            return song._id !== data;
        });
        $scope.$apply();
    });

    socket.on('get player info', function(data) {
        if (!data.currentSong || !data.nextSong) {
            return;
        }
        $scope.currentSong = data.currentSong;
        $scope.nextSong = data.nextSong;
        $scope.getSongList();
    });
}]);

//Config
app.config(function($stateProvider) {
$stateProvider
    .state('player', {
        url: '/player',
        views: {
            'player': { templateUrl: 'player.html' }
        }
    });
});
