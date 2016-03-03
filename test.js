//Dependencies - Packages
var express = require('express');
var app = express();
var cors = require('cors');
var http = require('http').Server(app);
var io = require('socket.io')(http);
var morgan = require('morgan');
var bodyParser = require('body-parser');
var raspi = require('raspi');
var PWM = require('raspi-pwm').PWM;

var pwm;
raspi.init(function() {
	pwm = new PWM('GPIO19');
	pwm.write(94); //(94);
});

app.use(morgan('dev'));
app.use(bodyParser.urlencoded({extended: true}));
app.use(bodyParser.json());
app.use(cors());

var Gpio = require('onoff').Gpio,

//Initialize ports and pins
motor = new Gpio(17, 'out'),
button = new Gpio(18, 'in', 'both'),
r = new Gpio(20, 'out'),
g = new Gpio(16, 'out'),
b = new Gpio(21, 'out');

//Helpers
var global = require('./global.js');

//Variables
var count = 0;

//------------------------------------------------------------

var red = function() {
	r.writeSync(1);
	g.writeSync(0);
	b.writeSync(0);
}

var green = function() {
	r.writeSync(0);
	g.writeSync(1);
	b.writeSync(0);
}

//----------------------------------------------------------
//Servo Control
//Turn left
var closeDoor = function() {
	pwm.write(94); //97
	red();
}

var openDoor = function() {
	pwm.write(48); //56
	green();
}

var grantAccess = function() {
	openDoor();
	setTimeout(closeDoor, 3000);
};


//Helper functions
var initGlobal = function() {
	setPassword(global.password);
	count = 0;
}

var setPassword = function(password) {
	//global.password = password;
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

//Generate ontime using the normalized bounding algorithm
var generateOntime = function(digit) {
    var x1 = Math.random();
    //console.log('x1: ', x1);
    
    var m = Math.floor(370 + x1*630);
    var M = Math.floor((7*m - 1800)/2);
    
    //var m = 600;
    //var M = 1200;
        
    var mew1 = (M+m)/2;
    
    //console.log('m:',m ,' M:',M, ' mew1:', mew1, ' mew5:', mew1*5);
    
    var cf = 5*mew1 - digit*mew1;
    var x2 = Math.random();
    
    var genDelay = Math.floor(m + x2*(M-m));
    
    var delay = Math.floor(genDelay + cf/digit);
    
    //console.log('cf: ', cf, ' genDelay: ',genDelay, ' delay:', delay,' delay*digit:', delay*digit);
	console.log('Delay:', delay);
    return delay;
};


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
red();
//setTimeout(green, 3000);
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
		var ontime = generateOntime(currDigit);
		if(input === 0) { count++; vibrate(ontime,400); }
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
		grantAccess();
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
	//console.log('Get request received.', request.headers);
	//response.send('Raghav Abboy\'s Pi: Hello.\n');
	response.status(200).send(JSON.stringify(global));
});

//POST Request
app.post('/', function (req, res) {
	var data = +Object.keys(req.body)[0];
	console.log('POST request received! Data:', data);
	if(data === 1) { grantAccess(); }
	res.status(200).send('test.js says: Thanks!');
});

//app.listen(3000, function() {
//	console.log('App listening on port 3000.\n');
//});

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


