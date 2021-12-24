

// Circle Resolution
const circleResolution = 64;

// Init Game
initScene();

document.addEventListener('keydown', (event) => {
  const linearAcc = 0.25;
  const angularAcc = 1.0;
  if (event.code == "KeyD") {
    ufo.torque = -ufo.MoI * angularAcc;
  }
  if (event.code == "KeyA") {
    ufo.torque = ufo.MoI * angularAcc;
  }
  if (event.code == "KeyW") {
    ufo.force.x = Math.cos(ufo.alpha) * linearAcc * ufo.mass;
    ufo.force.y = Math.sin(ufo.alpha) * linearAcc * ufo.mass;
  }
  if (event.code == "KeyS") {
    ufo.force.x = -Math.cos(ufo.alpha) * linearAcc * ufo.mass;
    ufo.force.y = -Math.sin(ufo.alpha) * linearAcc * ufo.mass;
  }
});

document.addEventListener('keyup', (event) => {
  if (event.code == "KeyD") {
    ufo.torque = 0.0;
  }
  if (event.code == "KeyA") {
    ufo.torque = 0.0;
  }
  if (event.code == "KeyW") {
    ufo.force.x = 0.0;
    ufo.force.y = 0.0;
  }
  if (event.code == "KeyS") {
    ufo.force.x = 0.0;
    ufo.force.y = 0.0;
  }
});


main();

//
// Start here
//
function main() {
  const canvas = document.querySelector('#glcanvas');
  const gl = canvas.getContext('webgl');

  // If we don't have a GL context, give up now

  if (!gl) {
    alert('Unable to initialize WebGL. Your browser or machine may not support it.');
    return;
  }

  // Vertex shader program

  const vsSource = `
    attribute vec4 aVertexPosition;
    attribute vec2 aTextureCoord;
    uniform mat4 uModelViewMatrix;
    uniform mat4 uProjectionMatrix;
    varying highp vec2 vTextureCoord;
    void main(void) {
      gl_Position = uProjectionMatrix * uModelViewMatrix * aVertexPosition;
      vTextureCoord = aTextureCoord;
    }
  `;

  // Fragment shader program

  const fsSource = `
    varying highp vec2 vTextureCoord;
    uniform sampler2D uSampler;
    void main(void) {
      gl_FragColor = texture2D(uSampler, vTextureCoord);
    }
  `;

  // Initialize a shader program; this is where all the lighting
  // for the vertices and so forth is established.
  const shaderProgram = initShaderProgram(gl, vsSource, fsSource);

  // Collect all the info needed to use the shader program.
  // Look up which attributes our shader program is using
  // for aVertexPosition, aTextureCoord and also
  // look up uniform locations.
  const programInfo = {
    program: shaderProgram,
    attribLocations: {
      vertexPosition: gl.getAttribLocation(shaderProgram, 'aVertexPosition'),
      textureCoord: gl.getAttribLocation(shaderProgram, 'aTextureCoord'),
    },
    uniformLocations: {
      projectionMatrix: gl.getUniformLocation(shaderProgram, 'uProjectionMatrix'),
      modelViewMatrix: gl.getUniformLocation(shaderProgram, 'uModelViewMatrix'),
      uSampler: gl.getUniformLocation(shaderProgram, 'uSampler'),
    },
  };

  // Here's where we call the routine that builds all the
  // objects we'll be drawing.
  const buffers = initBuffers(gl);

  const earth_tex = loadTexture(gl, 'earth.png');
  const ufo_tex = loadTexture(gl, 'ufo.png');
  const asteroid_tex = loadTexture(gl, 'asteroid.png');

  var then = 0;

  // Draw the scene repeatedly
  function render(now) {
    now *= 0.001;  // convert to seconds
    const deltaTime = now - then;
    then = now;

    var currentSimTime = 0.0;
    const simStep = 0.001;
    while(currentSimTime < deltaTime)
    {
      performSimStep(simStep);
      currentSimTime += simStep;
    }
    // Check if won
    {
      var won = true;
      const deltaX = ufo.position.x - earth.position.x;
      const deltaY = ufo.position.y - earth.position.y;
      won = won && deltaX * deltaX + deltaY * deltaY < earth.size;
      won = won && ufo.velocity.x * ufo.velocity.x + ufo.velocity.y * ufo.velocity.y < 0.1;
      won = won && ufo.angularVelocity < 0.1;
      if(won)
      {
        document.getElementById("WinHeader").innerHTML = "!!!You Won!!!";
      }
      else
      {
        document.getElementById("WinHeader").innerHTML = "";
      }
    }
    

    drawScene(gl, programInfo, buffers, earth_tex, ufo_tex, asteroid_tex);

    requestAnimationFrame(render);
  }
  requestAnimationFrame(render);
}

function getVertexCount()
{
  return circleResolution + 1 + Math.floor(1 + circleResolution / 2);
}

function getCirclePositions(center_x, center_y, radius)
{
  const totalPoints = circleResolution;
  var positions = [];
  const dAlpha = 2.0 * Math.PI / (totalPoints);
  var alpha = 0.0;
  for(var i = 0; i <= circleResolution; i++)
  {
    var offset_x = Math.cos(alpha) * radius;
    var offset_y = Math.sin(alpha) * radius;
    if(positions.length % 3 == 0)
    {
      positions.push(center_x, center_y);
    }
    positions.push(center_x + offset_x, center_y + offset_y);
    alpha += dAlpha;
  }

  circleVertexCount = positions.length / 2;

  return positions;
}

function getCircleTextureCoords()
{
  const totalPoints = circleResolution;
  var positions = [];
  const dAlpha = 2.0 * Math.PI / (totalPoints);
  var alpha = 0.0;
  for(var i = 0; i <= circleResolution; i++)
  {
    var offset_x = Math.cos(alpha) * 0.5;
    var offset_y = Math.sin(alpha) * 0.5;
    if(positions.length % 3 == 0)
    {
      positions.push(0.5, 0.5);
    }
    positions.push(0.5 + offset_x, 0.5 - offset_y);
    alpha += dAlpha;
  }

  circleVertexCount = positions.length / 2;

  return positions;
}

//
// initBuffers
//
// Initialize the buffers we'll need. For this demo, we just
// have one object -- a simple three-dimensional cube.
//
function initBuffers(gl) {

  // Create a buffer for the cube's vertex positions.

  const positionBuffer = gl.createBuffer();

  // Select the positionBuffer as the one to apply buffer
  // operations to from here out.

  gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);

  // Now create an array of positions for the cube.

  var positions = [];

  const earthPositions = getCirclePositions(0, 0, 1);
  Array.prototype.push.apply(positions, earthPositions);

  const ufoPositions = getCirclePositions(0, 0, 1);
  Array.prototype.push.apply(positions, ufoPositions);

  for(var i = 0; i < numAsteroids; i++)
  {
    const asteroidPositions = getCirclePositions(0, 0, 1);
    Array.prototype.push.apply(positions, asteroidPositions);
  }

  // Now pass the list of positions into WebGL to build the
  // shape. We do this by creating a Float32Array from the
  // JavaScript array, then use it to fill the current buffer.

  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(positions), gl.STATIC_DRAW);

  // Now set up the texture coordinates for the faces.

  const textureCoordBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, textureCoordBuffer);

  var textureCoordinates = [];

  const earthTextureCoordinates = getCircleTextureCoords();
  Array.prototype.push.apply(textureCoordinates, earthTextureCoordinates);

  const ufoTextureCoordinates = getCircleTextureCoords();
  Array.prototype.push.apply(textureCoordinates, ufoTextureCoordinates);

  for(var i = 0; i < numAsteroids; i++)
  {
    const asteroidTextureCoordinates = getCircleTextureCoords();
    Array.prototype.push.apply(textureCoordinates, asteroidTextureCoordinates);
  }

  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(textureCoordinates),
                gl.STATIC_DRAW);

  return {
    position: positionBuffer,
    textureCoord: textureCoordBuffer,
  };
}

//
// Initialize a texture and load an image.
// When the image finished loading copy it into the texture.
//
function loadTexture(gl, url) {
  const texture = gl.createTexture();
  gl.bindTexture(gl.TEXTURE_2D, texture);

  // Because images have to be download over the internet
  // they might take a moment until they are ready.
  // Until then put a single pixel in the texture so we can
  // use it immediately. When the image has finished downloading
  // we'll update the texture with the contents of the image.
  const level = 0;
  const internalFormat = gl.RGBA;
  const width = 1;
  const height = 1;
  const border = 0;
  const srcFormat = gl.RGBA;
  const srcType = gl.UNSIGNED_BYTE;
  const pixel = new Uint8Array([0, 0, 255, 255]);  // opaque blue
  gl.texImage2D(gl.TEXTURE_2D, level, internalFormat,
                width, height, border, srcFormat, srcType,
                pixel);

  const image = new Image();
  image.onload = function() {
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texImage2D(gl.TEXTURE_2D, level, internalFormat,
                  srcFormat, srcType, image);

    // WebGL1 has different requirements for power of 2 images
    // vs non power of 2 images so check if the image is a
    // power of 2 in both dimensions.
    if (isPowerOf2(image.width) && isPowerOf2(image.height)) {
       // Yes, it's a power of 2. Generate mips.
       gl.generateMipmap(gl.TEXTURE_2D);
    } else {
       // No, it's not a power of 2. Turn of mips and set
       // wrapping to clamp to edge
       gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
       gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
       gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    }
  };
  image.src = url;

  return texture;
}

function isPowerOf2(value) {
  return (value & (value - 1)) == 0;
}

function drawEarth(gl, programInfo, offset, earth_tex)
{

  // Specify the texture to map onto the faces.

  // Tell WebGL we want to affect texture unit 0
  gl.activeTexture(gl.TEXTURE0);

  // Bind the texture to texture unit 0
  gl.bindTexture(gl.TEXTURE_2D, earth_tex);

  // Tell the shader we bound the texture to texture unit 0
  gl.uniform1i(programInfo.uniformLocations.uSampler, 0);
  // Set the drawing position to the "identity" point, which is
  // the center of the scene.
  const modelViewMatrix = mat4.create();

  // Now move the drawing position a bit to where we want to
  // start drawing the square.

  mat4.translate(modelViewMatrix,     // destination matrix
                 modelViewMatrix,     // matrix to translate
                 [earth.position.x, earth.position.y, -6.0]);  // amount to translate
  mat4.rotate(modelViewMatrix,  // destination matrix
              modelViewMatrix,  // matrix to rotate
              0.0,     // amount to rotate in radians
              [0, 0, 1]);       // axis to rotate around (Z)

  mat4.scale(modelViewMatrix,
    modelViewMatrix,
    [earth.size, earth.size, 1]);

  gl.uniformMatrix4fv(
    programInfo.uniformLocations.modelViewMatrix,
    false,
    modelViewMatrix);


  const vertexCount = getVertexCount();
  gl.drawArrays(gl.TRIANGLE_STRIP, offset, vertexCount);


  return offset + vertexCount;
}

function drawUfo(gl, programInfo, offset, ufo_tex)
{

  // Specify the texture to map onto the faces.

  // Tell WebGL we want to affect texture unit 0
  gl.activeTexture(gl.TEXTURE1);

  // Bind the texture to texture unit 0
  gl.bindTexture(gl.TEXTURE_2D, ufo_tex);

  // Tell the shader we bound the texture to texture unit 0
  gl.uniform1i(programInfo.uniformLocations.uSampler, 1);
  // Set the drawing position to the "identity" point, which is
  // the center of the scene.
  const modelViewMatrix = mat4.create();

  // Now move the drawing position a bit to where we want to
  // start drawing the square.

  mat4.translate(modelViewMatrix,     // destination matrix
                 modelViewMatrix,     // matrix to translate
                 [ufo.position.x, ufo.position.y, -6.0]);  // amount to translate
  mat4.rotate(modelViewMatrix,  // destination matrix
              modelViewMatrix,  // matrix to rotate
              ufo.alpha,     // amount to rotate in radians
              [0, 0, 1]);       // axis to rotate around (Z)

  mat4.scale(modelViewMatrix,
    modelViewMatrix,
    [ufo.size, ufo.size, 1]);

  gl.uniformMatrix4fv(
    programInfo.uniformLocations.modelViewMatrix,
    false,
    modelViewMatrix);


  const vertexCount = getVertexCount();
  gl.drawArrays(gl.TRIANGLE_STRIP, offset, vertexCount);


  return offset + vertexCount;
}

function drawAsteroids(gl, programInfo, offset, asteroid_tex)
{
  

  // Specify the texture to map onto the faces.

  // Tell WebGL we want to affect texture unit 0
  gl.activeTexture(gl.TEXTURE2);

  // Bind the texture to texture unit 0
  gl.bindTexture(gl.TEXTURE_2D, asteroid_tex);

  // Tell the shader we bound the texture to texture unit 0
  gl.uniform1i(programInfo.uniformLocations.uSampler, 2);

  for(var i = 0; i < asteroids.length; i++)
  {
    // Set the drawing position to the "identity" point, which is
    // the center of the scene.
    const modelViewMatrix = mat4.create();

    // Now move the drawing position a bit to where we want to
    // start drawing the square.

    mat4.translate(modelViewMatrix,     // destination matrix
                  modelViewMatrix,     // matrix to translate
                  [asteroids[i].position.x, asteroids[i].position.y, -6.0]);  // amount to translate
    mat4.rotate(modelViewMatrix,  // destination matrix
                modelViewMatrix,  // matrix to rotate
                asteroids[i].alpha,     // amount to rotate in radians
                [0, 0, 1]);       // axis to rotate around (Z)

    mat4.scale(modelViewMatrix,
      modelViewMatrix,
      [asteroids[i].size, asteroids[i].size, 1]);

    gl.uniformMatrix4fv(
      programInfo.uniformLocations.modelViewMatrix,
      false,
      modelViewMatrix);

    const vertexCount = getVertexCount();
    gl.drawArrays(gl.TRIANGLE_STRIP, offset, vertexCount);
    offset += vertexCount;
  }
  

  return offset;
}

//
// Draw the scene.
//
function drawScene(gl, programInfo, buffers, earth_tex, ufo_tex, asteroid_tex) {
  gl.clearColor(0.0, 0.0, 0.0, 1.0);  // Clear to black, fully opaque
  gl.clearDepth(1.0);                 // Clear everything
  gl.enable(gl.DEPTH_TEST);           // Enable depth testing
  gl.depthFunc(gl.LEQUAL);            // Near things obscure far things

  // Clear the canvas before we start drawing on it.

  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

  // Create a perspective matrix, a special matrix that is
  // used to simulate the distortion of perspective in a camera.
  // Our field of view is 45 degrees, with a width/height
  // ratio that matches the display size of the canvas
  // and we only want to see objects between 0.1 units
  // and 100 units away from the camera.

  const fieldOfView = 45 * Math.PI / 180;   // in radians
  const aspect = gl.canvas.clientWidth / gl.canvas.clientHeight;
  const zNear = 0.1;
  const zFar = 100.0;
  const projectionMatrix = mat4.create();

  // note: glmatrix.js always has the first argument
  // as the destination to receive the result.
  mat4.perspective(projectionMatrix,
                   fieldOfView,
                   aspect,
                   zNear,
                   zFar);

  // Tell WebGL how to pull out the positions from the position
  // buffer into the vertexPosition attribute
  {
    const numComponents = 2;
    const type = gl.FLOAT;
    const normalize = false;
    const stride = 0;
    const offset = 0;
    gl.bindBuffer(gl.ARRAY_BUFFER, buffers.position);
    gl.vertexAttribPointer(
        programInfo.attribLocations.vertexPosition,
        numComponents,
        type,
        normalize,
        stride,
        offset);
    gl.enableVertexAttribArray(
        programInfo.attribLocations.vertexPosition);
  }

  // Tell WebGL how to pull out the texture coordinates from
  // the texture coordinate buffer into the textureCoord attribute.
  {
    const numComponents = 2;
    const type = gl.FLOAT;
    const normalize = false;
    const stride = 0;
    const offset = 0;
    gl.bindBuffer(gl.ARRAY_BUFFER, buffers.textureCoord);
    gl.vertexAttribPointer(
        programInfo.attribLocations.textureCoord,
        numComponents,
        type,
        normalize,
        stride,
        offset);
    gl.enableVertexAttribArray(
        programInfo.attribLocations.textureCoord);
  }

  // Tell WebGL to use our program when drawing

  gl.useProgram(programInfo.program);

  // Set the shader uniforms

  gl.uniformMatrix4fv(
      programInfo.uniformLocations.projectionMatrix,
      false,
      projectionMatrix);

  var offset = 0;
  offset = drawEarth(gl, programInfo, offset, earth_tex);
  offset = drawUfo(gl, programInfo, offset, ufo_tex);
  offset = drawAsteroids(gl, programInfo, offset, asteroid_tex);  
}

//
// Initialize a shader program, so WebGL knows how to draw our data
//
function initShaderProgram(gl, vsSource, fsSource) {
  const vertexShader = loadShader(gl, gl.VERTEX_SHADER, vsSource);
  const fragmentShader = loadShader(gl, gl.FRAGMENT_SHADER, fsSource);

  // Create the shader program

  const shaderProgram = gl.createProgram();
  gl.attachShader(shaderProgram, vertexShader);
  gl.attachShader(shaderProgram, fragmentShader);
  gl.linkProgram(shaderProgram);

  // If creating the shader program failed, alert

  if (!gl.getProgramParameter(shaderProgram, gl.LINK_STATUS)) {
    alert('Unable to initialize the shader program: ' + gl.getProgramInfoLog(shaderProgram));
    return null;
  }

  return shaderProgram;
}

//
// creates a shader of the given type, uploads the source and
// compiles it.
//
function loadShader(gl, type, source) {
  const shader = gl.createShader(type);

  // Send the source to the shader object

  gl.shaderSource(shader, source);

  // Compile the shader program

  gl.compileShader(shader);

  // See if it compiled successfully

  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    alert('An error occurred compiling the shaders: ' + gl.getShaderInfoLog(shader));
    gl.deleteShader(shader);
    return null;
  }

  return shader;
}
