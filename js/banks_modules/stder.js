var utils = require("../utils_mod.js");
var cheerio = require("cheerio");
var request = require("request");

BStder = function(user, pass) {
	this.user = user;
	this.pass = pass.replace(/\.\-/g, '');
	this.jar = request.jar();
	this.req = require("request").defaults({ jar:this.jar, followAllRedirects:true, headers:{"user-agent": global._ua} });

	this.keepAliveInt = null;

	this.username = "";
	this.logged = false;
};

BStder.bname = "Banco Santander";
BStder.userIsRUT = true;

BStder.prefixDomain = "https://www.santander.cl";
BStder.formURL = BStder.prefixDomain + "/transa/cruce.asp";
BStder.transfAccs = BStder.prefixDomain + '/transa/productos/tt/mis_productos/miscuentas_inicio-v2.asp';
BStder.homeURL = BStder.prefixDomain + '/transa/segmentos/Menu/view.asp';

BStder.prototype.login = function(callback) {
	console.log("[BS] Logging in...");
	var that = this;
	var _callback = callback || function(){};
	var opts = {
		url: BStder.formURL,
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

BStder.prototype.getAccounts = function(callback) {
	if(!this.logged) {
		console.error("[BS][GA] Not logged!");
		callback(new Error("Not logged"));
		return;
	}
	var _callback = callback || function(){};

	//console.log("[BS][GA] Loading resume");
	return this.req(BStder.transfAccs, function(err, res, body) {
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

BStder.prototype.logout = function() {
	this.jar = request.jar();
}

///////////////////////////////////////////////////////////

BStder.prototype.checkStatus = function(callback) {
	var _call = callback || function(){};
	var that = this;
	this.req(BStder.homeURL, function(err, res, body) {
		if(err != null) {
			_call(err);
			return;
		}

		that.logged = body.indexOf("actualiza_area_trabajo") != -1;
		_call(null, that.logged);
	});
}

BStder.prototype.keepAlive = function(callback) {
	var that = this;
	var _call = callback || function(){};
	that.checkStatus(function(err, logged){
		if(err != null) {
			console.log("[BS][KA] Error received! " + err.message);
			_call(err);
		}

		if(!logged) {
			that.keepAliveInt = null;
			console.log("[BS][KA] Session got closed!");
			_call(new Error('Session closed'));
			return;
		}

		if(that.keepAliveInt == null) {
			console.log("[BS][KA] KeepAlive iniciado");
		}
		that.keepAliveInt = setTimeout(function(){ that.keepAlive(_call); }, 30000);
	});
}

module.exports = BStder;