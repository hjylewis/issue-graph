var config = {};
var DEBUG = false;

config.debug = DEBUG;
config.gh_clientId = DEBUG ? "2faafe746b50760f267e" : "3767b3e501e7804d2f60";
config.gh_secret = process.env.SECRET;

module.exports = config;