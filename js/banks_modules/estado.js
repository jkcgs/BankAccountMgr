var utils = require("../utils_mod.js");
var cheerio = require("cheerio");
var request = require("request");

BEstado = function(user, pass) {
	var prefix = "https://bancapersonas.bancoestado.cl/eBankingBech/";

	this.user = user;
	this.pass = pass;
	this.jar = request.jar();
	this.req = require("request").defaults({ jar:this.jar, followAllRedirects:true, headers:{"user-agent": global._ua} });

	this.keepAliveInt = null;

	this.username = "";
	this.logged = false;
};

BEstado.prefix = "https://bancapersonas.bancoestado.cl/eBankingBech/";
BEstado.formURL = BEstado.prefix + "login/login.htm",
BEstado.postURL = BEstado.prefix + "login",
BEstado.resumenURL = BEstado.prefix + "superCartola/superCartola.htm";
BEstado.homeURL = BEstado.prefix + "home/home.htm";

BEstado.prototype.login = function(callback) {
	console.log("[BE] Retrieving login page...");
	var that = this;
	_callback = callback || function(){};
	this.req(BEstado.formURL, function(err, res, body) {
		if(body.indexOf("BancoEstado Login") == -1) {
			console.log("[BE] Wrong page received");
			callback(false, new Error("Wrong page received"));
			return;
		}

		//console.log("[BE] Login page loaded");
		var opts = {
			form: {
				j_username: that.user, j_password: that.pass,
				ctoken: utils.textFinder(body, 'ctoken" value="', '"')
			}
		};

		//console.log("[BE] Log-in...");
		that.req.post(BEstado.postURL, opts, function(err, res, body) {
			if(res.statusCode == 500) {
				console.log("[BE] Error 500");
				_callback(false, new Error("Error 500")); return;
			} else if(body.indexOf("Home - BUILD") == -1) {
				console.log("[BE] Login unsuccessful");
				_callback(false, null); return;
			}

			console.log("[BE] Logged in successful");
			that.logged = true;

			var $ = cheerio.load(body);
			that.username = $('.tituloNombre').text().trim();

			that.startKeepAlive();
			_callback(true, null);
		}).on('error', function(e){ _callback(false, e); });
	}).on('error', function(e){ _callback(false, e); });
};

BEstado.prototype.getAccounts = function(callback) {
	if(!this.logged) {
		console.error("[BE][GA] Not logged!");
		callback(false, new Error("Not logged"));
		return;
	}

	this.req(BEstado.resumenURL, function(err, res, body) {
		if(body.indexOf("<title>Resumen de Productos") == -1) {
			console.log("[BE][GA] Wrong page received");
			callback(false, new Error("Wrong page received"));
			return;
		}

		var accounts = [];
		var $1 = cheerio.load(body);
		var els = $1("#table_1 tbody tr");
		for(var i = 0; i < els.length; i++) {
			var tds = $1("td", els[i]),
				accType = tds.eq(0).text().trim(),
				accNum = tds.eq(1).text().trim(),
				accBal = tds.eq(3).text().replace(/[^0-9]/g, "");

			accounts.push({accNumber:accNum, accType: accType, accBal: accBal})
		}

		callback(accounts, null);
	});
}

///////////////////////////////////////////////////////////

BEstado.prototype.checkStatus = function(callback) {
	this.req(BEstado.homeURL, function(err, res, body) {
		this.logged = body.indexOf("<title>Home -") != -1;
		callback(this.logged);
	});
}

BEstado.prototype.keepAliveCallback = function(callback) {
	//console.log("[BE][KA] Checking status...");
	var that = this;
	var _call = callback;
	that.checkStatus(function(logged){
		if(!logged) {
			that.keepAliveInt = null;
			console.log("[BE][KA] Session got closed!");
			_call(that);
			return;
		}

		//console.log("[BE][KA] Session OK");
		that.keepAliveInt = setTimeout(function(){ that.keepAliveCallback(); }, 30000);
	});
}

BEstado.prototype.startKeepAlive = function() {
	if(this.keepAliveInt != null) return;

	this.keepAliveCallback();
}

module.exports = BEstado;