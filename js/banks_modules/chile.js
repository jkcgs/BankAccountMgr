var utils = require("../utils_mod.js");
var cheerio = require("cheerio");
var request = require("request");

BChile = function(user, pass) {
	this.user = user;
	this.pass = pass;
	this.jar = request.jar();
	this.req = require("request").defaults({ jar:this.jar, followAllRedirects:true, headers:{"user-agent": utils._ua} });

	this.keepAliveInt = null;

	this.username = "";
	this.logged = false;
};

BChile.bname = "Banco de Chile/Edwards/CrediChile";
BChile.userIsRUT = true;

BChile.prefixDomain = "https://www.bancochile.cl";
BChile.prefix = BChile.prefixDomain + "/bchile-perfilamiento/";
BChile.formURL = BChile.prefix + "Process?AID=LOGIN-0004"
BChile.formURL2 = "https://www.bancochile.cl/bchile-perfilamiento/Process?AID=LOGIN-0004"
// a = new banks.chile.module("", ""); a.login();

BChile.prototype.login = function(callback) {
	console.log("[BC] Retrieving login page... " + BChile.formURL);
	var that = this;
	_callback = callback || function(){};
	this.req(BChile.formURL2, function(err, res, body) {
		if(err != null) {
			console.log(err);
			return;
		}

		if(body.indexOf("Ingreso a Banco") == -1) {
			console.log("[BC] Wrong page received");
			console.log(body);
			_callback(false, new Error("Wrong page received"));
			return;
		}

		console.log("[BC] Login page loaded");
		var formSubmitURL = BChile.prefixDomain + utils.textFinder(body, 'myformLogin1" action="', '"').replace(/&amp;/g, "&");

		console.log("[BC] Form Action URL: " + formSubmitURL);

		var opts = {
			form: {
				CustLoginID: utils.formatRUT(that.user, !1),
				SignonPswd: that.pass,
				relogin: "0",
				marca: "",
				segmento: ",",
				pagina: "login"
			}
		};

		console.log("[BC] Log-in...");
		that.req.post(formSubmitURL, opts, function(err, res, body) {
			if(err != null) {
				console.log(err);
				return;
			}

			if(body.indexOf("?AID=CARTOLACONTODO-0000") == -1) {
				console.log("[BC] Login unsuccessful");
				console.log(body);
				_callback(false, null); return;
			}

			console.log("[BC] Logged in successful");
			_callback(true, null);
		}).on('error', function(e){ _callback(false, e); });
	}).on('error', function(e){ _callback(false, e); });
};

BChile.prototype.getAccounts = function(callback) {
	if(!this.logged) {
		console.error("[BE][GA] Not logged!");
		callback(false, new Error("Not logged"));
		return;
	}

	this.req(BChile.resumenURL, function(err, res, body) {
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

BChile.prototype.checkStatus = function(callback) {
	this.req(BChile.homeURL, function(err, res, body) {
		this.logged = body.indexOf("<title>Home -") != -1;
		callback(this.logged);
	});
}

BChile.prototype.keepAliveCallback = function(callback) {
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

BChile.prototype.startKeepAlive = function() {
	if(this.keepAliveInt != null) return;

	this.keepAliveCallback();
}

module.exports = BChile;