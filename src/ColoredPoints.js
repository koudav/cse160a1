// ColoredPoint.js (c) 2012 matsuda
// Vertex shader program
var VSHADER_SOURCE = `
  attribute vec4 a_Position;
  uniform float u_Size;
  void main() { 
    gl_Position = a_Position;
    //gl_PointSize = 10.0;
    gl_PointSize = u_Size;
  }`

// Fragment shader program
var FSHADER_SOURCE = `
  precision mediump float;
  uniform vec4 u_FragColor;  // uniform変数
  void main() {
    gl_FragColor = u_FragColor;
  }`

// Global vars
let canvas;
let gl;
let a_Position;
let u_FragColor;
let u_Size;

function setupWebGL(){
    // Retrieve <canvas> element
    canvas = document.getElementById('webgl');

    // Get the rendering context for WebGL
    gl = canvas.getContext("webgl", { preserveDrawingBuffer: true });
    if (!gl) {
      console.log('Failed to get the rendering context for WebGL');
      return;
    }
}

function connectVariablesToGLSL(){
  // Initialize shaders
  if (!initShaders(gl, VSHADER_SOURCE, FSHADER_SOURCE)) {
    console.log('Failed to intialize shaders.');
    return;
  }

  // // Get the storage location of a_Position
  a_Position = gl.getAttribLocation(gl.program, 'a_Position');
  if (a_Position < 0) {
    console.log('Failed to get the storage location of a_Position');
    return;
  }

  // Get the storage location of u_FragColor
  u_FragColor = gl.getUniformLocation(gl.program, 'u_FragColor');
  if (!u_FragColor) {
    console.log('Failed to get the storage location of u_FragColor');
    return;
  }

  // Get the storage location of u_Size
  u_Size = gl.getUniformLocation(gl.program, 'u_Size');
  if (!u_Size) {
    console.log('Failed to get the storage location of u_Size');
    return;
  }
}

// Constants
const POINT = 0;
const TRIANGLE = 1;
const CIRCLE = 2;

// Global vars related to UI elements
let g_selectedColor = [1.0,1.0,1.0,1.0];
let g_selectedSize = 5;
let g_selectedType = POINT;
let g_segmentCount = 6;
let g_selectedAlpha = 100;

// Set up actions for HTML UI elements
function addActionsForHtmlUI() {
  
  // Button Events (Shape Type)
  /*document.getElementById("green").onclick = function() {g_selectedColor = [0.0,1.0,0.0,1.0]; };
  document.getElementById("red").onclick = function() {g_selectedColor = [1.0,0.0,0.0,1.0]; };*/
  document.getElementById("clearButton").onclick = function() {g_shapesList = []; renderAllShapes(); };

  document.getElementById("pointButton").onclick = function() {g_selectedType = POINT; };
  document.getElementById("triButton").onclick = function() {g_selectedType = TRIANGLE; };
  document.getElementById("circleButton").onclick = function() {g_selectedType = CIRCLE; };
  document.getElementById("surpriseButton").onclick = function() {g_shapesList = []; renderAllShapes(); renderSurprise();};

  // Slider Events
  document.getElementById("redSlide").addEventListener('mouseup', function() {g_selectedColor[0] = this.value/100;});
  document.getElementById("greenSlide").addEventListener('mouseup', function() {g_selectedColor[1] = this.value/100;});
  document.getElementById("blueSlide").addEventListener('mouseup', function() {g_selectedColor[2] = this.value/100;});
  document.getElementById("alphaSlide").addEventListener('mouseup', function() {g_selectedColor[3] = this.value/100;});
  

  // Size Slider Events
  document.getElementById("segSlide").addEventListener('mouseup', function() {g_segmentCount = this.value;});
  document.getElementById("sizeSlide").addEventListener('mouseup', function() {g_selectedSize = this.value;});
}

function main() {
  // Set up canvas and gl vars
  setupWebGL();

  // Set up GLSL shader programs and connect GLSL vars
  connectVariablesToGLSL();

  // Set up actions for HTML UI elements
  addActionsForHtmlUI();

  // Register function (event handler) to be called on a mouse press
  canvas.onmousedown = click;
  // and also while moving, if a button is pressed
  canvas.onmousemove = function(ev) {if(ev.buttons==1) {click(ev)} };

  // Specify the color for clearing <canvas>
  gl.clearColor(0.0, 0.0, 0.0, 1.0);

  // Clear <canvas>
  gl.clear(gl.COLOR_BUFFER_BIT);
}

var g_shapesList = [];

/*var g_points = [];  // The array for the position of a mouse press
var g_colors = [];  // The array to store the color of a point
var g_sizes = []; // The array to store the size of a point*/

function click(ev) {

  // Extract the event click and return it in WebGL coords
  let [x,y] = convertCoordinatesEventToGL(ev);
  
  // Create and store new point
  let point;
  switch (g_selectedType) {
    case TRIANGLE:
      point = new Triangle();
      break;
    case POINT:
      point = new Point();
      break;
    case CIRCLE:
      point = new Circle();
      break;
    default:
      point = new Point();
      break; 
  }

  point.position=[x,y];
  point.color=g_selectedColor.slice();
  point.size=g_selectedSize;
  if (g_selectedType == CIRCLE) {
    point.segments = g_segmentCount;
  }
  //console.log("pushing point with color: " + point.color);
  g_shapesList.push(point);

  /*// Store the coordinates to g_points array
  g_points.push([x,y]);

  // Store selected color to g_colors array
  g_colors.push(g_selectedColor.slice());

  // Store size to g_sizes array
  g_sizes.push(g_selectedSize);*/

  /* // Deprecated: Picked color via coordinate
  // Store the coordinates to g_colors array
  if (x >= 0.0 && y >= 0.0) {      // First quadrant
    g_colors.push([1.0, 0.0, 0.0, 1.0]);  // Red
  } else if (x < 0.0 && y < 0.0) { // Third quadrant
    g_colors.push([0.0, 1.0, 0.0, 1.0]);  // Green
  } else {                         // Others
    g_colors.push([1.0, 1.0, 1.0, 1.0]);  // White
  }*/

  // draw every shape on the canvas
  renderAllShapes();
}

function convertCoordinatesEventToGL(ev) {
  var x = ev.clientX; // x coordinate of a mouse pointer
  var y = ev.clientY; // y coordinate of a mouse pointer
  var rect = ev.target.getBoundingClientRect();

  x = ((x - rect.left) - canvas.width/2)/(canvas.width/2);
  y = (canvas.height/2 - (y - rect.top))/(canvas.height/2);

  return [x,y];
}

function renderAllShapes(){
  // Check time at start of function
  var startTime = performance.now();

  // Clear <canvas>
  gl.clear(gl.COLOR_BUFFER_BIT);
  gl.enable(gl.BLEND);
  gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

  //var len = g_points.length;
  var len = g_shapesList.length;

  for(var i = 0; i < len; i++) {
    g_shapesList[i].render();
  }

  // Check time at end of function and display on webpage
  var duration = performance.now() - startTime;
  //sendTextToHTML("numdot: " + len + " ms: " + Math.floor(duration) + " fps: " + Math.floor(10000/duration)/10, "numdot");
  return;
}

/*function sendTextToHTML(text, htmlID) {
  var htmlElm = document.getElementById(htmlID);
  if (!htmlElm) {
    console.log("Failed to get " + htmlID + "from HTML");
    return;
  }
  htmlElm.innerHTML = text;
}*/

// this is unholy but it works..
function renderSurprise(){

  let offsetX = -200;
  let offsetY = -200;


  // ground
  pushCustomTriangle([0.64, 0.32, 0.16, 1.0], [[0,0],[0,120],[400,120]]);
  pushCustomTriangle([0.64, 0.32, 0.16, 1.0], [[0,0],[400,0],[400,120]]);

  // tent
  pushCustomTriangle([0.2, 0.2, 0.2, 1.0], [[196,120],[204,120],[196,180]]);
  pushCustomTriangle([0.2, 0.2, 0.2, 1.0], [[196,180],[204,120],[204,180]]);
  pushCustomTriangle([0.3, 0.45, 0.25, 1.0], [[120,120],[140,120],[140,180]]);
  pushCustomTriangle([0.3, 0.45, 0.25, 1.0], [[260,120],[260,180],[280,120]]);
  pushCustomTriangle([0.3, 0.45, 0.25, 1.0], [[140,180],[260,180],[200,200]]);
  pushCustomTriangle([0.3, 0.45, 0.25, 1.0], [[140,120],[200,180],[140,180]]);
  pushCustomTriangle([0.3, 0.45, 0.25, 1.0], [[260,120],[260,180],[200,180]]);

  
  // beam
  pushCustomTriangle([0.9, 0.75, 0.1, 1.0], [[0,400],[280,120],[400,120]]);

  // celestial being
  pushCustomTriangle([0.9, 0.9, 0.9, 1.0], [[0,400],[0,340],[10,340]]);
  pushCustomTriangle([0.9, 0.9, 0.9, 1.0], [[0,400],[0,340],[10,340]]);
  pushCustomTriangle([0.9, 0.9, 0.9, 1.0], [[0,400],[10,340],[40,350]]);
  pushCustomTriangle([0.9, 0.9, 0.9, 1.0], [[0,400],[40,350],[50,360],]);
  pushCustomTriangle([0.9, 0.9, 0.9, 1.0], [[0,400],[50,360],[60,390]]);
  pushCustomTriangle([0.9, 0.9, 0.9, 1.0], [[0,400],[60,390],[60,400]]);

  // celestial scars
  pushCustomTriangle([0.01, 0.01, 0.01, 1.0], [[0,390],[1,392],[3,395]]);
  pushCustomTriangle([0.01, 0.01, 0.01, 1.0], [[5,360],[6,362],[8,365]]);
  pushCustomTriangle([0.01, 0.01, 0.01, 1.0], [[14,360],[15,362],[17,365]]);
  pushCustomTriangle([0.01, 0.01, 0.01, 1.0], [[17,350],[21,356],[26,363]]);
  pushCustomTriangle([0.01, 0.01, 0.01, 1.0], [[23,370],[24,372],[25,375]]);
  pushCustomTriangle([0.01, 0.01, 0.01, 1.0], [[33,380],[34,382],[36,385]]);
  pushCustomTriangle([0.01, 0.01, 0.01, 1.0], [[38,390],[39,392],[41,395]]);
  pushCustomTriangle([0.01, 0.01, 0.01, 1.0], [[42,350],[43,352],[45,355]]);
  pushCustomTriangle([0.01, 0.01, 0.01, 1.0], [[48,390],[49,392],[51,395]]);

  renderAllShapes();
}

function pushCustomTriangle(thisColor, theseCoords){
  let offsetX = -200;
  let offsetY = -200;

  let point1 = new Triangle();
  point1.position=[0,0,0];
  point1.color=[thisColor[0], thisColor[1], thisColor[2], thisColor[3]];
  point1.size=g_selectedSize;
  point1.isCustom=true;
  point1.customCoords[0] = [(theseCoords[0][0] + offsetX)/200, (theseCoords[0][1] + offsetY)/200];
  point1.customCoords[1] = [(theseCoords[1][0] + offsetX)/200, (theseCoords[1][1] + offsetY)/200];
  point1.customCoords[2] = [(theseCoords[2][0] + offsetX)/200, (theseCoords[2][1] + offsetY)/200];
  g_shapesList.push(point1);
}
