'use strict';
/**
 * Module dependencies.
 */

var express = require('express');
var routes = require('./routes');
var user = require('./routes/user');
var http = require('http');
var path = require('path');
var os = require('os');
var app = express();

// all environments
app.set('port', process.env.PORT || 19817);
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');
app.use(express.favicon());
app.use(express.logger('dev'));
app.use(express.json());
app.use(express.urlencoded());
app.use(express.methodOverride());
app.use(express.cookieParser('LIUJING'));
app.use(express.session());
app.use(app.router);
app.use(require('less-middleware')({ src: path.join(__dirname, 'public') }));
app.use(express.static(path.join(__dirname, 'public')));
app.use('/android', express.static('/Users/liujing/myproject/adt-bundle-mac-x86_64-20131030/sdk/docs'));

// development only
if ('development' == app.get('env')) {
  app.use(express.errorHandler());
}

app.get('/', routes.index);
app.get('/users', user.list);

app.get('/about', function(req, res){
        res.send('<label>current dir: </label>'+ __dirname + "<br><label>host:</label>"+ os.hostname()+
            '<br><pre>' + JSON.stringify(process.env, null, '    ') +
            '</pre>');
});
app.get('/test', function(req, res){
        res.send({ user: 'tobi' });
});

http.createServer(app).listen(app.get('port'), function(){
  console.log('Express server listening on port ' + app.get('port'));
});
