var env = require('node-env-file');
var express = require('express');
var protect = require('./lib/static-protect.js');
var Mkdocs = require('./lib/mkdocs.js');
var githubhook = require('githubhook');
var httpProxy = require('http-proxy');

var proxy = httpProxy.createProxyServer({});

try {
  env(__dirname + '/.env');
}
catch(err) {}

var REPO = process.env.REPO || false;

var mkdocs = new Mkdocs('master', __dirname, 'site', process.env.GITHUB_USER, process.env.GITHUB_PASS);

if (REPO) {
  mkdocs.build(REPO);
}

var github = githubhook({path: '/gitlab/callback'});

github.listen();

github.on('push', function (repo, ref, data) {
  if (REPO === data['project']['path_with_namespace'])
    mkdocs.build(data['project']['path_with_namespace']);
});

var app = express();

app.post('/gitlab/callback', function(req, res) {
  proxy.web(req, res, {
    target: 'http://127.0.0.1:3420'
  });
});

var server = new protect(__dirname);
server.init(app);

app.listen(process.env.PORT || 9090);

console.log('Server started http://127.0.0.1:9090');
