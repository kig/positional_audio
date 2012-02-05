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

  setupCamera : function() {
    this.camera = new THREE.PerspectiveCamera(
        45, this.width/this.height, 0.1, 10000);
    this.camera.position.z = 800;
    this.camera.position.y = 150;
  },

  setupObjects : function() {
    var cubeGeo = new THREE.CubeGeometry(200,100,200);
    var cubeMat = new THREE.MeshLambertMaterial({color: 0xFF0000});
    var cube = new THREE.Mesh(cubeGeo, cubeMat);
    this.cube = cube;
    this.scene.add(cube);

    var light = new THREE.PointLight(0xFFFFFF);
    light.position.x = 400;
    light.position.y = 400;
    light.position.z = 400;
    this.light = light;
    this.scene.add(light);

    this.setupAudio();
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

  update : function(t, dt) {
    this.cube.rotation.x += dt/1000;
    this.cube.rotation.y += dt/800;
    this.cube.position.x = Math.cos(t/3000) * 500;
    this.cube.position.z = Math.sin(t/3000) * 500;
    this.cube.position.y = Math.sin(t/600) * 150;

    var rx = this.cube.position.x - this.camera.position.x;
    var ry = this.cube.position.y - this.camera.position.y;
    var rz = this.cube.position.z - this.camera.position.z;
    this.audio.panner.setPosition(rx/200, ry/200, rz/200);
  }

};

window.addEventListener('load', function(ev) {
  window.demo = new Demo();
}, false);
