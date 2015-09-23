
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

    this.COMPASS_COLOR = 0x666666;
    this.COMPASS_HIGHLIGHT_COLOR = 0x666666;
    this.COMPASS_OPACITY = 0.8;
    this.EDGE_COLOR = 0x999999;
    this.EDGE_HIGHLIGHT_COLOR = 0x999999;
    this.FACE_COLOR = 0xAAAAAA;
    this.FACE_HIGHLIGHT_COLOR = 0xAAAAAA;
    this.LABEL_COLOR = 0x555555;

    this.backgroundColor = new THREE.Color(0x000, 1.0);
    this.camera = null;
    this.compass = null;
    this.control = null;
    this.cube = null;
    this.element = null;
    this.elementId = elementId;
    this.mouse = new THREE.Vector2();
    this.projector = new THREE.Projector();
    this.raycaster = new THREE.Raycaster();
    this.scene = new THREE.Scene();
}

Viewport3D.prototype.init = function () {
    var self = this;
    // renderer
    self.webGLRenderer = new THREE.WebGLRenderer({antialias: true});
    self.webGLRenderer.setClearColor(self.backgroundColor);
    self.webGLRenderer.setSize(window.innerWidth, window.innerHeight);
    self.webGLRenderer.shadowMapEnabled = true;
    // add the output of the renderer to the html element
    self.element = document.getElementById(self.elementId);
    self.element.appendChild(self.webGLRenderer.domElement);
    // setup scene
    self.setupCamera();
    self.setupGeometry();
    self.setupLights();
    // setup interactions
    self.setupNavigation();
    self.setupSelection();
};

Viewport3D.prototype.render = function () {
    var self = this;
    TWEEN.update();
    self.webGLRenderer.render(self.scene, self.camera);
    requestAnimationFrame(self.render.bind(self));
};

Viewport3D.prototype.setupCamera = function () {
    var self = this;
    // position and point the camera to the center of the scene
    self.camera = new THREE.PerspectiveCamera(55, window.innerWidth / window.innerHeight, 0.1, 1000);
    self.camera.position.x = 150;
    self.camera.position.y = 150;
    self.camera.position.z = 90;
    self.camera.up = new THREE.Vector3(0, 0, 1);
    self.camera.lookAt(new THREE.Vector3(0, 0, 0));
};

Viewport3D.prototype.setupGeometry = function () {
    var self = this;

    var ROTATE_0 = 0;
    var ROTATE_90 = Math.PI / 2;
    var ROTATE_180 = Math.PI;
    var ROTATE_270 = Math.PI * 1.5;
    var ROTATE_360 = Math.PI * 2;

    var X_AXIS = new THREE.Vector3(1,0,0);
    var Y_AXIS = new THREE.Vector3(0,1,0);
    var Z_AXIS = new THREE.Vector3(0,0,1);

    self.control = new THREE.Object3D();
    self.cube = new THREE.Object3D();

    // faces
    var topTexture = THREE.ImageUtils.loadTexture('lib/img/top.png');
    var frontTexture = THREE.ImageUtils.loadTexture('lib/img/front.png');
    var rightTexture = THREE.ImageUtils.loadTexture('lib/img/right.png');
    var backTexture = THREE.ImageUtils.loadTexture('lib/img/back.png');
    var leftTexture = THREE.ImageUtils.loadTexture('lib/img/left.png');
    var bottomTexture = THREE.ImageUtils.loadTexture('lib/img/bottom.png');

    var topFace    = self.makeFace(70,   0,   0,  50, [{axis:Z_AXIS, rad:ROTATE_90}], self.FACE_COLOR, topTexture);
    var frontFace  = self.makeFace(70,  50,   0,   0, [{axis:Y_AXIS, rad:ROTATE_90},{axis:Z_AXIS, rad:ROTATE_90}], self.FACE_COLOR, frontTexture);
    var rightFace  = self.makeFace(70,   0,  50,   0, [{axis:X_AXIS, rad:ROTATE_270},{axis:Z_AXIS, rad:ROTATE_180}], self.FACE_COLOR, rightTexture);
    var leftFace   = self.makeFace(70,   0, -50,   0, [{axis:X_AXIS, rad:ROTATE_90},{axis:Z_AXIS, rad:ROTATE_360}], self.FACE_COLOR, leftTexture);
    var backFace   = self.makeFace(70, -50,   0,   0, [{axis:X_AXIS, rad:ROTATE_90},{axis:Y_AXIS, rad:ROTATE_270}], self.FACE_COLOR, backTexture);
    var bottomFace = self.makeFace(70,   0,   0, -50, [{axis:Y_AXIS, rad:ROTATE_180},{axis:Z_AXIS, rad:ROTATE_90}], self.FACE_COLOR, bottomTexture);

    self.cube.add(topFace);
    self.cube.add(frontFace);
    self.cube.add(rightFace);
    self.cube.add(backFace);
    self.cube.add(leftFace);
    self.cube.add(bottomFace);

    // edges
    var top_front_edge    = self.makeEdge(70, 15,  50,   0, 50, [{axis:Z_AXIS, rad:ROTATE_90}], self.EDGE_COLOR);
    var top_right_edge    = self.makeEdge(70, 15,   0,  50, 50, [{axis:Z_AXIS, rad:ROTATE_180}], self.EDGE_COLOR);
    var top_back_edge     = self.makeEdge(70, 15, -50,   0, 50, [{axis:Z_AXIS, rad:ROTATE_270}], self.EDGE_COLOR);
    var top_left_edge     = self.makeEdge(70, 15,   0, -50, 50, [{axis:Z_AXIS, rad:ROTATE_360}], self.EDGE_COLOR);

    var bottom_front_edge = self.makeEdge(70, 15,  50,   0, -50, [{axis:Z_AXIS, rad:ROTATE_90}, {axis:Y_AXIS, rad:ROTATE_180}], self.EDGE_COLOR);
    var bottom_right_edge = self.makeEdge(70, 15,   0,  50, -50, [{axis:Z_AXIS, rad:ROTATE_180},{axis:Y_AXIS, rad:ROTATE_180}], self.EDGE_COLOR);
    var bottom_back_edge  = self.makeEdge(70, 15, -50,   0, -50, [{axis:Z_AXIS, rad:ROTATE_270},{axis:Y_AXIS, rad:ROTATE_180}], self.EDGE_COLOR);
    var bottom_left_edge  = self.makeEdge(70, 15,   0, -50, -50, [{axis:Z_AXIS, rad:ROTATE_360},{axis:Y_AXIS, rad:ROTATE_180}], self.EDGE_COLOR);

    var front_right_edge  = self.makeEdge(70, 15,  50,  50, 0, [{axis:X_AXIS, rad:ROTATE_180},{axis:Y_AXIS, rad:ROTATE_90},{axis:Z_AXIS, rad:0}], self.EDGE_COLOR);
    var back_right_edge   = self.makeEdge(70, 15, -50,  50, 0, [{axis:X_AXIS, rad:ROTATE_90},{axis:Y_AXIS, rad:ROTATE_180},{axis:Z_AXIS, rad:ROTATE_90}], self.EDGE_COLOR);
    var back_left_edge    = self.makeEdge(70, 15, -50, -50, 0, [{axis:X_AXIS, rad:ROTATE_90},{axis:Y_AXIS, rad:ROTATE_270},{axis:Z_AXIS, rad:ROTATE_90}], self.EDGE_COLOR);
    var front_left_edge   = self.makeEdge(70, 15,  50, -50, 0, [{axis:X_AXIS, rad:ROTATE_90},{axis:Y_AXIS, rad:ROTATE_360},{axis:Z_AXIS, rad:ROTATE_90}], self.EDGE_COLOR);

    self.cube.add(top_front_edge);
    self.cube.add(top_right_edge);
    self.cube.add(top_back_edge);
    self.cube.add(top_left_edge);

    self.cube.add(bottom_front_edge);
    self.cube.add(bottom_right_edge);
    self.cube.add(bottom_back_edge);
    self.cube.add(bottom_left_edge);
    
    self.cube.add(front_right_edge);
    self.cube.add(back_right_edge);
    self.cube.add(back_left_edge);
    self.cube.add(front_left_edge);

    // corners
    var top_front_left_corner  = self.makeCorner(15,  50, -50, 50, [{axis:Z_AXIS, rad:ROTATE_90}], self.EDGE_COLOR);
    var top_front_right_corner = self.makeCorner(15,  50,  50, 50, [{axis:Z_AXIS, rad:ROTATE_180}], self.EDGE_COLOR);
    var top_back_right_corner  = self.makeCorner(15, -50,  50, 50, [{axis:Z_AXIS, rad:ROTATE_270}], self.EDGE_COLOR);
    var top_back_left_corner   = self.makeCorner(15, -50, -50, 50, [{axis:Z_AXIS, rad:ROTATE_360}], self.EDGE_COLOR);

    var bottom_front_left_corner  = self.makeCorner(15,  50, -50, -50, [{axis:X_AXIS, rad:ROTATE_0},{axis:Y_AXIS, rad:ROTATE_180},{axis:Z_AXIS, rad:ROTATE_0}], self.EDGE_COLOR);
    var bottom_front_right_corner = self.makeCorner(15,  50,  50, -50, [{axis:X_AXIS, rad:ROTATE_90},{axis:Y_AXIS, rad:ROTATE_180},{axis:Z_AXIS, rad:ROTATE_0}], self.EDGE_COLOR);
    var bottom_back_right_corner  = self.makeCorner(15, -50,  50, -50, [{axis:X_AXIS, rad:ROTATE_90},{axis:Y_AXIS, rad:ROTATE_180},{axis:Z_AXIS, rad:ROTATE_90}], self.EDGE_COLOR);
    var bottom_back_left_corner   = self.makeCorner(15, -50, -50, -50, [{axis:X_AXIS, rad:ROTATE_0},{axis:Y_AXIS, rad:ROTATE_180},{axis:Z_AXIS, rad:ROTATE_90}], self.EDGE_COLOR);

    self.cube.add(top_front_left_corner);
    self.cube.add(top_front_right_corner);
    self.cube.add(top_back_right_corner);
    self.cube.add(top_back_left_corner);

    self.cube.add(bottom_front_left_corner);
    self.cube.add(bottom_front_right_corner);
    self.cube.add(bottom_back_right_corner);
    self.cube.add(bottom_back_left_corner);

    // compass
    self.compass = new THREE.Object3D();
    var circle = self.makeCompass(0, 0, -55, 90, 64, self.COMPASS_COLOR, self.COMPASS_OPACITY);
    self.compass.add(circle);

    // add
    self.scene.add(self.cube);
    self.scene.add(self.compass);
};

Viewport3D.prototype.makeCompass = function (x, y, z, radius, segments, color, opacity) {
    var self = this;
    var obj = new THREE.Object3D();
    var material = new THREE.MeshBasicMaterial({color: color});
    var circleGeometry = new THREE.CircleGeometry(radius, segments);
    var circle = new THREE.Mesh(circleGeometry, material);
    obj.add(circle);
    obj.opacity = opacity;
    obj.position.x = x;
    obj.position.y = y;
    obj.position.z = z;
    return obj;
};

Viewport3D.prototype.makeCorner = function (w, x, y, z, rotations, color) {
    var face1, face2, face3, geometry, material, obj;
    obj = new THREE.Object3D();

    geometry = new THREE.PlaneGeometry(w, w);
    material = new THREE.MeshPhongMaterial({color: color});
    face1 = new THREE.Mesh(geometry, material);
    face1.material.side = THREE.DoubleSide;
    face1.position.setX(w / 2);
    face1.position.setY(w / 2);

    geometry = new THREE.PlaneGeometry(w, w);
    face2 = new THREE.Mesh(geometry, material);
    face2.material.side = THREE.DoubleSide;
    face2.position.setX(w / 2);
    face2.position.setZ(-w / 2);
    face2.rotateOnAxis(new THREE.Vector3(1,0,0), Math.PI / 2);

    geometry = new THREE.PlaneGeometry(w, w);
    face3 = new THREE.Mesh(geometry, material);
    face3.material.side = THREE.DoubleSide;
    face3.position.setY(w / 2);
    face3.position.setZ(-w / 2);
    face3.rotateOnAxis(new THREE.Vector3(0,1,0), Math.PI / 2);

    obj.add(face1);
    obj.add(face2);
    obj.add(face3);
    obj.position.x = x;
    obj.position.y = y;
    obj.position.z = z;
    rotations.forEach(function (rotation) {
        obj.rotateOnAxis(rotation.axis, rotation.rad);
    });
    return obj;
};

Viewport3D.prototype.makeEdge = function (w, h, x, y, z, rotations, color) {
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
    rotations.forEach(function (rotation) {
        obj.rotateOnAxis(rotation.axis, rotation.rad);
    });
    return obj;
};

Viewport3D.prototype.makeFace = function (w, x, y, z, rotations, color, texture) {
    var geometry = new THREE.PlaneGeometry(w, w);
    var material = new THREE.MeshPhongMaterial({blending: THREE.NoBlending, color: color, map: texture, opacity: 1, transparent: false});
    var face = new THREE.Mesh(geometry, material);
    face.material.side = THREE.DoubleSide;
    face.position.setX(x);
    face.position.setY(y);
    face.position.setZ(z);
    rotations.forEach(function (rotation) {
        face.rotateOnAxis(rotation.axis, rotation.rad);
    });
    return face;
};

Viewport3D.prototype.makeLabel = function () {};

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
    var self = this;
    self.controller = new THREE.TrackballControls(self.camera, self.element);
    self.controller.rotateSpeed = 1.0;
    self.controller.noZoom = true;
    self.controller.noPan = true;
    self.controller.staticMoving = true;
    self.controller.dynamicDampingFactor = 0.3;
    self.controller.keys = [ 65, 83, 68 ];
    self.controller.addEventListener('change', self.render);
};

Viewport3D.prototype.setupSelection = function () {
    var self = this;
    function onMouseUp(event) {
        if (self.mode == self.MODES.SELECT) {
            // calculate mouse position in normalized device coordinates
            // (-1 to +1) for both components
            self.mouse.x = ( event.clientX / window.innerWidth ) * 2 - 1;
            self.mouse.y = - ( event.clientY / window.innerHeight ) * 2 + 1;
            // update the picking ray with the camera and mouse position
            self.raycaster.setFromCamera(self.mouse, self.camera);
            // calculate objects intersecting the picking ray
            self.selection = [];
            var intersects = self.raycaster.intersectObjects(self.scene.children);
            intersects.forEach(function (intersect) {
                if (intersect.object.userData.type && intersect.object.userData.type === self.ENTITIES.POLES) {
                    // toggle object selection
                    intersect.object.material.color.set(0x6666ff);
                    self.selection.push(intersect.object);
                }
            });
        }
    }
    window.addEventListener('mouseup', onMouseUp, false);
};

Viewport3D.prototype.setView = function (view) {
    var self = this;
    // TODO center on the bounding box of all entities
    // TODO fit all entities in the display
    if (view === self.VIEWS.TOP) {
        this.tweenCameraToPosition(0, 0, 100, 0, 0, 0);
    }
    else if (view === self.VIEWS.LEFT) {
        this.tweenCameraToPosition(-100, 0, 0, 0, 0, 0);
    }
    else if (view === self.VIEWS.RIGHT) {
        this.tweenCameraToPosition(100, 0, 0, 0, 0, 0);
    }
    else if (view === self.VIEWS.FRONT) {
        this.tweenCameraToPosition(100, 0, 0, 0, 0, 0);
    }
    else if (view === self.VIEWS.BACK) {
        this.tweenCameraToPosition(0, -100, 0, 0, 0, 0);
    }
    else if (view === self.VIEWS.PERSPECTIVE) {
        this.tweenCameraToPosition(100, 50, 50, 0, 0, 0);
    }
};

Viewport3D.prototype.tweenCameraToPosition = function (x, y, z, tx, ty, tz) {
    var self = this;
    return new Promise(function (resolve) {
        var start = {
            x: self.camera.position.x,
            y: self.camera.position.y,
            z: self.camera.position.z
        };
        var finish = {x: x, y: y, z: z};
        var tween = new TWEEN.Tween(start).to(finish, 2000);
        tween.easing(TWEEN.Easing.Cubic.InOut);
        tween.onComplete(resolve);
        tween.onUpdate(function () {
            self.camera.lookAt(new THREE.Vector3(tx, ty, tz));
            self.camera.position.setX(this.x);
            self.camera.position.setY(this.y);
            self.camera.position.setZ(this.z);
        });
        tween.start();
        self.render();
    });
};
