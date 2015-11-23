module.exports = function($http, $q) {
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
};