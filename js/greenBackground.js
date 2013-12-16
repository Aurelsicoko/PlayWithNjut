navigator.getUserMedia = ( navigator.getUserMedia ||
           navigator.webkitGetUserMedia ||
           navigator.mozGetUserMedia ||
           navigator.msGetUserMedia);

var video, width, height, context, canvas, theStream;



function initialize(callback) {
	console.log("init");
	// The source video.
	video = document.getElementById("v");
	width = video.width;
	height = video.height;

	// The target canvas.
	canvas = document.getElementById("c");
	context = canvas.getContext("2d");
	context.webkitImageSmoothingEnabled=false;


	// Get the webcam's stream.
	navigator.getUserMedia({video: true}, function(stream){
		callback();
		theStream = stream;
		video.src = URL.createObjectURL(stream);
		video.play();
		
		// Ready! Let's start drawing.
		requestAnimationFrame(draw);
	});
}

function stopStream(){
	theStream.stop();
	video.src="";
}

function draw() {
var frame = readFrame();

if (frame) {
  replaceGreen(frame.data);
  context.beginPath();
  context.putImageData(frame, 0, 0);
  context.closePath();
}

// Wait for the next frame.
requestAnimationFrame(draw);
}

function readFrame() {
try {
	context.beginPath();
	context.drawImage(video, 0, 0, width, height);
	context.closePath();
} catch (e) {
  // The video may not be ready, yet.
  return null;
}

return context.getImageData(0, 0, width, height);
}

function replaceGreen(data){
var len = data.length;

for (var i = 0, j = 0; j < len; i++, j += 4){

	// Convert from RGB to HSL...
	var hsl = rgb2hsl(data[j], data[j + 1], data[j + 2]);
	var h = hsl[0], s = hsl[1], l = hsl[2];

	// ...and check if we have a somewhat green pixel.
	if (h >= 70 && h <= 150 && s >= 10 && s <= 100 && l >= 10 && l <= 80){
		data[j + 3] = 0;
	}
}
}

function rgb2hsl(r, g, b) {
r /= 255; g /= 255; b /= 255;

var min = Math.min(r, g, b);
var max = Math.max(r, g, b);
var delta = max - min;
var h, s, l;

if (max == min) {
  h = 0;
} else if (r == max) {
  h = (g - b) / delta;
} else if (g == max) {
  h = 2 + (b - r) / delta;
} else if (b == max) {
  h = 4 + (r - g) / delta;
}

h = Math.min(h * 60, 360);

if (h < 0) {
  h += 360;
}

l = (min + max) / 2;

if (max == min) {
  s = 0;
} else if (l <= 0.5) {
  s = delta / (max + min);
} else {
  s = delta / (2 - max - min);
}

return [h, s * 100, l * 100];
}