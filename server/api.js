var express = require('express'),
    config = require('../config.json'),
    http = require('http'),
    path = require('path'),
    app = express(),
    controllers = {
      graphMeta: require('./controllers/graphMeta.js'),
      graph: require('./controllers/graph.js'),
      embed: require('./controllers/embed.js'),
      space: require('./controllers/space.js')
    },
    server;

/**
 * MIDDLEWARES:
 * ************
 */
app.use(express.logger('dev'));
app.use(express.json());
app.use(express.urlencoded());
app.use(express.cookieParser(config.api.secret));
app.use(express.session({ domain: 'localhost:8080,localhost:8000' }));
app.use(express.bodyParser({ limit: '50mb' }));
app.use(app.router);

// development only
if ('development' === app.get('env')) {
  app.use(express.errorHandler());
}

/**
 * API ROUTES:
 * ***********
 */
app.get('/api/login/:id/:password', controllers.space.login);
app.get('/api/logout/:id', controllers.space.logout);

app.post('/api/space', controllers.space.create);
app.post('/api/space/:id', controllers.space.update);
app.get('/api/space/:id', controllers.space.get);
app.delete('/api/space/:id', controllers.space.delete);

app.post('/api/space/graph/:id', controllers.space.addGraph);
app.get('/api/space/graph/:id/:version', controllers.space.readGraph);
app.post('/api/space/graph/:id/:version', controllers.space.updateGraph);

app.get('/api/graph/:id', controllers.graph.get);
app.get('/api/graphmeta/:id', controllers.graphMeta.get);
app.get('/api/embed/:id', controllers.embed.get);

/**
 * STATIC FILES:
 * *************
 */
app.get('/*', express.static(__dirname + '/../' + config.static.path));

/**
 * EXPORT:
 * *******
 */
exports.app = app;
exports.start = function(port) {
  server = http.createServer(app).listen(port, function(){
    console.log('API server listening on port ' + port);
  });
};
exports.stop = function() {
  if (server)
    server.close();
};
