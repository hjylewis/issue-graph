var fs = require('fs');
var express = require('express');
var app = express();
var session = require('express-session');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var everyauth = require('everyauth');
var githubIssues = require('../get_issues');
var githubOrgs = require('../get_orgs');

var config = require('./config');

everyauth.debug = config.debug;
everyauth.github
  .appId(config.gh_clientId)
  .appSecret(config.gh_secret)
  .entryPath('/auth/github')
  .callbackPath('/auth/github/callback')
  .scope('repo')
  .findOrCreateUser( function (session, accessToken, accessTokenExtra, githubUserMetadata) {
    session.oauth = accessToken;
	session.uid = githubUserMetadata.login;
	return session.uid;
  })
  .redirectPath('/');


app.use(cookieParser());
app.use(bodyParser());

app.use(session({secret: config.gh_secret}));

app.use(everyauth.middleware());


var checkOAuth = function (req, res, next) {
	if (!req.session.oauth || !req.session.uid) {
		return res.redirect('/launch.html');
	} else {
		next();
	}
};

var checkLogin = function (req, res, next) {
	if (!req.session.source) {
		return res.redirect('/login.html');
	} else {
		next();
	}
};

app.get('/graph-data.json', checkOAuth, checkLogin, function (req, res) {

	githubIssues.getIssues(req.session, function (err, data){
		if (err) {
			console.log(err);
			res.send(500, "error");
			return;
		}
		//console.log(data);
		res.json(data);
	});
});

app.get('/orgs.json', checkOAuth, function (req, res) {

	githubOrgs.getOrgs(req.session.uid, req.session.oauth, function (err, data){
		if (err) {
			console.log(err);
			res.send(500, "error");
			return;
		}
		//console.log(data);
		res.json(data);
	});
});

app.get('/login.html', checkOAuth, function (req, res, next){
	next();
});

app.post('/login.html', function (req, res) {
	req.session.source = req.body.source;
	req.session.sname = req.body.sname;
	res.redirect('/');
});

app.get('/', checkOAuth, checkLogin, function (req, res, next){
	next();
});

app.use(express.static(__dirname + '/../public'));

app.get('/:query', function (req, res, next) {
	console.log(req.params.query);
	if (req.params.query !== 'favicon.ico') {
		req.session.source = 3;
		req.session.sname = req.params.query;
	}
	res.redirect('/');
});


app.set('port', process.env.PORT || 3000);


var server = app.listen(app.get('port'), function (){
	console.log('Listening on port %d', server.address().port);
});