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

  audioFileName : 'breakbeat.wav',

  setupAudio : function() {
    this.audio = {};
    var ctx = this.audio.context = new webkitAudioContext();
    this.audio.source = ctx.createBufferSource();
    this.audio.source.loop = true;
    this.audio.panner = ctx.createPanner();

    this.audio.source.connect(this.audio.panner);
    this.audio.panner.connect(ctx.destination);

    var self = this;
    var request = new XMLHttpRequest();
    request.open("GET", this.audioFileName, true);
    request.responseType = "arraybuffer";
    request.onload = function() {
      console.log('loaded ' + self.audioFileName);
      self.audio.buffer = ctx.createBuffer(request.response, true);
      self.audio.source.buffer = self.audio.buffer;
      self.audio.source.noteOn(ctx.currentTime + 0.020);
    };
    request.send();
  },

  setupCamera : function() {
    this.camera = new THREE.PerspectiveCamera(
        45, this.width/this.height, 0.01, 1000);
    this.camera.position.z = 8.00;
    this.camera.position.y = -0.50;
  },

  setupObjects : function() {
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

    this.setupAudio();
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

  update : function(t, dt) {
    var vx = 0, vz = 0, vy = 0;
    if (this.keyForward) {
      this.camera.position.z -= dt/100;
      vz -= 10;
    }
    if (this.keyBackward) {
      this.camera.position.z += dt/100;
      vz += 10;
    }
    if (this.keyLeft) {
      this.camera.position.x -= dt/100;
      vx -= 10;
    }
    if (this.keyRight) {
      this.camera.position.x += dt/100;
      vx += 10;
    }

    this.cube.rotation.x += dt/1000;
    this.cube.rotation.y += dt/800;
    this.cube.position.x = Math.cos(t/3000) * 5.00;
    this.cube.position.z = Math.sin(t/3000) * 5.00;
    this.cube.position.y = Math.sin(t/600) * 1.50;

    var rx = this.cube.position.x;
    var ry = this.cube.position.y;
    var rz = this.cube.position.z;
    this.audio.panner.setPosition(rx, ry, rz);

    var cx = this.camera.position.x;
    var cy = this.camera.position.y;
    var cz = this.camera.position.z;
    this.audio.context.listener.setPosition(cx, cy, cz);
    this.audio.context.listener.setVelocity(vx, vy, vz);
  }

};

window.addEventListener('load', function(ev) {
  window.demo = new Demo();
}, false);
