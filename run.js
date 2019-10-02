// gl context & shader programs
let gl;
let shaderProgramBridge;
let shaderProgramOcean;
let shaderProgramRoad;
let shaderProgramTown;
let shaderProgramStar;

// stuff I dont have to create every time
let a_vert;
let a_norm;
let itemColor;
let alpha_val;
let brighten;

// uniforms, so I don't have to create them every time
let projMatrix;
let modelMatrix;
let transMatrix;
let rotMatrix;
let scaleMatrix;
let scaleFactor;
let mM;
let vM;
let eP;
let proj;
let normalMatrix;
let nM;
let diffuseLightColor;
let ambientLightColor;
let diffDirection;
let shine;

// for splitting up ModelMaterialsArray and ModelAttributeArray
let numMesh = [];
let numMat = [];

// colors
let bridge_colors = [];
let ocean_colors = [];
let car_colors = [];
let chopper_colors = [];
let sheep_colors = [];

// for animating
let car_counter = 0;
let car_config = [];
let blade_counter = 0;
let chopper_counter = 0;
let chopper_config = [];
let bus_counter = 0;
let bus_config = [];

// meshes for models
let bridge_meshes = [];
let ocean_meshes = [];
let road_meshes = [];
let car_meshes = [];
let town_meshes = [];
let chopper_meshes = [];
let sign_meshes = [];
let sheep_meshes = [];
let bus_meshes = [];

// for ModelMaterialsArray stuff
let car_materials = [];
let town_materials = [];
let chopper_materials = [];
let sign_materials = [];
let bus_materials = [];

// generated from basicModelLibrary
let sphere;
let sphereBuffers = [];

// buffers for textures
let textImageBuffer;
let b1;
let b2;
let b3;
let b4;
let b5;
let b6;
let b7;
let b8;
let g;
let starText;
let signtext;

// checks if textures have loaded before activating them
let housesLoaded = [];
let carsLoaded = [];
let roadLoaded = false;
let starLoaded = false;
let signLoaded = false;

// for camera stuff
let startAnim = false;
let pauseScene = false;
let zTrans = 0;
let rotate = false;
let angle = 0;
let heliCam = false;
let freeCam = true;

// outdated texture stuff, but still used
let textFound = [];
let createText = false;

let ModelMaterialsArray = []; // an array of materials
let ModelAttributeArray = []; // vertices, normals, textcoords, uv

let carCamera = new Camera();   // car cam
let heliCamera = new Camera();  // heli cam
let frCamera = new Camera();    // free roam
let myCam = new Camera();       // current camera, always selected

let canvasWidth;
let canvasHeight;

// I thought I was gonna make this modular, but didn't
let modelDir = "models/road/";
let modelMesh = modelDir + "brije.json";
let modelText = modelDir + "textures/";

function myMain() {
    canvasWidth = parseFloat(document.getElementById("surface").width);
    canvasHeight = parseFloat(document.getElementById("surface").height);
    
    let conf = {};
    conf.forward = 0;
    conf.up = 0;
    car_config.push(conf);
    bus_config.push(conf);
    conf.left = 0;
    conf.rotate = 0;
    chopper_config.push(conf);
    
    for(let i = 0; i < 700; i++){
        let config = {};
        config.forward = -1 * (i + 1)/10;
        config.up = 0;
        car_config.push(config);
    }

    for(let i = 0; i < 925; i++){
        let config = {};
        config.forward = 1 * (i + 1)/15;
        config.up = 0;
        bus_config.push(config);
    }

    let last;
    for(let i = 0; i < 60; i++){
        let config = {};
        config.forward = 0;
        config.up = 1 * (i + 1)/10;
        config.left = 0;
        config.rotate = 0;
        chopper_config.push(config);
    }
    last = chopper_config.length - 1;
    
    for(let i = 0; i < 300; i++){
        let config = {};
        config.forward = chopper_config[last].forward;
        config.up = chopper_config[last].up;
        config.left = 1 * (i + 1)/10;
        config.rotate = 0;
        chopper_config.push(config);
    }

    last = chopper_config.length - 1;

    for(let i = 0; i < 200; i++){
        let config = {};
        config.forward = chopper_config[last].forward + (1 * (i + 1)/20);
        config.up = chopper_config[last].up - (1 * (i + 1)/20);
        config.left = chopper_config[last].left;
        config.rotate = i * 7;
        chopper_config.push(config);
    }

    initCarCam();
    initHeliCam();
    initFreeCam();
    myCam = frCamera;

    sphere = uvSphere(2000, 64, 32);

    loadExternalJSON(modelMesh);

}

function initCarCam(){
    carCamera = new Camera();
    
    // car cam init
    for(let i = 0; i < 172; i++)
        carCamera.move(5, 0.1);
    for(let i = 0; i < 14; i++)
        carCamera.move(3, 0.1);
    carCamera.rotate(2, 90);

    //console.log(carCamera);
}

function initHeliCam(){
    heliCamera = new Camera();
    //heli cam init
    for(let i = 0; i < 316; i++)
        heliCamera.move(4, 0.1);
    for(let i = 0; i < 20; i++)
        heliCamera.move(3, 0.1);
    for(let i = 0; i < 110; i++)
        heliCamera.move(1, 0.1);
    heliCamera.rotate(2, 220);
    heliCamera.rotate(0, 9);
}

function initFreeCam(){
    frCamera = new Camera();
    //free roam cam init
    for(let i = 0; i < 75; i++){
        frCamera.move(3, 0.1);
        frCamera.move(0, 0.1);
    }
    frCamera.rotate(0, 24);
}

function setUpWebGL() {
    const canvas = document.querySelector('canvas');

    // create webgl2 context. This is what we will render to
    gl = canvas.getContext('webgl2', {premultipliedAlpha: false});

    if (!gl) {
        alert('Error, obtaining webgl2 unsuccessful ');
        return null;
    }

    document.addEventListener("keydown", adjustCamera, false);

    const vertexSource = fetch('shaders/vertex.txt')
        .then(function (response) {
            //console.log('response object is returning vertex source ...');
            return response.text();
        });
    const fragSourceBridge = fetch('shaders/frag_bridge.txt')
        .then(function (response) {
            //console.log('response object is returning frag source ...');
            return response.text();
        });
    const fragSourceOcean = fetch('shaders/frag_ocean.txt')
        .then(function (response) {
            //console.log('response object is returning frag source ...');
            return response.text();
        });
    const fragSourceRoad = fetch('shaders/frag_road.txt')
        .then(function (response) {
            //console.log('response object is returning frag source ...');
            return response.text();
        });
    const fragSourceTown = fetch('shaders/frag_town.txt')
        .then(function (response) {
            //console.log('response object is returning frag source ...');
            return response.text();
        });
    const fragSourceStar = fetch('shaders/frag_star.txt')
        .then(function (response) {
            //console.log('response object is returning frag source ...');
            return response.text();
        });

    Promise.all([vertexSource, fragSourceBridge, fragSourceOcean, fragSourceRoad, fragSourceTown, fragSourceStar])
        .then(function(sources){
            // compile, link shaders and put into a shader program. 
            // let we will tell gpu to use this progam gl.useProgram(name_of_program_to_use)
            shaderProgramBridge = initShaders(gl, sources[0], sources[1]);
            shaderProgramOcean = initShaders(gl, sources[0], sources[2]);
            shaderProgramRoad = initShaders(gl, sources[0], sources[3]);
            shaderProgramTown = initShaders(gl, sources[0], sources[4]);
            shaderProgramStar = initShaders(gl, sources[0], sources[5]);
            
            initStaticVertexBufferObj();
            drawScene();
            //drawScene(gl, shaderProgramOcean);
            //drawScene(gl, shaderProgramRoad);
        });

        // get webGL context
        // create shader program
        // setup attribute buffers
        // draw/Renderloop
}

function adjustCamera(e){
    if(e.keyCode == "87"){  // w - move forward
        myCam.move(1, 0.2);
    }
    else if(e.keyCode == "83"){ // s - move backward
        myCam.move(0, 0.2);
    }
    else if(e.keyCode == "65"){ // a - move left
        myCam.move(4, 0.2);
    }
    else if(e.keyCode == "68"){ // d - mode right
        myCam.move(5, 0.2);
    }
    else if(e.keyCode == "74"){ // j - rotate right
        myCam.rotate(3, 1.5);
    }
    else if(e.keyCode == "75"){ // k - rotate left
        myCam.rotate(2, 1.5);
    }
    else if(e.keyCode == "85"){ // u - rotate up
        myCam.rotate(1, 1.5);
    }
    else if(e.keyCode == "78"){ // n - rotate down
        myCam.rotate(0, 1.5);
    }
    else if(e.keyCode == "81"){ // q - move up
        myCam.move(3, 0.2);
    }
    else if(e.keyCode == "90"){ // z - mode down
        myCam.move(2, 0.2);
    }
    else if(e.keyCode == "32"){
        rotate = !rotate;
    }
    else if(e.keyCode == "77"){ // 'm' to start animation
        startAnim = true;
        car_counter = 0;
        bus_counter = 0;
        heli_counter = 0;
    }
    else if(e.keyCode == "80"){ // 'p'
        pauseScene = !pauseScene;
    }
    else if(e.keyCode == "72"){  // switch to heli mode 'h'
        heliCam = true;
        freeCam = false;
        myCam = heliCamera;
    }
    else if(e.keyCode == "67"){ // switch to car cam 'c'
        heliCam = false;
        freeCam = false;
        myCam = carCamera;
    }
    else if(e.keyCode == "70"){ // switch to free cam 'f'
        freeCam = true;
        heliCam = false;
        myCam = frCamera;
    }
    else if(e.keyCode == "82"){ // reset scene
        initCarCam();
        initFreeCam();
        initHeliCam();
        myCam = frCamera;
        rotate = false;
        startAnim = false;
        pauseScene = false;
        angle = 0;
        car_counter = 0;
        bus_counter = 0;
        chopper_counter = 0;
    }
}

function createModelAttributeArray(obj2) {
    // obj.mesh[x] is an array of attributes
    // vertices, normals, texture coord, indices
    // get number of meshes
    let numMeshIndexes = obj2.meshes.length;
    numMesh.push(numMeshIndexes);
    //console.log(numMesh);
    let idx = 0;
    for (idx = 0; idx < numMeshIndexes; idx++) {
        let modelObj = {};

        modelObj.vertices = obj2.meshes[idx].vertices;
        
        modelObj.normals = obj2.meshes[idx].normals;

        // now get index array data from faces, [[x,y,z], [x,y,z], ...]
        // to [x,y,z,x,y,z,...]. use array concat to transform
        //modelObj.indexs = [].concat(...obj2.meshes[idx].faces);
        modelObj.indexes = obj2.meshes[idx].faces.flat();

        //which material index to use for this set of indices?
        modelObj.matIndex = obj2.meshes[idx].materialindex;


        if (obj2.meshes[idx].texturecoords !== undefined){
            modelObj.textureCoords = obj2.meshes[idx].texturecoords[0];
            // console.log(`got texture coords for ${idx}`);
            textFound.push(true);
            createText = true;
        }
        else{
            //console.log(`texture coords for ${idx} does not exist`);
            textFound.push(false);
        }

        // push onto array
        ModelAttributeArray.push(modelObj);
    }
}

function createMaterialsArray(obj2){

    // loop through array extracting material properites 
    // needed for rendering
    let itr = obj2.materials.length;
    numMat.push(itr);

    //console.log(itr);
    let idx = 0;
    for (idx = 0; idx < itr; idx++) {
        let mat = {};
        // shainding 
        mat.shadingm = obj2.materials[idx].properties[1].value;
        mat.ambient = obj2.materials[idx].properties[2].value;
        mat.diffuse = obj2.materials[idx].properties[3].value;
        mat.specular = obj2.materials[idx].properties[4].value;
        mat.shininess = obj2.materials[idx].properties[6].value;
        mat.opacity = obj2.materials[idx].properties[7].value;

        /* Not all models have textures, the below code checks for to see if a file attribute exists
         * if it does, we extract the name of the texture file.  requires ES6
         * 
         */
        let foundTextImageProperty = obj2.materials[idx].properties.find(x => x.key === '$tex.file');
        
        if( foundTextImageProperty !== undefined){
            mat.textureImageName = foundTextImageProperty.value; // name of texture file
            //console.log(mat.textureImageName);
        }
        
        // object containing all the illumination comp needed to 
        // ill faces using material properties for index idx
        ModelMaterialsArray.push(mat);
    }
}

function loadExternalJSON(url, b) {
    //console.log(url)
    fetch(url)
        .then((resp) => {
            // if the fetch does not result in a network error
            if (resp.ok)
                return resp.json(); // return response as JSON
            throw new Error(`Could not get ${url}`);
        })
        .then(function (ModelInJson) {
            createModelAttributeArray(ModelInJson);
            loadJSON2('models/chopper/chopper.json');
        })
        .catch(function (error) {
            // error retireving resource put up alerts...
            alert(error);
            console.log(error);
        });
}

function loadJSON2(url) {
    //console.log(url);
    fetch(url)
        .then((resp) => {
            // if the fetch does not result in a network error
            if (resp.ok)
                return resp.json(); // return response as JSON
            throw new Error(`Could not get ${url}`);
        })
        .then(function (ModelInJson) {
            // we have a valid Model Reference so we can use it later
        
            createModelAttributeArray(ModelInJson);
            createMaterialsArray(ModelInJson);
            loadJSON3('models/car/Low-Poly-Racing-Car.json');
        })
        .catch(function (error) {
            // error retireving resource put up alerts...
            alert(error);
            console.log(error);
        });
}

function loadJSON3(url) {
    //console.log(url);
    fetch(url)
        .then((resp) => {
            // if the fetch does not result in a network error
            if (resp.ok)
                return resp.json(); // return response as JSON
            throw new Error(`Could not get ${url}`);
        })
        .then(function (ModelInJson) {
            // we have a valid Model Reference so we can use it later
        
            createModelAttributeArray(ModelInJson);
            createMaterialsArray(ModelInJson);
            loadJSON4('models/town/Street_environment_V01.json')
        })
        .catch(function (error) {
            // error retireving resource put up alerts...
            alert(error);
            console.log(error);
        });
}

function loadJSON4(url) {
    //console.log(url);
    fetch(url)
        .then((resp) => {
            // if the fetch does not result in a network error
            if (resp.ok)
                return resp.json(); // return response as JSON
            throw new Error(`Could not get ${url}`);
        })
        .then(function (ModelInJson) {
            // we have a valid Model Reference so we can use it later
        
            createModelAttributeArray(ModelInJson);
            createMaterialsArray(ModelInJson);
            loadJSON5('models/speed_limit/sign.json')
            //setUpWebGL();
        })
        .catch(function (error) {
            // error retireving resource put up alerts...
            alert(error);
            console.log(error);
        });
}

function loadJSON5(url) {
    //console.log(url);
    fetch(url)
        .then((resp) => {
            // if the fetch does not result in a network error
            if (resp.ok)
                return resp.json(); // return response as JSON
            throw new Error(`Could not get ${url}`);
        })
        .then(function (ModelInJson) {
            // we have a valid Model Reference so we can use it later
        
            createModelAttributeArray(ModelInJson);
            createMaterialsArray(ModelInJson);
            loadJSON6('models/sheep/sheep.json')
            //setUpWebGL();  
        })
        .catch(function (error) {
            // error retireving resource put up alerts...
            alert(error);
            console.log(error);
        });
}

function loadJSON6(url) {
    //console.log(url);
    fetch(url)
        .then((resp) => {
            // if the fetch does not result in a network error
            if (resp.ok)
                return resp.json(); // return response as JSON
            throw new Error(`Could not get ${url}`);
        })
        .then(function (ModelInJson) {
            // we have a valid Model Reference so we can use it later
        
            createModelAttributeArray(ModelInJson);
            //createMaterialsArray(ModelInJson);
            loadJSON7('models/bus/bus.json')
        })
        .catch(function (error) {
            // error retireving resource put up alerts...
            alert(error);
            console.log(error);
        });
}

function loadJSON7(url) {
    //console.log(url);
    fetch(url)
        .then((resp) => {
            // if the fetch does not result in a network error
            if (resp.ok)
                return resp.json(); // return response as JSON
            throw new Error(`Could not get ${url}`);
        })
        .then(function (ModelInJson) {
            // we have a valid Model Reference so we can use it later
        
            createModelAttributeArray(ModelInJson);
            createMaterialsArray(ModelInJson);
            setUpWebGL();
        })
        .catch(function (error) {
            // error retireving resource put up alerts...
            alert(error);
            console.log(error);
        });
}

// need to do this for all meshes
function initStaticVertexBufferObj() {
   
    let beg = 0, end = numMesh[0];

    for(let i = beg; i < end; i++){
        let indexBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
        gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(ModelAttributeArray[i].indexes), gl.STATIC_DRAW)

        let normalBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, normalBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(ModelAttributeArray[i].normals), gl.STATIC_DRAW);

        let vertexBufferObj = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, vertexBufferObj);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(ModelAttributeArray[i].vertices), gl.STATIC_DRAW);  

        let textureBuffer;
        if(textFound[i]){
            textureBuffer = gl.createBuffer();
            gl.bindBuffer(gl.ARRAY_BUFFER, textureBuffer);
            gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(ModelAttributeArray[i].textureCoords), gl.STATIC_DRAW);
        }

        if(i == 10 || i == 31)
            ocean_meshes.push([indexBuffer, ModelAttributeArray[i].indexes.length, normalBuffer, vertexBufferObj, textureBuffer, ModelAttributeArray[i].matIndex]);
        else{
            if(textFound[i])
                road_meshes.push([indexBuffer, ModelAttributeArray[i].indexes.length, normalBuffer, vertexBufferObj, textureBuffer, ModelAttributeArray[i].matIndex]);
            else
                bridge_meshes.push([indexBuffer, ModelAttributeArray[i].indexes.length, normalBuffer, vertexBufferObj, ModelAttributeArray[i].matIndex]);
        }
    }

    beg = end;
    end += numMesh[1];
    
    //console.log(numMesh[1])
    for(let i = beg; i < end; i++){
        let indexBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
        gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(ModelAttributeArray[i].indexes), gl.STATIC_DRAW)

        let normalBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, normalBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(ModelAttributeArray[i].normals), gl.STATIC_DRAW);

        let vertexBufferObj = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, vertexBufferObj);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(ModelAttributeArray[i].vertices), gl.STATIC_DRAW);

        chopper_meshes.push([indexBuffer, ModelAttributeArray[i].indexes.length, normalBuffer, vertexBufferObj, ModelAttributeArray[i].matIndex]);

        chopper_colors.push([Math.random(), Math.random(), Math.random()]);
    }

    beg = end;
    end += numMesh[2];

    //console.log(numMesh[2])
    for(let i = beg; i < end; i++){
        let indexBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
        gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(ModelAttributeArray[i].indexes), gl.STATIC_DRAW)

        let normalBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, normalBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(ModelAttributeArray[i].normals), gl.STATIC_DRAW);

        let vertexBufferObj = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, vertexBufferObj);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(ModelAttributeArray[i].vertices), gl.STATIC_DRAW);
    
        car_meshes.push([indexBuffer, ModelAttributeArray[i].indexes.length, normalBuffer, vertexBufferObj, ModelAttributeArray[i].matIndex]);
    }

    beg = end;
    end += numMesh[3];

    //console.log(numMesh[3])
    for(let i = beg; i < end; i++){
        let indexBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
        gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(ModelAttributeArray[i].indexes), gl.STATIC_DRAW)

        let normalBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, normalBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(ModelAttributeArray[i].normals), gl.STATIC_DRAW);

        let vertexBufferObj = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, vertexBufferObj);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(ModelAttributeArray[i].vertices), gl.STATIC_DRAW);
    
        let textureBuffer;
        if(textFound[i]){
            textureBuffer = gl.createBuffer();
            gl.bindBuffer(gl.ARRAY_BUFFER, textureBuffer);
            gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(ModelAttributeArray[i].textureCoords), gl.STATIC_DRAW);
        }

        if(textFound[i])
            town_meshes.push([indexBuffer, ModelAttributeArray[i].indexes.length, normalBuffer, vertexBufferObj, textureBuffer, ModelAttributeArray[i].matIndex]);
        else
            town_meshes.push([indexBuffer, ModelAttributeArray[i].indexes.length, normalBuffer, vertexBufferObj]);    
    }
    
    beg = end;
    end += numMesh[4];

    for(let i = beg; i < end; i++){
        
        let indexBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
        gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(ModelAttributeArray[i].indexes), gl.STATIC_DRAW)

        let normalBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, normalBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(ModelAttributeArray[i].normals), gl.STATIC_DRAW);

        let vertexBufferObj = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, vertexBufferObj);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(ModelAttributeArray[i].vertices), gl.STATIC_DRAW);
    
        let textureBuffer;
        if(textFound[i]){
            textureBuffer = gl.createBuffer();
            gl.bindBuffer(gl.ARRAY_BUFFER, textureBuffer);
            gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(ModelAttributeArray[i].textureCoords), gl.STATIC_DRAW);
        }

        if(textFound[i])
            sign_meshes.push([indexBuffer, ModelAttributeArray[i].indexes.length, normalBuffer, vertexBufferObj, textureBuffer, ModelAttributeArray[i].matIndex]);
        else
            sign_meshes.push([indexBuffer, ModelAttributeArray[i].indexes.length, normalBuffer, vertexBufferObj, ModelAttributeArray[i].matIndex]);    
    }

    beg = end;
    end += numMesh[5];

    for(let i = beg; i < end; i++){
        
        let indexBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
        gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(ModelAttributeArray[i].indexes), gl.STATIC_DRAW)

        let normalBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, normalBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(ModelAttributeArray[i].normals), gl.STATIC_DRAW);

        let vertexBufferObj = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, vertexBufferObj);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(ModelAttributeArray[i].vertices), gl.STATIC_DRAW);
    
        let textureBuffer;
        if(textFound[i]){
            textureBuffer = gl.createBuffer();
            gl.bindBuffer(gl.ARRAY_BUFFER, textureBuffer);
            gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(ModelAttributeArray[i].textureCoords), gl.STATIC_DRAW);
        }

        sheep_meshes.push([indexBuffer, ModelAttributeArray[i].indexes.length, normalBuffer, vertexBufferObj, ModelAttributeArray[i].matIndex]);    
    }

    beg = end;
    end += numMesh[6];

    for(let i = beg; i < end; i++){
        
        let indexBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
        gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(ModelAttributeArray[i].indexes), gl.STATIC_DRAW)

        let normalBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, normalBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(ModelAttributeArray[i].normals), gl.STATIC_DRAW);

        let vertexBufferObj = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, vertexBufferObj);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(ModelAttributeArray[i].vertices), gl.STATIC_DRAW);
    
        // let textureBuffer;
        // if(textFound[i]){
        //     textureBuffer = gl.createBuffer();
        //     gl.bindBuffer(gl.ARRAY_BUFFER, textureBuffer);
        //     gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(ModelAttributeArray[i].textureCoords), gl.STATIC_DRAW);
        // }

        // if(textFound[i])
            // bus_meshes.push([indexBuffer, ModelAttributeArray[i].indexes.length, normalBuffer, vertexBufferObj, textureBuffer, ModelAttributeArray[i].matIndex]);
        // else
        bus_meshes.push([indexBuffer, ModelAttributeArray[i].indexes.length, normalBuffer, vertexBufferObj, ModelAttributeArray[i].matIndex]);    
    }

    beg = 0;
    end = numMat[0];

    // console.log(numMat);
    for(let i = beg; i < end; i++)
        chopper_materials.push(ModelMaterialsArray[i]);    
    
    beg = end;
    end += numMat[1];

    for(let i = beg; i < end; i++)
        car_materials.push(ModelMaterialsArray[i]);
    
    beg = end;
    end += numMat[2];

    for(let i = beg ; i < end; i++)
        town_materials.push(ModelMaterialsArray[i]);
    
    beg = end;
    end += numMat[3];

    for(let i = beg ; i < end; i++)
        sign_materials.push(ModelMaterialsArray[i]);

    // beg = end;
    // end += numMat[4];   // skipping over sheep materials
    beg = end;
    end += numMat[4];
    for(let i = beg ; i < end; i++)
        bus_materials.push(ModelMaterialsArray[i]);
    //setup bridge_colors for bridge
    {
        // road paving
        bridge_colors.push([0.1, 0.1, 0.1]);
        bridge_colors.push([0.1, 0.1, 0.1]);
        bridge_colors.push([0.1, 0.1, 0.1]);
        bridge_colors.push([0.1, 0.1, 0.1]);
        bridge_colors.push([0.1, 0.1, 0.1]);

        // bridge frame
        bridge_colors.push([0.3, 0.3, 0.3]);

        // light color
        bridge_colors.push([1.0, 1.0, 1.0]);

        // light stands
        bridge_colors.push([0.1, 0.1, 0.1]);

        // railing
        bridge_colors.push([0.2, 0.2, 0.2]);

        // railing support
        bridge_colors.push([78/256,46/256,40/256]);
        
        // bottom reflection
        bridge_colors.push([9/256,56/256, 255/256]);

        // green bridge lining
        bridge_colors.push([54/256,100/256,79/256]);
        bridge_colors.push([1,1,1]);
        
        // side reflective panel
        bridge_colors.push([9/256,56/256, 255/256]);

        // REPEAT PATTERN
        // road paving
        bridge_colors.push([0.1, 0.1, 0.1]);

        // bridge frame
        bridge_colors.push([0.3, 0.3, 0.3]);

        // light color
        bridge_colors.push([1,1,1]);

         // light stands
         bridge_colors.push([0.1, 0.1, 0.1]);

         // railing
         bridge_colors.push([0.2, 0.2, 0.2]);
 
         // railing support
         bridge_colors.push([78/256,46/256,40/256]);
         
         // bottom reflection
         bridge_colors.push([9/256,56/256, 255/256]);
 
         // green bridge lining
         bridge_colors.push([54/256,100/256,79/256]);
         bridge_colors.push([1,1,1]);
         
         // side reflective panel
         bridge_colors.push([9/256,56/256, 255/256]);
         
         // REPEAT ABOVE AGAIN

         // road paving
        bridge_colors.push([0.1, 0.1, 0.1]);

        // bridge frame
        bridge_colors.push([0.3, 0.3, 0.3]);
        
        // light color
        bridge_colors.push([1,1,1]);

        // light stands
        bridge_colors.push([0.1, 0.1, 0.1]);

        // railing
        bridge_colors.push([0.2, 0.2, 0.2]);

        // railing support
        bridge_colors.push([78/256,46/256,40/256]);
        
        // bottom reflection
        bridge_colors.push([9/256,56/256, 255/256]);

        // green bridge lining
        bridge_colors.push([54/256,100/256,79/256]);
        bridge_colors.push([1,1,1]);
        
        // side reflective panel
        bridge_colors.push([9/256,56/256, 255/256]);

        // --------- water and sand color

        ocean_colors.push([238/256, 214/256, 175/256]);
        ocean_colors.push([0.0, 0.567, 0.845]);

    }

    //setup car_colors
    {
        car_colors.push([0.14, 0.15, 0.18]);
        car_colors.push([0.4, .1, 0.1]);
        car_colors.push([0.4, .1, 0.1]);
        car_colors.push([0.85, 0.87, 0.85]);
        car_colors.push([0.4, .1, 0.1]);

        car_colors.push([0.05, 0.1, 0.15]);
        car_colors.push([0.7, 0.9, 0.95]);
        car_colors.push([0.85, 0.68, 0.7]);

        car_colors.push([0.85, 0.87, 0.85]); // back rim
        car_colors.push([0.05, 0.1, 0.15]); // back tire
        car_colors.push([0.34, 0.345, 0.36]); // back disc

        // same front stuff
        car_colors.push([0.85, 0.87, 0.85]);
        car_colors.push([0.05, 0.1, 0.15]);
        car_colors.push([0.34, 0.345, 0.36]);
    }

    //setup sheep_colors
    {
        sheep_colors.push([0.5, 0.5, 0.5]);
        sheep_colors.push([0.08, 0.08, 0.08]);
        sheep_colors.push([0.7, 0, 0]);
        sheep_colors.push([0, 0.5, 0]);
        sheep_colors.push([0.296875, 0.1796875, 0.1015625]);
    }
    // house keeping, unbind buffer. Bind it again when we need it
    gl.bindBuffer(gl.ARRAY_BUFFER, null);
}

function drawScene() {
    gl.clearColor(0.1, 0.1, 0.1, 1.0);
    gl.clearDepth(1.0);
    gl.enable(gl.DEPTH_TEST);
    gl.clear(gl.COLOR_BUFFER_BIT, gl.DEPTH_BUFFER_BIT);

    let sphereI = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, sphereI);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, sphere.indices, gl.STATIC_DRAW)

    let sphereV = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, sphereV);
    gl.bufferData(gl.ARRAY_BUFFER, sphere.vertexPositions, gl.STATIC_DRAW)
    
    let sphereN = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, sphereN);
    gl.bufferData(gl.ARRAY_BUFFER, sphere.vertexNormals, gl.STATIC_DRAW)
    
    let sphereT = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, sphereT);
    gl.bufferData(gl.ARRAY_BUFFER, sphere.vertexTextureCoords, gl.STATIC_DRAW)

    sphereBuffers.push(sphereI);
    sphereBuffers.push(sphereV);
    sphereBuffers.push(sphereN);
    sphereBuffers.push(sphereT);
    
    if(createText){
        var tex = gl.createTexture();
        gl.bindTexture(gl.TEXTURE_2D, tex);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE,
                        new Uint8Array([255, 0, 0, 255]));

        // load the road texture
        let pictureImage = new Image;
        pictureImage.src = modelText + 'road_d.jpg';

        pictureImage.onload = function(){
            gl.useProgram(shaderProgramRoad);
            textImageBuffer = gl.createTexture();

            gl.bindTexture(gl.TEXTURE_2D, textImageBuffer);
            gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
            gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, pictureImage.naturalWidth, pictureImage.naturalHeight, 0, gl.RGBA, gl.UNSIGNED_BYTE, pictureImage);

            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
            
            gl.activeTexture(gl.TEXTURE0);  
            gl.bindTexture(gl.TEXTURE_2D, textImageBuffer);

            let textureLocation = gl.getUniformLocation(shaderProgramRoad, 'textureSampler');
            gl.uniform1i(textureLocation, 0);
            
            roadLoaded = true;
        }

        let b1Image = new Image;
        b1Image.src = 'models/town/textures/building03_c.jpg';

        b1Image.onload = function(){
            gl.useProgram(shaderProgramTown);

            b1 = gl.createTexture();

            gl.bindTexture(gl.TEXTURE_2D, b1);
            gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
            gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, b1Image.naturalWidth, b1Image.naturalHeight, 0, gl.RGBA, gl.UNSIGNED_BYTE, b1Image);

            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);

            gl.activeTexture(gl.TEXTURE0);  
            gl.bindTexture(gl.TEXTURE_2D, b1);

            let textureLocation = gl.getUniformLocation(shaderProgramTown, 'textureSampler');
            gl.uniform1i(textureLocation, 0);

            housesLoaded.push(true);
        }

        let b2Image = new Image;
        b2Image.src = 'models/town/textures/Building_V02_C.png';

        b2Image.onload = function(){
            gl.useProgram(shaderProgramTown);

            b2 = gl.createTexture();

            gl.bindTexture(gl.TEXTURE_2D, b2);
            gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
            gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, b2Image.naturalWidth, b2Image.naturalHeight, 0, gl.RGBA, gl.UNSIGNED_BYTE, b2Image);

            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);

            gl.activeTexture(gl.TEXTURE0);
            gl.bindTexture(gl.TEXTURE_2D, b2);

            let textureLocation = gl.getUniformLocation(shaderProgramTown, 'textureSampler');
            gl.uniform1i(textureLocation, 0);

            housesLoaded.push(true);

        }

        let b3Image = new Image;
        b3Image.src = 'models/town/textures/building_016_c.jpg';

        b3Image.onload = function(){
            gl.useProgram(shaderProgramTown);

            b3 = gl.createTexture();

            gl.bindTexture(gl.TEXTURE_2D, b3);
            gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
            gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, b3Image.naturalWidth, b3Image.naturalHeight, 0, gl.RGBA, gl.UNSIGNED_BYTE, b3Image);

            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);

            gl.activeTexture(gl.TEXTURE0);
            gl.bindTexture(gl.TEXTURE_2D, b3);

            let textureLocation = gl.getUniformLocation(shaderProgramTown, 'textureSampler');
            gl.uniform1i(textureLocation, 0);

            housesLoaded.push(true);

        }

        let b4Image = new Image;
        b4Image.src = 'models/town/textures/building_025_c.jpg';

        b4Image.onload = function(){
            gl.useProgram(shaderProgramTown);

            b4 = gl.createTexture();

            gl.bindTexture(gl.TEXTURE_2D, b4);
            gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
            gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, b4Image.naturalWidth, b4Image.naturalHeight, 0, gl.RGBA, gl.UNSIGNED_BYTE, b4Image);

            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);

            gl.activeTexture(gl.TEXTURE0);  
            gl.bindTexture(gl.TEXTURE_2D, b4);

            let textureLocation = gl.getUniformLocation(shaderProgramTown, 'textureSampler');
            gl.uniform1i(textureLocation, 0);
            
            housesLoaded.push(true);

        }

        let b5Image = new Image;
        b5Image.src = 'models/town/textures/building 01_c.jpg';

        b5Image.onload = function(){
            gl.useProgram(shaderProgramTown);

            b5 = gl.createTexture();

            gl.bindTexture(gl.TEXTURE_2D, b5);
            gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
            gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, b5Image.naturalWidth, b5Image.naturalHeight, 0, gl.RGBA, gl.UNSIGNED_BYTE, b5Image);

            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);

            gl.activeTexture(gl.TEXTURE0);  
            gl.bindTexture(gl.TEXTURE_2D, b5);

            let textureLocation = gl.getUniformLocation(shaderProgramTown, 'textureSampler');
            gl.uniform1i(textureLocation, 0);

            housesLoaded.push(true);

        }

        let b6Image = new Image;
        b6Image.src = 'models/town/textures/building 06_ c.jpg';
        
        b6Image.onload = function(){
            gl.useProgram(shaderProgramTown);

            b6 = gl.createTexture();

            gl.bindTexture(gl.TEXTURE_2D, b6);
            gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
            gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, b6Image.naturalWidth, b6Image.naturalHeight, 0, gl.RGBA, gl.UNSIGNED_BYTE, b6Image);

            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);

            gl.activeTexture(gl.TEXTURE0);
            gl.bindTexture(gl.TEXTURE_2D, b6);

            let textureLocation = gl.getUniformLocation(shaderProgramTown, 'textureSampler');
            gl.uniform1i(textureLocation, 0);

            housesLoaded.push(true);

        }

        let b7Image = new Image;
        b7Image.src = 'models/town/textures/building05 _c.jpg';

        b7Image.onload = function(){
            gl.useProgram(shaderProgramTown);

            b7 = gl.createTexture();

            gl.bindTexture(gl.TEXTURE_2D, b7);
            gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
            gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, b7Image.naturalWidth, b7Image.naturalHeight, 0, gl.RGBA, gl.UNSIGNED_BYTE, b7Image);

            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);

            gl.activeTexture(gl.TEXTURE0);
            gl.bindTexture(gl.TEXTURE_2D, b7);

            let textureLocation = gl.getUniformLocation(shaderProgramTown, 'textureSampler');
            gl.uniform1i(textureLocation, 0);

            housesLoaded.push(true);

        }

        let b8Image = new Image;
        b8Image.src = 'models/town/textures/Building_V01_C.png';

        b8Image.onload = function(){
            gl.useProgram(shaderProgramTown);

            b8 = gl.createTexture();

            gl.bindTexture(gl.TEXTURE_2D, b8);
            gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
            gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, b8Image.naturalWidth, b8Image.naturalHeight, 0, gl.RGBA, gl.UNSIGNED_BYTE, b8Image);

            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);

            gl.activeTexture(gl.TEXTURE0);
            gl.bindTexture(gl.TEXTURE_2D, b8);

            let textureLocation = gl.getUniformLocation(shaderProgramTown, 'textureSampler');
            gl.uniform1i(textureLocation, 0);

            housesLoaded.push(true);

        }

        let gImage = new Image;
        gImage.src = 'models/town/textures/grass.jpg';

        gImage.onload = function(){
            gl.useProgram(shaderProgramTown);

            g = gl.createTexture();

            gl.bindTexture(gl.TEXTURE_2D, g);
            gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
            gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gImage.naturalWidth, gImage.naturalHeight, 0, gl.RGBA, gl.UNSIGNED_BYTE, gImage);

            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);

            gl.activeTexture(gl.TEXTURE0);  

            let textureLocation = gl.getUniformLocation(shaderProgramTown, 'textureSampler');
            gl.uniform1i(textureLocation, 0);

            housesLoaded.push(true);

        }

        let starImage = new Image;
        starImage.src = 'models/starmap8k.jpg';

        starImage.onload = function(){
            gl.useProgram(shaderProgramStar);

            starText = gl.createTexture();

            gl.bindTexture(gl.TEXTURE_2D, starText);
            gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
            gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, starImage.naturalWidth, starImage.naturalHeight, 0, gl.RGBA, gl.UNSIGNED_BYTE, starImage);

            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);

            gl.activeTexture(gl.TEXTURE0);  

            let textureLocation = gl.getUniformLocation(shaderProgramStar, 'textureSampler');
            gl.uniform1i(textureLocation, 0);

            starLoaded = true;
            rotate = true;
        }

        let signImg = new Image;
        signImg.src = 'models/speed_limit/35 mph speed limit sign unwrap 4888.png';

        signImg.onload = function(){
            gl.useProgram(shaderProgramTown);

            signtext = gl.createTexture();

            gl.bindTexture(gl.TEXTURE_2D, signtext);
            gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
            gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, signImg.naturalWidth, signImg.naturalHeight, 0, gl.RGBA, gl.UNSIGNED_BYTE, signImg);

            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);

            gl.activeTexture(gl.TEXTURE0);  

            let textureLocation = gl.getUniformLocation(shaderProgramTown, 'textureSampler');
            gl.uniform1i(textureLocation, 0);

            signLoaded = true;
        }


    }

    // specify which binaries (shader programs) to use for vertex and fragshader
    
    drawAll();
}

function drawAll(){

    // generic stuff for whole program
    if(rotate)
        angle += 1;

    gl.clear(gl.COLOR_BUFFER_BIT, gl.DEPTH_BUFFER_BIT);

    projMatrix = glMatrix.mat4.create();
    glMatrix.mat4.perspective(projMatrix, Math.PI/3, canvasWidth/canvasHeight, 0.001, 2500.0); 
    
    // road specific stuff
    {
        scaleFactor = 1;
        gl.useProgram(shaderProgramRoad);
            
        let diffuseLightColor = gl.getUniformLocation(shaderProgramRoad, 'uDiffuseLightColor');
        gl.uniform3fv(diffuseLightColor, [1.0, 1.0, 1.0]);  

        let ambientLightColor = gl.getUniformLocation(shaderProgramRoad, 'uAmbientLightColor');
        gl.uniform3fv(ambientLightColor, [0.1, 0.1, 0.1]);

        let diffDirection = gl.getUniformLocation(shaderProgramRoad, 'uDiffuseLightDirection');
        gl.uniform3fv(diffDirection, [-0.5, -0.5, -0.5]);

        let shine = gl.getUniformLocation(shaderProgramRoad, 'shininess');
        gl.uniform1f(shine, 343.8);

        mM = gl.getUniformLocation(shaderProgramRoad, 'modelMat');
        vM = gl.getUniformLocation(shaderProgramRoad, 'viewMat');
        eP = gl.getUniformLocation(shaderProgramRoad, 'eyePos');
        proj = gl.getUniformLocation(shaderProgramRoad, 'projection');
        nM = gl.getUniformLocation(shaderProgramRoad, 'normMat');

        a_vert = gl.getAttribLocation(shaderProgramRoad, 'a_position');
        a_norm = gl.getAttribLocation(shaderProgramRoad, 'a_normal');
        itemColor = gl.getUniformLocation(shaderProgramRoad, 'cubeColor');

        drawRoad();
    }

    // bridge specific stuff
    {
        scaleFactor = 1;

        gl.useProgram(shaderProgramBridge);    

        diffuseLightColor = gl.getUniformLocation(shaderProgramBridge, 'uDiffuseLightColor');
        gl.uniform3fv(diffuseLightColor, [1.0, 1.0, 1.0]);  

        ambientLightColor = gl.getUniformLocation(shaderProgramBridge, 'uAmbientLightColor');
        gl.uniform3fv(ambientLightColor, [0.1, 0.1, 0.1]);

        diffDirection = gl.getUniformLocation(shaderProgramBridge, 'uDiffuseLightDirection');
        gl.uniform3fv(diffDirection, [-0.5, -0.5, -0.5]);

        shine = gl.getUniformLocation(shaderProgramBridge, 'shininess');
        gl.uniform1f(shine, 343.8);

        mM = gl.getUniformLocation(shaderProgramBridge, 'modelMat');
        vM = gl.getUniformLocation(shaderProgramBridge, 'viewMat');
        eP = gl.getUniformLocation(shaderProgramBridge, 'eyePos');
        proj = gl.getUniformLocation(shaderProgramBridge, 'projection');
        nM = gl.getUniformLocation(shaderProgramBridge, 'normMat');

        a_vert = gl.getAttribLocation(shaderProgramBridge, 'a_position');
        a_norm = gl.getAttribLocation(shaderProgramBridge, 'a_normal');
        itemColor = gl.getUniformLocation(shaderProgramBridge, 'cubeColor');

        brighten = gl.getUniformLocation(shaderProgramBridge, 'brighten');
        gl.uniform1f(brighten, 0.0);

        drawBridge();
    }

    // sheep specific stuff
    {
        gl.uniform3fv(ambientLightColor, [0.8, 0.8, 0.8]);
        gl.uniform1f(shine, 10);
        scaleFactor = 0.5;
        drawSheep();
    }

    // draw bus, same shader as town
    {
        scaleFactor = 0.4;
        gl.uniform1f(brighten, -0.25);
        drawbus();
    }

    // town specific stuff
    {
    gl.useProgram(shaderProgramTown);

    diffuseLightColor = gl.getUniformLocation(shaderProgramTown, 'uDiffuseLightColor');
    gl.uniform3fv(diffuseLightColor, [1.0, 1.0, 1.0]);

    ambientLightColor = gl.getUniformLocation(shaderProgramTown, 'uAmbientLightColor');
    gl.uniform3fv(ambientLightColor, [0.1, 0.1, 0.1]);

    diffDirection = gl.getUniformLocation(shaderProgramTown, 'uDiffuseLightDirection');
    gl.uniform3fv(diffDirection, [-0.5, -0.5, -0.5]);

    shine = gl.getUniformLocation(shaderProgramTown, 'shininess');
    gl.uniform1f(shine, 343.8);

    mM = gl.getUniformLocation(shaderProgramTown, 'modelMat');
    vM = gl.getUniformLocation(shaderProgramTown, 'viewMat');
    eP = gl.getUniformLocation(shaderProgramTown, 'eyePos');
    proj = gl.getUniformLocation(shaderProgramTown, 'projection');
    nM = gl.getUniformLocation(shaderProgramTown, 'normMat');

    a_vert = gl.getAttribLocation(shaderProgramTown, 'a_position');
    a_norm = gl.getAttribLocation(shaderProgramTown, 'a_normal');
    // itemColor = gl.getUniformLocation(shaderProgramTown, 'cubeColor');

    scaleFactor = 0.5;
    
    drawTown();
    }

    // draw stop sign, same shader as town
    {
    scaleFactor = 0.1;
    drawSign();
    }

    
    // draw sphere/sky
    {
    gl.useProgram(shaderProgramStar);

    mM = gl.getUniformLocation(shaderProgramStar, 'modelMat');
    vM = gl.getUniformLocation(shaderProgramStar, 'viewMat');
    eP = gl.getUniformLocation(shaderProgramStar, 'eyePos');
    proj = gl.getUniformLocation(shaderProgramStar, 'projection');
    nM = gl.getUniformLocation(shaderProgramStar, 'normMat');

    a_vert = gl.getAttribLocation(shaderProgramStar, 'a_position');
    a_norm = gl.getAttribLocation(shaderProgramStar, 'a_normal');

    scaleFactor = 1;
    
    drawSphere();
    }

    // ocean specific stuff
    {
    scaleFactor = 1;
    gl.useProgram(shaderProgramOcean);    

    diffuseLightColor = gl.getUniformLocation(shaderProgramOcean, 'uDiffuseLightColor');
    gl.uniform3fv(diffuseLightColor, [1.0, 1.0, 1.0]);  

    ambientLightColor = gl.getUniformLocation(shaderProgramOcean, 'uAmbientLightColor');
    gl.uniform3fv(ambientLightColor, [0.1, 0.1, 0.1]);

    diffDirection = gl.getUniformLocation(shaderProgramOcean, 'uDiffuseLightDirection');
    gl.uniform3fv(diffDirection, [-0.5, -0.5, -0.5]);

    shine = gl.getUniformLocation(shaderProgramOcean, 'shininess');
    gl.uniform1f(shine, 343.8);

    mM = gl.getUniformLocation(shaderProgramOcean, 'modelMat');
    vM = gl.getUniformLocation(shaderProgramOcean, 'viewMat');
    eP = gl.getUniformLocation(shaderProgramOcean, 'eyePos');
    proj = gl.getUniformLocation(shaderProgramOcean, 'projection');
    nM = gl.getUniformLocation(shaderProgramOcean, 'normMat');

    a_vert = gl.getAttribLocation(shaderProgramOcean, 'a_position');
    a_norm = gl.getAttribLocation(shaderProgramOcean, 'a_normal');
    itemColor = gl.getUniformLocation(shaderProgramOcean, 'cubeColor');
    alpha_val = gl.getUniformLocation(shaderProgramOcean, 'alpha');

    drawOcean();
    }
    
    if(heliCam){
    // car specific stuff ---- uses same shader as ocean
        {
            scaleFactor = 0.006;
            gl.uniform1f(shine, 343.8);
            
            drawCar();
        }
        // draw chopper, same FS as car since alpha
        {
            scaleFactor = 0.4;
            gl.uniform1f(shine, 500);
            drawChopper();
        }
        
    }
    else{
        // draw chopper, same FS as car since alpha
        {
            scaleFactor = 0.4;
            gl.uniform1f(shine, 500);
            drawChopper();
        }
        {
            scaleFactor = 0.006;
            gl.uniform1f(shine, 343.8);
            gl.uniform3fv(diffuseLightColor, [1.0, 1.0, 1.0]);  
            gl.uniform3fv(ambientLightColor, [0.1, 0.1, 0.1]);

            drawCar();
        }
    }


    requestAnimationFrame(drawAll);
}

function drawBridge(){
  
    modelMatrix = glMatrix.mat4.create();
    transMatrix = glMatrix.mat4.create();
    rotMatrix = glMatrix.mat4.create();
    scaleMatrix = glMatrix.mat4.create();
    normalMatrix = glMatrix.mat4.create();

    // uniform setup
    {
        glMatrix.mat4.scale(scaleMatrix, scaleMatrix, [scaleFactor, scaleFactor, 1.5 * scaleFactor]);
        glMatrix.mat4.translate(transMatrix, transMatrix, [6, -1, 0]);
        glMatrix.mat4.fromYRotation(rotMatrix, angle * Math.PI/180);

        glMatrix.mat4.multiply(modelMatrix, modelMatrix, rotMatrix);
        glMatrix.mat4.multiply(modelMatrix, modelMatrix, transMatrix);
        glMatrix.mat4.multiply(modelMatrix, modelMatrix, scaleMatrix);

        gl.uniformMatrix4fv(mM, 0, modelMatrix);
        gl.uniformMatrix4fv(vM, 0, myCam.matrix);
        gl.uniform3fv(eP, myCam.positionVector);
        gl.uniformMatrix4fv(proj, 0, projMatrix);

        glMatrix.mat4.copy(normalMatrix, myCam.matrix);
        glMatrix.mat4.multiply(normalMatrix, normalMatrix, modelMatrix); // this is now the model view matrix
        glMatrix.mat4.invert(normalMatrix, normalMatrix);
        glMatrix.mat4.transpose(normalMatrix, normalMatrix);

        gl.uniformMatrix4fv(nM, 0, normalMatrix);
    }

    //draw calls for bridge
    for(let i = 0; i < bridge_meshes.length; i++){
        
        // vertices
        gl.bindBuffer(gl.ARRAY_BUFFER, bridge_meshes[i][3]);
        // indices
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, bridge_meshes[i][0]);
        
        gl.vertexAttribPointer(a_vert, 3, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(a_vert);

        // normals
        gl.bindBuffer(gl.ARRAY_BUFFER, bridge_meshes[i][2]);
        
        gl.vertexAttribPointer(a_norm, 3, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(a_norm);
        
        gl.uniform3fv(itemColor, bridge_colors[i]);

        // index length
        gl.drawElements(gl.TRIANGLES, bridge_meshes[i][1], gl.UNSIGNED_SHORT, 0);
    }
}

function drawRoad(){

    modelMatrix = glMatrix.mat4.create();
    transMatrix = glMatrix.mat4.create();
    rotMatrix = glMatrix.mat4.create();
    scaleMatrix = glMatrix.mat4.create();
    normalMatrix = glMatrix.mat4.create();

    {
        glMatrix.mat4.scale(scaleMatrix, scaleMatrix, [scaleFactor, scaleFactor, 1.5 * scaleFactor]);
        glMatrix.mat4.translate(transMatrix, transMatrix, [6, -1, 0]);
        glMatrix.mat4.fromYRotation(rotMatrix, angle * Math.PI/180);

        glMatrix.mat4.multiply(modelMatrix, modelMatrix, rotMatrix);
        glMatrix.mat4.multiply(modelMatrix, modelMatrix, transMatrix);
        glMatrix.mat4.multiply(modelMatrix, modelMatrix, scaleMatrix);

        gl.uniformMatrix4fv(mM, 0, modelMatrix);
        gl.uniformMatrix4fv(vM, 0, myCam.matrix);
        gl.uniform3fv(eP, myCam.positionVector);
        gl.uniformMatrix4fv(proj, 0, projMatrix);

        glMatrix.mat4.copy(normalMatrix, myCam.matrix);
        glMatrix.mat4.multiply(normalMatrix, normalMatrix, modelMatrix); // this is now the model view matrix
        glMatrix.mat4.invert(normalMatrix, normalMatrix);
        glMatrix.mat4.transpose(normalMatrix, normalMatrix);

        gl.uniformMatrix4fv(nM, 0, normalMatrix);
    }

    //draw calls for road
    for(let i = 0; i < road_meshes.length; i++){

        // vertices
        gl.bindBuffer(gl.ARRAY_BUFFER, road_meshes[i][3]);
        // indices
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, road_meshes[i][0]);
        gl.vertexAttribPointer(a_vert, 3, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(a_vert);

        // normals
        gl.bindBuffer(gl.ARRAY_BUFFER, road_meshes[i][2]);
        gl.vertexAttribPointer(a_norm, 3, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(a_norm);

        // texture coords
        gl.bindBuffer(gl.ARRAY_BUFFER, road_meshes[i][4]);
        let textureAttribLocation = gl.getAttribLocation(shaderProgramRoad, 'vertTextureCoord');
        gl.vertexAttribPointer(textureAttribLocation, 2, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(textureAttribLocation);

        if(roadLoaded)
            gl.bindTexture(gl.TEXTURE_2D, textImageBuffer);

        // need to change this to road at some point
        gl.uniform3fv(itemColor, [1.0, 1.0, 1.0]);

        // index length
        gl.drawElements(gl.TRIANGLES, road_meshes[i][1], gl.UNSIGNED_SHORT, 0);
    }
    
    modelMatrix = glMatrix.mat4.create();
    transMatrix = glMatrix.mat4.create();
    rotMatrix = glMatrix.mat4.create();
    scaleMatrix = glMatrix.mat4.create();
    normalMatrix = glMatrix.mat4.create();

    {
        glMatrix.mat4.scale(scaleMatrix, scaleMatrix, [scaleFactor, scaleFactor, 1.5 * scaleFactor]);
        glMatrix.mat4.translate(transMatrix, transMatrix, [-19, -1, 0]);
        glMatrix.mat4.fromYRotation(rotMatrix, angle * Math.PI/180);

        glMatrix.mat4.multiply(modelMatrix, modelMatrix, rotMatrix);
        glMatrix.mat4.multiply(modelMatrix, modelMatrix, transMatrix);
        glMatrix.mat4.multiply(modelMatrix, modelMatrix, scaleMatrix);

        gl.uniformMatrix4fv(mM, 0, modelMatrix);
        gl.uniformMatrix4fv(vM, 0, myCam.matrix);
        gl.uniform3fv(eP, myCam.positionVector);
        gl.uniformMatrix4fv(proj, 0, projMatrix);

        glMatrix.mat4.copy(normalMatrix, myCam.matrix);
        glMatrix.mat4.multiply(normalMatrix, normalMatrix, modelMatrix); // this is now the model view matrix
        glMatrix.mat4.invert(normalMatrix, normalMatrix);
        glMatrix.mat4.transpose(normalMatrix, normalMatrix);

        gl.uniformMatrix4fv(nM, 0, normalMatrix);
    }

    for(let i = 0; i < road_meshes.length; i++){

        // vertices
        gl.bindBuffer(gl.ARRAY_BUFFER, road_meshes[i][3]);
        // indices
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, road_meshes[i][0]);
        gl.vertexAttribPointer(a_vert, 3, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(a_vert);

        // normals
        gl.bindBuffer(gl.ARRAY_BUFFER, road_meshes[i][2]);
        gl.vertexAttribPointer(a_norm, 3, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(a_norm);

        // texture coords
        gl.bindBuffer(gl.ARRAY_BUFFER, road_meshes[i][4]);
        let textureAttribLocation = gl.getAttribLocation(shaderProgramRoad, 'vertTextureCoord');
        gl.vertexAttribPointer(textureAttribLocation, 2, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(textureAttribLocation);

        if(roadLoaded)
            gl.bindTexture(gl.TEXTURE_2D, textImageBuffer);

        // need to change this to road at some point
        gl.uniform3fv(itemColor, [1.0, 1.0, 1.0]);

        // index length
        gl.drawElements(gl.TRIANGLES, road_meshes[i][1], gl.UNSIGNED_SHORT, 0);
    }

    modelMatrix = glMatrix.mat4.create();
    transMatrix = glMatrix.mat4.create();
    rotMatrix = glMatrix.mat4.create();
    scaleMatrix = glMatrix.mat4.create();
    normalMatrix = glMatrix.mat4.create();

    {
        glMatrix.mat4.scale(scaleMatrix, scaleMatrix, [scaleFactor, scaleFactor, 1.5 * scaleFactor]);
        glMatrix.mat4.translate(transMatrix, transMatrix, [-42.25, -1, 0]);
        glMatrix.mat4.fromYRotation(rotMatrix, angle * Math.PI/180);

        glMatrix.mat4.multiply(modelMatrix, modelMatrix, rotMatrix);
        glMatrix.mat4.multiply(modelMatrix, modelMatrix, transMatrix);
        glMatrix.mat4.multiply(modelMatrix, modelMatrix, scaleMatrix);

        gl.uniformMatrix4fv(mM, 0, modelMatrix);
        gl.uniformMatrix4fv(vM, 0, myCam.matrix);
        gl.uniform3fv(eP, myCam.positionVector);
        gl.uniformMatrix4fv(proj, 0, projMatrix);

        glMatrix.mat4.copy(normalMatrix, myCam.matrix);
        glMatrix.mat4.multiply(normalMatrix, normalMatrix, modelMatrix); // this is now the model view matrix
        glMatrix.mat4.invert(normalMatrix, normalMatrix);
        glMatrix.mat4.transpose(normalMatrix, normalMatrix);

        gl.uniformMatrix4fv(nM, 0, normalMatrix);
    }

    for(let i = 0; i < road_meshes.length; i++){

        // vertices
        gl.bindBuffer(gl.ARRAY_BUFFER, road_meshes[i][3]);
        // indices
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, road_meshes[i][0]);
        gl.vertexAttribPointer(a_vert, 3, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(a_vert);

        // normals
        gl.bindBuffer(gl.ARRAY_BUFFER, road_meshes[i][2]);
        gl.vertexAttribPointer(a_norm, 3, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(a_norm);

        // texture coords
        gl.bindBuffer(gl.ARRAY_BUFFER, road_meshes[i][4]);
        let textureAttribLocation = gl.getAttribLocation(shaderProgramRoad, 'vertTextureCoord');
        gl.vertexAttribPointer(textureAttribLocation, 2, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(textureAttribLocation);

        if(roadLoaded)
            gl.bindTexture(gl.TEXTURE_2D, textImageBuffer);

        // need to change this to road at some point
        gl.uniform3fv(itemColor, [1.0, 1.0, 1.0]);

        // index length
        gl.drawElements(gl.TRIANGLES, road_meshes[i][1], gl.UNSIGNED_SHORT, 0);
    }

}

function drawOcean(){
    modelMatrix = glMatrix.mat4.create();
    transMatrix = glMatrix.mat4.create();
    rotMatrix = glMatrix.mat4.create();
    scaleMatrix = glMatrix.mat4.create();
    normalMatrix = glMatrix.mat4.create();

    gl.enable(gl.BLEND)
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

    // uniform setup
    {
        glMatrix.mat4.scale(scaleMatrix, scaleMatrix, [scaleFactor*2, scaleFactor, scaleFactor*2]);
        glMatrix.mat4.translate(transMatrix, transMatrix, [6, -0.95, 0]);
        glMatrix.mat4.fromYRotation(rotMatrix, angle * Math.PI/180);

        glMatrix.mat4.multiply(modelMatrix, modelMatrix, rotMatrix);
        glMatrix.mat4.multiply(modelMatrix, modelMatrix, transMatrix);
        glMatrix.mat4.multiply(modelMatrix, modelMatrix, scaleMatrix);

        gl.uniformMatrix4fv(mM, 0, modelMatrix);
        gl.uniformMatrix4fv(vM, 0, myCam.matrix);
        gl.uniform3fv(eP, myCam.positionVector);
        gl.uniformMatrix4fv(proj, 0, projMatrix);

        glMatrix.mat4.copy(normalMatrix, myCam.matrix);
        glMatrix.mat4.multiply(normalMatrix, normalMatrix, modelMatrix); // this is now the model view matrix
        glMatrix.mat4.invert(normalMatrix, normalMatrix);
        glMatrix.mat4.transpose(normalMatrix, normalMatrix);

        gl.uniformMatrix4fv(nM, 0, normalMatrix);
    }

    //draw calls for bridge
    for(let i = 0; i < ocean_meshes.length; i++){
        
        // vertices
        gl.bindBuffer(gl.ARRAY_BUFFER, ocean_meshes[i][3]);
        // indices
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, ocean_meshes[i][0]);
        
        gl.vertexAttribPointer(a_vert, 3, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(a_vert);

        // normals
        gl.bindBuffer(gl.ARRAY_BUFFER, ocean_meshes[i][2]);
        
        gl.vertexAttribPointer(a_norm, 3, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(a_norm);
        
        gl.uniform3fv(itemColor, ocean_colors[i]);
        
        if(i == 0)
            gl.uniform1f(alpha_val, 1.0);
        else
            gl.uniform1f(alpha_val, 0.8);

        // index length
        gl.drawElements(gl.TRIANGLES, ocean_meshes[i][1], gl.UNSIGNED_SHORT, 0);
    }

    gl.disable(gl.BLEND);
}

function drawCar(){

    if(startAnim && !pauseScene){
        if(car_counter == car_config.length - 2){
            car_counter = 0;
            initCarCam();
            if(!heliCam && !freeCam){
                myCam = carCamera;
            }
        }
        else{
            car_counter += 1;
            carCamera.move(1, car_config[car_counter].forward - car_config[car_counter+1].forward);
        }
    }

    modelMatrix = glMatrix.mat4.create();
    transMatrix = glMatrix.mat4.create();
    rotMatrix = glMatrix.mat4.create();
    scaleMatrix = glMatrix.mat4.create();
    normalMatrix = glMatrix.mat4.create();

    gl.enable(gl.BLEND)
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

    // uniform setup
    {
        glMatrix.mat4.scale(scaleMatrix, scaleMatrix, [scaleFactor, scaleFactor, scaleFactor]);
        glMatrix.mat4.fromYRotation(rotMatrix, angle * Math.PI/180);

        let modelRot = glMatrix.mat4.create();
        glMatrix.mat4.fromYRotation(modelRot, 113 * Math.PI/180);

        let transCar = glMatrix.mat4.create();
        glMatrix.mat4.translate(transCar, transCar, [17, 0.80, -0.1]);

        let animateCar = glMatrix.mat4.create();
        glMatrix.mat4.translate(animateCar, animateCar, [car_config[car_counter].forward, car_config[car_counter].up, 0]);

        glMatrix.mat4.multiply(modelMatrix, modelMatrix, rotMatrix);
        if(startAnim)
            glMatrix.mat4.multiply(modelMatrix, modelMatrix, animateCar);
        glMatrix.mat4.multiply(modelMatrix, modelMatrix, transCar);
        glMatrix.mat4.multiply(modelMatrix, modelMatrix, modelRot);
        glMatrix.mat4.multiply(modelMatrix, modelMatrix, scaleMatrix);


        gl.uniformMatrix4fv(mM, 0, modelMatrix);
        gl.uniformMatrix4fv(vM, 0, myCam.matrix);
        gl.uniform3fv(eP, myCam.positionVector);
        gl.uniformMatrix4fv(proj, 0, projMatrix);

        glMatrix.mat4.copy(normalMatrix, myCam.matrix);
        glMatrix.mat4.multiply(normalMatrix, normalMatrix, modelMatrix); // this is now the model view matrix
        glMatrix.mat4.invert(normalMatrix, normalMatrix);
        glMatrix.mat4.transpose(normalMatrix, normalMatrix);

        gl.uniformMatrix4fv(nM, 0, normalMatrix);
    }

    //draw calls for bridge
    for(let i = 0; i < car_meshes.length; i++){
        
        // vertices
        gl.bindBuffer(gl.ARRAY_BUFFER, car_meshes[i][3]);
        // indices
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, car_meshes[i][0]);
        
        gl.vertexAttribPointer(a_vert, 3, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(a_vert);

        if(i == 5)
            gl.uniform1f(alpha_val, 0.3);
        else
            gl.uniform1f(alpha_val, 1.0);

        // normals
        gl.bindBuffer(gl.ARRAY_BUFFER, car_meshes[i][2]);
        
        gl.vertexAttribPointer(a_norm, 3, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(a_norm);
        
        gl.uniform3fv(itemColor, car_colors[i]);

        // index length
        gl.drawElements(gl.TRIANGLES, car_meshes[i][1], gl.UNSIGNED_SHORT, 0);
    }
    gl.disable(gl.BLEND);

}

function drawTown(){
    modelMatrix = glMatrix.mat4.create();
    transMatrix = glMatrix.mat4.create();
    rotMatrix = glMatrix.mat4.create();
    scaleMatrix = glMatrix.mat4.create();
    normalMatrix = glMatrix.mat4.create();

    // uniform setup
    {
        glMatrix.mat4.scale(scaleMatrix, scaleMatrix, [scaleFactor, scaleFactor, scaleFactor]);
        glMatrix.mat4.translate(transMatrix, transMatrix, [-31, 0.9, 1.6]);
        glMatrix.mat4.fromYRotation(rotMatrix, angle * Math.PI/180);

        glMatrix.mat4.multiply(modelMatrix, modelMatrix, rotMatrix);
        // why do I get the feeling that this is wrong.. but seems right
        glMatrix.mat4.multiply(modelMatrix, modelMatrix, transMatrix);
        glMatrix.mat4.multiply(modelMatrix, modelMatrix, scaleMatrix);


        gl.uniformMatrix4fv(mM, 0, modelMatrix);
        gl.uniformMatrix4fv(vM, 0, myCam.matrix);
        gl.uniform3fv(eP, myCam.positionVector);
        gl.uniformMatrix4fv(proj, 0, projMatrix);

        glMatrix.mat4.copy(normalMatrix, myCam.matrix);
        glMatrix.mat4.multiply(normalMatrix, normalMatrix, modelMatrix); // this is now the model view matrix
        glMatrix.mat4.invert(normalMatrix, normalMatrix);
        glMatrix.mat4.transpose(normalMatrix, normalMatrix);

        gl.uniformMatrix4fv(nM, 0, normalMatrix);
    }

    //draw calls for town
    for(let i = 0; i < town_meshes.length; i++){
        
        if (town_meshes[i].length > 5) {
            
            gl.uniform3fv(diffuseLightColor, town_materials[town_meshes[i][5]].diffuse);
            gl.uniform3fv(ambientLightColor, town_materials[town_meshes[i][5]].ambient);
            gl.uniform1f(shine, town_materials[town_meshes[i][5]].shininess);

            // vertices
            gl.bindBuffer(gl.ARRAY_BUFFER, town_meshes[i][3]);
            // indices
            gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, town_meshes[i][0]);
            
            gl.vertexAttribPointer(a_vert, 3, gl.FLOAT, false, 0, 0);
            gl.enableVertexAttribArray(a_vert);

            // normals
            gl.bindBuffer(gl.ARRAY_BUFFER, town_meshes[i][2]);        
            gl.vertexAttribPointer(a_norm, 3, gl.FLOAT, false, 0, 0);
            gl.enableVertexAttribArray(a_norm);

            //texture coords
            gl.bindBuffer(gl.ARRAY_BUFFER, town_meshes[i][4]);
            let textureAttribLocation = gl.getAttribLocation(shaderProgramTown, 'vertTextureCoord');
            gl.vertexAttribPointer(textureAttribLocation, 2, gl.FLOAT, false, 0, 0);
            gl.enableVertexAttribArray(textureAttribLocation);

            if(housesLoaded.length == 9){
                if (i == 5)
                    gl.bindTexture(gl.TEXTURE_2D, g);
                else if (town_materials[town_meshes[i][5]].textureImageName == 'building03_c.jpg')
                    gl.bindTexture(gl.TEXTURE_2D, b1);
                else if (town_materials[town_meshes[i][5]].textureImageName == 'Building_V02_C.png')
                    gl.bindTexture(gl.TEXTURE_2D, b2);
                else if (town_materials[town_meshes[i][5]].textureImageName == 'building_016_c.jpg')
                    gl.bindTexture(gl.TEXTURE_2D, b3);
                else if (town_materials[town_meshes[i][5]].textureImageName == 'building_025_c.jpg')
                    gl.bindTexture(gl.TEXTURE_2D, b4);
                else if (town_materials[town_meshes[i][5]].textureImageName == 'building 01_c.jpg')
                    gl.bindTexture(gl.TEXTURE_2D, b5);
                else if (town_materials[town_meshes[i][5]].textureImageName == 'building 06_ c.jpg')
                    gl.bindTexture(gl.TEXTURE_2D, b6);
                else if (town_materials[town_meshes[i][5]].textureImageName == 'building05 _c.jpg')
                    gl.bindTexture(gl.TEXTURE_2D, b7);
                else if (town_materials[town_meshes[i][5]].textureImageName == 'Building_V01_C.png')
                    gl.bindTexture(gl.TEXTURE_2D, b8);    
            }

            //gl.uniform3fv(itemColor, [1.0, 1.0, 1.0]);

            // index length
            gl.drawElements(gl.TRIANGLES, town_meshes[i][1], gl.UNSIGNED_SHORT, 0);
            //console.log('drawing');
        }
    }
}

function drawSphere(){
    modelMatrix = glMatrix.mat4.create();
    transMatrix = glMatrix.mat4.create();
    rotMatrix = glMatrix.mat4.create();
    scaleMatrix = glMatrix.mat4.create();
    normalMatrix = glMatrix.mat4.create();

    // uniform setup
    {
        glMatrix.mat4.scale(scaleMatrix, scaleMatrix, [scaleFactor, scaleFactor, scaleFactor]);
        glMatrix.mat4.translate(transMatrix, transMatrix, [6, -0.95, 0]);
        glMatrix.mat4.fromYRotation(rotMatrix, angle * Math.PI/180);

        glMatrix.mat4.multiply(modelMatrix, modelMatrix, rotMatrix);
        //glMatrix.mat4.multiply(modelMatrix, modelMatrix, transMatrix);
        glMatrix.mat4.multiply(modelMatrix, modelMatrix, scaleMatrix);

        gl.uniformMatrix4fv(mM, 0, modelMatrix);
        gl.uniformMatrix4fv(vM, 0, myCam.matrix);
        gl.uniform3fv(eP, myCam.positionVector);
        gl.uniformMatrix4fv(proj, 0, projMatrix);

        glMatrix.mat4.copy(normalMatrix, myCam.matrix);
        glMatrix.mat4.multiply(normalMatrix, normalMatrix, modelMatrix); // this is now the model view matrix
        glMatrix.mat4.invert(normalMatrix, normalMatrix);
        glMatrix.mat4.transpose(normalMatrix, normalMatrix);

        gl.uniformMatrix4fv(nM, 0, normalMatrix);
    }


    // vertices
    gl.bindBuffer(gl.ARRAY_BUFFER, sphereBuffers[1]);
    
    // indices
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, sphereBuffers[0]);
    gl.vertexAttribPointer(a_vert, 3, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(a_vert);

    // normals
    // gl.bindBuffer(gl.ARRAY_BUFFER, sphereBuffers[2]);
    // gl.vertexAttribPointer(a_norm, 3, gl.FLOAT, false, 0, 0);
    // gl.enableVertexAttribArray(a_norm);

    gl.bindBuffer(gl.ARRAY_BUFFER, sphereBuffers[3]);
    let textureAttribLocation = gl.getAttribLocation(shaderProgramTown, 'vertTextureCoord');
    gl.vertexAttribPointer(textureAttribLocation, 2, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(textureAttribLocation);

    if(starLoaded)
        gl.bindTexture(gl.TEXTURE_2D, starText);
    
    // gl.uniform3fv(itemColor, [1.0, 1.0, 1.0]);

    // index length
    gl.drawElements(gl.TRIANGLES, sphere.indices.length, gl.UNSIGNED_SHORT, 0);

}

function drawChopper(){
    let back = true;
    if(startAnim && !pauseScene){
        heliCamera.rotate(1, 9);
        heliCamera.rotate(3, 40);
        if(chopper_counter == chopper_config.length - 2){
            chopper_counter = 0;
            initHeliCam();
            if(heliCam){
                myCam = heliCamera;
                back = false;
            }
        }
        else{
            chopper_counter += 1;
            heliCamera.rotate(3, chopper_config[chopper_counter - 1].rotate)
            heliCamera.move(0, chopper_config[chopper_counter].forward - chopper_config[chopper_counter+1].forward);
            heliCamera.move(5, chopper_config[chopper_counter].left - chopper_config[chopper_counter+1].left);
            heliCamera.move(2, chopper_config[chopper_counter].up - chopper_config[chopper_counter+1].up);
            heliCamera.rotate(2, chopper_config[chopper_counter].rotate)
            if(chopper_counter == chopper_config.length - 3)
                heliCamera.rotate(2, chopper_config[chopper_counter].rotate)

            // 3 up, 2 down, 0 back
        }
        if(back){
            heliCamera.rotate(2, 40);
            heliCamera.rotate(0, 9);
        }
    }

    gl.enable(gl.BLEND)
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

    
    // draw helipad before rest of heli, otherwise windows transparency doesn't render it and shows grass
    gl.uniform3fv(diffuseLightColor, chopper_materials[chopper_meshes[7][4]].diffuse);
    gl.uniform3fv(ambientLightColor, chopper_materials[chopper_meshes[7][4]].ambient);
    gl.uniform1f(shine, chopper_materials[chopper_meshes[7][4]].shininess);

    // vertices
    gl.bindBuffer(gl.ARRAY_BUFFER, chopper_meshes[7][3]);
    // indices
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, chopper_meshes[7][0]);

    gl.vertexAttribPointer(a_vert, 3, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(a_vert);

    // normals
    gl.bindBuffer(gl.ARRAY_BUFFER, chopper_meshes[7][2]);

    gl.vertexAttribPointer(a_norm, 3, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(a_norm);

    gl.uniform3fv(itemColor, chopper_materials[chopper_meshes[7][4]].diffuse);

    modelMatrix = glMatrix.mat4.create();
    transMatrix = glMatrix.mat4.create();
    rotMatrix = glMatrix.mat4.create();
    scaleMatrix = glMatrix.mat4.create();
    normalMatrix = glMatrix.mat4.create();

    glMatrix.mat4.scale(scaleMatrix, scaleMatrix, [0.5 * scaleFactor, scaleFactor, 0.5 * scaleFactor]);
    glMatrix.mat4.translate(transMatrix, transMatrix, [-31.75, 0.75, -12]);
    glMatrix.mat4.fromYRotation(rotMatrix, angle * Math.PI / 180);

    glMatrix.mat4.multiply(modelMatrix, modelMatrix, rotMatrix);
    glMatrix.mat4.multiply(modelMatrix, modelMatrix, transMatrix);
    glMatrix.mat4.multiply(modelMatrix, modelMatrix, scaleMatrix);

    gl.uniformMatrix4fv(mM, 0, modelMatrix);
    gl.uniformMatrix4fv(vM, 0, myCam.matrix);
    gl.uniform3fv(eP, myCam.positionVector);
    gl.uniformMatrix4fv(proj, 0, projMatrix);

    glMatrix.mat4.copy(normalMatrix, myCam.matrix);
    glMatrix.mat4.multiply(normalMatrix, normalMatrix, modelMatrix); // this is now the model view matrix
    glMatrix.mat4.invert(normalMatrix, normalMatrix);
    glMatrix.mat4.transpose(normalMatrix, normalMatrix);

    gl.uniformMatrix4fv(nM, 0, normalMatrix);
    
    gl.drawElements(gl.TRIANGLES, chopper_meshes[7][1], gl.UNSIGNED_SHORT, 0);

    for(let i = 0; i < chopper_meshes.length; i++){
        if(i != 7){

            gl.uniform3fv(diffuseLightColor, chopper_materials[chopper_meshes[i][4]].diffuse);
            gl.uniform3fv(ambientLightColor, chopper_materials[chopper_meshes[i][4]].ambient);
            gl.uniform1f(shine, chopper_materials[chopper_meshes[i][4]].shininess);

            // vertices
            gl.bindBuffer(gl.ARRAY_BUFFER, chopper_meshes[i][3]);
            // indices
            gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, chopper_meshes[i][0]);
            
            gl.vertexAttribPointer(a_vert, 3, gl.FLOAT, false, 0, 0);
            gl.enableVertexAttribArray(a_vert);

            // normals
            gl.bindBuffer(gl.ARRAY_BUFFER, chopper_meshes[i][2]);
            
            gl.vertexAttribPointer(a_norm, 3, gl.FLOAT, false, 0, 0);
            gl.enableVertexAttribArray(a_norm);
            
            gl.uniform3fv(itemColor, chopper_materials[chopper_meshes[i][4]].diffuse);

            modelMatrix = glMatrix.mat4.create();
            transMatrix = glMatrix.mat4.create();
            rotMatrix = glMatrix.mat4.create();
            scaleMatrix = glMatrix.mat4.create();
            normalMatrix = glMatrix.mat4.create();

            if(i == 5)
                gl.uniform1f(alpha_val, 0.3);
            else
                gl.uniform1f(alpha_val, 1.0);

            
            glMatrix.mat4.scale(scaleMatrix, scaleMatrix, [scaleFactor, scaleFactor, scaleFactor]);
            
            if(i == 2 || i == 3)
                glMatrix.mat4.translate(transMatrix, transMatrix, [-31.75, 0.75, -12.3]);
            else if(i == 0 || i == 1)
                glMatrix.mat4.translate(transMatrix, transMatrix, [-31.75, 2.148, -16.78]);
            else
                glMatrix.mat4.translate(transMatrix, transMatrix, [-31.75, 0.75, -12]);


            glMatrix.mat4.fromYRotation(rotMatrix, angle * Math.PI/180);

            let animateChopper = glMatrix.mat4.create();
            glMatrix.mat4.translate(animateChopper, animateChopper, [chopper_config[chopper_counter].left, chopper_config[chopper_counter].up, chopper_config[chopper_counter].forward]);

            let chopperSpin = glMatrix.mat4.create();
            glMatrix.mat4.fromYRotation(chopperSpin, (chopper_config[chopper_counter].rotate)/30);
            
            glMatrix.mat4.multiply(modelMatrix, modelMatrix, rotMatrix);
            if(startAnim)
                glMatrix.mat4.multiply(modelMatrix, modelMatrix, animateChopper);
            glMatrix.mat4.multiply(modelMatrix, modelMatrix, transMatrix);
            glMatrix.mat4.multiply(modelMatrix, modelMatrix, scaleMatrix);
            if(startAnim);
                glMatrix.mat4.multiply(modelMatrix, modelMatrix, chopperSpin);

            if(i == 2 || i == 3){
                if(startAnim && !pauseScene){
                    blade_counter += 24;
                }
                
                let rotBlades = glMatrix.mat4.create();
                glMatrix.mat4.fromYRotation(rotBlades, blade_counter * Math.PI/180);

                let movBlades = glMatrix.mat4.create();
                glMatrix.mat4.translate(movBlades, movBlades, [0,0,0.7]);

                glMatrix.mat4.multiply(modelMatrix, modelMatrix, rotBlades);
                glMatrix.mat4.multiply(modelMatrix, modelMatrix, movBlades);
            }

            if(i == 0 || i == 1){
                let rotBlades = glMatrix.mat4.create();
                glMatrix.mat4.fromXRotation(rotBlades, -4.3 * blade_counter * Math.PI/180);

                let movBlades = glMatrix.mat4.create();
                glMatrix.mat4.translate(movBlades, movBlades, [0, -3.5, 12.0]);

                glMatrix.mat4.multiply(modelMatrix, modelMatrix, rotBlades);
                glMatrix.mat4.multiply(modelMatrix, modelMatrix, movBlades);
            }
            
            gl.uniformMatrix4fv(mM, 0, modelMatrix);
            gl.uniformMatrix4fv(vM, 0, myCam.matrix);
            gl.uniform3fv(eP, myCam.positionVector);
            gl.uniformMatrix4fv(proj, 0, projMatrix);

            glMatrix.mat4.copy(normalMatrix, myCam.matrix);
            glMatrix.mat4.multiply(normalMatrix, normalMatrix, modelMatrix); // this is now the model view matrix
            glMatrix.mat4.invert(normalMatrix, normalMatrix);
            glMatrix.mat4.transpose(normalMatrix, normalMatrix);

            gl.uniformMatrix4fv(nM, 0, normalMatrix);
    
            // index length
            gl.drawElements(gl.TRIANGLES, chopper_meshes[i][1], gl.UNSIGNED_SHORT, 0);
        }
    }

    gl.disable(gl.BLEND)
}

function drawSign(){
    modelMatrix = glMatrix.mat4.create();
    transMatrix = glMatrix.mat4.create();
    rotMatrix = glMatrix.mat4.create();
    scaleMatrix = glMatrix.mat4.create();
    normalMatrix = glMatrix.mat4.create();

    // uniform setup
    {
        glMatrix.mat4.scale(scaleMatrix, scaleMatrix, [scaleFactor, scaleFactor, scaleFactor]);
        glMatrix.mat4.translate(transMatrix, transMatrix, [2, 1.73, -1.05]);
        glMatrix.mat4.fromYRotation(rotMatrix, angle * Math.PI/180);

        let initRot = glMatrix.mat4.create();
        glMatrix.mat4.fromYRotation(initRot, 90 * Math.PI/180);

        glMatrix.mat4.multiply(modelMatrix, modelMatrix, rotMatrix);
        // why do I get the feeling that this is wrong.. but seems right
        glMatrix.mat4.multiply(modelMatrix, modelMatrix, transMatrix);
        glMatrix.mat4.multiply(modelMatrix, modelMatrix, initRot);
        glMatrix.mat4.multiply(modelMatrix, modelMatrix, scaleMatrix);
        


        gl.uniformMatrix4fv(mM, 0, modelMatrix);
        gl.uniformMatrix4fv(vM, 0, myCam.matrix);
        gl.uniform3fv(eP, myCam.positionVector);
        gl.uniformMatrix4fv(proj, 0, projMatrix);

        glMatrix.mat4.copy(normalMatrix, myCam.matrix);
        glMatrix.mat4.multiply(normalMatrix, normalMatrix, modelMatrix); // this is now the model view matrix
        glMatrix.mat4.invert(normalMatrix, normalMatrix);
        glMatrix.mat4.transpose(normalMatrix, normalMatrix);

        gl.uniformMatrix4fv(nM, 0, normalMatrix);
    }

    //draw calls for town
    for(let i = 0; i < sign_meshes.length; i++){
        
        if (sign_meshes[i].length > 5) {
            
            gl.uniform3fv(diffuseLightColor, sign_materials[sign_meshes[i][5]].diffuse);
            gl.uniform3fv(ambientLightColor, sign_materials[sign_meshes[i][5]].ambient);
            gl.uniform1f(shine, sign_materials[sign_meshes[i][5]].shininess);

            // vertices
            gl.bindBuffer(gl.ARRAY_BUFFER, sign_meshes[i][3]);
            // indices
            gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, sign_meshes[i][0]);
            
            gl.vertexAttribPointer(a_vert, 3, gl.FLOAT, false, 0, 0);
            gl.enableVertexAttribArray(a_vert);

            // normals
            gl.bindBuffer(gl.ARRAY_BUFFER, sign_meshes[i][2]);        
            gl.vertexAttribPointer(a_norm, 3, gl.FLOAT, false, 0, 0);
            gl.enableVertexAttribArray(a_norm);

            //texture coords
            gl.bindBuffer(gl.ARRAY_BUFFER, sign_meshes[i][4]);
            let textureAttribLocation = gl.getAttribLocation(shaderProgramTown, 'vertTextureCoord');
            gl.vertexAttribPointer(textureAttribLocation, 2, gl.FLOAT, false, 0, 0);
            gl.enableVertexAttribArray(textureAttribLocation);

            if(signLoaded)
                    gl.bindTexture(gl.TEXTURE_2D, signtext);

            // index length
            gl.drawElements(gl.TRIANGLES, sign_meshes[i][1], gl.UNSIGNED_SHORT, 0);
            //console.log('drawing');
        }
        else
            console.log('error in sign, found one without texture')
    }
}

function drawSheep(){
    modelMatrix = glMatrix.mat4.create();
    transMatrix = glMatrix.mat4.create();
    rotMatrix = glMatrix.mat4.create();
    scaleMatrix = glMatrix.mat4.create();
    normalMatrix = glMatrix.mat4.create();

    // uniform setup
    {
        glMatrix.mat4.scale(scaleMatrix, scaleMatrix, [scaleFactor, scaleFactor, scaleFactor]);
        glMatrix.mat4.translate(transMatrix, transMatrix, [-34.5, 0.91, 7]);
        glMatrix.mat4.fromYRotation(rotMatrix, angle * Math.PI/180);

        let initRot = glMatrix.mat4.create();
        glMatrix.mat4.fromYRotation(initRot, 40 * Math.PI/180);

        glMatrix.mat4.multiply(modelMatrix, modelMatrix, rotMatrix);
        glMatrix.mat4.multiply(modelMatrix, modelMatrix, transMatrix);
        glMatrix.mat4.multiply(modelMatrix, modelMatrix, initRot);
        glMatrix.mat4.multiply(modelMatrix, modelMatrix, scaleMatrix);

        gl.uniformMatrix4fv(mM, 0, modelMatrix);
        gl.uniformMatrix4fv(vM, 0, myCam.matrix);
        gl.uniform3fv(eP, myCam.positionVector);
        gl.uniformMatrix4fv(proj, 0, projMatrix);

        glMatrix.mat4.copy(normalMatrix, myCam.matrix);
        glMatrix.mat4.multiply(normalMatrix, normalMatrix, modelMatrix); // this is now the model view matrix
        glMatrix.mat4.invert(normalMatrix, normalMatrix);
        glMatrix.mat4.transpose(normalMatrix, normalMatrix);

        gl.uniformMatrix4fv(nM, 0, normalMatrix);
    }

    //draw calls for bridge
    for(let i = 0; i < sheep_meshes.length; i++){
        
        // vertices
        gl.bindBuffer(gl.ARRAY_BUFFER, sheep_meshes[i][3]);
        // indices
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, sheep_meshes[i][0]);
        
        gl.vertexAttribPointer(a_vert, 3, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(a_vert);

        // normals
        gl.bindBuffer(gl.ARRAY_BUFFER, sheep_meshes[i][2]);
        
        gl.vertexAttribPointer(a_norm, 3, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(a_norm);
        
        gl.uniform3fv(itemColor, sheep_colors[i]);

        // index length
        gl.drawElements(gl.TRIANGLES, sheep_meshes[i][1], gl.UNSIGNED_SHORT, 0);
    }

    modelMatrix = glMatrix.mat4.create();
    transMatrix = glMatrix.mat4.create();
    rotMatrix = glMatrix.mat4.create();
    scaleMatrix = glMatrix.mat4.create();
    normalMatrix = glMatrix.mat4.create();

    // uniform setup
    {
        glMatrix.mat4.scale(scaleMatrix, scaleMatrix, [scaleFactor, scaleFactor, scaleFactor]);
        glMatrix.mat4.translate(transMatrix, transMatrix, [-31.5, 0.91, 9]);
        glMatrix.mat4.fromYRotation(rotMatrix, angle * Math.PI/180);

        let initRot = glMatrix.mat4.create();
        glMatrix.mat4.fromYRotation(initRot, -40 * Math.PI/180);

        glMatrix.mat4.multiply(modelMatrix, modelMatrix, rotMatrix);
        glMatrix.mat4.multiply(modelMatrix, modelMatrix, transMatrix);
        glMatrix.mat4.multiply(modelMatrix, modelMatrix, initRot);
        glMatrix.mat4.multiply(modelMatrix, modelMatrix, scaleMatrix);

        gl.uniformMatrix4fv(mM, 0, modelMatrix);
        gl.uniformMatrix4fv(vM, 0, myCam.matrix);
        gl.uniform3fv(eP, myCam.positionVector);
        gl.uniformMatrix4fv(proj, 0, projMatrix);

        glMatrix.mat4.copy(normalMatrix, myCam.matrix);
        glMatrix.mat4.multiply(normalMatrix, normalMatrix, modelMatrix); // this is now the model view matrix
        glMatrix.mat4.invert(normalMatrix, normalMatrix);
        glMatrix.mat4.transpose(normalMatrix, normalMatrix);

        gl.uniformMatrix4fv(nM, 0, normalMatrix);
    }

    //draw calls for bridge
    for(let i = 0; i < sheep_meshes.length; i++){
        
        // vertices
        gl.bindBuffer(gl.ARRAY_BUFFER, sheep_meshes[i][3]);
        // indices
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, sheep_meshes[i][0]);
        
        gl.vertexAttribPointer(a_vert, 3, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(a_vert);

        // normals
        gl.bindBuffer(gl.ARRAY_BUFFER, sheep_meshes[i][2]);
        
        gl.vertexAttribPointer(a_norm, 3, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(a_norm);
        
        gl.uniform3fv(itemColor, sheep_colors[i]);

        // index length
        gl.drawElements(gl.TRIANGLES, sheep_meshes[i][1], gl.UNSIGNED_SHORT, 0);
    }

    modelMatrix = glMatrix.mat4.create();
    transMatrix = glMatrix.mat4.create();
    rotMatrix = glMatrix.mat4.create();
    scaleMatrix = glMatrix.mat4.create();
    normalMatrix = glMatrix.mat4.create();

    // uniform setup
    {
        glMatrix.mat4.scale(scaleMatrix, scaleMatrix, [scaleFactor, scaleFactor, scaleFactor]);
        glMatrix.mat4.translate(transMatrix, transMatrix, [-29.5, 0.91, 13]);
        glMatrix.mat4.fromYRotation(rotMatrix, angle * Math.PI/180);

        let initRot = glMatrix.mat4.create();
        glMatrix.mat4.fromYRotation(initRot, 0 * Math.PI/180);

        glMatrix.mat4.multiply(modelMatrix, modelMatrix, rotMatrix);
        glMatrix.mat4.multiply(modelMatrix, modelMatrix, transMatrix);
        glMatrix.mat4.multiply(modelMatrix, modelMatrix, initRot);
        glMatrix.mat4.multiply(modelMatrix, modelMatrix, scaleMatrix);

        gl.uniformMatrix4fv(mM, 0, modelMatrix);
        gl.uniformMatrix4fv(vM, 0, myCam.matrix);
        gl.uniform3fv(eP, myCam.positionVector);
        gl.uniformMatrix4fv(proj, 0, projMatrix);

        glMatrix.mat4.copy(normalMatrix, myCam.matrix);
        glMatrix.mat4.multiply(normalMatrix, normalMatrix, modelMatrix); // this is now the model view matrix
        glMatrix.mat4.invert(normalMatrix, normalMatrix);
        glMatrix.mat4.transpose(normalMatrix, normalMatrix);

        gl.uniformMatrix4fv(nM, 0, normalMatrix);
    }

    //draw calls for bridge
    for(let i = 0; i < sheep_meshes.length; i++){
        
        // vertices
        gl.bindBuffer(gl.ARRAY_BUFFER, sheep_meshes[i][3]);
        // indices
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, sheep_meshes[i][0]);
        
        gl.vertexAttribPointer(a_vert, 3, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(a_vert);

        // normals
        gl.bindBuffer(gl.ARRAY_BUFFER, sheep_meshes[i][2]);
        
        gl.vertexAttribPointer(a_norm, 3, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(a_norm);
        
        gl.uniform3fv(itemColor, sheep_colors[i]);

        // index length
        gl.drawElements(gl.TRIANGLES, sheep_meshes[i][1], gl.UNSIGNED_SHORT, 0);
    }

    modelMatrix = glMatrix.mat4.create();
    transMatrix = glMatrix.mat4.create();
    rotMatrix = glMatrix.mat4.create();
    scaleMatrix = glMatrix.mat4.create();
    normalMatrix = glMatrix.mat4.create();

    // uniform setup
    {
        glMatrix.mat4.scale(scaleMatrix, scaleMatrix, [scaleFactor, scaleFactor, scaleFactor]);
        glMatrix.mat4.translate(transMatrix, transMatrix, [-28.9, 0.91, 9]);
        glMatrix.mat4.fromYRotation(rotMatrix, angle * Math.PI/180);

        let initRot = glMatrix.mat4.create();
        glMatrix.mat4.fromYRotation(initRot, 70 * Math.PI/180);

        glMatrix.mat4.multiply(modelMatrix, modelMatrix, rotMatrix);
        glMatrix.mat4.multiply(modelMatrix, modelMatrix, transMatrix);
        glMatrix.mat4.multiply(modelMatrix, modelMatrix, initRot);
        glMatrix.mat4.multiply(modelMatrix, modelMatrix, scaleMatrix);

        gl.uniformMatrix4fv(mM, 0, modelMatrix);
        gl.uniformMatrix4fv(vM, 0, myCam.matrix);
        gl.uniform3fv(eP, myCam.positionVector);
        gl.uniformMatrix4fv(proj, 0, projMatrix);

        glMatrix.mat4.copy(normalMatrix, myCam.matrix);
        glMatrix.mat4.multiply(normalMatrix, normalMatrix, modelMatrix); // this is now the model view matrix
        glMatrix.mat4.invert(normalMatrix, normalMatrix);
        glMatrix.mat4.transpose(normalMatrix, normalMatrix);

        gl.uniformMatrix4fv(nM, 0, normalMatrix);
    }

    //draw calls for bridge
    for(let i = 0; i < sheep_meshes.length; i++){
        
        // vertices
        gl.bindBuffer(gl.ARRAY_BUFFER, sheep_meshes[i][3]);
        // indices
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, sheep_meshes[i][0]);
        
        gl.vertexAttribPointer(a_vert, 3, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(a_vert);

        // normals
        gl.bindBuffer(gl.ARRAY_BUFFER, sheep_meshes[i][2]);
        
        gl.vertexAttribPointer(a_norm, 3, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(a_norm);
        
        gl.uniform3fv(itemColor, sheep_colors[i]);

        // index length
        gl.drawElements(gl.TRIANGLES, sheep_meshes[i][1], gl.UNSIGNED_SHORT, 0);
    }

    modelMatrix = glMatrix.mat4.create();
    transMatrix = glMatrix.mat4.create();
    rotMatrix = glMatrix.mat4.create();
    scaleMatrix = glMatrix.mat4.create();
    normalMatrix = glMatrix.mat4.create();

    // uniform setup
    {
        glMatrix.mat4.scale(scaleMatrix, scaleMatrix, [scaleFactor, scaleFactor, scaleFactor]);
        glMatrix.mat4.translate(transMatrix, transMatrix, [-28.1, 0.91, 12.2]);
        glMatrix.mat4.fromYRotation(rotMatrix, angle * Math.PI/180);

        let initRot = glMatrix.mat4.create();
        glMatrix.mat4.fromYRotation(initRot, 337 * Math.PI/180);

        glMatrix.mat4.multiply(modelMatrix, modelMatrix, rotMatrix);
        glMatrix.mat4.multiply(modelMatrix, modelMatrix, transMatrix);
        glMatrix.mat4.multiply(modelMatrix, modelMatrix, initRot);
        glMatrix.mat4.multiply(modelMatrix, modelMatrix, scaleMatrix);

        gl.uniformMatrix4fv(mM, 0, modelMatrix);
        gl.uniformMatrix4fv(vM, 0, myCam.matrix);
        gl.uniform3fv(eP, myCam.positionVector);
        gl.uniformMatrix4fv(proj, 0, projMatrix);

        glMatrix.mat4.copy(normalMatrix, myCam.matrix);
        glMatrix.mat4.multiply(normalMatrix, normalMatrix, modelMatrix); // this is now the model view matrix
        glMatrix.mat4.invert(normalMatrix, normalMatrix);
        glMatrix.mat4.transpose(normalMatrix, normalMatrix);

        gl.uniformMatrix4fv(nM, 0, normalMatrix);
    }

    //draw calls for bridge
    for(let i = 0; i < sheep_meshes.length; i++){
        
        // vertices
        gl.bindBuffer(gl.ARRAY_BUFFER, sheep_meshes[i][3]);
        // indices
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, sheep_meshes[i][0]);
        
        gl.vertexAttribPointer(a_vert, 3, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(a_vert);

        // normals
        gl.bindBuffer(gl.ARRAY_BUFFER, sheep_meshes[i][2]);
        
        gl.vertexAttribPointer(a_norm, 3, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(a_norm);
        
        gl.uniform3fv(itemColor, sheep_colors[i]);

        // index length
        gl.drawElements(gl.TRIANGLES, sheep_meshes[i][1], gl.UNSIGNED_SHORT, 0);
    }

    modelMatrix = glMatrix.mat4.create();
    transMatrix = glMatrix.mat4.create();
    rotMatrix = glMatrix.mat4.create();
    scaleMatrix = glMatrix.mat4.create();
    normalMatrix = glMatrix.mat4.create();

    // uniform setup
    {
        glMatrix.mat4.scale(scaleMatrix, scaleMatrix, [scaleFactor, scaleFactor, scaleFactor]);
        glMatrix.mat4.translate(transMatrix, transMatrix, [-29.2, 0.91, 17]);
        glMatrix.mat4.fromYRotation(rotMatrix, angle * Math.PI/180);

        let initRot = glMatrix.mat4.create();
        glMatrix.mat4.fromYRotation(initRot, 200 * Math.PI/180);

        glMatrix.mat4.multiply(modelMatrix, modelMatrix, rotMatrix);
        glMatrix.mat4.multiply(modelMatrix, modelMatrix, transMatrix);
        glMatrix.mat4.multiply(modelMatrix, modelMatrix, initRot);
        glMatrix.mat4.multiply(modelMatrix, modelMatrix, scaleMatrix);

        gl.uniformMatrix4fv(mM, 0, modelMatrix);
        gl.uniformMatrix4fv(vM, 0, myCam.matrix);
        gl.uniform3fv(eP, myCam.positionVector);
        gl.uniformMatrix4fv(proj, 0, projMatrix);

        glMatrix.mat4.copy(normalMatrix, myCam.matrix);
        glMatrix.mat4.multiply(normalMatrix, normalMatrix, modelMatrix); // this is now the model view matrix
        glMatrix.mat4.invert(normalMatrix, normalMatrix);
        glMatrix.mat4.transpose(normalMatrix, normalMatrix);

        gl.uniformMatrix4fv(nM, 0, normalMatrix);
    }

    //draw calls for bridge
    for(let i = 0; i < sheep_meshes.length; i++){
        
        // vertices
        gl.bindBuffer(gl.ARRAY_BUFFER, sheep_meshes[i][3]);
        // indices
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, sheep_meshes[i][0]);
        
        gl.vertexAttribPointer(a_vert, 3, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(a_vert);

        // normals
        gl.bindBuffer(gl.ARRAY_BUFFER, sheep_meshes[i][2]);
        
        gl.vertexAttribPointer(a_norm, 3, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(a_norm);
        
        gl.uniform3fv(itemColor, sheep_colors[i]);

        // index length
        gl.drawElements(gl.TRIANGLES, sheep_meshes[i][1], gl.UNSIGNED_SHORT, 0);
    }

    modelMatrix = glMatrix.mat4.create();
    transMatrix = glMatrix.mat4.create();
    rotMatrix = glMatrix.mat4.create();
    scaleMatrix = glMatrix.mat4.create();
    normalMatrix = glMatrix.mat4.create();

    // uniform setup
    {
        glMatrix.mat4.scale(scaleMatrix, scaleMatrix, [scaleFactor, scaleFactor, scaleFactor]);
        glMatrix.mat4.translate(transMatrix, transMatrix, [-33.8, 0.91, 16]);
        glMatrix.mat4.fromYRotation(rotMatrix, angle * Math.PI/180);

        let initRot = glMatrix.mat4.create();
        glMatrix.mat4.fromYRotation(initRot, 130 * Math.PI/180);

        glMatrix.mat4.multiply(modelMatrix, modelMatrix, rotMatrix);
        glMatrix.mat4.multiply(modelMatrix, modelMatrix, transMatrix);
        glMatrix.mat4.multiply(modelMatrix, modelMatrix, initRot);
        glMatrix.mat4.multiply(modelMatrix, modelMatrix, scaleMatrix);

        gl.uniformMatrix4fv(mM, 0, modelMatrix);
        gl.uniformMatrix4fv(vM, 0, myCam.matrix);
        gl.uniform3fv(eP, myCam.positionVector);
        gl.uniformMatrix4fv(proj, 0, projMatrix);

        glMatrix.mat4.copy(normalMatrix, myCam.matrix);
        glMatrix.mat4.multiply(normalMatrix, normalMatrix, modelMatrix); // this is now the model view matrix
        glMatrix.mat4.invert(normalMatrix, normalMatrix);
        glMatrix.mat4.transpose(normalMatrix, normalMatrix);

        gl.uniformMatrix4fv(nM, 0, normalMatrix);
    }

    //draw calls for bridge
    for(let i = 0; i < sheep_meshes.length; i++){
        
        // vertices
        gl.bindBuffer(gl.ARRAY_BUFFER, sheep_meshes[i][3]);
        // indices
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, sheep_meshes[i][0]);
        
        gl.vertexAttribPointer(a_vert, 3, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(a_vert);

        // normals
        gl.bindBuffer(gl.ARRAY_BUFFER, sheep_meshes[i][2]);
        
        gl.vertexAttribPointer(a_norm, 3, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(a_norm);
        
        gl.uniform3fv(itemColor, sheep_colors[i]);

        // index length
        gl.drawElements(gl.TRIANGLES, sheep_meshes[i][1], gl.UNSIGNED_SHORT, 0);
    }

    modelMatrix = glMatrix.mat4.create();
    transMatrix = glMatrix.mat4.create();
    rotMatrix = glMatrix.mat4.create();
    scaleMatrix = glMatrix.mat4.create();
    normalMatrix = glMatrix.mat4.create();

    // uniform setup
    {
        glMatrix.mat4.scale(scaleMatrix, scaleMatrix, [scaleFactor, scaleFactor, scaleFactor]);
        glMatrix.mat4.translate(transMatrix, transMatrix, [-31.5, 0.91, 8]);
        glMatrix.mat4.fromYRotation(rotMatrix, angle * Math.PI/180);

        let initRot = glMatrix.mat4.create();
        glMatrix.mat4.fromYRotation(initRot, 100 * Math.PI/180);

        glMatrix.mat4.multiply(modelMatrix, modelMatrix, rotMatrix);
        glMatrix.mat4.multiply(modelMatrix, modelMatrix, transMatrix);
        glMatrix.mat4.multiply(modelMatrix, modelMatrix, initRot);
        glMatrix.mat4.multiply(modelMatrix, modelMatrix, scaleMatrix);

        gl.uniformMatrix4fv(mM, 0, modelMatrix);
        gl.uniformMatrix4fv(vM, 0, myCam.matrix);
        gl.uniform3fv(eP, myCam.positionVector);
        gl.uniformMatrix4fv(proj, 0, projMatrix);

        glMatrix.mat4.copy(normalMatrix, myCam.matrix);
        glMatrix.mat4.multiply(normalMatrix, normalMatrix, modelMatrix); // this is now the model view matrix
        glMatrix.mat4.invert(normalMatrix, normalMatrix);
        glMatrix.mat4.transpose(normalMatrix, normalMatrix);

        gl.uniformMatrix4fv(nM, 0, normalMatrix);
    }

    //draw calls for bridge
    for(let i = 0; i < sheep_meshes.length; i++){
        
        // vertices
        gl.bindBuffer(gl.ARRAY_BUFFER, sheep_meshes[i][3]);
        // indices
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, sheep_meshes[i][0]);
        
        gl.vertexAttribPointer(a_vert, 3, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(a_vert);

        // normals
        gl.bindBuffer(gl.ARRAY_BUFFER, sheep_meshes[i][2]);
        
        gl.vertexAttribPointer(a_norm, 3, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(a_norm);
        
        gl.uniform3fv(itemColor, sheep_colors[i]);

        // index length
        gl.drawElements(gl.TRIANGLES, sheep_meshes[i][1], gl.UNSIGNED_SHORT, 0);
    }

    modelMatrix = glMatrix.mat4.create();
    transMatrix = glMatrix.mat4.create();
    rotMatrix = glMatrix.mat4.create();
    scaleMatrix = glMatrix.mat4.create();
    normalMatrix = glMatrix.mat4.create();

    // uniform setup
    {
        glMatrix.mat4.scale(scaleMatrix, scaleMatrix, [scaleFactor, scaleFactor, scaleFactor]);
        glMatrix.mat4.translate(transMatrix, transMatrix, [-24.5, 0.91, 13]);
        glMatrix.mat4.fromYRotation(rotMatrix, angle * Math.PI/180);

        let initRot = glMatrix.mat4.create();
        glMatrix.mat4.fromYRotation(initRot, 47 * Math.PI/180);

        glMatrix.mat4.multiply(modelMatrix, modelMatrix, rotMatrix);
        glMatrix.mat4.multiply(modelMatrix, modelMatrix, transMatrix);
        glMatrix.mat4.multiply(modelMatrix, modelMatrix, initRot);
        glMatrix.mat4.multiply(modelMatrix, modelMatrix, scaleMatrix);

        gl.uniformMatrix4fv(mM, 0, modelMatrix);
        gl.uniformMatrix4fv(vM, 0, myCam.matrix);
        gl.uniform3fv(eP, myCam.positionVector);
        gl.uniformMatrix4fv(proj, 0, projMatrix);

        glMatrix.mat4.copy(normalMatrix, myCam.matrix);
        glMatrix.mat4.multiply(normalMatrix, normalMatrix, modelMatrix); // this is now the model view matrix
        glMatrix.mat4.invert(normalMatrix, normalMatrix);
        glMatrix.mat4.transpose(normalMatrix, normalMatrix);

        gl.uniformMatrix4fv(nM, 0, normalMatrix);
    }

    //draw calls for bridge
    for(let i = 0; i < sheep_meshes.length; i++){
        
        // vertices
        gl.bindBuffer(gl.ARRAY_BUFFER, sheep_meshes[i][3]);
        // indices
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, sheep_meshes[i][0]);
        
        gl.vertexAttribPointer(a_vert, 3, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(a_vert);

        // normals
        gl.bindBuffer(gl.ARRAY_BUFFER, sheep_meshes[i][2]);
        
        gl.vertexAttribPointer(a_norm, 3, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(a_norm);
        
        gl.uniform3fv(itemColor, sheep_colors[i]);

        // index length
        gl.drawElements(gl.TRIANGLES, sheep_meshes[i][1], gl.UNSIGNED_SHORT, 0);
    }

    modelMatrix = glMatrix.mat4.create();
    transMatrix = glMatrix.mat4.create();
    rotMatrix = glMatrix.mat4.create();
    scaleMatrix = glMatrix.mat4.create();
    normalMatrix = glMatrix.mat4.create();

    // uniform setup
    {
        glMatrix.mat4.scale(scaleMatrix, scaleMatrix, [scaleFactor, scaleFactor, scaleFactor]);
        glMatrix.mat4.translate(transMatrix, transMatrix, [-30.2, 0.91, 14]);
        glMatrix.mat4.fromYRotation(rotMatrix, angle * Math.PI/180);

        let initRot = glMatrix.mat4.create();
        glMatrix.mat4.fromYRotation(initRot, 301 * Math.PI/180);

        glMatrix.mat4.multiply(modelMatrix, modelMatrix, rotMatrix);
        glMatrix.mat4.multiply(modelMatrix, modelMatrix, transMatrix);
        glMatrix.mat4.multiply(modelMatrix, modelMatrix, initRot);
        glMatrix.mat4.multiply(modelMatrix, modelMatrix, scaleMatrix);

        gl.uniformMatrix4fv(mM, 0, modelMatrix);
        gl.uniformMatrix4fv(vM, 0, myCam.matrix);
        gl.uniform3fv(eP, myCam.positionVector);
        gl.uniformMatrix4fv(proj, 0, projMatrix);

        glMatrix.mat4.copy(normalMatrix, myCam.matrix);
        glMatrix.mat4.multiply(normalMatrix, normalMatrix, modelMatrix); // this is now the model view matrix
        glMatrix.mat4.invert(normalMatrix, normalMatrix);
        glMatrix.mat4.transpose(normalMatrix, normalMatrix);

        gl.uniformMatrix4fv(nM, 0, normalMatrix);
    }

    //draw calls for bridge
    for(let i = 0; i < sheep_meshes.length; i++){
        
        // vertices
        gl.bindBuffer(gl.ARRAY_BUFFER, sheep_meshes[i][3]);
        // indices
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, sheep_meshes[i][0]);
        
        gl.vertexAttribPointer(a_vert, 3, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(a_vert);

        // normals
        gl.bindBuffer(gl.ARRAY_BUFFER, sheep_meshes[i][2]);
        
        gl.vertexAttribPointer(a_norm, 3, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(a_norm);
        
        gl.uniform3fv(itemColor, sheep_colors[i]);

        // index length
        gl.drawElements(gl.TRIANGLES, sheep_meshes[i][1], gl.UNSIGNED_SHORT, 0);
    }

    modelMatrix = glMatrix.mat4.create();
    transMatrix = glMatrix.mat4.create();
    rotMatrix = glMatrix.mat4.create();
    scaleMatrix = glMatrix.mat4.create();
    normalMatrix = glMatrix.mat4.create();

    // uniform setup
    {
        glMatrix.mat4.scale(scaleMatrix, scaleMatrix, [scaleFactor, scaleFactor, scaleFactor]);
        glMatrix.mat4.translate(transMatrix, transMatrix, [-33.5, 0.91, 11]);
        glMatrix.mat4.fromYRotation(rotMatrix, angle * Math.PI/180);

        let initRot = glMatrix.mat4.create();
        glMatrix.mat4.fromYRotation(initRot, 178 * Math.PI/180);

        glMatrix.mat4.multiply(modelMatrix, modelMatrix, rotMatrix);
        glMatrix.mat4.multiply(modelMatrix, modelMatrix, transMatrix);
        glMatrix.mat4.multiply(modelMatrix, modelMatrix, initRot);
        glMatrix.mat4.multiply(modelMatrix, modelMatrix, scaleMatrix);

        gl.uniformMatrix4fv(mM, 0, modelMatrix);
        gl.uniformMatrix4fv(vM, 0, myCam.matrix);
        gl.uniform3fv(eP, myCam.positionVector);
        gl.uniformMatrix4fv(proj, 0, projMatrix);

        glMatrix.mat4.copy(normalMatrix, myCam.matrix);
        glMatrix.mat4.multiply(normalMatrix, normalMatrix, modelMatrix); // this is now the model view matrix
        glMatrix.mat4.invert(normalMatrix, normalMatrix);
        glMatrix.mat4.transpose(normalMatrix, normalMatrix);

        gl.uniformMatrix4fv(nM, 0, normalMatrix);
    }

    //draw calls for bridge
    for(let i = 0; i < sheep_meshes.length; i++){
        
        // vertices
        gl.bindBuffer(gl.ARRAY_BUFFER, sheep_meshes[i][3]);
        // indices
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, sheep_meshes[i][0]);
        
        gl.vertexAttribPointer(a_vert, 3, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(a_vert);

        // normals
        gl.bindBuffer(gl.ARRAY_BUFFER, sheep_meshes[i][2]);
        
        gl.vertexAttribPointer(a_norm, 3, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(a_norm);
        
        gl.uniform3fv(itemColor, sheep_colors[i]);

        // index length
        gl.drawElements(gl.TRIANGLES, sheep_meshes[i][1], gl.UNSIGNED_SHORT, 0);
    }

    modelMatrix = glMatrix.mat4.create();
    transMatrix = glMatrix.mat4.create();
    rotMatrix = glMatrix.mat4.create();
    scaleMatrix = glMatrix.mat4.create();
    normalMatrix = glMatrix.mat4.create();

    // uniform setup
    {
        glMatrix.mat4.scale(scaleMatrix, scaleMatrix, [scaleFactor, scaleFactor, scaleFactor]);
        glMatrix.mat4.translate(transMatrix, transMatrix, [-32.45, 0.91, 11]);
        glMatrix.mat4.fromYRotation(rotMatrix, angle * Math.PI/180);

        let initRot = glMatrix.mat4.create();
        glMatrix.mat4.fromYRotation(initRot, 56 * Math.PI/180);

        glMatrix.mat4.multiply(modelMatrix, modelMatrix, rotMatrix);
        glMatrix.mat4.multiply(modelMatrix, modelMatrix, transMatrix);
        glMatrix.mat4.multiply(modelMatrix, modelMatrix, initRot);
        glMatrix.mat4.multiply(modelMatrix, modelMatrix, scaleMatrix);

        gl.uniformMatrix4fv(mM, 0, modelMatrix);
        gl.uniformMatrix4fv(vM, 0, myCam.matrix);
        gl.uniform3fv(eP, myCam.positionVector);
        gl.uniformMatrix4fv(proj, 0, projMatrix);

        glMatrix.mat4.copy(normalMatrix, myCam.matrix);
        glMatrix.mat4.multiply(normalMatrix, normalMatrix, modelMatrix); // this is now the model view matrix
        glMatrix.mat4.invert(normalMatrix, normalMatrix);
        glMatrix.mat4.transpose(normalMatrix, normalMatrix);

        gl.uniformMatrix4fv(nM, 0, normalMatrix);
    }

    //draw calls for bridge
    for(let i = 0; i < sheep_meshes.length; i++){
        
        // vertices
        gl.bindBuffer(gl.ARRAY_BUFFER, sheep_meshes[i][3]);
        // indices
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, sheep_meshes[i][0]);
        
        gl.vertexAttribPointer(a_vert, 3, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(a_vert);

        // normals
        gl.bindBuffer(gl.ARRAY_BUFFER, sheep_meshes[i][2]);
        
        gl.vertexAttribPointer(a_norm, 3, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(a_norm);
        
        gl.uniform3fv(itemColor, sheep_colors[i]);

        // index length
        gl.drawElements(gl.TRIANGLES, sheep_meshes[i][1], gl.UNSIGNED_SHORT, 0);
    }
}

function drawbus(){
    if(startAnim && !pauseScene){
        if(bus_counter == bus_config.length - 2){
            bus_counter = 0;
        }
        else{
            bus_counter += 1;
        }
    }

    modelMatrix = glMatrix.mat4.create();
    transMatrix = glMatrix.mat4.create();
    rotMatrix = glMatrix.mat4.create();
    scaleMatrix = glMatrix.mat4.create();
    normalMatrix = glMatrix.mat4.create();

    // uniform setup
    {
        glMatrix.mat4.scale(scaleMatrix, scaleMatrix, [scaleFactor, scaleFactor, scaleFactor]);
        glMatrix.mat4.translate(transMatrix, transMatrix, [-50, 0.95, 1.45]);
        glMatrix.mat4.fromYRotation(rotMatrix, angle * Math.PI/180);

        let initRot = glMatrix.mat4.create();
        glMatrix.mat4.fromYRotation(initRot, 90 * Math.PI/180);
        
        let animateBus = glMatrix.mat4.create();
        glMatrix.mat4.translate(animateBus, animateBus, [bus_config[bus_counter].forward, bus_config[bus_counter].up, 0]);
        
        glMatrix.mat4.multiply(modelMatrix, modelMatrix, rotMatrix);
        if(startAnim)
            glMatrix.mat4.multiply(modelMatrix, modelMatrix, animateBus);
        glMatrix.mat4.multiply(modelMatrix, modelMatrix, transMatrix);
        glMatrix.mat4.multiply(modelMatrix, modelMatrix, initRot);
        glMatrix.mat4.multiply(modelMatrix, modelMatrix, scaleMatrix);

        gl.uniformMatrix4fv(mM, 0, modelMatrix);
        gl.uniformMatrix4fv(vM, 0, myCam.matrix);
        gl.uniform3fv(eP, myCam.positionVector);
        gl.uniformMatrix4fv(proj, 0, projMatrix);

        glMatrix.mat4.copy(normalMatrix, myCam.matrix);
        glMatrix.mat4.multiply(normalMatrix, normalMatrix, modelMatrix); // this is now the model view matrix
        glMatrix.mat4.invert(normalMatrix, normalMatrix);
        glMatrix.mat4.transpose(normalMatrix, normalMatrix);

        gl.uniformMatrix4fv(nM, 0, normalMatrix);
    }

    //draw calls for bus
    for(let i = 0; i < bus_meshes.length; i++){
        gl.uniform3fv(diffuseLightColor, bus_materials[bus_meshes[i][4]].diffuse);
        gl.uniform3fv(ambientLightColor, bus_materials[bus_meshes[i][4]].ambient);
        gl.uniform1f(shine, bus_materials[bus_meshes[i][4]].shininess);

        // vertices
        gl.bindBuffer(gl.ARRAY_BUFFER, bus_meshes[i][3]);
        // indices
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, bus_meshes[i][0]);
        
        gl.vertexAttribPointer(a_vert, 3, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(a_vert);

        // normals
        gl.bindBuffer(gl.ARRAY_BUFFER, bus_meshes[i][2]);        
        gl.vertexAttribPointer(a_norm, 3, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(a_norm);

        gl.uniform3fv(itemColor, bus_materials[bus_meshes[i][4]].diffuse);


        //texture coords
        // gl.bindBuffer(gl.ARRAY_BUFFER, bus_meshes[i][4]);
        // let textureAttribLocation = gl.getAttribLocation(shaderProgramTown, 'vertTextureCoord');
        // gl.vertexAttribPointer(textureAttribLocation, 2, gl.FLOAT, false, 0, 0);
        // gl.enableVertexAttribArray(textureAttribLocation);

        // if(busLoaded)
                // gl.bindTexture(gl.TEXTURE_2D, busText);

        // index length
        if (i != 0)
            gl.drawElements(gl.TRIANGLES, bus_meshes[i][1], gl.UNSIGNED_SHORT, 0);

    }
}