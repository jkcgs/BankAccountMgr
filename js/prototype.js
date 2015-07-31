// Copyright (C) 2015 makzk - Puedes revisar la licencia de uso en el archivo LICENSE

(function(d,w) {
	w.q = function(a,b){
		if(typeof a == "function") return w.addEventListener('load', a);
		return (b instanceof Element ? b : (b instanceof NodeList && b.length > 0 ? b[0] : d)).querySelectorAll(a);
	};

	Element.prototype.show = function() {
		this.style.display = typeof this._ps == "undefined" ? "" : this._ps;
	}
	Element.prototype.hide = function() {
		this._ps = this.style.display == "none" ? "" : this.style.display;
		this.style.display = "none";
	}
	Element.prototype.addClass = function(c) {
		this.classList.add(c);
	}
	Element.prototype.removeClass = function(c) {
		this.classList.remove(c);
	}
	Element.prototype.hasClass = function(c) {
		return this.classList.contains(c);
	}
	Element.prototype.remove = function() {
		this.parentNode.removeChild(this);
	}
	Element.prototype.attr = function(n,v) {
		if(typeof v != "undefined") {
			this.setAttribute(n,v);
		} else {
			return this.getAttribute(n);
		}
	}
	Element.prototype.html = function(v) {
		if(typeof v != "undefined") {
			this.innerHTML = v;
		} else {
			return this.innerHTML;
		}
	}
	Element.prototype.text = function(v) {
		if(typeof v != "undefined") {
			this.textContent = v.replace(/</g, "&lt;");
		} else {
			return this.textContent;
		}
	}
	Element.prototype.append = function(v) {
		if(typeof v == 'string') {
			this.innerHTML += v;
		} else if(v instanceof Element) {
			this.appendChild(v);
		}
	}
	Element.prototype.val = function(v) {
		if(this.tagName == "SELECT") {
			if(typeof v != "undefined") {
				q(":checked", this).val(v);
			} else {
				return q(":checked", this).val();
			}
		} else {
			if(typeof v != "undefined") {
				this.value = v;
			} else {
				return this.value;
			}
		}
	}
	Element.prototype.setStyle = function(a,b) {
		if(typeof a == "object") {
			for(var p in a) {
				if(a.hasOwnProperty(p)) {
					this.style[p] = a[p];
				}
			}
		} else if(typeof a == "string" && typeof b != "undefined") {
			this.style[a] = b;
		}
	}
	Element.prototype.bind = function(evt, cb) {
		this.addEventListener(evt, cb);
	}
	Element.prototype.parent = function(s) {
		if(typeof s == "undefined") return this.parentNode;
		for(var sp = this.parentNode;;){
			if(sp == null || sp.matches(s)) {
				return sp
			} else {
				sp = sp.parentNode;
			}
		}
	}

	// Inherit Element methods to NodeList
	// If the method returns a value, the value of the first element of the collection is returned
	var o = [
		"show", "hide", "addClass", "removeClass", "remove", "parent",
		"attr", "html", "text", "val", "focus", "click", "append", "setStyle"];

	o.forEach(function(e){
		NodeList.prototype[e] = function(){
			for(var j = 0; j < this.length; j++) {
				var v = this[j][e].apply(this[j], arguments);
				if(typeof v != "undefined") {
					return v;
				}
			}
		}
	});

	NodeList.prototype.bind = function(evt, cb) {
		for(var i = 0; i < this.length; i++) {
			this[i].addEventListener(evt, cb);
		}
	}

	String.prototype.strip = function() {
		var tmp = d.createElement("DIV");
		tmp.innerHTML = this;
		return tmp.textContent;
	}

	// Function taken from format-unicorn library - https://github.com/tallesl/format-unicorn
	// See license at LICENSE-FAIR or at https://github.com/tallesl/format-unicorn/blob/master/LICENSE
	String.prototype.format = function() {
		var str = this.toString()

		if (arguments.length) {
			var type = typeof arguments[0],
				args = type == 'string' || type == 'number' ? Array.prototype.slice.call(arguments) : arguments[0]

			for (var arg in args) str = str.replace(new RegExp('\\{' + arg + '\\}', 'gi'), args[arg])
		}

		return str
	}

	Object.prototype.serialize = function() {
		var s = [];
		for(var param in this) {
			if(this.hasOwnProperty(param)) {
				s.push(param + "=" + encodeURIComponent(this[param]));
			}
		}

		return s.join('&');
	}

	Object.prototype.extend = function(other) {
		for (var i = 0; i < arguments.length; i++) {
			if (!arguments[i]) continue;

			for (var key in arguments[i]) {
				if (arguments[i].hasOwnProperty(key)) {
					this[key] = arguments[i][key];
				}
			}
		}
	}

})(document, window);