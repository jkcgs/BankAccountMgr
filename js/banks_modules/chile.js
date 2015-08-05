var request = require("request");
var utils = require("../utils_mod.js");

BancoCL = function(user, pass) {
	this.user = user;
	this.pass = pass;
	this.jar = request.jar();
	this.req = request.defaults({ jar:this.jar, followAllRedirects:true, headers:{"user-agent": _ua} });

	this.keepAliveInt = null;

	this.username = "";
	this.logged = false;
};

BancoCL.bname = "B. Chile/Edwards/CrediChile";
BancoCL.userIsRUT = true;

BancoCL.prefixDomain = "https://www.bancochile.cl";
BancoCL.prefix = BancoCL.prefixDomain + "/bchile-perfilamiento/Process?";
BancoCL.prefixAjax = BancoCL.prefixDomain + "/bchile-perfilamiento/Ajax?";
BancoCL.loginURL = BancoCL.prefix + "MID=&AID=LOGIN-0005";
BancoCL.validaClave = BancoCL.prefix + "AID=VALIDA_CLAVE-0000";
BancoCL.uInfoURL = BancoCL.prefix + "MID=&AID=CARTOLA_CON_SALDOS-0200";
BancoCL.ajaxSaldo = BancoCL.prefix + "AID=AJAX_OBTENER_SALDOS1&indice=";
BancoCL.checkSession = BancoCL.prefix + "AID=ESTADO_SESION-010";

BancoCL.prototype.login = function(callback) {
	var that = this;
	var _callback = callback || function(){};

	console.log("[BCL] Checking login data... ");
	that.validatePass(function(loginCheck, err){
		if(!loginCheck) {
			_callback(err);
			return;
		}

		var opts = {
			url: BancoCL.loginURL,
			form: {
				rutFull: utils.formatRUT(that.user),
				SignonPswd: that.pass
			}
		};

		console.log("[BCL] Log-in... ");
		that.req.post(opts, function(err, res, body){
			if(err != null) {
				_callback(err)
				return;
			}

			if(res.request.href.indexOf("CARTOLACONTODO") == -1) {
				_callback(new Error('No se pudo iniciar sesión.'));
				return;
			}

			console.log("[BCL] Retrieving user name... ");
			that.req(BancoCL.uInfoURL, function(err, res, body) {
				if(err != null) {
					_callback(err);
					return;
				}

				that.logged = true;
				that.username = utils.textFinder(body, "Sr(a). ", "<");
				_callback(null, true);
			});
		});
	});
};

BancoCL.prototype.getAccounts = function(callback) {
	var _call = callback || function(){};
	var that = this;
	if(!this.logged) {
		console.error("[BCL][GA] Not logged!");
		_call(new Error("Not logged"));
		return;
	}

	this.req(BancoCL.uInfoURL, function(err, res, body) {
		if(res.request.href.indexOf("CARTOLA_CON_SALDOS") == -1) {
			console.log("[BCL][GA] Wrong page received");
			_call(new Error("Wrong page received"));
			return;
		}

		var accs = [];
		var r = (new RegExp('mtoDisp[0-9]*', 'g')).exec(body);
		for(var i = 0, c = 0; i < r.length; i++) {
			that.req(BancoCL.ajaxSaldo + i, function(err, res, data){
				if(data.indexOf('<') != -1) {
					_call(new Error('Contenido incorrecto recibido'));
					return;
				}

				try {
					var d = data.replace(/'/g, '"')
						.replace("nroProducto", "accNumber")
						.replace("montoContable", "accBal")
						.replace("codProducto", "accType");
					d = JSON.parse(d);
					delete d[0].montoDisponible;
					accs.push(d[0]);
				} catch(e) {
					console.log('[BCL][GA] Error al decodificar JSON');
					showData(data);
					_call(e);
				}

				if(++c == r.length) {
					_call(null, accs);
				}
			});
		}
	});
}


///////////////////////////////////////////////////////////

BancoCL.prototype.validatePass = function(callback) {
	callback = callback || function(){};
	if(this.pass == "") {
		callback(false, null);
	}

	var that = this;
	var opts = {
		form: {
			CustLoginID: utils.formatRUT(that.user),
			SignonPswd: that.pass
		}
	};

	this.req.post(BancoCL.validaClave, opts, function(err, res, body) {
		if(err != null) {
			log("check error");
			console.log(err);
			return;
		}

		var code = false;
		try {
			var x = JSON.parse(body.replace(/'/g, '"'));
			var code = x[0].compara_sesion;
		} catch(e) {
			console.log(body);
			callback(false, e);
			return;
		}

		switch(code) {
			case "00":
				callback(true, null);
			break;
			case "01":
			case "02":
			case "04":
				callback(false, new Error("Contraseña incorrecta"));
			break;
			case "05":
				callback(false, new Error("Contraseña bloqueada"));
			break;
			default:
				callback(false, new Error("Error desconocido"));
		}
	})
}

BancoCL.prototype.checkStatus = function(callback) {
	var _call = callback || function(){};
	var that = this;
	this.req(BancoCL.checkSession, function(err, res, body) {
		if(err != null) {
			_call(err);
			return;
		}

		that.logged = body.trim() == "00";
		_call(null, that.logged);
	});
}

BancoCL.prototype.keepAlive = function(callback) {
	var _call = callback || function(){};
	var that = this;
	that.checkStatus(function(err, logged){
		if(err != null) {
			console.log("[BCL][KA] Error received! " + err.message);
			_call(err);
			return;
		}

		if(!logged) {
			that.keepAliveInt = null;
			console.log("[BCL][KA] Session got closed!");
			_call(new Error('Session closed'));
			return;
		}

		if(that.keepAliveInt == null) {
			console.log("[BCL][KA] KeepAlive iniciado");
		}
		that.keepAliveInt = setTimeout(function(){ that.keepAlive(_call); }, 30000);
	});
}

module.exports = BancoCL;