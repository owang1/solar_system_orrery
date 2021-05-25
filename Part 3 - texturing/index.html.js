"use strict";

var gl;
var canvas;

var printDay;
var savedDay;
var triggered = false;
var mvMatrix;

// non-common modelview projection matrix
var noncommonMVMatrix;

// common modelview projection matrix
var commonMVMatrix;

var a_positionLoc;
var u_colorLoc;
var u_mvMatrixLoc;

// last time that this function was called
var g_last = Date.now();
var elapsed = 0;
var mspf = 1000/30.0;  // ms per frame

// scale factors
var rSunMult = 45;      // keep sun's size manageable
var rPlanetMult = 2000;  // scale planet sizes to be more visible

// surface radii (km)
var rSun = 696000;
var rMercury = 2440;
var rVenus = 6052;
var rEarth = 6371;
var rMoon = 1737;

// orbital radii (km)
var orMercury = 57909050;
var orVenus = 108208000;
var orEarth = 149598261;
var orMoon = 384399;


// orbital periods (Earth days)
var pMercury = 88;
var pVenus = 225;
var pEarth = 365;
var pMoon = 27;

// time
var currentDay;
var daysPerFrame;

var globalScale;

// vertices
var circleVertexPositionData = []; // for orbit
var sphereVertexPositionData = []; // for planet
var sphereVertexIndexData = []; // for planet

var circleVertexPositionBuffer;
var sphereVertexPositionBuffer;
var sphereVertexIndexBuffer;

// global array to store vertex normals
var normalsArray = [];
var nBuffer;

// normal and modelview matrix
var nMatrix, u_nMatrixLoc;
var projectionMatrix;
var u_projectionMatrixLoc;

// RGB slider values
var red_val = 1.0;
var green_val = 1.0;
var blue_val = 1.0;

// directional light
var lightPosition = vec4(1.0, 1.0, 1.0, 0.0 );

// ambient, diffuse, specular
var lightAmbient = vec4(0.2, 0.2, 0.2, 1.0 );
var lightDiffuse = vec4( red_val*1.0, green_val*1.0, blue_val*1.0, 1.0 );
var lightSpecular = vec4( red_val*1.0, green_val*1.0, blue_val*1.0, 1.0 );

var materialAmbient = vec4( 1.0, 1.0, 1.0, 1.0 );
var materialDiffuse = vec4( 1.0, 1.0, 1.0, 1.0 );
var materialSpecular = vec4( 1.0, 1.0, 1.0, 1.0 );
var materialShininess = 50.0;

// for trackball
var m_inc;
var m_curquat;
var m_mousex = 1;
var m_mousey = 1;
var trackballMove = false;

// Texture global arrays
var textureCoordData = [];

var a_TextureCoordLoc;
var u_TextureSamplerLoc;
var a_vNormalLoc;

// Task 2: Texture variables for each planet
var earthTexture;
var mercuryTexture;
var moonTexture;
var sunTexture;
var venusTexture;

var sphereVertexTextureCoordBuffer;
// for trackball
function mouseMotion( x,  y)
{
        var lastquat;
        if (m_mousex != x || m_mousey != y)
        {
            lastquat = trackball(
                  (2.0*m_mousex - canvas.width) / canvas.width,
                  (canvas.height - 2.0*m_mousey) / canvas.height,
                  (2.0*x - canvas.width) / canvas.width,
                  (canvas.height - 2.0*y) / canvas.height);
            m_curquat = add_quats(lastquat, m_curquat);
            m_mousex = x;
            m_mousey = y;
        }
}

// Set up appropriate texture parameters
function handleLoadedTexture(texture) {
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, texture.image);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_NEAREST);
    gl.generateMipmap(gl.TEXTURE_2D);
}

// Load in jpg images for all planets
function initTexture() {
    earthTexture = gl.createTexture();
    earthTexture.image = new Image();
    earthTexture.image.onload = function () {
        handleLoadedTexture(earthTexture)
    }
    earthTexture.image.src = "earth.jpg";

    mercuryTexture = gl.createTexture();
    mercuryTexture.image = new Image();
    mercuryTexture.image.onload = function () {
        handleLoadedTexture(mercuryTexture)
    }
    mercuryTexture.image.src = "mercury.jpg";

    moonTexture = gl.createTexture();
    moonTexture.image = new Image();
    moonTexture.image.onload = function () {
        handleLoadedTexture(moonTexture)
    }
    moonTexture.image.src = "moon.jpg";

    sunTexture = gl.createTexture();
    sunTexture.image = new Image();
    sunTexture.image.onload = function () {
        handleLoadedTexture(sunTexture)
    }
    sunTexture.image.src = "sun.jpg";

    venusTexture = gl.createTexture();
    venusTexture.image = new Image();
    venusTexture.image.onload = function () {
        handleLoadedTexture(venusTexture)
    }
    venusTexture.image.src = "venus.jpg";
}


window.onload = function init()
{
    canvas = document.getElementById( "gl-canvas" );
    printDay = document.getElementById("printDay");

    gl = WebGLUtils.setupWebGL( canvas );
    if ( !gl ) { alert( "WebGL isn't available" ); }

    //
    //  Configure WebGL
    //
    gl.viewport( 0, 0, canvas.width, canvas.height );
    gl.clearColor( 0.85, 0.85, 0.85, 1.0 );

    gl.enable(gl.DEPTH_TEST);


    currentDay = 0;
    //daysPerFrame = 1.0;
    // Slow down so spinning can be clearly observed
    daysPerFrame = .0625;

    // global scaling for the entire orrery
    globalScale = 50.0 / ( orEarth + orMoon + ( rEarth + 2 * rMoon ) * rPlanetMult );

    setupCircle();

    setupSphere();

    initTexture();


    // for trackball
    m_curquat = trackball(0, 0, 0, 0);

    //  Load shaders and initialize attribute buffers

    var program = initShaders( gl, "vertex-shader", "fragment-shader" );
    gl.useProgram( program );

    // RGB sliders
     document.getElementById("rslider").onchange = function(event) {
       red_val = event.target.value;
       lightDiffuse = vec4(red_val*1.0, green_val*1.0, blue_val*1.0, 1.0 );
       lightSpecular = vec4( red_val*1.0, green_val*1.0, blue_val*1.0, 1.0 );

       diffuseProduct = mult(lightDiffuse, materialDiffuse);
       specularProduct = mult(lightSpecular, materialSpecular);

       gl.uniform4fv( gl.getUniformLocation(program,
          "u_diffuseProduct"),flatten(diffuseProduct) );
       gl.uniform4fv( gl.getUniformLocation(program,
          "u_specularProduct"),flatten(specularProduct) );
     };
     document.getElementById("gslider").onchange = function(event) {
       green_val = event.target.value;
       lightDiffuse = vec4(red_val*1.0, green_val*1.0, blue_val*1.0, 1.0 );
       lightSpecular = vec4( red_val*1.0, green_val*1.0, blue_val*1.0, 1.0 );

       diffuseProduct = mult(lightDiffuse, materialDiffuse);
       specularProduct = mult(lightSpecular, materialSpecular);

       gl.uniform4fv( gl.getUniformLocation(program,
          "u_diffuseProduct"),flatten(diffuseProduct) );
       gl.uniform4fv( gl.getUniformLocation(program,
          "u_specularProduct"),flatten(specularProduct) );
     };
     document.getElementById("bslider").onchange = function(event) {
       blue_val = event.target.value;
       lightDiffuse = vec4(red_val*1.0, green_val*1.0, blue_val*1.0, 1.0 );
       lightSpecular = vec4( red_val*1.0, green_val*1.0, blue_val*1.0, 1.0 );

       diffuseProduct = mult(lightDiffuse, materialDiffuse);
       specularProduct = mult(lightSpecular, materialSpecular);

       gl.uniform4fv( gl.getUniformLocation(program,
          "u_diffuseProduct"),flatten(diffuseProduct) );
       gl.uniform4fv( gl.getUniformLocation(program,
          "u_specularProduct"),flatten(specularProduct) );
     };

    // For the lighting
    var ambientProduct = mult(lightAmbient, materialAmbient);
    var diffuseProduct = mult(lightDiffuse, materialDiffuse);
    var specularProduct = mult(lightSpecular, materialSpecular);

    // For texture -> use only one texture unit gl.TEXTURE0
    gl.activeTexture(gl.TEXTURE0);
    u_TextureSamplerLoc = gl.getUniformLocation(program, "u_TextureSampler");
    gl.uniform1i(u_TextureSamplerLoc, 0);

    // Send sphere vertex texture coordinate data into GPU
    sphereVertexTextureCoordBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, sphereVertexTextureCoordBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(textureCoordData), gl.STATIC_DRAW);

    // Load the data into the GPU
    circleVertexPositionBuffer = gl.createBuffer();
    gl.bindBuffer( gl.ARRAY_BUFFER, circleVertexPositionBuffer );
    gl.bufferData( gl.ARRAY_BUFFER, flatten(circleVertexPositionData), gl.STATIC_DRAW );

    sphereVertexPositionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, sphereVertexPositionBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(sphereVertexPositionData), gl.STATIC_DRAW);

    sphereVertexIndexBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, sphereVertexIndexBuffer);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(sphereVertexIndexData), gl.STATIC_DRAW);

    // Load sphere vertex normal data into GPU
    nBuffer = gl.createBuffer();
    gl.bindBuffer( gl.ARRAY_BUFFER, nBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(normalsArray), gl.STATIC_DRAW);

    // Associate out shader variables with our data buffer

    a_vNormalLoc = gl.getAttribLocation( program, "a_vNormal" );

    a_positionLoc = gl.getAttribLocation( program, "a_position" );

    u_colorLoc = gl.getUniformLocation( program, "u_color" );

    u_mvMatrixLoc = gl.getUniformLocation( program, "u_mvMatrix" );

    u_projectionMatrixLoc = gl.getUniformLocation( program, "u_projectionMatrix" );

    u_nMatrixLoc = gl.getUniformLocation(program, "u_nMatrix");

    a_TextureCoordLoc = gl.getAttribLocation(program, "a_TextureCoord");

    // for trackball
    canvas.addEventListener("mousedown", function(event){
        m_mousex = event.clientX - event.target.getBoundingClientRect().left;
        m_mousey = event.clientY - event.target.getBoundingClientRect().top;
        trackballMove = true;
    });

    // for trackball
    canvas.addEventListener("mouseup", function(event){
        trackballMove = false;
    });

    // for trackball
    canvas.addEventListener("mousemove", function(event){
      if (trackballMove) {
        var x = event.clientX - event.target.getBoundingClientRect().left;
        var y = event.clientY - event.target.getBoundingClientRect().top;
        mouseMotion(x, y);
      }
    } );

    // Compute per-vertex Phong
    gl.uniform4fv( gl.getUniformLocation(program,
       "u_ambientProduct"),flatten(ambientProduct) );
    gl.uniform4fv( gl.getUniformLocation(program,
       "u_diffuseProduct"),flatten(diffuseProduct) );
    gl.uniform4fv( gl.getUniformLocation(program,
       "u_specularProduct"),flatten(specularProduct) );
    gl.uniform4fv( gl.getUniformLocation(program,
       "u_lightPosition"),flatten(lightPosition) );
    gl.uniform1f( gl.getUniformLocation(program,
       "u_shininess"),materialShininess );

    render();

};

function setupCircle() {
    var increment = 0.1;
    for (var theta=0.0; theta < Math.PI*2; theta+=increment) {
        circleVertexPositionData.push(vec3(Math.cos(theta+increment), 0.0, Math.sin(theta+increment)));
    }
}

function setupSphere() {
    var latitudeBands = 50;
    var longitudeBands = 50;
    var radius = 1.0;

    // compute sampled vertex positions
    for (var latNumber=0; latNumber <= latitudeBands; latNumber++) {
        var theta = latNumber * Math.PI / latitudeBands;
        var sinTheta = Math.sin(theta);
        var cosTheta = Math.cos(theta);

        for (var longNumber=0; longNumber <= longitudeBands; longNumber++) {
            var phi = longNumber * 2 * Math.PI / longitudeBands;
            var sinPhi = Math.sin(phi);
            var cosPhi = Math.cos(phi);

            var x = cosPhi * sinTheta;
            var y = cosTheta;
            var z = sinPhi * sinTheta;

            // Compute sphere vertex texture coordinates
            var u = 1 - (longNumber / longitudeBands);
            var v = 1 - (latNumber / latitudeBands);
            textureCoordData.push(u);
            textureCoordData.push(v);

            sphereVertexPositionData.push(radius * x);
            sphereVertexPositionData.push(radius * y);
            sphereVertexPositionData.push(radius * z);

            // Compute sphere vertex normals when the vertex positions are defined
            normalsArray.push(radius * x);
            normalsArray.push(radius * y);
            normalsArray.push(radius * z);

        }
    }

    // create the actual mesh, each quad is represented by two triangles
    for (var latNumber=0; latNumber < latitudeBands; latNumber++) {
        for (var longNumber=0; longNumber < longitudeBands; longNumber++) {
            var first = (latNumber * (longitudeBands + 1)) + longNumber;
            var second = first + longitudeBands + 1;
            // the three vertices of the 1st triangle
            sphereVertexIndexData.push(first);
            sphereVertexIndexData.push(second);
            sphereVertexIndexData.push(first + 1);
            // the three vertices of the 2nd triangle
            sphereVertexIndexData.push(second);
            sphereVertexIndexData.push(second + 1);
            sphereVertexIndexData.push(first + 1);
        }
    }
}

function drawCircle(color) {
    // set uniforms
    gl.uniform3fv( u_colorLoc, color );
    mvMatrix = mult(commonMVMatrix, noncommonMVMatrix);
    gl.uniformMatrix4fv(u_mvMatrixLoc, false, flatten(mvMatrix) );

    gl.enableVertexAttribArray( a_positionLoc );
    gl.bindBuffer(gl.ARRAY_BUFFER, circleVertexPositionBuffer);
    gl.vertexAttribPointer( a_positionLoc, 3, gl.FLOAT, false, 0, 0 );
    gl.drawArrays( gl.LINE_LOOP, 0, circleVertexPositionData.length );
}

function drawSphere(color, texture) {

    // set uniforms
    gl.uniform3fv( u_colorLoc, color );
    mvMatrix = mult(commonMVMatrix, noncommonMVMatrix);
    gl.uniformMatrix4fv(u_mvMatrixLoc, false, flatten(mvMatrix) );

    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.enableVertexAttribArray( a_positionLoc );
    gl.bindBuffer(gl.ARRAY_BUFFER, sphereVertexPositionBuffer);
    gl.vertexAttribPointer(a_positionLoc, 3, gl.FLOAT, false, 0, 0);

    gl.enableVertexAttribArray( a_TextureCoordLoc );
    gl.bindBuffer(gl.ARRAY_BUFFER, sphereVertexTextureCoordBuffer);
    gl.vertexAttribPointer(a_TextureCoordLoc, 2, gl.FLOAT, false, 0, 0);

    gl.enableVertexAttribArray(a_vNormalLoc);
    gl.bindBuffer(gl.ARRAY_BUFFER, nBuffer);
    gl.vertexAttribPointer( a_vNormalLoc, 3, gl.FLOAT, false, 0, 0 );

    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, sphereVertexIndexBuffer);
    gl.drawElements(gl.TRIANGLES, sphereVertexIndexData.length, gl.UNSIGNED_SHORT, 0);

}

function drawOrbits() {
    var gray = vec3( 0.2, 0.2, 0.2 );
    var angleOffset = currentDay * 360.0;  // days * degrees

    noncommonMVMatrix =  scalem(orVenus, orVenus, orVenus);
    drawCircle( gray );    // Venus

    noncommonMVMatrix = scalem(orMercury, orMercury, orMercury);
    drawCircle( gray );    // Mercury

    noncommonMVMatrix = scalem(orEarth, orEarth, orEarth);
    drawCircle( gray );    // Earth

    noncommonMVMatrix = mult(rotateY(angleOffset/pEarth), mult(translate(orEarth, 0.0, 0.0), mult(rotateZ(23.5), scalem(orMoon*45, orMoon*45, orMoon*45))));

    drawCircle( gray );    // Moon
}

function drawBodies() {
    var size;
    var angleOffset = currentDay * 360.0;  // days * degrees

    // Sun
    size = rSun * rSunMult;
    noncommonMVMatrix = scalem(size, size, size);
    drawSphere( vec3( 1.0, 1.0, 0.0 ), sunTexture);

    // Mercury
    size = rMercury * rPlanetMult;
    noncommonMVMatrix = mult(rotateY(angleOffset/pMercury),
                              mult(translate(orMercury, 0.0, 0.0), scalem(size, size, size)));
    drawSphere( vec3( 1.0, 0.5, 0.5 ), mercuryTexture );

    // Venus
    size = rVenus * rPlanetMult;
    noncommonMVMatrix =  mult(rotateY(angleOffset/pVenus),
                              mult(translate(orVenus, 0.0, 0.0), scalem(size, size, size)));
    drawSphere( vec3( 0.5, 1.0, 0.5 ), venusTexture );

    // Earth, also self-spinning
    size = rEarth* rPlanetMult;
    noncommonMVMatrix = mult(rotateY(angleOffset/pEarth),
                              mult(translate(orEarth, 0.0, 0.0), mult(rotateZ(23.5), mult(rotateY(angleOffset/1), scalem(size, size, size)))));
    drawSphere( vec3( 0.5, 0.5, 1.0 ), earthTexture);

    // Moon
    size = rMoon * rPlanetMult;
    var earthRef =  mult(rotateY(angleOffset/pEarth), mult(translate(orEarth, 0.0, 0.0), rotateZ(23.5)));
    noncommonMVMatrix = mult(earthRef, mult(rotateY(angleOffset/pMoon),
                              mult(translate(orMoon*45, 0.0, 0.0), scalem(size, size, size))));

    drawSphere( vec3( 1.0, 1.0, 1.0 ), moonTexture);

}


function drawDay() {
    var string = 'Day ' + currentDay.toString();
    printDay.innerHTML = string;
}

function dayOff() {
    var string = '';
    printDay.innerHTML = string;
}

function drawAll()
{
    gl.clear( gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT );

    // all planets and orbits will take the following transformation

    // global scaling
    commonMVMatrix = scalem(.75*globalScale, .75*globalScale, .75*globalScale);

    // rotate by 15 degrees
    commonMVMatrix = mult(rotateX(15), commonMVMatrix);

    // for trackball
    m_inc = build_rotmatrix(m_curquat);
    commonMVMatrix = mult(m_inc, commonMVMatrix);

    // viewing matrix
    commonMVMatrix = mult(lookAt(vec3(0.0, 0.0, 100.0),
                                  vec3(0.0, 0.0, 0.0),
                                  vec3(0.0, 1.0, 0.0)),
                           commonMVMatrix);

    // interface -> buttons and radio buttons
    if (document.getElementById("orbon").checked == true){
        drawOrbits();
    }
    document.getElementById("dec-dpf").onclick = function () {
        daysPerFrame = daysPerFrame / 2;
    };

    document.getElementById("inc-dpf").onclick = function () {
        daysPerFrame = daysPerFrame * 2;
    };

    // turn animation off (pause solar system)
    if (document.getElementById("animoff").checked == true && triggered == false){
        savedDay = daysPerFrame;
        daysPerFrame = 0;
        triggered = true;
    }

    // animation is on
    if (document.getElementById("animon").checked == true){
        if(daysPerFrame == 0){
            daysPerFrame = savedDay;
        }
        triggered = false;
    }

    // draw the planets
    drawBodies();

    if (document.getElementById("dayon").checked == true) {
        drawDay();
    } else {
        dayOff();
    }
}

var render = function(){

    drawAll();

    // projection matrix (separate from modelview matrix)
    projectionMatrix = perspective(30, 2.0, 0.1, 1000.0);

    // compute normal matrix
    nMatrix = normalMatrix(mvMatrix, true); // return 3 by 3 normal matrix

    gl.uniformMatrix4fv(u_mvMatrixLoc, false, flatten(mvMatrix) );
    gl.uniformMatrix4fv(u_projectionMatrixLoc, false, flatten(projectionMatrix) );
    gl.uniformMatrix3fv(u_nMatrixLoc, false, flatten(nMatrix) );

    // calculate the elapsed time
    var now = Date.now(); // time in ms
    elapsed += now - g_last;
    g_last = now;
    if (elapsed >= mspf) {
        currentDay += daysPerFrame;
        elapsed = 0;
    }
    requestAnimFrame(render);
};
