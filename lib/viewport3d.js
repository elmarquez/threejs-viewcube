
function Viewport3D (elementId) {
    this.MODES = {
        SELECT: 0,
        ORBIT: 1,
        WALK: 2,
        VISIT: 3
    };
    this.ENTITIES = {
        GROUND: 'ground',
        POINT: 'point',
        POLES: 'pole'
    };
    this.VIEWS = {
        TOP: 0,
        LEFT: 1,
        RIGHT: 2,
        FRONT: 3,
        BACK: 4,
        PERSPECTIVE: 5
    };

    this.backgroundColor = new THREE.Color(0x000, 1.0);
    this.camera = null;
    this.clock = new THREE.Clock();
    this.element = null;
    this.elementId = elementId;
    this.mode = this.MODES.SELECT;
    this.mouse = new THREE.Vector2();
    this.projector = new THREE.Projector();
    this.raycaster = new THREE.Raycaster();
    this.scene = new THREE.Scene();
    this.selection = [];
}

Viewport3D.prototype.getBoundingBox = function () {
    console.log('get bounding box');
    var me = this;
    var envelope = new THREE.Box3(new THREE.Vector3(0,0,0), new THREE.Vector3(0,0,0));
    // if the selection set contains objects, then get the bounding box for the
    // selected items
    if (me.selection.length > 0) {
        me.selection.forEach(function (obj) {
            if (obj.userData.type && obj.userData.type === 'pole') {
                // update bounding envelope
                var objEnv = new THREE.Box3(new THREE.Vector3(0,0,0), new THREE.Vector3(0,0,0));
                objEnv.setFromObject(obj);
                envelope.union(objEnv);
            }
        })
    } else {
        // get the bounding box for all entities
        me.scene.traverse(function (obj) {
            if (obj.userData.type && obj.userData.type === 'pole') {
                // update bounding envelope
                var objEnv = new THREE.Box3(new THREE.Vector3(0,0,0), new THREE.Vector3(0,0,0));
                objEnv.setFromObject(obj);
                envelope.union(objEnv);
            }
        });
    }
    // envelope dimension
    var dx = envelope.max.x - envelope.min.x;
    var dy = envelope.max.y - envelope.min.y;
    var dz = envelope.max.z - envelope.min.z;
    // create a mesh that represents the bounding box
    var geom = new THREE.BoxGeometry(dx, dy, dz);
    var bbox = new THREE.Mesh(geom);
    bbox.position.set(envelope.min.x + (dx / 2), envelope.min.y + (dy / 2), envelope.min.z + (dz / 2));
    return bbox;
};

Viewport3D.prototype.init = function () {
    var me = this;
    // renderer
    me.webGLRenderer = new THREE.WebGLRenderer({antialias: true});
    me.webGLRenderer.setClearColor(me.backgroundColor);
    me.webGLRenderer.setSize(window.innerWidth, window.innerHeight);
    me.webGLRenderer.shadowMapEnabled = true;
    // add the output of the renderer to the html element
    me.element = document.getElementById(me.elementId);
    me.element.appendChild(me.webGLRenderer.domElement);
    // setup interactions
    me.setupKeyboardBindings();
    me.setupNavigation();
    me.setupSelection();
    // setup scene
    me.setupCamera();
    me.setupGeometry();
    me.setupLights();
};

Viewport3D.prototype.render = function () {
    var me = this;
    // update scene state
    TWEEN.update();
    var delta = me.clock.getDelta();
    if (me.controller && me.controller.hasOwnProperty('update')) {
        me.controller.update(delta);
    }
    // render the frame
    me.webGLRenderer.render(me.scene, me.camera);
    // enque next update
    requestAnimationFrame(me.render.bind(me));
};

Viewport3D.prototype.setMode = function (mode) {
    var me = this;
    me.mode = mode;
    // remove the existing controller
    if (me.controller && me.controller.hasOwnProperty('enabled')) {
        me.controller.enabled = false;
    }
    // add the new controller
    if (me.mode === me.MODES.SELECT) {
        console.log('selection mode');
    } else if (me.mode === me.MODES.ORBIT) {
        console.log('orbit mode');
        // consider adding a turntable feature to the orbit controller
    } else if (me.mode === me.MODES.WALK) {
        console.log('walk mode');
        var height = 2;
        me.tweenCameraToPosition(
            me.camera.position.x, me.camera.position.y, height,
            0, 0, height)
            .then(function () {
                me.controller = new THREE.FirstPersonControls(me.camera, me.domElement);
                me.controller.constrainVertical = true;
                me.controller.lookSpeed = 0.4;
                me.controller.lookVertical = true;
                me.controller.movementSpeed = 20;
                me.controller.noFly = true;
                //me.controller.verticalMax = 2.0;
                //me.controller.verticalMin = 1.0;
                me.controller.lon = -150;
                me.controller.lat = 120;
                me.controller.phi = 0;
                me.controller.theta = 1;
            });
    } else if (me.mode === me.MODES.VISIT) {
        console.log('visit mode');
        // create a feature visit plan
        // if there are any selected entities, then visit only those entities otherwise visit all entities
    }
};

Viewport3D.prototype.setupCamera = function () {
    var me = this;
    // position and point the camera to the center of the scene
    me.camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 1000);
    me.camera.position.x = 100;
    me.camera.position.y = 50;
    me.camera.position.z = 50;
    me.camera.up = new THREE.Vector3(0, 0, 1);
    me.camera.lookAt(new THREE.Vector3(0, 0, 0));

// me.cameraHelper = new THREE.CameraHelper(me.camera);
// me.scene.add(me.cameraHelper);
};

Viewport3D.prototype.setupGeometry = function () {
    var me = this;
    // make some poles
    var count = 2, obj, geometry, material;
    //for (var i=0; i<count;i++) {
    //    geometry = new THREE.CylinderGeometry(0.5, 0.5, 15, 20, 4);
    //    material = new THREE.MeshPhongMaterial({color: 0x00ff00});
    //    obj = new THREE.Mesh(geometry, material);
    //    obj.rotateOnAxis(new THREE.Vector3(1,0,0), Math.PI / 2);
    //    obj.position.setX(i * Math.random() * 5);
    //    obj.position.setY(i * Math.random() * 5);
    //    obj.position.setZ(7.5);
    //    obj.userData.type = 'pole';
    //    me.scene.add(obj);
    //}

    geometry = new THREE.CylinderGeometry(0.5, 0.5, 15, 20, 4);
    material = new THREE.MeshPhongMaterial({color: 0x00ff00});
    obj = new THREE.Mesh(geometry, material);
    obj.rotateOnAxis(new THREE.Vector3(1,0,0), Math.PI / 2);
    obj.position.setX(0);
    obj.position.setY(0);
    obj.position.setZ(7.5);
    obj.userData.type = 'pole';
    me.scene.add(obj);

    geometry = new THREE.CylinderGeometry(0.5, 0.5, 15, 20, 4);
    material = new THREE.MeshPhongMaterial({color: 0x00ff00});
    obj = new THREE.Mesh(geometry, material);
    obj.rotateOnAxis(new THREE.Vector3(1,0,0), Math.PI / 2);
    obj.position.setX(10);
    obj.position.setY(0);
    obj.position.setZ(7.5);
    obj.userData.type = 'pole';
    me.scene.add(obj);

    geometry = new THREE.CylinderGeometry(0.5, 0.5, 15, 20, 4);
    material = new THREE.MeshPhongMaterial({color: 0x00ff00});
    obj = new THREE.Mesh(geometry, material);
    obj.rotateOnAxis(new THREE.Vector3(1,0,0), Math.PI / 2);
    obj.position.setX(10);
    obj.position.setY(20);
    obj.position.setZ(7.5);
    obj.userData.type = 'pole';
    me.scene.add(obj);

    geometry = new THREE.CylinderGeometry(0.5, 0.5, 15, 20, 4);
    material = new THREE.MeshPhongMaterial({color: 0x00ff00});
    obj = new THREE.Mesh(geometry, material);
    obj.rotateOnAxis(new THREE.Vector3(1,0,0), Math.PI / 2);
    obj.position.setX(0);
    obj.position.setY(20);
    obj.position.setZ(7.5);
    obj.userData.type = 'pole';
    me.scene.add(obj);

    // ground plane
    geometry = new THREE.PlaneGeometry(100, 100);
    material = new THREE.MeshPhongMaterial({color: 0x880000});
    var plane = new THREE.Mesh(geometry, material);
    me.scene.add(plane);
    me.ground = plane;

    // line geometry
    material = new THREE.LineBasicMaterial({
        color: 0xffffff
    });
    geometry = new THREE.Geometry();
    geometry.vertices.push(
        new THREE.Vector3( 0, 0, 0 ),
        new THREE.Vector3( 50, 50, 50)
    );
    var line = new THREE.Line(geometry, material);
    me.scene.add(line);
};

Viewport3D.prototype.setupKeyboardBindings = function () {
    var me = this;
    Mousetrap.bind('b', function () { me.toggleBoundingBox(); });
    Mousetrap.bind('g', function () { me.generateWalkPath(); });

    Mousetrap.bind('q', function () { me.setMode(me.MODES.SELECT); });
    Mousetrap.bind('w', function () { me.setMode(me.MODES.ORBIT); });
    Mousetrap.bind('e', function () { me.setMode(me.MODES.WALK); });
    Mousetrap.bind('r', function () { me.setMode(me.MODES.VISIT); });

    Mousetrap.bind('5', function () { me.setView(me.VIEWS.TOP); });
    Mousetrap.bind('6', function () { me.setView(me.VIEWS.FRONT); });
    Mousetrap.bind('7', function () { me.setView(me.VIEWS.LEFT); });
    Mousetrap.bind('8', function () { me.setView(me.VIEWS.RIGHT); });
    Mousetrap.bind('9', function () { me.setView(me.VIEWS.BACK); });
    Mousetrap.bind('0', function () { me.setView(me.VIEWS.PERSPECTIVE); });
};

Viewport3D.prototype.setupLights = function () {
    var ambientLight = new THREE.AmbientLight(0x383838);
    this.scene.add(ambientLight);

    // add spotlight for the shadows
    var spotLight = new THREE.SpotLight(0xffffff);
    spotLight.position.set(100, 140, 130);
    spotLight.intensity = 2;
    this.scene.add(spotLight);
};

Viewport3D.prototype.setupNavigation = function () {
    this.setMode(this.mode);
};

Viewport3D.prototype.setupSelection = function () {
    var me = this;
    function onMouseUp(event) {
        if (me.mode == me.MODES.SELECT) {
            // calculate mouse position in normalized device coordinates
            // (-1 to +1) for both components
            me.mouse.x = ( event.clientX / window.innerWidth ) * 2 - 1;
            me.mouse.y = - ( event.clientY / window.innerHeight ) * 2 + 1;
            // update the picking ray with the camera and mouse position
            me.raycaster.setFromCamera(me.mouse, me.camera);
            // calculate objects intersecting the picking ray
            me.selection = [];
            var intersects = me.raycaster.intersectObjects(me.scene.children);
            intersects.forEach(function (intersect) {
                if (intersect.object.userData.type && intersect.object.userData.type === me.ENTITIES.POLES) {
                    // toggle object selection
                    intersect.object.material.color.set(0x6666ff);
                    me.selection.push(intersect.object);
                }
            });
        }
    }
    window.addEventListener('mouseup', onMouseUp, false);
};

Viewport3D.prototype.setView = function (view) {
    var me = this;
    // TODO center on the bounding box of all entities
    // TODO fit all entities in the display
    if (view === me.VIEWS.TOP) {
        this.tweenCameraToPosition(0, 0, 100, 0, 0, 0);
    }
    else if (view === me.VIEWS.LEFT) {
        this.tweenCameraToPosition(-100, 0, 0, 0, 0, 0);
    }
    else if (view === me.VIEWS.RIGHT) {
        this.tweenCameraToPosition(100, 0, 0, 0, 0, 0);
    }
    else if (view === me.VIEWS.FRONT) {
        this.tweenCameraToPosition(100, 0, 0, 0, 0, 0);
    }
    else if (view === me.VIEWS.BACK) {
        this.tweenCameraToPosition(0, -100, 0, 0, 0, 0);
    }
    else if (view === me.VIEWS.PERSPECTIVE) {
        this.tweenCameraToPosition(100, 50, 50, 0, 0, 0);
    }
};

Viewport3D.prototype.toggleBoundingBox = function () {
    // if there is an existing bounding box object
    var bbox = null, me = this;
    me.scene.traverse(function (child) {
        if (child.userData.type && child.userData.type === 'scene-bounding-box') {
            bbox = child;
        }
    });
    if (bbox) {
        // toggle its visibility state
        bbox.visible = !bbox.visible;
    } else {
        // create a new bounding box
        var mesh = me.getBoundingBox();
        bbox = new THREE.BoxHelper(mesh);
        bbox.userData.type = 'scene-bounding-box';
        this.scene.add(bbox);
    }
    me.render();
};

Viewport3D.prototype.tweenCameraToPosition = function (x, y, z, tx, ty, tz) {
    var me = this;
    return new Promise(function (resolve) {
        var start = {
            x: me.camera.position.x,
            y: me.camera.position.y,
            z: me.camera.position.z
        };
        var finish = {x: x, y: y, z: z};
        var tween = new TWEEN.Tween(start).to(finish, 2000);
        tween.easing(TWEEN.Easing.Cubic.InOut);
        tween.onComplete(resolve);
        tween.onUpdate(function () {
            me.camera.lookAt(new THREE.Vector3(tx, ty, tz));
            me.camera.position.setX(this.x);
            me.camera.position.setY(this.y);
            me.camera.position.setZ(this.z);
        });
        tween.start();
        me.render();
    });
};

Viewport3D.prototype.zoomFitAll = function () {
    console.log('zoom fit all');
};

Viewport3D.prototype.zoomFitObject = function () {
    console.log('zoom fit object');
};

Viewport3D.prototype.zoomFitSelection = function () {
    console.log('zoom fit selection');
};



Viewport3D.prototype.generateWalkPath = function () {
    var material, geometry, line, me = this, objs = [], paths = [];
    me.scene.traverse(function (child) {
        if (child.userData.type && child.userData.type === 'pole') {
            var obj = {
                uuid: child.uuid,
                x: child.position.x,
                y: child.position.y
            };
            objs.push(obj);
        }
    });
    paths.forEach(function (path) {
        // line geometry
        material = new THREE.LineBasicMaterial({color: 0x0000cc});
        geometry = new THREE.Geometry();
        geometry.vertices.push(
            new THREE.Vector3( 0, 0, 0 ),
            new THREE.Vector3( 50, 50, 50)
        );
        line = new THREE.Line(geometry, material);
        me.scene.add(line);
    });
};
