module.exports = {
	ua: "Mozilla/5.0 (Windows NT 10.0; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/44.0.2403.89 Safari/537.36",
	remove: function(el) {
		if(typeof el.parentElement != "undefined")
			el.parentElement.removeChild(el);
	},
	serialize: function(obj) {
		var s = [];
		for(var param in obj) {
			if(obj.hasOwnProperty(param)) {
				s.push(param + "=" + encodeURIComponent(obj[param]));
			}
		}

		return s.join('&');
	},
	extend: function(base, other) {
		for (var i = 0; i < arguments.length; i++) {
			if (!arguments[i]) continue;

			for (var key in arguments[i]) {
				if (arguments[i].hasOwnProperty(key)) {
					base[key] = arguments[i][key];
				}
			}
		}

		return base;
	},
	encrypt: function(str, pass) {
		pass = pass || sessionStorage.pass || '';
		return CryptoJS.TripleDES.encrypt(str, pass).toString();
	},
	decrypt: function(hash, pass) {
		pass = pass || sessionStorage.pass || '';
		return CryptoJS.TripleDES.decrypt(hash, pass).toString(CryptoJS.enc.Latin1);
	},
	show: function(blockId) {
		var e = document.querySelectorAll('.cont');
		for(var i = 0; i < e.length; i++) {
			e[i].style.display = e[i].id != blockId ? "none" : "block";
		}
	},
	objFormatter: function(str) {
		return JSON.stringify(str).replace(/\"\,\"/g, "\",\n\"");
	},
	formatRUT: function(rut, points) {
		var rut = rut.replace(/[^0-9kK]/g, '').toUpperCase(),
			rut_dv = rut.substr(-1),
			rut = rut.substr(0, rut.length-1);

		if (points) {
			var aux = '',
				i = 1;
			while (i <= rut.length) {
				aux = rut.charAt(rut.length-i) + aux;
				if (i % 3 == 0 && rut.length != i) {
					aux = "." + aux
				}

				i++;
			}

			rut = aux
		}

		return rut + "-" + rut_dv;
	},

	// http://users.dcc.uchile.cl/~mortega/microcodigos/validarrut/javascript.html
	validarRUT: function(rut) {
		var s = formatRUT(rut).split("-");
		var r = parseInt(s[0]), d = s[1];
		if(isNaN(r)) return false;

		var M=0,S=1;
		for(;r;r=Math.floor(r/10)) {
			S=(S+r%10*(9-M++%6))%11;
		}
		return (S?S-1:'k') == d;
	},
	textFinder: function(text, init, end, reverse) {
		if(typeof text == "undefined") return '';

		end = end || '';
		reverse = reverse || false;

		text_init = (reverse ? text.lastIndexOf(init) : text.indexOf(init)) + init.length;
		text_end = !end ? text.length : text.indexOf(end, text_init);

		return text.substring(text_init, text_end);
	},
	showNotification: function(options) {
		/*var defaults = {
			title: "Default notification title",
			text: "Default notification text",
			onClick: function(){},
			onShow: function(){},
			onClose: function(){}
		};

		options.extend(defaults);

		var notification = new Notification(options.title, {body: options.text});

		notification.onclick = options.onClick;
		notification.onshow = options.onShow;
		notification.onclose = options.onClose;*/
	}
}












