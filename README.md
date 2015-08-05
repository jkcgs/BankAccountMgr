# Bank Account Manager

Esta aplicación está diseñada para permitir almacenar y manejar cuentas bancarias.
Las cuentas son almacenadas de forma segura, encriptadas.

Además, permite recibir notificaciones una vez se modifica el saldo de una cuenta bancaria.

Bajo licencia MIT

## Creación de módulos para banco
Cada módulo debe contar con las siguientes carácterísticas

* Constructor: function(user, pass)
* Constantes de la clase:
 - Modulo.bname (string): el nombre del banco
 - Modulo.userIsRUT (boolean): si el usuario es un RUT, para validarlo
* Funciones:
 - `login(function callback(obj err, bool logged){})`
 - `getAccounts(function callback(obj err, array cuentas (1)))`
 - `checkStatus(function callback(obj err, bool loggedIn))`
 - `startKeepAlive(function callback(obj err (2)))`

(1): El arreglo `cuentas` debe tener el siguiente formato:
```js
[
	{
		accNumber: "(no. de la cuenta, obligatorio)",
		accType: "(tipo de cuenta, ej: vista, corriente, no es relevante)",
		accBal: "(balance de la cuenta, obligatorio)"
	}
]
```
(2): La función startKeepAlive es una función que ejecuta el callback si
no se ha podido mantener la sesión abierta. Por ende, el esta función debería
existir como una función que revise el estado de la sesión cada cierto tiempo.
Revisar los módulos existentes para mayor info y ejemplos.