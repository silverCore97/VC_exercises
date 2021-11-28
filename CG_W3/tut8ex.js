// https://webglfundamentals.org/webgl/lessons/webgl-3d-camera.html
// https://webglfundamentals.org/webgl/lessons/webgl-3d-textures.html

////////////////////////////////////////////////////////////////////////////////
// Ignore this shtuff for now... ///////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////

const basicVertShaderSource = `
    attribute vec4 aVertexPosition;
    attribute vec4 aVertexColor;

    uniform mat4 uModelViewMatrix;
    uniform mat4 uProjectionMatrix;

    varying lowp vec4 vPosition; 
    varying lowp vec4 vColor; 

    void main(void) {
        gl_Position = uProjectionMatrix * uModelViewMatrix * aVertexPosition;
        vColor = aVertexColor;
        vPosition = aVertexPosition; 
    } 
`;

const texturedVertShaderSource = `
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

const coloredFragShaderSource = `
    varying lowp vec4 vColor; 

    void main(void) {
        gl_FragColor = vColor; 
    }
`; 

const texturedFragShaderSource = `
    varying highp vec2 vTextureCoord;
    uniform sampler2D uSampler;

    void main(void) {
      gl_FragColor = texture2D(uSampler, vTextureCoord);
    }
`;

const floorFragShaderSource = `
    precision highp float;
    varying lowp vec4 vPosition; 

    void main(void) {
        vec4 p = vPosition; 
        vec2 ab = .1*p.xz;
        vec3 A = .25 + .25*vec3(sin(ab.x), sin(ab.y), 1.);
        vec2 uv = floor(p.xz);
        vec3 B = .5 - .5*vec3(mod(uv.x + uv.y, 2.));
        gl_FragColor = vec4(mix(A, B, .5), 1.);
    }
`;

function setupShaderProgram(vertShaderSource, fragShaderSource) { 
    var vertShader = gl.createShader(gl.VERTEX_SHADER);
    gl.shaderSource(vertShader, vertShaderSource);
    gl.compileShader(vertShader);
    if (!gl.getShaderParameter(vertShader, gl.COMPILE_STATUS)) {
        alert("Problem with vertex shader...");
        alert(gl.getShaderInfoLog(vertShader));
        return;
    }

    var fragShader = gl.createShader(gl.FRAGMENT_SHADER);
    gl.shaderSource(fragShader, fragShaderSource);
    gl.compileShader(fragShader);
    if (!gl.getShaderParameter(fragShader, gl.COMPILE_STATUS)) {
        alert("Problem with fragment shader...");
        alert(gl.getShaderInfoLog(fragShader));
        return;
    }

    var shaderProgram = gl.createProgram();
    gl.attachShader(shaderProgram, vertShader);
    gl.attachShader(shaderProgram, fragShader);
    gl.linkProgram(shaderProgram);

    if (!gl.getProgramParameter(shaderProgram, gl.LINK_STATUS)) {
        alert("Could not initialise shaders");
    }

    gl.useProgram(shaderProgram);

    return shaderProgram;
};

var canvas = document.getElementById('canvas');
canvas.width = document.body.clientWidth;
canvas.height = document.body.clientHeight;
var gl = canvas.getContext('webgl');

var textCanvas = document.getElementById("text");
textCanvas.width = document.body.clientWidth;
textCanvas.height = document.body.clientHeight;
var ctx = textCanvas.getContext("2d");

var colorShaderProgram = setupShaderProgram(basicVertShaderSource, coloredFragShaderSource);
var textureShaderProgram = setupShaderProgram(texturedVertShaderSource, texturedFragShaderSource);
var floorShaderProgram = setupShaderProgram(basicVertShaderSource, floorFragShaderSource);
var shaderPrograms = [colorShaderProgram, textureShaderProgram, floorShaderProgram];

// NOTE: sets P, VM in _both_ shaders (they have the same vertex shader, but different uniform locations afaik)
function setPVM(P, V, M) { 
    let VM = mat4.create();
    mat4.multiply(VM, V, M);
    shaderPrograms.forEach(shaderProgram => { // Oh man oh man what is this language D:
        gl.useProgram(shaderProgram); // NOTE: "WebGL: INVALID_OPERATION: uniformMatrix4fv: location is not from current program"
        const uProjectionMatrix = gl.getUniformLocation(shaderProgram, 'uProjectionMatrix');
        const uModelViewMatrix  = gl.getUniformLocation(shaderProgram, 'uModelViewMatrix');
        gl.uniformMatrix4fv(uProjectionMatrix, false, P);
        gl.uniformMatrix4fv(uModelViewMatrix, false, VM);
    });
} 

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

////////////////////////////////////////////////////////////////////////////////

var globalTime = 0.;
var shouldRotate = false;

var camUp = [0., 1., 0.];
var camPos = [0, 2, 18];
var camDir = [0, 0, -1];

var objectRotation = [0., 0., 0];
var activeObject = 'ex1a';

function mousePressed() {

}

function moveCamera(dist, sideways) {
    var d = camDir.slice()
    if(sideways) {
        vec3.cross(d, camUp, d);
    }
    vec3.scale(d, d, dist);
    vec3.add(camPos, camPos, d);
}

function rotateCamera(angle) {
    var origin = [0., 0., 0.];
    vec3.rotateY(camDir, camDir, origin, angle);
}

function keyPressed(event) {

    if(event.code == 'KeyW') {
        moveCamera(0.1, false);
    }
    else if(event.code == 'KeyS') {
        moveCamera(-0.1, false);
    }
    else if(event.code == 'KeyA') {
        moveCamera(0.1, true);
    }
    else if(event.code == 'KeyD') {
        moveCamera(-0.1, true);
    }
    else if(event.code == 'KeyE') {
        rotateCamera(0.02);
    }
    else if(event.code == 'KeyQ') {
        rotateCamera(-0.02);
    }
    else if(event.code == 'ArrowUp') {
        objectRotation[0] += 0.1;
    }
    else if(event.code == 'ArrowDown') {
        objectRotation[0] -= 0.1;
    }
    else if(event.code == 'ArrowLeft') {
        objectRotation[1] -= 0.1;
    }
    else if(event.code == 'ArrowRight') {
        objectRotation[1] += 0.1;
    }
    else if(event.code == 'Space') {
        shouldRotate = !shouldRotate;
    }
    else if(event.code == 'Digit1') {
        activeObject = 'ex1a';
    }
    else if(event.code == 'Digit2') {
        activeObject = 'ex1b';
    }
    else if(event.code == 'Digit3') {
        activeObject = 'ex2a';
    }
    else if(event.code == 'Digit4') {https://sslvpn.ethz.ch/+CSCO+00756767633A2F2F7065792E7267756D2E7075++/teaching/2021_02_Visual_Computing/exercises/VC_CG_Exercise8.mp4
        activeObject = 'ex2b';
    }

}

function getCameraMatrix() { 
    let eye = camPos;
    var d = [0., 0., 0.]
    vec3.add(d, camPos, camDir)
    let TR = mat4.create();
    mat4.targetTo(TR, eye, d, [0., 1., 0.])
    return TR; 
}

function getViewMatrix() { 
    let V = mat4.create();
    mat4.invert(V, getCameraMatrix()); 
    return V; 
}

function getProjectionMatrix() {
    const fieldOfView = 45. * Math.PI / 180.; // NOTE: In radians.
    const aspect = gl.canvas.clientWidth / gl.canvas.clientHeight;
    const zNear = 0.1;
    const zFar = 100.0;
    let P = mat4.create(); 
    mat4.perspective(P, fieldOfView, aspect, zNear, zFar);
    return P;
}

// some colors for the faces
const face_colors = [ 
    [1.0,  0.0,  0.0,  1.0], 
    [0.0,  1.0,  0.0,  1.0], 
    [0.0,  0.0,  1.0,  1.0],

    [1.0,  1.0,  0.0,  1.0], 
    [1.0,  0.0,  1.0,  1.0], 
    [0.0,  1.0,  1.0,  1.0], 

    [0.5,  0.5,  1.0,  1.0], 
    [0.5,  1.0,  0.5,  1.0], 
    [1.0,  0.5,  0.5,  1.0], 

    [0.5,  0.0,  1.0,  1.0], 
    [0.0,  1.0,  0.5,  1.0], 
    [1.0,  0.5,  0.0,  1.0], 
    
    [0.0,  0.5,  1.0,  1.0], 
    [0.5,  1.0,  0.0,  1.0], 
    [1.0,  0.0,  0.5,  1.0],

    [0.5,  0.5,  0.5,  1.0],
];

// use this function to color faces. `n` is the number of faces
function colorVertices(n){
  var vertex_colors = [];
  for (var j = 0; j < n; ++j) {
      const c = face_colors[Math.min(j, 15)];
      vertex_colors = vertex_colors.concat(c, c, c, c); // four vertices per face, all same color
  }
  return vertex_colors;
}

////////////////////////////////////////////////////////////////////////////////
// Ex 1a: Make the cube taller!
////////////////////////////////////////////////////////////////////////////////

const cube = {
  vertices : [ 
    // Front face
    -1.0, -3.0,  1.0,
     1.0, -3.0,  1.0,
     1.0,  3.0,  1.0,
    -1.0,  3.0,  1.0,

    // Back face
    -1.0, -3.0, -1.0,
     1.0, -3.0, -1.0,
     1.0,  3.0, -1.0,
    -1.0,  3.0, -1.0,

    // Top face
    -1.0,  3.0, -1.0,
    -1.0,  3.0,  1.0,
     1.0,  3.0,  1.0,
     1.0,  3.0, -1.0,

    // Bottom face
    -1.0, -3.0, -1.0,
     1.0, -3.0, -1.0,
     1.0, -3.0,  1.0,
    -1.0, -3.0,  1.0,

    // Right face
     1.0, -3.0, -1.0,
     1.0,  3.0, -1.0,
     1.0,  3.0,  1.0,
     1.0, -3.0,  1.0,

    // Left face
    -1.0, -3.0, -1.0,
    -1.0, -3.0,  1.0,
    -1.0,  3.0,  1.0,
    -1.0,  3.0, -1.0,
  ],
  indices : [     
      0,  1,  2,      0,  2,  3,    // front
      4,  5,  6,      4,  6,  7,    // back
      8,  9,  10,     8,  10, 11,   // top
      12, 13, 14,     12, 14, 15,   // bottom
      16, 17, 18,     16, 18, 19,   // right
      20, 21, 22,     20, 22, 23,   // left
  ],
  vertex_colors : colorVertices(6), // pass in number of faces to have colored faces
};

// uncomment to start with ex1a geometry
activeObject = 'ex1a';

////////////////////////////////////////////////////////////////////////////////
// Ex 1b: Make an 'F'
////////////////////////////////////////////////////////////////////////////////

const Fshape = {
  vertices : [ 
	//Main pillar
    // Front face
    -1.0, -3.0,  1.0,
     1.0, -3.0,  1.0,
     1.0,  3.0,  1.0,
    -1.0,  3.0,  1.0,

    // Back face
    -1.0, -3.0, -1.0,
     1.0, -3.0, -1.0,
     1.0,  3.0, -1.0,
    -1.0,  3.0, -1.0,

    // Top face
    -1.0,  3.0, -1.0,
    -1.0,  3.0,  1.0,
     1.0,  3.0,  1.0,
     1.0,  3.0, -1.0,

    // Bottom face
    -1.0, -3.0, -1.0,
     1.0, -3.0, -1.0,
     1.0, -3.0,  1.0,
    -1.0, -3.0,  1.0,

    // Right face
     1.0, -3.0, -1.0,
     1.0,  3.0, -1.0,
     1.0,  3.0,  1.0,
     1.0, -3.0,  1.0,

    // Left face
    -1.0, -3.0, -1.0,
    -1.0, -3.0,  1.0,
    -1.0,  3.0,  1.0,
    -1.0,  3.0, -1.0,
	
	//Top pillar
	// Front face
    1.0,  1.0,  1.0,
    4.0,  1.0,  1.0,
    4.0,  3.0,  1.0,
    1.0,  3.0,  1.0,

    // Back face
    1.0,  1.0, -1.0,
    4.0,  1.0, -1.0,
    4.0,  3.0, -1.0,
    1.0,  3.0, -1.0,

    // Top face
    1.0,  3.0, -1.0,
    1.0,  3.0,  1.0,
    4.0,  3.0,  1.0,
    4.0,  3.0, -1.0,

    // Bottom face
    1.0,  1.0, -1.0,
    4.0,  1.0, -1.0,
    4.0,  1.0,  1.0,
    1.0,  1.0,  1.0,

    // Right face
    4.0,  1.0, -1.0,
    4.0,  3.0, -1.0,
    4.0,  3.0,  1.0,
    4.0,  1.0,  1.0,

    // Left face
    1.0,  1.0, -1.0,
    1.0,  1.0,  1.0,
    1.0,  3.0,  1.0,
    1.0,  3.0, -1.0,
	
	// Middle pillar
	// Front face
     1.0, -0.5,  1.0,
     3.0, -0.5,  1.0,
     3.0,  0.5,  1.0,
     1.0,  0.5,  1.0,

    // Back face
     1.0, -0.5, -1.0,
     3.0, -0.5, -1.0,
     3.0,  0.5, -1.0,
     1.0,  0.5, -1.0,

    // Top face
     1.0,  0.5, -1.0,
     1.0,  0.5,  1.0,
     3.0,  0.5,  1.0,
     3.0,  0.5, -1.0,

    // Bottom face
     1.0, -0.5, -1.0,
     3.0, -0.5, -1.0,
     3.0, -0.5,  1.0,
     1.0, -0.5,  1.0,

    // Right face
     3.0, -0.5, -1.0,
     3.0,  0.5, -1.0,
     3.0,  0.5,  1.0,
     3.0, -0.5,  1.0,

    // Left face
     1.0, -0.5, -1.0,
     1.0, -0.5,  1.0,
     1.0,  0.5,  1.0,
     1.0,  0.5, -1.0,
	
	
  ],
  indices : [     
      0,  1,  2,      0,  2,  3,    // front
      4,  5,  6,      4,  6,  7,    // back
      8,  9,  10,     8,  10, 11,   // top
      12, 13, 14,     12, 14, 15,   // bottom
      16, 17, 18,     16, 18, 19,   // right
      20, 21, 22,     20, 22, 23,   // left
	  
	  24, 25, 26,     24, 26, 27,    // front
      28, 29, 30,     28, 30, 31,   // back
      32, 33, 34,     32, 34, 35,   // top
      36, 37, 38,     36, 38, 39,   // bottom
      40, 41, 42,     40, 42, 43,   // right 
	  44, 45, 46,     44, 46, 47,    // left
	  
      48, 49, 50,     48, 50, 51,    // front
      52, 53, 54,     52, 54, 55,   // back
      56, 57, 58,     56, 58, 59,   // top
      60, 61, 62,     60, 62, 63,   // bottom
      64, 65, 66,     64, 66, 67,   // right
	  68, 69, 70,	  68, 70, 71,	//left
  ],
  vertex_colors : colorVertices(18), // pass in number of faces to have colored faces
};

// uncomment to start with ex1b geometry
// activeObject = 'ex1b';

////////////////////////////////////////////////////////////////////////////////
// Ex 2a: Texture each face with the F-texture!
////////////////////////////////////////////////////////////////////////////////

const FShapeTex2a = {
  vertices : Fshape.vertices,
  indices : Fshape.indices,
  texture_coords : [
      // Front
      0, 1,
      1, 1,
      1, 0,
      0, 0,
      // Back
      0, 1,
      1, 1,
      1, 0,
      0, 0,
      // Top
      0, 1,
      1, 1,
      1, 0,
      0, 0,
      // Bottom
      0, 1,
      1, 1,
      1, 0,
      0, 0,
      // Right
      0, 1,
      1, 1,
      1, 0,
      0, 0,
      // Left
      0, 1,
      1, 1,
      1, 0,
      0, 0,
	  
	  //Top pillar
	   // Front
      0, 1,
      1, 1,
      1, 0,
      0, 0,
      // Back
      0, 1,
      1, 1,
      1, 0,
      0, 0,
      // Top
      0, 1,
      1, 1,
      1, 0,
      0, 0,
      // Bottom
      0, 1,
      1, 1,
      1, 0,
      0, 0,
      // Right
      0, 1,
      1, 1,
      1, 0,
      0, 0,
      // Left
      0, 1,
      1, 1,
      1, 0,
      0, 0,
	  
	  //Middle pillar
	   // Front
      0, 1,
      1, 1,
      1, 0,
      0, 0,
      // Back
      0, 1,
      1, 1,
      1, 0,
      0, 0,
      // Top
      0, 1,
      1, 1,
      1, 0,
      0, 0,
      // Bottom
      0, 1,
      1, 1,
      1, 0,
      0, 0,
      // Right
      0, 1,
      1, 1,
      1, 0,
      0, 0,
      // Left
      0, 1,
      1, 1,
      1, 0,
      0, 0,
  ],
};

// uncomment to start with ex2a geometry
activeObject = 'ex2a';

////////////////////////////////////////////////////////////////////////////////
// Ex 2b: Map the F-texture, so that the F aligns with the geometry!
////////////////////////////////////////////////////////////////////////////////

const FShapeTex2b = {
  vertices : Fshape.vertices,
  indices : Fshape.indices,
  texture_coords : [    //Picture is 255^2 pixels => divide coordinates by 255
      // Front
      38/255, 223/255,
      113/255, 223/255,
      113/255, 44/255,
      38/255, 44/255,
      // Back
      38/255, 223/255,
      113/255, 223/255,
      113/255, 44/255,
      38/255, 44/255,
      // Top
      0, 1,
      1, 1,
      1, 0,
      0, 0,
      // Bottom
      0, 1,
      1, 1,
      1, 0,
      0, 0,
      // Right
      0, 1,
      1, 1,
      1, 0,
      0, 0,
      // Left
      0, 1,
      1, 1,
      1, 0,
      0, 0,
	  
	  //Top pillar
	   // Front
      113/255, 85/255,
      218/255, 85/255,
      218/255, 44/255,
      113/255, 44/255,
      // Back
      113/255, 85/255,
      218/255, 85/255,
      218/255, 44/255,
      113/255, 44/255,
      // Top
      0, 1,
      1, 1,
      1, 0,
      0, 0,
      // Bottom
      0, 1,
      1, 1,
      1, 0,
      0, 0,
      // Right
      0, 1,
      1, 1,
      1, 0,
      0, 0,
      // Left
      0, 1,
      1, 1,
      1, 0,
      0, 0,
	  
	  //Middle pillar
	   // Front
      113/255, 151/255,
      203/255, 151/255,
      203/255, 112/255,
      113/255, 112/255,
      // Back
      113/255, 151/255,
      203/255, 151/255,
      203/255, 112/255,
      113/255, 112/255,
      // Top
      0, 1,
      1, 1,
      1, 0,
      0, 0,
      // Bottom
      0, 1,
      1, 1,
      1, 0,
      0, 0,
      // Right
      0, 1,
      1, 1,
      1, 0,
      0, 0,
      // Left
      0, 1,
      1, 1,
      1, 0,
      0, 0,
  ],
};

// uncomment to start with ex2b geometry
activeObject = 'ex2b';

let d = 50.;
const floor_vertices = [ d, 0., d,  -d, 0., d,  d, 0., -d, d, 0., -d, -d, 0., d, -d, 0., -d];
const floor_indices = [ 0, 1, 2, 3, 4, 5 ];

////////////////////////////////////////////////////////////////////////////////

main();

////////////////////////////////////////////////////////////////////////////////

function main() {

    // Load texture
    const texture = loadTexture(gl, 'f-texture.png');

    loop(); 

    function loop() { 
        window.requestAnimationFrame(loop);
        if(shouldRotate)
            globalTime += .01; 
        draw();
    }; 

    function draw() { 
        getReadyToDraw();
        
        let P = getProjectionMatrix(); 
        let V = getViewMatrix(); 

        let M_floor = mat4.create(); // NOTE: Initializes to I.
        setPVM(P, V, M_floor);
        drawFloor();
        
        let M = mat4.create();
        mat4.translate(M, M, [0, 3, 0]);
        mat4.rotateX(M, M, objectRotation[0]);
        mat4.rotateY(M, M, objectRotation[1]);
        mat4.rotateZ(M, M, objectRotation[2]);
        mat4.rotateX(M, M, globalTime);
        mat4.rotateY(M, M, globalTime);
        mat4.rotateZ(M, M, globalTime);
        setPVM(P, V, M);
  
        // draw cube
        if(activeObject == 'ex1a')
        {
            drawObject(cube);
        }

        // draw Fshape
        else if(activeObject == 'ex1b')
        {
            drawObject(Fshape);
        }
        // draw textured F shape
        else if(activeObject == 'ex2a')
        {
            drawObjectTextured(FShapeTex2a);
        }
        // draw textured FShape with proper texture
        else if(activeObject == 'ex2b')
        {
            drawObjectTextured(FShapeTex2b);
        }

        // text to display which object is drawn
        const lineHeight = 30;
        ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
        ctx.font = "bold 24px monospace ";
        ctx.fillStyle = "#ffffff";
        ctx.fillText(activeObject, ctx.canvas.width/2-lineHeight, lineHeight);

        var someText = [
          "controls:",
          "  camera: WASD QE",
          "  object: arrows",
          "  rotate object: space",
          "  choose exercise: 1234",
        ];
        for (var i = 0; i < someText.length; i++) {
          ctx.fillText(someText[i], 0, lineHeight+i*lineHeight);
        }

    }; 

    function drawFloor() {
        gl.useProgram(floorShaderProgram);

        const vertexBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(floor_vertices), gl.STATIC_DRAW);
        // --
        const aVertexPosition = gl.getAttribLocation(floorShaderProgram, "aVertexPosition");
        gl.vertexAttribPointer(aVertexPosition, 3, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(aVertexPosition);

        gl.drawArrays(gl.TRIANGLES, 0, 6);
    }
    
    function drawObject(object) { 
        gl.useProgram(colorShaderProgram);

        const vertexBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(object.vertices), gl.STATIC_DRAW);
        const aVertexPosition = gl.getAttribLocation(colorShaderProgram, "aVertexPosition");
        gl.vertexAttribPointer(aVertexPosition, 3, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(aVertexPosition);

        const colorBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, colorBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(object.vertex_colors), gl.STATIC_DRAW);
        const aVertexColor = gl.getAttribLocation(colorShaderProgram, "aVertexColor");
        gl.vertexAttribPointer( aVertexColor, 4, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(aVertexColor);

        const indexBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer); 
        gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(object.indices), gl.STATIC_DRAW); 
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer); 

        gl.drawElements(gl.TRIANGLES, object.indices.length, gl.UNSIGNED_SHORT, 0);
    };

    function drawObjectTextured(object) { 
        gl.useProgram(textureShaderProgram);

        const vertexBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(object.vertices), gl.STATIC_DRAW);
        const aVertexPosition = gl.getAttribLocation(textureShaderProgram, "aVertexPosition");
        gl.vertexAttribPointer(aVertexPosition, 3, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(aVertexPosition);

        const texBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, texBuffer);
        const texcoordLocation = gl.getAttribLocation(textureShaderProgram, "aTextureCoord");
        gl.vertexAttribPointer(texcoordLocation, 2, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(texcoordLocation);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(object.texture_coords), gl.STATIC_DRAW);
        
        // Tell WebGL we want to affect texture unit 0
        gl.activeTexture(gl.TEXTURE0);
        // Bind the texture to texture unit 0
        gl.bindTexture(gl.TEXTURE_2D, texture);
        // Tell the shader we bound the texture to texture unit 0
        var textureLocation = gl.getUniformLocation(textureShaderProgram, "uSampler")
        gl.uniform1i(textureLocation, 0);

        const indexBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer); 
        gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(object.indices), gl.STATIC_DRAW); 
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer); 

        gl.drawElements(gl.TRIANGLES, object.indices.length, gl.UNSIGNED_SHORT, 0);
    };

    function getReadyToDraw() { 
        gl.clearColor(0., 0., 0., 1.); // NOTE: This is the background color.
        gl.enable(gl.DEPTH_TEST);
        gl.viewport(0, 0, canvas.width, canvas.height);
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    };

};

