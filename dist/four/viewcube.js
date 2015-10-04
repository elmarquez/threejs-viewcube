'use strict';

var FOUR = FOUR || {};

FOUR.Viewcube = (function () {

    function Viewcube (elementId) {
        THREE.EventDispatcher.call(this);

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
        this.MODES = {
            SELECT: 0,
            READONLY: 1
        };
        this.OFFSET = 250;
        this.ROTATION_0   = 0;
        this.ROTATION_90  = Math.PI / 2;
        this.ROTATION_180 = Math.PI;
        this.ROTATION_270 = Math.PI * 1.5;
        this.ROTATION_360 = Math.PI * 2;

        this.COMPASS_COLOR = 0x666666;
        this.COMPASS_OPACITY = 0.8;
        this.FACE_COLOUR = 0x4a5f70;
        this.FACE_OPACITY_MOUSE_OFF = 0.0;
        this.FACE_OPACITY_MOUSE_OVER = 0.8;

        this.backgroundColor = new THREE.Color(0x000000, 0);
        this.camera = null;
        this.compass = null;
        this.control = null;
        this.cube = null;
        this.domElement = document.getElementById(elementId);
        this.elementId = elementId;
        this.fov = 60; // 50
        this.mouse = new THREE.Vector2();
        this.raycaster = new THREE.Raycaster();
        this.renderer = null;
        this.scene = new THREE.Scene();
    }

    Viewcube.prototype = Object.create(THREE.EventDispatcher.prototype);

    Viewcube.prototype.constructor = Viewcube;

    Viewcube.prototype.init = function () {
        var self = this;
        // renderer
        self.renderer = new THREE.WebGLRenderer({alpha: true, antialias: true});
        //self.renderer.setClearColor(self.backgroundColor);
        self.renderer.setSize(self.domElement.clientWidth, self.domElement.clientHeight);
        self.renderer.shadowMap.enabled = true;
        // add the output of the renderer to the html element
        self.domElement.appendChild(self.renderer.domElement);
        // setup scene
        self.setupCamera();
        self.setupGeometry();
        self.setupLights();
        // setup interactions
        self.setupNavigation();
        self.setupSelection();
        // start rendering
        self.render();
    };

    Viewcube.prototype.makeCompass = function (name, x, y, z, radius, segments, color, opacity) {
        var obj = new THREE.Object3D();
        var material = new THREE.MeshBasicMaterial({color: color});
        var circleGeometry = new THREE.CircleGeometry(radius, segments);
        var circle = new THREE.Mesh(circleGeometry, material);
        obj.add(circle);
        obj.name = name;
        obj.opacity = opacity;
        obj.position.x = x;
        obj.position.y = y;
        obj.position.z = z;
        return obj;
    };

    Viewcube.prototype.makeCorner = function (name, w, x, y, z, rotations, color) {
        var face1, face2, face3, geometry, material, obj, self = this;
        obj = new THREE.Object3D();

        geometry = new THREE.PlaneGeometry(w, w);
        material = new THREE.MeshBasicMaterial({color: color, opacity: self.FACE_OPACITY_MOUSE_OFF, transparent: true});
        face1 = new THREE.Mesh(geometry, material);
        face1.material.side = THREE.DoubleSide;
        face1.name = name;
        face1.position.setX(w / 2);
        face1.position.setY(w / 2);

        geometry = new THREE.PlaneGeometry(w, w);
        face2 = new THREE.Mesh(geometry, material);
        face2.material.side = THREE.DoubleSide;
        face2.name = name;
        face2.position.setX(w / 2);
        face2.position.setZ(-w / 2);
        face2.rotateOnAxis(new THREE.Vector3(1,0,0), Math.PI / 2);

        geometry = new THREE.PlaneGeometry(w, w);
        face3 = new THREE.Mesh(geometry, material);
        face3.material.side = THREE.DoubleSide;
        face3.name = name;
        face3.position.setY(w / 2);
        face3.position.setZ(-w / 2);
        face3.rotateOnAxis(new THREE.Vector3(0,1,0), Math.PI / 2);

        obj.add(face1);
        obj.add(face2);
        obj.add(face3);
        obj.name = name;
        obj.position.x = x;
        obj.position.y = y;
        obj.position.z = z;
        rotations.forEach(function (rotation) {
            obj.rotateOnAxis(rotation.axis, rotation.rad);
        });
        return obj;
    };

    Viewcube.prototype.makeEdge = function (name, w, h, x, y, z, rotations, color) {
        var face1, face2, geometry, material, obj, self = this;
        obj = new THREE.Object3D();

        geometry = new THREE.PlaneGeometry(w, h);
        material = new THREE.MeshBasicMaterial({color: color, opacity: self.FACE_OPACITY_MOUSE_OFF, transparent: true});
        face1 = new THREE.Mesh(geometry, material);
        face1.material.side = THREE.DoubleSide;
        face1.name = name;
        face1.position.setY(h / 2);

        geometry = new THREE.PlaneGeometry(w, h);
        face2 = new THREE.Mesh(geometry, material);
        face2.material.side = THREE.DoubleSide;
        face2.name = name;
        face2.position.setZ(-h / 2);
        face2.rotateOnAxis(new THREE.Vector3(1,0,0), Math.PI / 2);

        obj.add(face1);
        obj.add(face2);
        obj.name = name;
        obj.position.x = x;
        obj.position.y = y;
        obj.position.z = z;
        rotations.forEach(function (rotation) {
            obj.rotateOnAxis(rotation.axis, rotation.rad);
        });
        return obj;
    };

    Viewcube.prototype.makeFace = function (name, w, x, y, z, rotations, color) {
        var self = this;
        var geometry = new THREE.PlaneGeometry(w, w);
        var material = new THREE.MeshBasicMaterial({color: color, opacity: self.FACE_OPACITY_MOUSE_OFF, transparent: true});
        var face = new THREE.Mesh(geometry, material);
        face.material.side = THREE.DoubleSide;
        face.name = name;
        face.position.setX(x);
        face.position.setY(y);
        face.position.setZ(z);
        rotations.forEach(function (rotation) {
            face.rotateOnAxis(rotation.axis, rotation.rad);
        });
        return face;
    };

    Viewcube.prototype.onMouseMove = function (event) {
        var self = this;
        // calculate mouse position in normalized device coordinates
        // (-1 to +1) for both components
        self.mouse.x = (event.offsetX / self.domElement.clientWidth) * 2 - 1;
        self.mouse.y = - (event.offsetY / self.domElement.clientHeight) * 2 + 1;
        // update the picking ray with the camera and mouse position
        self.raycaster.setFromCamera(self.mouse, self.camera);
        // reset opacity for all scene objects
        self.scene.traverse(function (obj) {
            if (obj.name !== 'labels' && obj.material) {
                obj.material.opacity = self.FACE_OPACITY_MOUSE_OFF;
            }
        });
        // calculate objects intersecting the picking ray
        var intersects = self.raycaster.intersectObjects(self.scene.children, true);
        if (intersects.length > 0 && intersects[0].object.name !== 'labels') {
            intersects[0].object.material.opacity = self.FACE_OPACITY_MOUSE_OVER;
        }
    };

    Viewcube.prototype.onMouseOver = function (event) {
        var self = this;
        requestAnimationFrame(self.render.bind(self));
    };

    Viewcube.prototype.onMouseUp = function (event) {
        var self = this;
        // calculate mouse position in normalized device coordinates
        // (-1 to +1) for both components
        self.mouse.x = (event.offsetX / self.domElement.clientWidth) * 2 - 1;
        self.mouse.y = - (event.offsetX / self.domElement.clientWidth) * 2 + 1;
        // update the picking ray with the camera and mouse position
        self.raycaster.setFromCamera(self.mouse, self.camera);
        // calculate objects intersecting the picking ray
        self.selection = [];
        var intersects = self.raycaster.intersectObjects(self.scene.children, true);
        if (intersects.length > 0) {
            self.setView(intersects[0].object.name);
        }
    };

    Viewcube.prototype.render = function () {
        var self = this;
        TWEEN.update();
        self.renderer.render(self.scene, self.camera);
    };

    Viewcube.prototype.setupCamera = function () {
        var self = this;
        // position and point the camera to the center of the scene
        self.camera = new THREE.PerspectiveCamera(self.fov, self.domElement.clientWidth / self.domElement.clientHeight, 0.1, 1000);
        self.camera.position.x = 150;
        self.camera.position.y = 150;
        self.camera.position.z = 90;
        self.camera.up = new THREE.Vector3(0, 0, 1);
        self.camera.lookAt(new THREE.Vector3(0, 0, 0));
    };

    Viewcube.prototype.setupGeometry = function () {
        var self = this;

        var ROTATE_0 = 0;
        var ROTATE_90 = Math.PI / 2;
        var ROTATE_180 = Math.PI;
        var ROTATE_270 = Math.PI * 1.5;
        var ROTATE_360 = Math.PI * 2;

        var X_AXIS = new THREE.Vector3(1, 0, 0);
        var Y_AXIS = new THREE.Vector3(0, 1, 0);
        var Z_AXIS = new THREE.Vector3(0, 0, 1);

        self.control = new THREE.Object3D();
        self.cube = new THREE.Object3D();

        // labels
        var material1 = new THREE.MeshPhongMaterial({
            color: 0xAAAAAA,
            map: THREE.ImageUtils.loadTexture('lib/img/top.png'),
            opacity: 1.0,
            transparent: true
        });
        var material2 = new THREE.MeshPhongMaterial({
            color: 0xAAAAAA,
            map: THREE.ImageUtils.loadTexture('lib/img/front.png'),
            opacity: 1.0,
            transparent: true
        });
        var material3 = new THREE.MeshPhongMaterial({
            color: 0xAAAAAA,
            map: THREE.ImageUtils.loadTexture('lib/img/right.png'),
            opacity: 1.0,
            transparent: true
        });
        var material4 = new THREE.MeshPhongMaterial({
            color: 0xAAAAAA,
            map: THREE.ImageUtils.loadTexture('lib/img/back.png'),
            opacity: 1.0,
            transparent: true
        });
        var material5 = new THREE.MeshPhongMaterial({
            color: 0xAAAAAA,
            map: THREE.ImageUtils.loadTexture('lib/img/left.png'),
            opacity: 1.0,
            transparent: true
        });
        var material6 = new THREE.MeshPhongMaterial({
            color: 0xAAAAAA,
            map: THREE.ImageUtils.loadTexture('lib/img/bottom.png'),
            opacity: 1.0,
            transparent: true
        });
        var materials = [
            material2, material5, material3,
            material4, material1, material6
        ];

        var geometry = new THREE.BoxGeometry(99, 99, 99);
        var material = new THREE.MeshFaceMaterial(materials);
        var labels = new THREE.Mesh(geometry, material);
        labels.name = 'labels';
        self.scene.add(labels);

        // faces
        var topFace    = self.makeFace(self.FACES.TOP,    70,   0,   0,  50, [{axis:Z_AXIS, rad:ROTATE_90}], self.FACE_COLOUR);
        var frontFace  = self.makeFace(self.FACES.FRONT,  70,  50,   0,   0, [{axis:Y_AXIS, rad:ROTATE_90},{axis:Z_AXIS, rad:ROTATE_90}], self.FACE_COLOUR);
        var rightFace  = self.makeFace(self.FACES.RIGHT,  70,   0,  50,   0, [{axis:X_AXIS, rad:ROTATE_270},{axis:Z_AXIS, rad:ROTATE_180}], self.FACE_COLOUR);
        var leftFace   = self.makeFace(self.FACES.LEFT,   70,   0, -50,   0, [{axis:X_AXIS, rad:ROTATE_90},{axis:Z_AXIS, rad:ROTATE_360}], self.FACE_COLOUR);
        var backFace   = self.makeFace(self.FACES.BACK,   70, -50,   0,   0, [{axis:X_AXIS, rad:ROTATE_90},{axis:Y_AXIS, rad:ROTATE_270}], self.FACE_COLOUR);
        var bottomFace = self.makeFace(self.FACES.BOTTOM, 70,   0,   0, -50, [{axis:Y_AXIS, rad:ROTATE_180},{axis:Z_AXIS, rad:ROTATE_90}], self.FACE_COLOUR);

        // edges
        var topFrontEdge    = self.makeEdge(self.FACES.TOP_FRONT_EDGE, 70, 15,  50,   0, 50, [{axis:Z_AXIS, rad:ROTATE_90}], self.FACE_COLOUR);
        var topRightEdge    = self.makeEdge(self.FACES.TOP_RIGHT_EDGE, 70, 15,   0,  50, 50, [{axis:Z_AXIS, rad:ROTATE_180}], self.FACE_COLOUR);
        var topBackEdge     = self.makeEdge(self.FACES.TOP_BACK_EDGE, 70, 15, -50,   0, 50, [{axis:Z_AXIS, rad:ROTATE_270}], self.FACE_COLOUR);
        var topLeftEdge     = self.makeEdge(self.FACES.TOP_LEFT_EDGE, 70, 15,   0, -50, 50, [{axis:Z_AXIS, rad:ROTATE_360}], self.FACE_COLOUR);

        var bottomFrontEdge = self.makeEdge(self.FACES.BOTTOM_FRONT_EDGE, 70, 15,  50,   0, -50, [{axis:Z_AXIS, rad:ROTATE_90}, {axis:Y_AXIS, rad:ROTATE_180}], self.FACE_COLOUR);
        var bottomRightEdge = self.makeEdge(self.FACES.BOTTOM_RIGHT_EDGE, 70, 15,   0,  50, -50, [{axis:Z_AXIS, rad:ROTATE_180},{axis:Y_AXIS, rad:ROTATE_180}], self.FACE_COLOUR);
        var bottomBackEdge  = self.makeEdge(self.FACES.BOTTOM_BACK_EDGE, 70, 15, -50,   0, -50, [{axis:Z_AXIS, rad:ROTATE_270},{axis:Y_AXIS, rad:ROTATE_180}], self.FACE_COLOUR);
        var bottomLeftEdge  = self.makeEdge(self.FACES.BOTTOM_LEFT_EDGE, 70, 15,   0, -50, -50, [{axis:Z_AXIS, rad:ROTATE_360},{axis:Y_AXIS, rad:ROTATE_180}], self.FACE_COLOUR);

        var frontRightEdge  = self.makeEdge(self.FACES.FRONT_RIGHT_EDGE, 70, 15,  50,  50, 0, [{axis:X_AXIS, rad:ROTATE_180},{axis:Y_AXIS, rad:ROTATE_90},{axis:Z_AXIS, rad:0}], self.FACE_COLOUR);
        var backRightEdge   = self.makeEdge(self.FACES.BACK_RIGHT_EDGE, 70, 15, -50,  50, 0, [{axis:X_AXIS, rad:ROTATE_90},{axis:Y_AXIS, rad:ROTATE_180},{axis:Z_AXIS, rad:ROTATE_90}], self.FACE_COLOUR);
        var backLeftEdge    = self.makeEdge(self.FACES.BACK_LEFT_EDGE, 70, 15, -50, -50, 0, [{axis:X_AXIS, rad:ROTATE_90},{axis:Y_AXIS, rad:ROTATE_270},{axis:Z_AXIS, rad:ROTATE_90}], self.FACE_COLOUR);
        var frontLeftEdge   = self.makeEdge(self.FACES.FRONT_LEFT_EDGE, 70, 15,  50, -50, 0, [{axis:X_AXIS, rad:ROTATE_90},{axis:Y_AXIS, rad:ROTATE_360},{axis:Z_AXIS, rad:ROTATE_90}], self.FACE_COLOUR);

        // corners
        var topFrontLeftCorner  = self.makeCorner(self.FACES.TOP_FRONT_LEFT_CORNER, 15,  50, -50, 50, [{axis:Z_AXIS, rad:ROTATE_90}], self.FACE_COLOUR);
        var topFrontRightCorner = self.makeCorner(self.FACES.TOP_FRONT_RIGHT_CORNER, 15,  50,  50, 50, [{axis:Z_AXIS, rad:ROTATE_180}], self.FACE_COLOUR);
        var topBackRightCorner  = self.makeCorner(self.FACES.TOP_BACK_RIGHT_CORNER, 15, -50,  50, 50, [{axis:Z_AXIS, rad:ROTATE_270}], self.FACE_COLOUR);
        var topBackLeftCorner   = self.makeCorner(self.FACES.TOP_BACK_LEFT_CORNER, 15, -50, -50, 50, [{axis:Z_AXIS, rad:ROTATE_360}], self.FACE_COLOUR);

        var bottomFrontLeftCorner  = self.makeCorner(self.FACES.BOTTOM_FRONT_LEFT_CORNER, 15,  50, -50, -50, [{axis:X_AXIS, rad:ROTATE_0},{axis:Y_AXIS, rad:ROTATE_180},{axis:Z_AXIS, rad:ROTATE_0}], self.FACE_COLOUR);
        var bottomFrontRightCorner = self.makeCorner(self.FACES.BOTTOM_FRONT_RIGHT_CORNER, 15,  50,  50, -50, [{axis:X_AXIS, rad:ROTATE_90},{axis:Y_AXIS, rad:ROTATE_180},{axis:Z_AXIS, rad:ROTATE_0}], self.FACE_COLOUR);
        var bottomBackRightCorner  = self.makeCorner(self.FACES.BOTTOM_BACK_RIGHT_CORNER, 15, -50,  50, -50, [{axis:X_AXIS, rad:ROTATE_90},{axis:Y_AXIS, rad:ROTATE_180},{axis:Z_AXIS, rad:ROTATE_90}], self.FACE_COLOUR);
        var bottomBackLeftCorner   = self.makeCorner(self.FACES.BOTTOM_BACK_LEFT_CORNER, 15, -50, -50, -50, [{axis:X_AXIS, rad:ROTATE_0},{axis:Y_AXIS, rad:ROTATE_180},{axis:Z_AXIS, rad:ROTATE_90}], self.FACE_COLOUR);

        self.cube.add(topFace);
        self.cube.add(frontFace);
        self.cube.add(rightFace);
        self.cube.add(backFace);
        self.cube.add(leftFace);
        self.cube.add(bottomFace);

        self.cube.add(topFrontEdge);
        self.cube.add(topRightEdge);
        self.cube.add(topBackEdge);
        self.cube.add(topLeftEdge);

        self.cube.add(bottomFrontEdge);
        self.cube.add(bottomRightEdge);
        self.cube.add(bottomBackEdge);
        self.cube.add(bottomLeftEdge);

        self.cube.add(frontRightEdge);
        self.cube.add(backRightEdge);
        self.cube.add(backLeftEdge);
        self.cube.add(frontLeftEdge);

        self.cube.add(topFrontLeftCorner);
        self.cube.add(topFrontRightCorner);
        self.cube.add(topBackRightCorner);
        self.cube.add(topBackLeftCorner);

        self.cube.add(bottomFrontLeftCorner);
        self.cube.add(bottomFrontRightCorner);
        self.cube.add(bottomBackRightCorner);
        self.cube.add(bottomBackLeftCorner);

        // compass
        self.compass = new THREE.Object3D();
        var circle = self.makeCompass('compass', 0, 0, -55, 90, 64, self.COMPASS_COLOR, self.COMPASS_OPACITY);

        self.compass.add(circle);

        // add
        self.scene.add(self.cube);
        self.scene.add(self.compass);
    };

    Viewcube.prototype.setupLights = function () {
        var ambientLight = new THREE.AmbientLight(0x383838);
        this.scene.add(ambientLight);

        // add spotlight for the shadows
        var spotLight = new THREE.SpotLight(0xffffff);
        spotLight.position.set(100, 140, 130);
        spotLight.intensity = 2;
        this.scene.add(spotLight);
    };

    Viewcube.prototype.setupNavigation = function () {
        // bind click events to views
    };

    Viewcube.prototype.setupSelection = function () {
        var self = this;
        self.domElement.addEventListener('mousemove', self.onMouseMove.bind(self), false);
        self.domElement.addEventListener('mouseover', self.onMouseOver.bind(self), false);
        self.domElement.addEventListener('mouseup', self.onMouseUp.bind(self), false);
    };

    Viewcube.prototype.setView = function (view) {
        var self = this;
        switch (view) {
            case self.FACES.TOP:
                self.tweenCameraToPosition(0,0,self.OFFSET);
                break;
            case self.FACES.FRONT:
                self.tweenCameraToPosition(self.OFFSET,0,0);
                break;
            case self.FACES.LEFT:
                self.tweenCameraToPosition(0,0,self.OFFSET);
                break;
            case self.FACES.RIGHT:
                self.tweenCameraToPosition(self.OFFSET,0,0);
                break;
            case self.FACES.BACK:
                self.tweenCameraToPosition(-self.OFFSET,0,0);
                break;
            case self.FACES.BOTTOM:
                self.tweenCameraToPosition(0,0,-self.OFFSET);
                break;
            case self.FACES.TOP_FRONT_EDGE:
                self.tweenCameraToPosition(0,0,self.OFFSET,0);
                break;
            case self.FACES.TOP_BACK_EDGE:
                console.log(view); // TODO
                break;
            case self.FACES.TOP_RIGHT_EDGE:
                console.log(view); // TODO
                break;
            case self.FACES.TOP_LEFT_EDGE:
                console.log(view); // TODO
                break;
            default:
                console.dir(view);
        }
    };

    Viewcube.prototype.tweenCameraToPosition = function (x, y, z, rx, ry, rz) {
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
                self.camera.lookAt(new THREE.Vector3(0, 0, 0));
                self.camera.position.set(this.x, this.y, this.z);
            });
            tween.start();
            self.render();
        });
    };

    Viewcube.prototype.tweenControlRotation = function (rx, ry, rz) {
        var self = this;
        return new Promise(function (resolve) {
            var start = {
                rx: self.control.rotation.x,
                ry: self.control.rotation.y,
                rz: self.control.rotation.z
            };
            var finish = {rx: rx, ry: ry, rz: rz};
            var tween = new TWEEN.Tween(start).to(finish, 1000);
            tween.easing(TWEEN.Easing.Cubic.InOut);
            tween.onComplete(resolve);
            tween.onUpdate(function () {
                self.control.rotation.set(this.rx, this.ry, this.rz, 'XYZ');
            });
            tween.start();
            self.render();
        });
    };

    return Viewcube;

}());
