var request = require('request');
var banks = [];

require('fs').readdirSync("./js/banks_modules").forEach(function(file) {
	if(file.substr(-3) != '.js') return;

	var module_name = file.substr(0, file.length-3);
	var bank = require("./js/banks_modules/" + file);

	bank.id = module_name;
	banks.push({
		id: module_name,
		name: bank.bname,
		userIsRUT: bank.userIsRUT,
		module: bank
	});
});
