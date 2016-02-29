//Dependencies - Packages
var express = require('express');
var app = express();
var Gpio = require('onoff').Gpio,

//Initialize ports and pins
motor = new Gpio(17, 'out'),
button = new Gpio(18, 'in', 'both');

//Helpers
var global = require('./global.js');

//Variables
var count = 0;

//------------------------------------------------------------
//Helper functions
var initGlobal = function() {
	setPassword(123);
	count = 0;
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

//Synchronous Delay
var delay = function(ms) {
        var cur_ticks = Date.now(); //cur_d = Date.now();
        //var cur_ticks = cur_d.getTime();
        var ms_passed = 0;
        while(ms_passed < ms) {
            var ticks = Date.now();//d = Date.now(); 
            //var ticks = d.getTime();
            ms_passed = ticks - cur_ticks;
        }
}


//Vibrate the motor with an on and off time (ms)
var vibrate = function(ontime, offtime) {
	motor.writeSync(1);
	delay(ontime);
	motor.writeSync(0);
	delay(offtime);
}	

//------------------------------------------------------------
//Standby Logic
initGlobal();
//setPassword(8437934);

//------------------------------------------------------------
//Events and Listeners

//Action on a button press
var buttonAction = function(err, state) {
	//base case: neglect rising edge interrupts
	if(state === 1) { return; }
	
	var currDigit = global.digits[global.index];
	count = 0;
	console.log('Digit to unlock: ', currDigit);	

	var input = button.readSync();
	while(input === 0) {
		input = button.readSync();
		if(input === 0) { count++; vibrate(300,400); }
	}
	//Analyze counts held
	if(count === currDigit) { 
		console.log('Digit ', currDigit, ' unlocked!');
		global.index++;
	}
	else {
		global.attempts++;
		global.index = 0;
		console.log('Authentication failed. Attempts: ', global.attempts);
	}

	if(global.index === global.length) {
		console.log('Welcome Home!');
		global.index = 0;
		global.attempts = 0;
	}

	//console.log('Interrupt triggered. Init State:', state, ' Curr Input:', input, '\n');
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


