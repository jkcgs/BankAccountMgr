var utils = require("../utils_mod.js");
var cheerio = require("cheerio");
var request = require("request");

BSantander = function(user, pass) {
	this.user = user;
	this.pass = pass.replace(/\.\-/g, '');
	this.jar = request.jar();
	this.req = require("request").defaults({ jar:this.jar, followAllRedirects:true, headers:{"user-agent": global._ua} });

	this.keepAliveInt = null;

	this.username = "";
	this.logged = false;
};

BSantander.bname = "Banco Santander";
BSantander.userIsRUT = true;

BSantander.prefixDomain = "https://www.santander.cl";
BSantander.formURL = BSantander.prefixDomain + "/transa/cruce.asp";
BSantander.transfAccs = BSantander.prefixDomain + '/transa/productos/tt/mis_productos/miscuentas_inicio-v2.asp';
BSantander.homeURL = BSantander.prefixDomain + '/transa/segmentos/Menu/view.asp';

BSantander.prototype.login = function(callback) {
	console.log("[BS] Logging in...");
	var that = this;
	var _callback = callback || function(){};
	var opts = {
		url: BSantander.formURL,
		form: {
			rut: this.user,
			pin: this.pass
		}
	};

	that.req.post(opts, function(err, res, body) {
		console.log("[BS] loaded")
		if(err != null) {
			_callback(err); return;
		}

		if(res.request.href.indexOf("/transa/errmsg/") != -1) {
			_callback(new Error("Contraseña incorrecta o cuenta bloqueada"));
			return;
		}

		if(body.indexOf("actualiza_area_trabajo") == -1) {
			_callback(new Error("Sesion no iniciada"));
			return;
		}

		console.log("[BS] Logged in successful");
		that.logged = true;
		that.username = "[user]";

		_callback(null, true);
	});
};

BSantander.prototype.getAccounts = function(callback) {
	if(!this.logged) {
		console.error("[BS][GA] Not logged!");
		callback(new Error("Not logged"));
		return;
	}
	var _callback = callback || function(){};

	//console.log("[BS][GA] Loading resume");
	return this.req(BSantander.transfAccs, function(err, res, body) {
		if(err != null) {
			_callback(err); return;
		}

		if(body.indexOf("name='numcuenta'") == -1) {
			_callback(new Error("Wrong page received"));
			return;
		}

		var accs = [];
		/pasacuenta\(.*\)/.exec(body).forEach(function(o){
			o = o.substr(11, o.indexOf(')')-12).replace(/[\(<]/g, '').replace(/'/g,'"'); // sec
			var a = JSON.parse("["+o+"]");
			accs.push({accNumber:a[0], accType: a[2], accBal: a[3]});
		});

		callback(null, accs);
	});
}

BSantander.prototype.logout = function() {
	this.jar = request.jar();
}

///////////////////////////////////////////////////////////

BSantander.prototype.checkStatus = function(callback) {
	this.req(BSantander.homeURL, function(err, res, body) {
		if(err != null) {
			console.log("[BS][CS] Error while checking status");
			console.error(err);
			callback(this.logged);
			return;
		}

		this.logged = body.indexOf("actualiza_area_trabajo") != -1;
		callback(this.logged);
	});
}

BSantander.prototype.keepAliveCallback = function(callback) {
	//console.log("[BE][KA] Checking status...");
	var that = this;
	var _call = callback || function(){};
	that.checkStatus(function(logged){
		if(!logged) {
			that.keepAliveInt = null;
			console.log("[BS][KA] Session got closed!");
			_call(that);
			return;
		}

		//console.log("[BE][KA] Session OK");
		that.keepAliveInt = setTimeout(function(){ that.keepAliveCallback(); }, 30000);
	});
}

BSantander.prototype.startKeepAlive = function() {
	if(this.keepAliveInt != null) return;

	this.keepAliveCallback();
}

module.exports = BSantander;