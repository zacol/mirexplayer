var io = require('socket.io-client');
var socket = io();
var YouTubeIframeLoader = require('youtube-iframe');

module.exports = ['$scope', 'playerService', function($scope, playerService) {
    $scope.repeatMode = false;
    $scope.shuffleMode = false;
    $scope.playingCounter = 0;
    $scope.playedSongs = [];

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
        	$scope.playingCounter++;

        	if ($scope.playingCounter !== 1) {
            	return;
        	}

        	$scope.updateSong($scope.currentSong);

            if ($scope.repeatMode || $scope.playedSongs.length < $scope.songList.length) {
            	if ($scope.shuffleMode) {
                    $scope.nextSong = $scope.randomizeNextSong();
                } else {
                    $scope.nextSong = $scope.orderedNextSong();
                }
            }
            
            $scope.setPlayerInfo($scope.currentSong, $scope.nextSong);
        } else if (event.data === YT.PlayerState.ENDED) {
        	if (!$scope.nextSong) {
        		$scope.setPlayerInfo();
        		return;
        	}

        	$scope.playingCounter = 0;

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
        });
    };

    $scope.addSong = function(videoId, songTitle) {
        var song = {
            videoId: videoId,
            title: songTitle,
            plays: 0,
            lastPlayed: 0
        };

        playerService.addSong(song).success(function(response) {
            $scope.search.phrase = '';
            $scope.search.results = [];
            
            $scope.songList.push(response);

            socket.emit('add song', song);
        });
    };

    $scope.updateSong = function(song) {
        song.plays++;
        song.lastPlayed = Math.floor(Date.now() / 1000);
        playerService.updateSong(song);

        $scope.playedSongs.push(song);

        socket.emit('update song', song);
    };

    $scope.removeSong = function(songId) {
        playerService.removeSong(songId).success(function() {
			$scope.songList = $scope.songList.filter(function(song) {
                return song._id !== songId;
            });

            socket.emit('remove song', songId);
        });
    };

    $scope.searchSong = function() {
        playerService.searchSong($scope.search.phrase).then(function(value) {
            $scope.search.results = value.items;
        });
    };

    $scope.randomizeNextSong = function() {
    	var pool = [];

    	if ($scope.playedSongs.length === $scope.songList.length) {
    		$scope.playedSongs = [];
    	}

    	$scope.songList.forEach(function(song) {
			var index = $scope.playedSongs.indexOf(song);

			if (index === -1) {
				pool.push(song);
			}
    	});

    	pool = $scope.fisherYatesShuffle(pool);

    	if ($scope.currentSong && $scope.currentSong._id === pool[0]._id) {
    		return pool[1];
    	} else {
    		return pool[0];
    	}
    };

    $scope.orderedNextSong = function() {
        for(var index = 0; index < $scope.songList.length; index += 1) {
            if($scope.songList[index]['_id'] === $scope.currentSong._id) {
                if (index === $scope.songList.length - 1) {
                	$scope.playedSongs = [];
                    return $scope.songList[0];
                } else {
                    return $scope.songList[index + 1];
                }
            }
        }
    };

    $scope.fisherYatesShuffle = function(array) {
    	var arrayLength = array.length;
    	var t;
    	var i;

  		while (arrayLength) {
    		i = Math.floor(Math.random() * arrayLength--);

    		t = array[arrayLength];
    		array[arrayLength] = array[i];
    		array[i] = t;
  		}

  		return array;
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

    socket.on('updated song', function(data) {
    	$scope.songList.forEach(function(song) {
    		if (song._id === data._id) {
    			song.plays++;
    		}
    	});

        $scope.$apply();
    });

    socket.on('removed song', function(data) {
        $scope.songList = $scope.songList.filter(function(song) {
            return song._id !== data;
        });
        
        $scope.$apply();
    });

    socket.on('get player info', function(data) {
        $scope.currentSong = data.currentSong;
        $scope.nextSong = data.nextSong;

        $scope.songList.forEach(function(song) {
            if ($scope.currentSong && song._id === $scope.currentSong._id) {
                song.nowPlaying = true;
            } else {
            	song.nowPlaying = false;
            }
            if ($scope.nextSong && song._id === $scope.nextSong._id) {
                song.nextPlaying = true;
            } else {
            	song.nextPlaying = false;
            }
        });

        $scope.$apply();
    });
}];