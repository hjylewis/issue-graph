var GitHubApi = require('github');
var fs = require('fs');
var marked = require('marked');
var async = require('async');


var issues = function (session, callback) {


	var keywords = [];
	var nodes = [];
	var links = [];
	var repos = [];
	var nodesByNumber = {};
	var msg;

	var github = new GitHubApi({
		version: '3.0.0',
	});
	github.authenticate({
		type: "oauth",
		token: session.oauth
	});

	fs.readFile(__dirname+"/keywords.json", 'utf8', function (err, data) {
		if (err) {
			return console.log(err);
		}
		keywords = (JSON.parse(data).keywords);
		keywords.push("n/a");

		if (session.source == 1) {
			msg = {
				user: session.uid,
				type: 'all',
				page: 1,
				per_page: 100
			};
		} else if (session.source == 2){
			msg = {
				org: session.sname,
				page: 1,
				per_page: 100
			};
		} else {
			msg = {
				user: session.sname,
				page: 1,
				per_page: 100
			};
		}

		getRepos();

		function getRepos(){
			if (session.source == 2){
				github.repos.getFromOrg(msg, function (err, res) {
					repos = repos.concat(res);

					if (res.length < 100){
						callGetIssues(repos, session.sname);
					} else {
						msg.page++;
						getRepos();
					}
				});
			} else {
				github.repos.getFromUser(msg, function (err, res) {
					repos = repos.concat(res);
					if (!res){
						callback("Error: Repos not found");
						return;
					}
					if (res.length < 100){
						if (session.source == 1){
							callGetIssues(repos, session.uid);
						} else {
							callGetIssues(repos, session.sname);
						}
					} else {
						msg.page++;
						getRepos();
					}
				});
			}
		}



		function callGetIssues(repoList, user){
			var filtered = repoList.filter(function (repo) {
				return repo.has_issues;
			});
			repos = repoList.map(function (repo) {
				return repo.name;
			});

			var repos_length = filtered.length;
			async.each(filtered, function (repo, done) {
				getIssues(repo.owner.login, github, repo.name, 1, done);
			}, function (err) {
				if (err){
					callback(err);
				} else {
					writeData(user);
				}
			});
		}
	});









	function getIssues(user,github,name,pageN,done){
		github.issues.repoIssues({
			user: user,
			repo: name,
			page: pageN,
			per_page: 100
			//state: "open"
		}, function(err, res) {

			if (res) console.log("Issue Length" + res.length + name);
			if (err) {
				console.log('Error pulling from '+name+': ' + err);
				done(err);
			} else {
				res.forEach( function(value) {
					// copy over just the values we want

					var node = {
						id: '' + value.id,
						number: value.number,
						title: value.title,
						body: value.body ? marked(value.body) : "",
						naked_body: value.body || "",
						assignee: value.assignee ? value.assignee.login : "none",
						milestone: value.milestone ? value.milestone.title : "none",
						repo: name,
						url: value.html_url
					};
					nodes.push(node);
					nodesByNumber[user + "/" +node.repo + '#' + node.number] = node;
				});
				if (res.length === 0){
					done();
				} else {
					getIssues(user,github, name, pageN+1, done);
				}
			}

		});
	}

	function writeData(user){
		var linkPattern = /[a-z]* ?[&a-z-_/]*#\d+/gi;
		var keywordRegEx = new RegExp(keywords.join('|')); //regex for keywords
		nodes.forEach(function (node) {
			var matches = node.body.match(linkPattern);
			if (matches && matches.length > 0) {
				matches.forEach(function (match) {
					var type = match.match(keywordRegEx);
					if(type === null) type = "n/a";
					var id = match.match(/[&a-z-_/]+#\d+/i);
					var linkedTo = null;
					if (id && id.length >0) {
						if (match.indexOf('&') == -1){
							linkedTo = nodesByNumber[id];
						}
					} else {
						id = match.match(/#\d+/);

						if (id && id.length >0) {
							linkedTo = nodesByNumber[user +"/" + node.repo + id[0].replace(/ /, "")];
						}
					}
					if (linkedTo) {
						links.push({
							source: node,
							target: linkedTo,
							type: type
						});
					}
				});
			}
		});
		var graphData = {
			keywords: keywords,
			repos: repos.sort(),
			nodes: nodes,
			links: links
		};
		//console.log(JSON.stringify(graphData, null, 2));
		callback(null, graphData);
	}
};

module.exports.getIssues = issues;