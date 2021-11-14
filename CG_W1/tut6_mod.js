// Tutorial 6 for Visual Computing 2020
// Florian Kennel-Maushart (florian.maushart@inf.ethz.ch)
// Based on the 2019 version by James M. Bern

////////////////////////////////////////////////////////////////////////////////

// Based on: https://developer.mozilla.org/en-US/docs/Web/API/WebGL_API/Tutorial/Adding_2D_content_to_a_WebGL_context}
// Additional references:
// - https://jameshfisher.com/2017/09/30/webgl-triangle.html
// - https://gist.github.com/xeolabs/a04e8baa09c9224ac07202b91346c063
// - https://developer.mozilla.org/en-US/docs/Web/API/WebGL_API/Basic_2D_animation_example
// - https://jsfiddle.net/girlie_mac/faRW3/
// - https://webglfundamentals.org/webgl/lessons/webgl-fundamentals.html

////////////////////////////////////////////////////////////////////////////////

// NOTE: This is the simplest (but definitely not best) way to include shaders.

const vertShaderSource = `
    attribute vec3 aVertexPosition;
    void main(void) {
       gl_Position = vec4(aVertexPosition, 1.);
       // gl_Position = vec4(vec3(.5, 1., 1.)*aVertexPosition, 1.);
    }
`;

const fragShaderSource = `
    precision highp float;
    uniform vec3 uForegroundColor;
    void main(void) {
       gl_FragColor = vec4(uForegroundColor, 1.);
       // gl_FragColor = vec4(1., 0., 1., 1.);
    }
`;

////////////////////////////////////////////////////////////////////////////////

// NOTE: These are your globals

var globalTime = 0.;

var canvas = document.getElementById('canvas'); 
var gl = canvas.getContext('webgl'); 

// Nice colors :)
let BLACK  = vec3.fromValues(0., 0., 0.);
let WHITE  = vec3.fromValues(1., 1., 1.);
let RED    = vec3.fromValues(249./255.,  38./255., 114./255.);
let ORANGE = vec3.fromValues(253./255., 151./255.,  31./255.);
let YELLOW = vec3.fromValues(230./255., 219./255., 116./255.);
let GREEN  = vec3.fromValues(166./255., 226./255.,  46./255.);
let BLUE   = vec3.fromValues(102./255., 217./255., 239./255.);
let PURPLE = vec3.fromValues(174./255., 129./255., 255./255.);
let GRAY   = vec3.fromValues( 39./255.,  40./255.,  34./255.);

////////////////////////////////////////////////////////////////////////////////

function main() {

    var shaderProgram = setupShaderProgram();
    loop(); 

    function loop() { 
        process();
        draw();
        window.requestAnimationFrame(loop); // https://developer.mozilla.org/en-US/docs/Web/API/window/requestAnimationFrame
    }; 

    function process() {
        globalTime += .01; // NOTE: A variable like this is really useful for debugging.
    };

    function draw() { 
        getReadyToDraw();
		drawCircle();
        //drawTriangle();
    }; 

    function getReadyToDraw() { 
        gl.clearColor(0., 0., 0., 1.); // NOTE: This is the background color.
        gl.enable(gl.DEPTH_TEST);
        gl.viewport(0, 0, canvas.width, canvas.height);
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    };

    function drawTriangle() { 
        // {points} is an array of gLmatrix.vec2's
		let MOVE = 2;
        let points = [];
		if (MOVE == 0) {
            let p0 = vec2.fromValues(0., 0.);
			let p1 = vec2.fromValues(Math.cos(globalTime), Math.sin(globalTime));
			let p2 = vec2.fromValues(Math.cos(.33 * Math.PI + globalTime), Math.sin(.33 * Math.PI + globalTime));
			points.push(p0);
			points.push(p1);
			points.push(p2);
		} else if (MOVE == 1) {  //Nonmoving
			let p0 = vec2.fromValues(0., 0.);
			let p1 = vec2.fromValues(Math.cos(0), Math.sin(0));
			let p2 = vec2.fromValues(Math.cos(.33 * Math.PI ), Math.sin(.33 * Math.PI ));       
			points.push(p0);
			points.push(p1);
			points.push(p2);
		} else if (MOVE == 2) {  //Inverted triangle
			let p0 = vec2.fromValues(Math.cos(globalTime)*Math.sqrt(3.)/2., Math.sin(globalTime)*Math.sqrt(3.)/2.);
			let p1 = vec2.fromValues(Math.cos(globalTime + .5 * Math.PI)*.5, Math.sin(globalTime + .5 * Math.PI)*.5);
			let p2 = vec2.fromValues(Math.cos(globalTime - .5 * Math.PI)*.5, Math.sin(globalTime - .5 * Math.PI)*.5);       
			points.push(p0);
			points.push(p1);
			points.push(p2);
		} else if (MOVE == 3) {  //Inverted fixed triangle
			let p0 = vec2.fromValues(Math.sqrt(3.0)/2., 0);
			let p1 = vec2.fromValues(Math.cos( 0.5 * Math.PI)*0.5, Math.sin( 0.5 * Math.PI)*0.5);
			let p2 = vec2.fromValues(Math.cos( (-0.5) * Math.PI)*0.5, Math.sin( (-0.5) * Math.PI)*0.5);       
			points.push(p0);
			points.push(p1);
			points.push(p2);
		}
        
        
        // // {uForegroundColor} is a uniform vec3 specifying the triangle's color;
        let col = BLACK;
        let CASE = 4;
        if (CASE == 0) {
            col = WHITE;
        } else if (CASE == 1) {
            // .5 * (GREEN + RED)
            vec3.add(col, col, GREEN); // add col to GREEN and store the result in col; vec.add(out, a, b) <=> out = a + b;
            vec3.add(col, col, RED);
            vec3.scale(col, col, .5);  // scale col by .5 and store the result in col
        } else if (CASE == 2) {
            // lerp(GREEN, RED, ncos01(t))
            vec3.lerp(col, GREEN, RED, ncos01(globalTime));  // scale col by .5 and store the result in col 
        } else if (CASE == 3) {
            // https://www.shadertoy.com/view/4l2cDm
            let tau = Math.acos(-1.)*2.; 
            let c = vec3.fromValues(0, 2, 1);
            for (i = 0; i < 3; ++i) { 
                col[i] = Math.sqrt(Math.sin((globalTime+c[i]/3.)*tau)*.5+.5);
            }
        } else if (CASE == 4 ){
			col = RED;
		}	


        const uForegroundColor = gl.getUniformLocation(shaderProgram, 'uForegroundColor');
        gl.uniform3f(uForegroundColor, col[0], col[1], col[2]);

        // Populate vertex buffer
        let vertexData = concatArrayOfFloat32Arrays(points);
        const vertexBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, vertexData, gl.STATIC_DRAW);

        // Connect the shader to the vertex buffer (docs say it just uses the current buffer)
        const aVertexPosition = gl.getAttribLocation(shaderProgram, "aVertexPosition");
        gl.vertexAttribPointer(aVertexPosition, 2, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(aVertexPosition);

        // Actually draw the triangle
        gl.drawArrays(gl.TRIANGLES, 0, 3); 
    }; 
	

    function setupShaderProgram() { 
        var vertShader = gl.createShader(gl.VERTEX_SHADER);
        gl.shaderSource(vertShader, vertShaderSource);
        gl.compileShader(vertShader);
        if (!gl.getShaderParameter(vertShader, gl.COMPILE_STATUS)) {
            alert(gl.getShaderInfoLog(vertShader));
            return;
        }

        var fragShader = gl.createShader(gl.FRAGMENT_SHADER);
        gl.shaderSource(fragShader, fragShaderSource);
        gl.compileShader(fragShader);
        if (!gl.getShaderParameter(fragShader, gl.COMPILE_STATUS)) {
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
};

////////////////////////////////////////////////////////////////////////////////

// NOTE: Some helper functions.

function ncos01(t) {
    return .5 - .5*Math.cos(t);
}

function concatArrayOfFloat32Arrays(bufs) {
    // https://stackoverflow.com/questions/4554252/typed-arrays-in-gecko-2-float32array-concatenation-and-expansion 
    function sum(a) { return a.reduce(function(a,b) {return a + b; }, 0); } 
    var lens=bufs.map(function(a) { return a.length; } );
    var aout=new Float32Array(sum(lens));
    for (var i=0; i<bufs.length; ++i) {
        var start=sum(lens.slice(0, i));
        aout.set(bufs[i],start);
    }
    return aout;
}

