
function Viewport3D (elementId) {
    this.MODES = {
        SELECT: 0,
        READONLY: 1
    };
    this.FACES = {
        TOP: 0,
        FRONT: 1,
        RIGHT: 2,
        BACK: 3,
        LEFT: 4,
        BOTTOM: 5,

        TOP_FRONT_EDGE: 6,
        TOP_RIGHT_EDGE: 7,
        TOP_BACK_EDGE: 8,
        TOP_LEFT_EDGE: 9,

        FRONT_RIGHT_EDGE: 10,
        BACK_RIGHT_EDGE: 11,
        BACK_LEFT_EDGE: 12,
        FRONT_LEFT_EDGE: 13,

        BOTTOM_FRONT_EDGE: 14,
        BOTTOM_RIGHT_EDGE: 15,
        BOTTOM_BACK_EDGE: 16,
        BOTTOM_LEFT_EDGE: 17,

        TOP_FRONT_RIGHT_CORNER: 18,
        TOP_BACK_RIGHT_CORNER: 19,
        TOP_BACK_LEFT_CORNER: 20,
        TOP_FRONT_LEFT_CORNER: 21,

        BOTTOM_FRONT_RIGHT_CORNER: 22,
        BOTTOM_BACK_RIGHT_CORNER: 23,
        BOTTOM_BACK_LEFT_CORNER: 24,
        BOTTOM_FRONT_LEFT_CORNER: 25
    };

    this.backgroundColor = new THREE.Color(0x000, 1.0);
    this.camera = null;
    this.element = null;
    this.elementId = elementId;
    this.mouse = new THREE.Vector2();
    this.projector = new THREE.Projector();
    this.raycaster = new THREE.Raycaster();
    this.scene = new THREE.Scene();
}

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
    // setup scene
    me.setupCamera();
    me.setupGeometry();
    me.setupLights();
    // setup interactions
    me.setupNavigation();
    me.setupSelection();
};

Viewport3D.prototype.render = function () {
    var me = this;
    TWEEN.update();
    me.webGLRenderer.render(me.scene, me.camera);
    requestAnimationFrame(me.render.bind(me));
};

Viewport3D.prototype.setupCamera = function () {
    var me = this;
    // position and point the camera to the center of the scene
    me.camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 1000);
    me.camera.position.x = 150;
    me.camera.position.y = 150;
    me.camera.position.z = 100;
    me.camera.up = new THREE.Vector3(0, 0, 1);
    me.camera.lookAt(new THREE.Vector3(0, 0, 0));
};

Viewport3D.prototype.setupGeometry = function () {
    var me = this;
    var color = 0x880000;

    var xaxis = new THREE.Vector3(1,0,0);
    var yaxis = new THREE.Vector3(0,1,0);
    var zaxis = new THREE.Vector3(0,0,1);

    var ROTATE_90 = Math.PI / 2;
    var ROTATE_180 = Math.PI;
    var ROTATE_270 = Math.PI * 1.5;
    var ROTATE_360 = Math.PI * 2;

    // faces
    function makeFace (w, x, y, z, axis, rad, color) {
        var geometry = new THREE.PlaneGeometry(w, w);
        var material = new THREE.MeshPhongMaterial({color: color});
        var face = new THREE.Mesh(geometry, material);
        face.material.side = THREE.DoubleSide;
        face.position.setX(x);
        face.position.setY(y);
        face.position.setZ(z);
        if (axis && rad) {
            face.rotateOnAxis(axis, rad);
        }
        return face;
    }

    var top    = makeFace(70,   0,   0,  50,  null,      null, 0xff0000);
    var front  = makeFace(70,   0,  50,   0, xaxis, Math.PI/2, 0x00ff00);
    var right  = makeFace(70,  50,   0,   0, yaxis, Math.PI/2, 0x0000ff);
    var back   = makeFace(70,   0, -50,   0, xaxis, Math.PI/2, 0xff00ff);
    var left   = makeFace(70, -50,   0,   0, yaxis, Math.PI/2, 0xffff00);
    var bottom = makeFace(70,   0,   0, -50,  null,      null, 0x00ffff);

    me.scene.add(top);
    me.scene.add(front);
    me.scene.add(right);
    me.scene.add(back);
    me.scene.add(left);
    me.scene.add(bottom);

    // edges
    function makeEdge (w, h, x, y, z, axis, rot) {
        var face1, face2, geometry, material, obj;
        obj = new THREE.Object3D();

        geometry = new THREE.PlaneGeometry(w, h);
        material = new THREE.MeshPhongMaterial({color: color});
        face1 = new THREE.Mesh(geometry, material);
        face1.material.side = THREE.DoubleSide;
        face1.position.setY(h / 2);

        geometry = new THREE.PlaneGeometry(w, h);
        face2 = new THREE.Mesh(geometry, material);
        face2.material.side = THREE.DoubleSide;
        face2.position.setZ(-h / 2);
        face2.rotateOnAxis(new THREE.Vector3(1,0,0), Math.PI / 2);

        obj.add(face1);
        obj.add(face2);
        obj.position.x = x;
        obj.position.y = y;
        obj.position.z = z;
        obj.rotateOnAxis(axis, rot);
        return obj;
    }

    var top_front_edge    = makeEdge(70, 15,  50,   0, 50, zaxis, ROTATE_90, 0x550000);
    var top_right_edge    = makeEdge(70, 15,   0,  50, 50, zaxis, ROTATE_180, 0x550000);
    var top_back_edge     = makeEdge(70, 15, -50,   0, 50, zaxis, ROTATE_270, 0x550000);
    var top_left_edge     = makeEdge(70, 15,   0, -50, 50, zaxis, ROTATE_360, 0x550000);

    var bottom_front_edge = makeEdge(70, 15,  50,   0, -50, zaxis, ROTATE_90, 0x005500);
    var bottom_right_edge = makeEdge(70, 15,   0,  50, -50, zaxis, ROTATE_180, 0x005500);
    var bottom_back_edge  = makeEdge(70, 15, -50,   0, -50, zaxis, ROTATE_270, 0x005500);
    var bottom_left_edge  = makeEdge(70, 15,   0, -50, -50, zaxis, ROTATE_360, 0x005500);

    me.scene.add(top_front_edge);
    me.scene.add(top_right_edge);
    me.scene.add(top_back_edge);
    me.scene.add(top_left_edge);

    me.scene.add(bottom_front_edge);
    me.scene.add(bottom_right_edge);
    me.scene.add(bottom_back_edge);
    me.scene.add(bottom_left_edge);

    // corners
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
    var me = this;
    me.controller = new THREE.TrackballControls(me.camera, me.element);
    me.controller.rotateSpeed = 1.0;
    me.controller.noZoom = true;
    me.controller.noPan = true;
    me.controller.staticMoving = true;
    me.controller.dynamicDampingFactor = 0.3;
    me.controller.keys = [ 65, 83, 68 ];
    me.controller.addEventListener('change', me.render);
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
