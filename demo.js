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
        45, this.width/this.height, 0.01, 1000);
    this.camera.position.z = 8.00;
    this.camera.position.y = -0.50;
  },

  setupObjects : function() {
    var light = new THREE.PointLight(0xFFFFFF);
    light.position.x = 4.00;
    light.position.y = 4.00;
    light.position.z = 4.00;
    this.light = light;
    this.scene.add(light);


  },

  update : function(t, dt) {
  }

};

window.addEventListener('load', function(ev) {
  window.demo = new Demo();
}, false);
