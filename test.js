//Dependencies
var express = require('express');
var app = express();
var Gpio = require('onoff').Gpio,
motor = new Gpio(17, 'out'),
button = new Gpio(18, 'in', 'both');

/*
setInterval(function() {
	console.log('f called.\n');
	motor.writeSync(1);
}, 1000);
*/

button.watch(function (err, state) {
	console.log('Interrupt triggered. State:', state, '\n');
});


//Exit
function exit() {
  button.unexport();
  process.exit();
}

process.on('SIGINT', exit);


//HTTP client handlers
//Get request
app.get('/', function(request, response) {
	response.send('Raghav Abboy\'s Pi: Hello.\n');
});

app.listen(3000, '192.168.43.193', function() {
	console.log('App listening on port 3000.\n');
});


