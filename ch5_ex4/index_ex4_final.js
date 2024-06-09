//import * as THREE from './modules/three.module.js'; -> andere js

main();

function main() {
    // create context
    const canvas = document.querySelector("#c");
    const gl = new THREE.WebGLRenderer({
        canvas,
        antialias: true
    });

    var stats = initStats();

    var controls = new function () {
        this.rotationSpeed = 0.02;
        this.rotY1 = 0;
        this.rotZ1 = 0;
        this.rotZ2 = 0;
        this.rotZ3 = 0;
        //this.bouncingSpeed = 0.03;
    };

    var gui = new dat.GUI();
    gui.add(controls, 'rotationSpeed', 0, 0.5);
    gui.add(controls, 'rotY1',  0, 2 * Math.PI);
    gui.add(controls, 'rotZ1',  0, 2 * Math.PI);
    gui.add(controls, 'rotZ2',  0, 2 * Math.PI);
    gui.add(controls, 'rotZ3',  0, 2 * Math.PI);
    //gui.add(controls, 'bouncingSpeed', 0, 0.5);


    // create camera
    const angleOfView = 55;
    const aspectRatio = canvas.clientWidth / canvas.clientHeight;
    const nearPlane = 0.1;
    const farPlane = 100;
    const camera = new THREE.PerspectiveCamera(
        angleOfView,
        aspectRatio,
        nearPlane,
        farPlane
    );
    camera.position.set(0, 8, 30);


    // create the scene
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0.3, 0.5, 0.8);
    const fog = new THREE.Fog("grey", 1, 90);
    scene.fog = fog;


    // GEOMETRY
    // create the cube
    const cubeSize = 4;
    const cubeGeometry = new THREE.BoxGeometry(
        cubeSize,
        cubeSize,
        cubeSize
    );

    // Create the Sphere
    const sphereRadius = 3;
    const sphereWidthSegments = 32;
    const sphereHeightSegments = 16;
    const sphereGeometry = new THREE.SphereGeometry(
        sphereRadius,
        sphereWidthSegments,
        sphereHeightSegments
    );

    // Create the upright plane
    const planeWidth = 256;
    const planeHeight = 128;
    const planeGeometry = new THREE.PlaneGeometry(
        planeWidth,
        planeHeight
    );

    // MATERIALS
    const textureLoader = new THREE.TextureLoader();

    const cubeMaterial = new THREE.MeshPhongMaterial({
        color: 'pink'
    });

    const sphereNormalMap = textureLoader.load('textures/sphere_normal.png');
    sphereNormalMap.wrapS = THREE.RepeatWrapping;
    sphereNormalMap.wrapT = THREE.RepeatWrapping;
    const sphereMaterial = new THREE.MeshStandardMaterial({
        color: 'tan',
        normalMap: sphereNormalMap
    });


    const planeTextureMap = textureLoader.load('textures/pebbles.jpg');
    planeTextureMap.wrapS = THREE.RepeatWrapping;
    planeTextureMap.wrapT = THREE.RepeatWrapping;
    planeTextureMap.repeat.set(16, 16);
    //planeTextureMap.magFilter = THREE.NearestFilter;
    planeTextureMap.minFilter = THREE.NearestFilter;
    planeTextureMap.anisotropy = gl.getMaxAnisotropy();
    const planeNorm = textureLoader.load('textures/pebbles_normal.png');
    planeNorm.wrapS = THREE.RepeatWrapping;
    planeNorm.wrapT = THREE.RepeatWrapping;
    planeNorm.minFilter = THREE.NearestFilter;
    planeNorm.repeat.set(16, 16);
    const planeMaterial = new THREE.MeshStandardMaterial({
        map: planeTextureMap,
        side: THREE.DoubleSide,
        normalMap: planeNorm
    });

    // MESHES
    const cube = new THREE.Mesh(cubeGeometry, cubeMaterial);
    cube.position.set(cubeSize + 1, cubeSize + 1, 0);
    scene.add(cube);

    const sphere = new THREE.Mesh(sphereGeometry, sphereMaterial);
    sphere.position.set(-sphereRadius - 1, sphereRadius + 2, 0);
    scene.add(sphere);

    const plane = new THREE.Mesh(planeGeometry, planeMaterial);
    plane.rotation.x = Math.PI / 2;
    //scene.add(plane);


    //Objekt einladen und in die Szene hinzufügen -> Teekanne
    // Teekanne texture
    var texture = textureLoader.load('assets/stone.jpg');
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;

    const loader = new THREE.OBJLoader();

    loader.load('assets/teekanne.obj',
        function (mesh) {
            var material = new THREE.MeshPhongMaterial({map: texture});

            mesh.children.forEach(function (child) {
                child.material = material;
                child.castShadow = true;
            });

            mesh.position.set(-15, 2, 0);
            mesh.rotation.set(-Math.PI / 2, 0, 0);
            mesh.scale.set(0.005, 0.005, 0.005);

            scene.add(mesh);
        },
        function (xhr) {
            console.log((xhr.loaded / xhr.total * 100) + '% loaded');
        },
        function (error) {
            console.log(error);
            console.log('An error happened');
        }
    );


    //LIGHTS
    const color = 0xffffff;
    const intensity = .0;
    const light = new THREE.DirectionalLight(color, intensity);
    light.target = plane;
    light.position.set(0, 30, 30);
    scene.add(light);
    scene.add(light.target);

    const ambientColor = 0xffffff;
    const ambientIntensity = 0;
    const ambientLight = new THREE.AmbientLight(ambientColor, ambientIntensity);
    scene.add(ambientLight);

    //shadow
    cube.castShadow = true;
    sphere.castShadow = true;
    plane.receiveShadow = true;


    //roboterarm hinzufügen (mit den Segmenten)
    let h1 = 1;
    let h2 = 1;
    let h3 = 1;

    let seg1, seg2, seg3;
    seg1 = addSeg(scene, h1, 1);
    seg2 = addSeg(seg1, h2, h1);
    seg3 = addSeg(seg2, h3, h2);

    seg1.position.set(-25, 0,0);

    //PunktLichtquelle am roboterarm
    const pointLight = new THREE.PointLight(0xffffff,2,50);
    light.position.set(0,h3,0);
    seg3.add(pointLight);

    //track
    const trackballControls = initTrackballControls(camera, gl);
    var clock = new THREE.Clock();


    // DRAW
    function draw(time) {
        time *= 0.001;

        if (resizeGLToDisplaySize(gl)) {
            const canvas = gl.domElement;
            camera.aspect = canvas.clientWidth / canvas.clientHeight;
            camera.updateProjectionMatrix();
        }

        // rotate the cube around its axes
        cube.rotation.x += controls.rotationSpeed;
        cube.rotation.y += controls.rotationSpeed;
        cube.rotation.z += controls.rotationSpeed;

        // rotate the cube around its axes
        sphere.rotation.x += controls.rotationSpeed;
        sphere.rotation.y += controls.rotationSpeed;
        sphere.rotation.z += controls.rotationSpeed;

        // rotate roboterarm
        seg1.rotation.y = controls.rotY1;
        seg1.rotation.z = controls.rotZ1;
        seg2.rotation.z = controls.rotZ2;
        seg3.rotation.z = controls.rotZ3;

        //update track
        trackballControls.update(clock.getDelta());
        stats.update();


        light.position.x = 20 * Math.cos(time);
        light.position.y = 20 * Math.sin(time);
        gl.render(scene, camera);
        requestAnimationFrame(draw);
    }

    requestAnimationFrame(draw);


}


// UPDATE RESIZE
function resizeGLToDisplaySize(gl) {

    const canvas = gl.domElement;
    const width = canvas.clientWidth;
    const height = canvas.clientHeight;
    const needResize = canvas.width != width || canvas.height != height;
    if (needResize) {
        gl.setSize(width, height, false);
    }
    return needResize;
}

//Segmente Zeichnen für Roboterarm 
function addSeg(parent, height, posY) {
    var axisSphere = new THREE.Group();
   // axisSphere.rotation.z = 1
    axisSphere.position.y = posY;
    parent.add(axisSphere);

    var sphereGeometry = new THREE.SphereGeometry(1, 20, 20); // radius 1 -> diameter 2
    var sphereMaterial = new THREE.MeshLambertMaterial({color: 0x7777ff});
    var sphere = new THREE.Mesh(sphereGeometry, sphereMaterial);

    // position the sphere
    sphere.scale.x = 0.5
    sphere.scale.y = height
    sphere.scale.z = 0.5
    sphere.position.x = 0
    sphere.position.y = height
    sphere.position.z = 0
    sphere.castShadow = true;

    sphere.receiveShadow = true;

    axisSphere.add(sphere);

    const tripod = new THREE.AxesHelper(5);
    axisSphere.add(tripod);


    return axisSphere;
}






