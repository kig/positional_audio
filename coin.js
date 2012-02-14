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
    this.camera.position.z = 80.00;
    this.camera.position.y = 50.00;
  },

  setupObjects : function() {
    var light = new THREE.PointLight(0xFFFFFF);
    light.position.x = 40.00;
    light.position.y = 40.00;
    light.position.z = 40.00;
    this.light = light;
    this.scene.add(light);

    var coin_sides_geo =
      new THREE.CylinderGeometry( 10.0, 10.0, 1.0, 100.0, 10.0, true );
    var coin_cap_geo = new THREE.Geometry();
    var r = 10.0;
    for (var i=0; i<100; i++) {
      var a = i * 1/100 * Math.PI * 2;
      var z = Math.sin(a);
      var x = Math.cos(a);
      var a1 = (i+1) * 1/100 * Math.PI * 2;
      var z1 = Math.sin(a1);
      var x1 = Math.cos(a1);
      coin_cap_geo.vertices.push(
        new THREE.Vertex(new THREE.Vector3(0, 0, 0)),
        new THREE.Vertex(new THREE.Vector3(x*r, 0, z*r)),
        new THREE.Vertex(new THREE.Vector3(x1*r, 0, z1*r))
      );
      coin_cap_geo.faceVertexUvs[0].push([
        new THREE.UV(0.5, 0.5),
        new THREE.UV(x/2+0.5, z/2+0.5),
        new THREE.UV(x1/2+0.5, z1/2+0.5)
      ]);
      coin_cap_geo.faces.push(new THREE.Face3(i*3, i*3+1, i*3+2));
    }
    coin_cap_geo.computeCentroids();
    coin_cap_geo.computeFaceNormals();

    var coin_sides_texture =
      THREE.ImageUtils.loadTexture("./coin_sides.png");
    var coin_cap_texture =
      THREE.ImageUtils.loadTexture("./coin_face.png");
    
    var coin_sides_mat =
      new THREE.MeshLambertMaterial({map:coin_sides_texture});
    var coin_sides =
      new THREE.Mesh( coin_sides_geo, coin_sides_mat );
    
    var coin_cap_mat = new THREE.MeshLambertMaterial({map:coin_cap_texture});
    var coin_cap_top = new THREE.Mesh( coin_cap_geo, coin_cap_mat );
    var coin_cap_bottom = new THREE.Mesh( coin_cap_geo, coin_cap_mat );
    coin_cap_top.position.y = 0.5;
    coin_cap_bottom.position.y = -0.5;
    coin_cap_top.rotation.x = Math.PI;
    
    var coin = new THREE.Object3D();
    coin.add(coin_sides);
    coin.add(coin_cap_top);
    coin.add(coin_cap_bottom);

    this.scene.add(coin);
  },

  update : function(t, dt) {
    this.camera.lookAt(this.scene.position);
  }

};

window.addEventListener('load', function(ev) {
  window.demo = new Demo();
}, false);
