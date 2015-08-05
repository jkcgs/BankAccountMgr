$ = function(s){ return document.querySelector(s); }
Ractive.DEBUG = !1;

var gui = require('nw.gui');
var win = gui.Window.get();
var tray;

// Get the minimize event
win.on('minimize', function() {
	this.hide();
	tray = new gui.Tray({icon: 'img/icon_256.png'});

	tray.on('click', function() {
		win.show();
		this.remove();
		tray = null;
	});
});

window.addEventListener('keydown', function(e) {
	if(e.keyCode == 123) { // F12
		require('nw.gui').Window.get().showDevTools();
	}
})

var storage = {
	isInitiated: function(){ return typeof localStorage.pass != "undefined" },
	logged: function(){ return typeof sessionStorage.pass != "undefined" },
	logout: function(){
		var accs = storage.accounts.get();
		for(var i in accs) {
			ui.accLogout(i);
		}

		sessionStorage.pass = '';
		delete sessionStorage.pass;
		$("#add_account").reset();
		ui.r.set('loggedIn', !1);
		ui.r.set('accounts', []);
	},
	init: function() {
		if(storage.isInitiated()) {
			alert("Ya existe una contraseña! Reiniciar almacenamiento primero!"); return;
		}

		var newp = $('#epwd_new').value;
		var repp = $('#epwd_rep').value;

		if(newp == '') {
			if(!confirm('¿Realmente desea guardar los datos sin seguridad?')) {
				return;
			}
		}

		if(newp != repp) {
			alert('Las contraseñas no coinciden'); return;
		}

		localStorage.pass = encrypt(newp, newp);
		localStorage.accounts = JSON.stringify([]);

		$('#epwd_new').value = "";
		$('#epwd_rep').value = "";

		// mostrar cuentas
		ui.reloadAccounts();
		ui.r.set('initiated', !0);
		ui.r.set('loggedIn', !0);
	},
	login: function() {
		var pass = $('#login_pass').value;
		var ok = decrypt(localStorage.pass, pass) == pass;

		if(!ok) {
			alert("Contraseña incorrecta");
		} else {
			sessionStorage.pass = pass;
			$('#login_pass').value = "";
			ui.reloadAccounts();
			ui.r.set('loggedIn', !0);
		}
	},
	reset: function() {
		delete localStorage.pass;
		delete localStorage.accounts;

		ui.reloadAccounts();
		ui.r.set('initiated', !1);
		ui.r.set('loggedIn', !1);
		ui.r.set('accounts', []);
	},
	askReset: function() {
		if(confirm("¿Realmente desea reiniciar todo? Se borrará cualquier cuenta guardada.")) {
			storage.reset();
		}
	},
	accounts: {
		getIndex: function(bankId, user) {
			var accs = storage.accounts.get();
			for(var i = 0; i < accs.length; i++) {
				var acc = accs[i];
				if(acc == null) {
					continue;
				}

				if(bankId == acc[0] && user == acc[1]) {
					return i;
				}
			}

			return -1;
		},
		exists: function(bankId, user) {
			return storage.accounts.getIndex(bankId, user) != -1;
		},
		add: function(bankId, user, pass) {
			if(!ui.getBank(bankId) == null) {
				alert("Ese banco no existe"); return;
			}

			if(storage.accounts.exists(bankId, user)) {
				alert("Esa cuenta ya existe"); return;
			}

			var json = JSON.parse(localStorage.accounts);
			json.push([encrypt(bankId), encrypt(user), encrypt(pass)]);
			localStorage.accounts = JSON.stringify(json);
		},
		remove: function(bankId, user) {
			var idx = storage.accounts.getIndex(bankId, user);

			if(idx == -1) {
				alert("Esa cuenta no existe"); return;
			}

			var json = JSON.parse(localStorage.accounts);
			json.splice(idx, 1);
			localStorage.accounts = JSON.stringify(json);
		},
		get: function(idx, getDecrypted) {
			if(typeof idx == "undefined") idx = false;
			if(typeof getDecrypted == "undefined") getDecrypted = true;

			var acc = JSON.parse(localStorage.accounts);
			if(idx === false) {
				if(getDecrypted) {
					for(var i = 0; i < acc.length; i++) {
						if(acc[i] == null) {
							continue;
						}
						acc[i][0] = decrypt(acc[i][0]);
						acc[i][1] = decrypt(acc[i][1]);
						acc[i][2] = decrypt(acc[i][2]);
					}
				}

				return acc;
			} else {
				var acci = acc[idx];
				if(getDecrypted) {
					acci[0] = decrypt(acci[0]);
					acci[1] = decrypt(acci[1]);
					acci[2] = decrypt(acci[2]);
				}

				return acci;
			}
		}
	}
}

var ui = {
	reloadAccounts: function(){
		if(!storage.isInitiated()) {
			return;
		}
		var accs = storage.accounts.get();
		ui.r.set('accounts', []);

		for(var i = 0; i < accs.length; i++) {
			ui.r.push('accounts', {
				bankName: ui.getBank(accs[i][0]).name,
				user: accs[i][1],
				logged: false,
				mod: null,
				bAcc: []
			});
		}
	},
	addAcc: function() {
		var vbank = $('#new_bank').value;
		var user = $('#new_user').value;
		var pass = $('#new_pass').value;
		var repp = $('#new_repp').value;

		if(pass != repp) {
			alert("Las contraseñas no coinciden!"); return;
		}

		var bank = ui.getBank(vbank);
		if(bank == null) {
			alert("El banco seleccionado no existe! (WTF)"); return;
		}

		if(bank.userIsRUT && !validarRUT(user)) {
			alert("Debe ingresar un RUT válido como usuario para este banco!"); return;
		}

		storage.accounts.add(vbank, user, pass);
		$('#add_account').reset();
		ui.reloadAccounts();
	},
	delAcc: function(idx) {
		if(!confirm("¿Realmente desea eliminar esta cuenta?")) {
			return;
		}

		var acc = storage.accounts.get(idx);
		storage.accounts.remove(acc[0], acc[1]);

		ui.reloadAccounts();
	},
	getBank: function(bankId) {
		var r = banks.filter(function(o){ return o.id == bankId });
		return r.length > 0 ? r[0] : null;
	},
	getAcc: function(bankId, user) {
		var accs = ui.r.get('accounts');
		for(var i = 0; i < accs.length; i++) {
			if(accs[i].bankName == ui.getBank(bankId).name && accs[i].user == user) {
				accs[i].index = i;
				return accs[i];
			}
		}

		return null;
	},
	accLogin: function(idx) {
		var acc = storage.accounts.get(idx);
		if(typeof acc == "undefined" || acc == null) {
			return;
		}

		var r = ui.getAcc(acc[0], acc[1]);
		if(r.mod != null) {
			return;
		}

		var bank = ui.getBank(acc[0]);
		var l = new bank.module(acc[1], acc[2]);
		ui.r.set('accounts.'+r.index+'.mod', l);
		l.login(function(err, success) {
			if(err != null || !success) {
				alert('Error al iniciar sesión! ' + err.message); return;
			}
			ui.r.set('accounts.'+r.index+'.logged', !0);

			console.log("Iniciando monitor...");
			ui.accMonitor(idx);
		});
	},
	accLogout: function(idx) {
		var acc = storage.accounts.get(idx);
		if(typeof acc == "undefined" || acc == null) {
			return;
		}

		var r = ui.getAcc(acc[0], acc[1]);
		if(r == null) {
			return;
		}

		var t = ui.r.get('accounts.'+r.index+'.to');
		if(typeof t != "undefined") clearTimeout(t);

		ui.r.set('accounts.'+r.index+'.mod', null);
		ui.r.set('accounts.'+r.index+'.logged', false);
		ui.r.set('accounts.'+r.index+'.bAcc', []);
		ui.r.set('accounts.'+r.index+'.pAcc', undefined);
	},
	accMonitor: function(idx) {
		var acc = storage.accounts.get(idx);
		if(typeof acc == "undefined" || acc == null) {
			return;
		}

		var r = ui.getAcc(acc[0], acc[1]);
		if(r.mod == null) {
			return;
		}

		var bank = ui.getBank(acc[0]);
		var l = ui.r.get('accounts.'+r.index+'.mod');
		var _idx = idx;

		l.getAccounts(function(err, accs){
			if(err != null) {
				alert('Se ha detectado un error con una cuenta, se cerrará la sesión de ésta!');
				console.log(err);
				ui.accLogout(idx);
				return;
			}

			if(accs.length > 0) {
				if(typeof ui.r.get('accounts.'+r.index+'.pAcc') == "undefined") {
					console.log('Monitor inicializado!');

					ui.r.set('accounts.'+r.index+'.bAcc', accs);
					ui.r.set('accounts.'+r.index+'.pAcc', accs);

					var notifTxt = "";
					accs.forEach(function(acc) {
						notifTxt += acc.accType + "(" + acc.accNumber + ") $" + acc.accBal + "\n";
					});

					showNotification({title: 'Datos iniciales de cuenta ' + bank.name, text: notifTxt});
				} else {
					var prev = ui.r.get('accounts.'+r.index+'.bAcc', accs);
					for(var i = 0; i < accs.length; i++) {
						for(var j = 0; j < prev.length; j++) {
							if(accs[i].accNumber == prev[j].accNumber && accs[i].accBal != prev[j].accBal) {
								// Dif saldo: parseInt(accs[i].accBal) - parseInt(prev[j].accBal);
								var notifTxt = 'Delta: $' + (parseInt(accs[i].accBal) - parseInt(prev[j].accBal)) + "\nNuevo saldo: $" + accs[i].accBal;
								showNotification({title: 'Nuevo saldo de cuenta ' + bank.name, text: notifTxt});
							}
						}
					}

					ui.r.set('accounts.'+r.index+'.bAcc', accs);
					ui.r.set('accounts.'+r.index+'.pAcc', prev);
				}
			} else {
				console.log('No se encontraron cuentas!');
			}

			var it = setTimeout(function(){ui.accMonitor(idx)}, 15000);
			ui.r.set('accounts.'+r.index+'.to', accs);
		});
	},
	r: new Ractive({
		template: '#main_template',
		el: '#main_container',
		data: {
			initiated: storage.isInitiated(),
			loggedIn: false,
			accounts: [], // { bankName: str, user: str, logged: bool, mod: obj, bAcc: [] }
			banks: banks
		}
	})
}
