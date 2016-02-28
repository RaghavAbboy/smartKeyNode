//Dependencies - Packages
var express = require('express');
var app = express();
var Gpio = require('onoff').Gpio,

//Initialize ports and pins
motor = new Gpio(17, 'out'),
button = new Gpio(18, 'in', 'both');

//Helpers
var global = require('./global.js');

//------------------------------------------------------------
//Helper functions
var initGlobal = function() {
	setPassword(123);
}

var setPassword = function(password) {
	global.password = password;
	global.length = JSON.stringify(password).length;
	setDigits(password);
}

var setDigits = function(password) {
	var num = password;
	global.digits = [];
	while(num > 0) {
		var digit = num%10;
		global.digits.push(digit);
		num = Math.floor(num/10);
	}
	global.digits.reverse();
}	
//------------------------------------------------------------

//Standby Logic
//initGlobal();
setPassword(8437934);
console.log('Global object:', global);


//------------------------------------------------------------
//Events and Listeners

//Action on a button press
var buttonAction = function(err, state) {
	var input = button.readSync();
	while(input == 0) {
		input = button.readSync();
		console.log('Pressed...');
	}
	console.log('Interrupt triggered. State:', state, ' Input:', input, '\n');
}

//Event listeners
button.watch(buttonAction);
//------------------------------------------------------------


//------------------------------------------------------------
//HTTP client handlers
//Get request
app.get('/', function(request, response) {
	response.send('Raghav Abboy\'s Pi: Hello.\n');
});

app.listen(3000, '192.168.43.193', function() {
	console.log('App listening on port 3000.\n');
});
//------------------------------------------------------------

//------------------------------------------------------------
//Cleanup functions
function exit() {
  console.log('Cleaning up...');
  motor.unexport();
  button.unexport();
  process.exit();
}
process.on('SIGINT', exit);
//------------------------------------------------------------


