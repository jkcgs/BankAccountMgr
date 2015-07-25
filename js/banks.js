var request = require('request');
var banks = {
	estado: {
		name: "BancoEstado",
		userIsRUT: true,
		module: require("./js/banks_modules/estado.js")
	}
};