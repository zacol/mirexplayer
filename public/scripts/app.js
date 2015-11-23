window.$ = window.jQuery = require('jquery');
var angular = require('angular');

var app = angular.module('app', [require('angular-ui-router')]);

app.constant('VERSION', require('../../package.json').version);

require('./service');
require('./controller');

app.config(function($stateProvider) {
    $stateProvider
        .state('player', {
            url: '/player',
            views: {
                'player': { templateUrl: 'player.html' }
            }
        });
});
