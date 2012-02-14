Demo = function() {
  var self = this;
  this.ticker = function(t) {
    self.tick(t);
    window.requestAnimationFrame(self.ticker, self.renderer.domElement);
  };
  this.resizer = function(ev) {
    self.resize(window.innerWidth, window.innerHeight);
  };

  this.init();
  this.play();
};

Demo.prototype = {
  previousTime : 0,
  maxTimeDelta : 60,

  velocityEnabled : true,
  orientationEnabled : true,
  environmentEnabled : true,

  init : function() {
    this.setupRenderer();
    this.setupCamera();
    this.setupScene();
    this.setupObjects();
  },

  setupRenderer : function() {
    this.renderer = new THREE.WebGLRenderer();
    this.listenToResize();
    
    var s = this.renderer.domElement.style;
    s.position = 'absolute';
    s.left = s.top = '0px';
    document.body.appendChild(this.renderer.domElement);
  },

  listenToResize : function() {
    window.addEventListener('resize', this.resizer, false);
    this.resizer();
  },

  resize : function(w, h) {
    this.width = w;
    this.height = h;
    this.renderer.setSize(this.width, this.height);
  },

  play : function() {
    window.requestAnimationFrame(this.ticker, this.renderer.domElement);
  },

  tick : function(t) {
    var dt = Math.min(t - this.previousTime, this.maxTimeDelta);
    this.previousTime = t;
    this.update(t, dt);
    this.draw(t, dt);
  },

  draw : function(t, dt) {
    this.renderer.render(this.scene, this.camera);
  },

  setupScene : function() {
    this.scene = new THREE.Scene();
    this.scene.add(this.camera);
  },

  setupAudio : function() {
    var a = {};
    this.audio = a;

    a.context = new webkitAudioContext();
    a.convolver = a.context.createConvolver();
    a.volume = a.context.createGainNode();

    a.convolver.connect(a.volume);
    a.volume.connect(a.context.destination);
    a.destination = a.convolver;
  },

  loadSound : function(soundFileName) {
    var ctx = this.audio.context;

    var sound = {};
    sound.source = ctx.createBufferSource();
    sound.source.loop = true;
    sound.panner = ctx.createPanner();
    sound.volume = ctx.createGainNode();

    sound.source.connect(sound.volume);
    sound.volume.connect(sound.panner);
    sound.panner.connect(this.audio.destination);

    var request = new XMLHttpRequest();
    request.open("GET", soundFileName, true);
    request.responseType = "arraybuffer";
    request.onload = function() {
      sound.buffer = ctx.createBuffer(request.response, true);
      sound.source.buffer = sound.buffer;
      sound.source.noteOn(ctx.currentTime + 0.020);
    };
    request.send();

    return sound;
  },

  setupCamera : function() {
    this.camera = new THREE.PerspectiveCamera(
        45, this.width/this.height, 0.01, 1000);
    this.camera.position.z = 8.00;
    this.camera.position.y = -0.50;
  },

  setupObjects : function() {
    this.setupAudio();

    var cubeGeo = new THREE.CubeGeometry(2.00,1.00,2.00);
    var cubeMat = new THREE.MeshLambertMaterial({color: 0xFF0000});
    var cube = new THREE.Mesh(cubeGeo, cubeMat);
    this.cube = cube;
    this.scene.add(cube);

    var light = new THREE.PointLight(0xFFFFFF);
    light.position.x = 4.00;
    light.position.y = 4.00;
    light.position.z = 4.00;
    this.light = light;
    this.scene.add(light);

    var plane = new THREE.Mesh(
      new THREE.PlaneGeometry(20, 200, 20, 200),
      new THREE.MeshLambertMaterial({color: 0xffffff})
    );
    plane.position.y = -5.0;
    plane.rotation.x = -Math.PI/2;
    this.scene.add(plane);

    cube.sound = this.loadSound('breakbeat.wav');

    this.keyForward = this.keyBackward = this.keyLeft = this.keyRight = false;
    var self = this;

    window.addEventListener('keydown', function(ev) {
       switch (ev.keyCode) {
        case 'W'.charCodeAt(0):
          self.keyForward = true; break;
        case 'S'.charCodeAt(0):
          self.keyBackward = true; break;
        case 'A'.charCodeAt(0):
          self.keyLeft = true; break;
        case 'D'.charCodeAt(0):
          self.keyRight = true; break;
      }
    }, false);
    window.addEventListener('keyup', function(ev) {
      switch (ev.keyCode) {
        case 'W'.charCodeAt(0):
          self.keyForward = false; break;
        case 'S'.charCodeAt(0):
          self.keyBackward = false; break;
        case 'A'.charCodeAt(0):
          self.keyLeft = false; break;
        case 'D'.charCodeAt(0):
          self.keyRight = false; break;
      }
    }, false);
  },

  setPositionAndVelocity : function(object, audioNode, x, y, z, dt) {
    var p = object.matrixWorld.getPosition();
    var px = p.x, py = p.y, pz = p.z;
    object.position.set(x,y,z);
    object.updateMatrixWorld();
    var q = object.matrixWorld.getPosition();
    var dx = q.x-px, dy = q.y-py, dz = q.z-pz;
    audioNode.setPosition(q.x, q.y, q.z);
    object.worldPosition = [q.x, q.y, q.z];
    if (this.velocityEnabled) {
      object.velocity = [dx/dt, dy/dt, dz/dt];
      audioNode.setVelocity(dx/dt, dy/dt, dz/dt);
    }
  },

  setPosition : function(object, x, y, z, dt) {
    this.setPositionAndVelocity(object, object.sound.panner, x, y, z, dt);
    if (this.orientationEnabled) {
      var vec = new THREE.Vector3(0,0,1);
      var m = object.matrixWorld;
      var mx = m.n14, my = m.n24, mz = m.n34;
      m.n14 = m.n24 = m.n34 = 0;
      m.multiplyVector3(vec);
      vec.normalize();
      object.orientation = [vec.x, vec.y, vec.z];
      object.sound.panner.setOrientation(vec.x, vec.y, vec.z);
      m.n14 = mx;
      m.n24 = my; 
      m.n34 = mz;
    }
  },

  setListenerPosition : function(object, x, y, z, dt) {
    this.setPositionAndVelocity(object, this.audio.context.listener, x, y, z, dt);
    if (this.orientationEnabled) {
      var m = object.matrix;
      var mx = m.n14, my = m.n24, mz = m.n34;
      m.n14 = m.n24 = m.n34 = 0;

      var vec = new THREE.Vector3(0,0,1);
      m.multiplyVector3(vec);
      vec.normalize();

      var up = new THREE.Vector3(0,1,0);
      m.multiplyVector3(up);
      up.normalize();

      object.orientation = [vec.x, vec.y, vec.z];
      object.up = [up.x, up.y, up.z];
      this.audio.context.listener.setOrientation(vec.x, vec.y, vec.z, up.x, up.y, up.z);

      m.n14 = mx;
      m.n24 = my; 
      m.n34 = mz;
    }
  },

  update : function(t, dt) {
    var cp = this.camera.position;
    var camZ = cp.z, camX = cp.x, camY = cp.y;
    if (this.keyForward) {
      camZ -= dt/100;
    }
    if (this.keyBackward) {
      camZ += dt/100;
    }
    if (this.keyLeft) {
      camX -= dt/100;
    }
    if (this.keyRight) {
      camX += dt/100;
    }
    this.setListenerPosition(this.camera, camX, camY, camZ, dt/1000);

    this.cube.rotation.x += dt/1000;
    this.cube.rotation.y += dt/800;
    var cx = Math.cos(t/3000) * 5.00;
    var cz = Math.sin(t/3000) * 5.00;
    var cy = Math.sin(t/600) * 1.50;

    this.setPosition(this.cube, cx, cy, cz, dt/1000);

    var camera = this.camera;
    var cube = this.cube;
    console.log('camera: p(' + camera.worldPosition.join(',') + ') : v(' +camera.velocity.join(',')+ ') : o(' +camera.orientation.join(',')+ ') : u(' +camera.up.join(',')+ ')');
    console.log('cube: p(' + cube.worldPosition.join(',') + ') : v(' +cube.velocity.join(',')+ ') : o(' +cube.orientation.join(',')+ ')');

  }

};

window.addEventListener('load', function(ev) {
  window.demo = new Demo();
}, false);
