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

    a.mixer = a.context.createGainNode();

    a.flatGain = a.context.createGainNode();
    a.convolverGain = a.context.createGainNode();

    a.destination = a.mixer;
    a.mixer.connect(a.flatGain);
    a.mixer.connect(a.convolver);
    a.convolver.connect(a.convolverGain);
    a.flatGain.connect(a.volume);
    a.convolverGain.connect(a.volume);
    a.volume.connect(a.context.destination);

    a.environments = {};
    this.loadEnvironment('cathedral');
    this.loadEnvironment('filter-telephone');
    this.loadEnvironment('echo-chamber');
    this.loadEnvironment('bright-hall');
  },

  setEnvironment : function(name) {
    if (this.audio.environments[name]) {
      this.audio.convolverGain.gain.value = 1;
      this.audio.flatGain.gain.value = 0;
      this.audio.convolver.buffer = this.audio.environments[name];
    } else {
      this.audio.flatGain.gain.value = 1;
      this.audio.convolverGain.gain.value = 0;
    }
  },

  loadEnvironment : function(name) {
    var self = this;
    this.loadBuffer('impulse_responses/'+name+'.wav', function(buffer) {
      self.audio.environments[name] = buffer;
    });
  },

  loadBuffer : function(soundFileName, callback) {
    var request = new XMLHttpRequest();
    request.open("GET", soundFileName, true);
    request.responseType = "arraybuffer";
    var ctx = this.audio.context;
    request.onload = function() {
      var buffer = ctx.createBuffer(request.response, false);
      callback(buffer);
    };
    request.send();
    return request;
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

    this.loadBuffer(soundFileName, function(buffer){
      sound.buffer = buffer;
      sound.source.buffer = sound.buffer;
      sound.source.noteOn(ctx.currentTime + 0.020);
    });

    return sound;
  },

  setupCamera : function() {
    this.camera = new THREE.PerspectiveCamera(
        45, this.width/this.height, 0.01, 1000);
    this.camera.position.z = 8.00;
    this.camera.position.y = -0.50;
  },

  createSoundCone : function(object, innerAngle, outerAngle, outerGain) {
    var innerScale = 1, outerScale = 1;
    var ia = innerAngle;
    var oa = outerAngle;
    if (outerAngle > Math.PI) {
      oa = 2*Math.PI-outerAngle;
      outerScale = -1;
    }
    if (innerAngle > Math.PI) {
      ia = 2*Math.PI-innerAngle;
      innerScale = -1;
    }
    var height = 5;
    var innerRadius = Math.sin(ia/2) * height;
    var innerHeight = Math.cos(ia/2) * height;
    var outerRadius = Math.sin(oa/2) * height*0.9;
    var outerHeight = Math.cos(oa/2) * height*0.9;
    var innerConeGeo = new THREE.CylinderGeometry(0, innerRadius, innerHeight, 100, 1, true);
    var outerConeGeo = new THREE.CylinderGeometry(0, outerRadius, outerHeight, 100, 1, true);

    var innerCone = new THREE.Mesh(
      innerConeGeo,
      new THREE.MeshBasicMaterial({color: 0x00ff00, opacity: 0.5})
    );
    innerCone.doubleSided = true;
    innerCone.material.transparent = true;
    innerCone.material.blending = THREE.AdditiveBlending;
    innerCone.material.depthWrite = false;
    innerCone.scale.y = innerScale;
    innerCone.position.y = -innerHeight/2 * innerScale;
    var outerCone = new THREE.Mesh(
      outerConeGeo,
      new THREE.MeshBasicMaterial({color: 0xff0000, opacity: 0.5})
    );
    outerCone.doubleSided = true;
    outerCone.material.transparent = true;
    outerCone.material.blending = THREE.AdditiveBlending;
    outerCone.material.depthWrite = false;
    outerCone.scale.y = outerScale;
    outerCone.position.y = -outerHeight/2 * outerScale;

    var cones = new THREE.Object3D();
    cones.add(innerCone);
    cones.add(outerCone);
    cones.rotation.x = -Math.PI/2;
    object.add(cones);

    object.sound.panner.coneInnerAngle = innerAngle*180/Math.PI;
    object.sound.panner.coneOuterAngle = outerAngle*180/Math.PI;
    object.sound.panner.coneOuterGain = outerGain;
  },

  setupObjects : function() {
    this.setupAudio();

    var cubeGeo = new THREE.CubeGeometry(1.20,1.20,2.00);
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

    cube.sound = this.loadSound('samples/breakbeat.wav');
    this.createSoundCone(cube, 1.0, 3.8, 0.3);

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
    if (this.velocityEnabled) {
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

      var up = new THREE.Vector3(0,-1,0);
      m.multiplyVector3(up);
      up.normalize();

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

  }

};

window.addEventListener('load', function(ev) {
  window.demo = new Demo();
}, false);
