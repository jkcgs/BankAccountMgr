$ = function(s){ return document.querySelector(s); }

window.addEventListener('load', function() {
	if(!storage.isInitiated()) {
		$('#store_passwd').style.display = 'block';
	} else {
		$('#login').style.display = 'block';
	}
})

window.addEventListener('keydown', function(e) {
	if(e.keyCode == 123) { // F12
		require('nw.gui').Window.get().showDevTools();
	}
})

var storage = {
	isInitiated: function(){ return typeof localStorage.pass != "undefined" },
	logged: function(){ return typeof sessionStorage.pass != "undefined" },
	logout: function(){
		sessionStorage.pass = '';
		delete sessionStorage.pass;
		$("#add_account").reset();
		show("login");
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
		ui.initAcc();
		show("accounts");
	},
	login: function() {
		var pass = $('#login_pass').value;
		var ok = decrypt(localStorage.pass, pass) == pass;

		if(!ok) {
			alert("Contraseña incorrecta");
		} else {
			sessionStorage.pass = pass;
			$('#login_pass').value = "";
			ui.initAcc();
			show("accounts");
		}
	},
	reset: function() {
		delete localStorage.pass;
		delete localStorage.accounts;

		ui.initAcc();
	},
	askReset: function() {
		if(!confirm("¿Realmente desea reiniciar todo? Se borrará cualquier cuenta guardada.")) {
			return;
		}

		storage.reset();
		show("store_passwd");
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
			if(!banks.hasOwnProperty(bankId)) {
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
	reloadAcc: function() {
		if(!storage.isInitiated()) {
			return;
		}

		var accCont = $('#accounts table tbody');
		accCont.innerHTML = '';

		var accs = storage.accounts.get();
		for(var i = 0; i < accs.length; i++) {
			var bank = ui.getBank(accs[i][0]);
			if(bank == null) {
				continue;
			}

			accCont.innerHTML += "<td>" + bank.name +"</td><td>" + accs[i][1] + "</td><td><a href='javascript:ui.delAcc(" + i + ");'>borrar</a></td>";
		}
	},
	initAcc: function(){
		var addAccForm = $('#add_account');
			addAccSelect = $('#add_account select');
		addAccSelect.innerHTML = '<option value="">Seleccione...</option>';
		for(var bank in banks) {
			if(!banks.hasOwnProperty(bank)) {
				return;
			}

			addAccSelect.innerHTML += "<option value='" + bank + "'>" + banks[bank].name + "</option>";
		}
		ui.reloadAcc();
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
		ui.reloadAcc();
	},
	delAcc: function(idx) {
		if(!confirm("¿Realmente desea eliminar esta cuenta?")) {
			return;
		}

		var acc = storage.accounts.get(idx);
		storage.accounts.remove(acc[0], acc[1]);

		ui.reloadAcc();
	},
	getBank: function(bankId) {
		if(!banks.hasOwnProperty(bankId)) {
			return null;
		}

		return banks[bankId];
	}
}
