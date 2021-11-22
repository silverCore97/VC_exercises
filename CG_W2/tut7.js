/**
 * Tutorial 7 for Visual Computing 2020
 * 
 * Author:
 * - Dongho Kang (kangd@ethz.ch)
 * - James M. Bern (jamesmbern@gmail.com)
 * 
 * Based loosely on: 
 *  https://developer.mozilla.org/en-US/docs/Web/API/WebGL_API/Tutorial/ 
 * Additional reading: 
 *  https://webglfundamentals.org/webgl/lessons/webgl-3d-camera.html
 */

function set_(mat, r, c, val) {
    mat[r + 4*c] = val; // NOTE: glmatrix is column major, gross.
}

function getTriangleModelMatrix() { 
    var M_triangle = mat4.create();
    //
    // TODO: You can answer Part 1 + 2 of the assignment here.
    //
	
	//1
	//Triangle scaled in x direction
	//set_(M_triangle,0,0,Math.cos(globalTime));
	
	//Triangle reflected across x-axis
	//set_(M_triangle,1,1,-1);
	
	//Triangle rotates around origin
	//set_(M_triangle,0,0, Math.cos(globalTime)); 
    //set_(M_triangle, 0, 1, -Math.sin(globalTime)); 
    //set_(M_triangle, 1, 0, Math.sin(globalTime)); 
    //set_(M_triangle, 1, 1, Math.cos(globalTime));
	
	//Triangle rotates around (1,1)
	//set_(M_triangle, 0, 0,  Math.cos(globalTime)); 
    //set_(M_triangle, 0, 1, -Math.sin(globalTime)); 
    //set_(M_triangle, 0, 3, 1); 
    //set_(M_triangle, 1, 0,  Math.sin(globalTime)); 
    //set_(M_triangle, 1, 1,  Math.cos(globalTime));
    //set_(M_triangle, 1, 3, 1); 
	
	//2
	//Triangle on top of camera 2
	var M_triangle = getCameraMatrix(2);
	//Triangle rotates in place
    mat4.rotateY(M_triangle, M_triangle, globalTime);
    mat4.translate(M_triangle, M_triangle, [-.3, .3, 0.]);
    mat4.scale(M_triangle, M_triangle, [.5, .5, .5]);
    return M_triangle;
}

////////////////////////////////////////////////////////////////////////////////
// Ignore this stuff for now... ////////////////////////////////////////////////
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

const basicFragShaderSource = `
    void main(void) {
        gl_FragColor = vec4(166./255., 226./255., 46./255., 1.); 
    }
`; 

const vertexColoredFragShaderSource = `
    varying lowp vec4 vColor; 

    void main(void) {
        gl_FragColor = vColor; 
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
var gl = canvas.getContext('webgl'); 

var basicShaderProgram = setupShaderProgram(basicVertShaderSource, basicFragShaderSource);
var cameraShaderProgram = setupShaderProgram(basicVertShaderSource, vertexColoredFragShaderSource);
var floorShaderProgram = setupShaderProgram(basicVertShaderSource, floorFragShaderSource);
var shaderPrograms = [basicShaderProgram, cameraShaderProgram, floorShaderProgram];

// NOTE: sets P, VM in _allh_ shaders
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

////////////////////////////////////////////////////////////////////////////////

// NOTE: I've flattened these lines so they take up less space.
// -- If you want to see how it works please read here:
// -- https://developer.mozilla.org/en-US/docs/Web/API/WebGL_API/Tutorial/Creating_3D_objects_using_WebGL

const camera_vertices = [ -1.0, -1.0,  1.0, 1.0, -1.0,  1.0, 1.0,  1.0,  1.0, -1.0,  1.0,  1.0, -1.0, -1.0, -1.0, -1.0,  1.0, -1.0, 1.0,  1.0, -1.0, 1.0, -1.0, -1.0, -1.0,  1.0, -1.0, -1.0,  1.0,  1.0, 1.0,  1.0,  1.0, 1.0,  1.0, -1.0, -1.0, -1.0, -1.0, 1.0, -1.0, -1.0, 1.0, -1.0,  1.0, -1.0, -1.0,  1.0, 1.0, -1.0, -1.0, 1.0,  1.0, -1.0, 1.0,  1.0,  1.0, 1.0, -1.0,  1.0, -1.0, -1.0, -1.0, -1.0, -1.0,  1.0, -1.0,  1.0,  1.0, -1.0,  1.0, -1.0 ];

const camera_face_colors_ = [ [.5,  1.0,  1.0,  1.0], [1.0,  0.0,  0.0,  1.0], [0.0,  1.0,  0.0,  1.0], [0.0,  0.0,  1.0,  1.0], [1.0,  1.0,  0.0,  1.0], [1.0,  0.0,  1.0,  1.0], ];

var camera_vertex_colors = []; 
for (var j = 0; j < camera_face_colors_.length; ++j) {
    const c = camera_face_colors_[j];
    camera_vertex_colors = camera_vertex_colors.concat(c, c, c, c); // four vertices per face, all same color
} 

const camera_indices = [ 0,  1,  2,      0,  2,  3, 4,  5,  6,      4,  6,  7, 8,  9,  10,     8,  10, 11, 12, 13, 14,     12, 14, 15, 16, 17, 18,     16, 18, 19, 20, 21, 22,     20, 22, 23, ]; 

let d = 50.;
const floor_vertices = [ d, 0., d,  -d, 0., d,  d, 0., -d, d, 0., -d, -d, 0., d, -d, 0., -d];
const floor_indices = [ 0, 1, 2, 3, 4, 5 ];


////////////////////////////////////////////////////////////////////////////////

var globalTime = 0.;

////////////////////////////////////////////////////////////////////////////////
// For figuring out Part 2 start reading here... ///////////////////////////////
////////////////////////////////////////////////////////////////////////////////

// Let's start with 3 cameras (0, 1, and 2)
// NOTE: The position of camera 2 gets updated in process()
var cameraPositions = [[0., 0., 8.], [-15., 3., 15.], [5., 0., 0.]];

// NOTE: If you want to try adding a bunch of cameras, uncomment this.
// for (var i = 0; i < 50; ++i) { cameraPositions.push([-3.+6*Math.random(), .5+.5*Math.random(), -3.+6.*Math.random()]); }

// FORNOW: All cameras are pointed at the origin.
// var cameraTarget = [0., 0., 0.];

// This is the current camera index.
var currentCameraIndex = 0;

// Click the mouse button to switch cameras.
function mousePressed() {
    currentCameraIndex += 1;
    currentCameraIndex %= cameraPositions.length;
}

// C
function getCameraMatrix(i) { 
    let TR = mat4.create();
    mat4.targetTo(TR, cameraPositions[i], [0., 0., 0.], [0., 1., 0.])
    return TR; 
}

// V = inv(C)
function getViewMatrix(i) { 
    let V = mat4.create();
    mat4.invert(V, getCameraMatrix(i)); 
    return V; 
}

// P
function getProjectionMatrix() {
    const fieldOfView = 45. * Math.PI / 180.; // NOTE: In radians.
    const aspect = gl.canvas.clientWidth / gl.canvas.clientHeight;
    const zNear = 0.1;
    const zFar = 100.0;
    let P = mat4.create(); 
    mat4.perspective(P, fieldOfView, aspect, zNear, zFar);
    return P;
} 

// Just a wrapper
function getCurrentCameraPosition() {
    return cameraPositions[currentCameraIndex];
} 

// Just a wrapper
function getCurrentViewMatrix() { 
    return getViewMatrix(currentCameraIndex);
}

////////////////////////////////////////////////////////////////////////////////

main();

////////////////////////////////////////////////////////////////////////////////

function main() {

    loop(); 

    function loop() { 
        window.requestAnimationFrame(loop);
        process();
        draw();
    }; 

    function process() {
        globalTime += .01;
        cameraPositions[2] = [5.*Math.cos(-globalTime), 2. + 1.*Math.cos(1. + 2.*globalTime), 5.*Math.sin(-globalTime)];
    };

    function draw() { 
        getReadyToDraw();

        // P, V are the same for all objects in the scene.
        let P = getProjectionMatrix(); 
        let V = getCurrentViewMatrix(); 

        // Draw the floor.
        let M_floor = mat4.create(); // NOTE: mat4.create() initializes to the identity matrix.
        setPVM(P, V, M_floor);
        drawFloor();

        // Draw the triangle.
        let M_triangle = getTriangleModelMatrix();
        setPVM(P, V, M_triangle);
        drawTriangle();

        // Draw the other cameras as colorful cubes.
        for (var i = 0; i < cameraPositions.length; ++i) {
            if (i == currentCameraIndex) { continue; }
            // --
            let M_camera = mat4.create();
            // These functions seem to right multiply
            // T[RS]
            {
                let TR = getCameraMatrix(i);
                let S = mat4.create(); mat4.scale(S, S, [.3, .3, .3]);
                let TRS = mat4.create(); mat4.multiply(TRS, TR, S);
                M_camera = TRS;
            }
            setPVM(P, V, M_camera);
            drawCamera();
        }

        // Draw text.
        var textCanvas = document.getElementById("text");
        var ctx = textCanvas.getContext("2d");
        ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
        ctx.font="32px sans-serif";
        ctx.fillStyle="#FFFFFF"; 
        ctx.fillText("Camera: " + currentCameraIndex, 32, 64); 
        for (var i = 0; i < cameraPositions.length; ++i) {
            if (i == currentCameraIndex) { continue; }
            // Adapted from: https://webglfundamentals.org/webgl/lessons/webgl-text-html.html
            var p = cameraPositions[i]
            var p_hom = vec4.fromValues(p[0], p[1], p[2], 1.);
            var p_pro = p_hom;
            mat4.multiply(p_pro, V, p_pro);
            mat4.multiply(p_pro, P, p_pro); 
            if (p_pro[3] > 0) { // ???
                p_pro[0] /= p_pro[3];
                p_pro[1] /= p_pro[3];
            }

            var pixelX = (p_pro[0] *  0.5 + 0.5) * gl.canvas.width;
            var pixelY = (p_pro[1] * -0.5 + 0.5) * gl.canvas.height;

            ctx.font="24px sans-serif";
            ctx.fillStyle="#FFFFFF"; 
            ctx.fillText("" + i, pixelX, pixelY);
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

    function drawTriangle() { 
        gl.useProgram(basicShaderProgram);

        // NOTE: If you just supply an array this errors out.
        let vertexData = new Float32Array([0., 0., 1., 0., 1., 1.]);
        const vertexBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, vertexData, gl.STATIC_DRAW);

        const aVertexPosition = gl.getAttribLocation(basicShaderProgram, "aVertexPosition");
        gl.vertexAttribPointer(aVertexPosition, 2, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(aVertexPosition);

        gl.drawArrays(gl.TRIANGLES, 0, 3); 
    }; 

    function drawCamera() { 
        gl.useProgram(cameraShaderProgram);

        const vertexBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(camera_vertices), gl.STATIC_DRAW);
        // --
        const aVertexPosition = gl.getAttribLocation(cameraShaderProgram, "aVertexPosition");
        gl.vertexAttribPointer(aVertexPosition, 3, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(aVertexPosition);

        const colorBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, colorBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(camera_vertex_colors), gl.STATIC_DRAW);
        // --
        const aVertexColor = gl.getAttribLocation(cameraShaderProgram, "aVertexColor");
        gl.vertexAttribPointer( aVertexColor, 4, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(aVertexColor);

        const indexBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer); 
        gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(camera_indices), gl.STATIC_DRAW); 
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer); 

        gl.drawElements(gl.TRIANGLES, 36, gl.UNSIGNED_SHORT, 0);
    };

    function getReadyToDraw() { 
        gl.clearColor(0., 0., 0., 1.); // NOTE: This is the background color.
        gl.enable(gl.DEPTH_TEST);
        gl.viewport(0, 0, canvas.width, canvas.height);
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    };

};

