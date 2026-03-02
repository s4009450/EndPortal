(function () {
  const canvas = document.getElementById("portal-canvas");
  if (!canvas) {
    console.error("Missing #portal-canvas element.");
    return;
  }

  const gl = canvas.getContext("webgl", {
    alpha: false,
    antialias: true,
    depth: false,
    stencil: false,
    premultipliedAlpha: false
  });

  if (!gl) {
    console.error("WebGL is not available in this browser.");
    return;
  }

  gl.enable(gl.BLEND);
  gl.blendEquation(gl.FUNC_ADD);
  gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

  const vertexSource = `
    attribute vec3 aPosition;

    uniform mat4 uModelViewMat;
    uniform mat4 uProjMat;

    varying vec4 texProj0;

    vec4 projectionFromPosition(vec4 position) {
      return vec4(
        position.xy * 0.5 + 0.5 * position.w,
        position.z,
        position.w
      );
    }

    void main() {
      gl_Position = uProjMat * uModelViewMat * vec4(aPosition, 1.0);
      texProj0 = projectionFromPosition(gl_Position);
    }
  `;

  const fragmentSource = `
    precision highp float;

    uniform sampler2D uSampler0;
    uniform sampler2D uSampler1;

    uniform float uGameTime;
    uniform int uEndPortalLayers;

    varying vec4 texProj0;

    const int MAX_LAYERS = 16;

    const mat4 SCALE_TRANSLATE = mat4(
      0.5, 0.0, 0.0, 0.25,
      0.0, 0.5, 0.0, 0.25,
      0.0, 0.0, 1.0, 0.0,
      0.0, 0.0, 0.0, 1.0
    );

    vec3 getColor(int i) {
      if (i == 0) return vec3(0.022087, 0.098399, 0.110818);
      if (i == 1) return vec3(0.011892, 0.095924, 0.089485);
      if (i == 2) return vec3(0.027636, 0.101689, 0.100326);
      if (i == 3) return vec3(0.046564, 0.109883, 0.114838);
      if (i == 4) return vec3(0.064901, 0.117696, 0.097189);
      if (i == 5) return vec3(0.063761, 0.086895, 0.123646);
      if (i == 6) return vec3(0.084817, 0.111994, 0.166380);
      if (i == 7) return vec3(0.097489, 0.154120, 0.091064);
      if (i == 8) return vec3(0.106152, 0.131144, 0.195191);
      if (i == 9) return vec3(0.097721, 0.110188, 0.187229);
      if (i == 10) return vec3(0.133516, 0.138278, 0.148582);
      if (i == 11) return vec3(0.070006, 0.243332, 0.235792);
      if (i == 12) return vec3(0.196766, 0.142899, 0.214696);
      if (i == 13) return vec3(0.047281, 0.315338, 0.321970);
      if (i == 14) return vec3(0.204675, 0.390010, 0.302066);
      return vec3(0.080955, 0.314821, 0.661491);
    }

    mat2 rotateZ(float angle) {
      float s = sin(angle);
      float c = cos(angle);
      return mat2(c, -s, s, c);
    }

    mat4 endPortalLayer(float layer) {
      mat4 translate = mat4(
        1.0, 0.0, 0.0, 17.0 / layer,
        0.0, 1.0, 0.0, (2.0 + layer / 1.5) * (uGameTime * 1.5),
        0.0, 0.0, 1.0, 0.0,
        0.0, 0.0, 0.0, 1.0
      );

      mat2 rotate = rotateZ(radians((layer * layer * 4321.0 + layer * 9.0) * 2.0));
      float scaleValue = (4.5 - layer / 4.0) * 2.0;

      mat4 scaleRotate = mat4(
        rotate[0][0] * scaleValue, rotate[0][1] * scaleValue, 0.0, 0.0,
        rotate[1][0] * scaleValue, rotate[1][1] * scaleValue, 0.0, 0.0,
        0.0, 0.0, 1.0, 0.0,
        0.0, 0.0, 0.0, 1.0
      );

      return scaleRotate * translate * SCALE_TRANSLATE;
    }

    void main() {
      vec3 color = texture2DProj(uSampler0, texProj0).rgb * getColor(0);

      for (int i = 0; i < MAX_LAYERS; i++) {
        if (i >= uEndPortalLayers) {
          break;
        }

        float layer = float(i + 1);
        vec4 projected = texProj0 * endPortalLayer(layer);
        color += texture2DProj(uSampler1, projected).rgb * getColor(i);
      }

      color = min(color * 1.25, vec3(1.0));
      gl_FragColor = vec4(color, 0.95);
    }
  `;

  function compileShader(type, source) {
    const shader = gl.createShader(type);
    if (!shader) {
      return null;
    }

    gl.shaderSource(shader, source);
    gl.compileShader(shader);

    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
      console.error(gl.getShaderInfoLog(shader));
      gl.deleteShader(shader);
      return null;
    }

    return shader;
  }

  const vertexShader = compileShader(gl.VERTEX_SHADER, vertexSource);
  const fragmentShader = compileShader(gl.FRAGMENT_SHADER, fragmentSource);

  if (!vertexShader || !fragmentShader) {
    return;
  }

  const program = gl.createProgram();
  if (!program) {
    console.error("Failed to create WebGL program.");
    return;
  }

  gl.attachShader(program, vertexShader);
  gl.attachShader(program, fragmentShader);
  gl.linkProgram(program);

  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    console.error(gl.getProgramInfoLog(program));
    return;
  }

  gl.useProgram(program);

  const positionLocation = gl.getAttribLocation(program, "aPosition");
  const modelViewLocation = gl.getUniformLocation(program, "uModelViewMat");
  const projLocation = gl.getUniformLocation(program, "uProjMat");
  const gameTimeLocation = gl.getUniformLocation(program, "uGameTime");
  const layersLocation = gl.getUniformLocation(program, "uEndPortalLayers");
  const sampler0Location = gl.getUniformLocation(program, "uSampler0");
  const sampler1Location = gl.getUniformLocation(program, "uSampler1");

  const quadBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, quadBuffer);
  gl.bufferData(
    gl.ARRAY_BUFFER,
    new Float32Array([
      -1, -1, 0,
      1, -1, 0,
      -1, 1, 0,
      1, 1, 0
    ]),
    gl.STATIC_DRAW
  );

  gl.enableVertexAttribArray(positionLocation);
  gl.vertexAttribPointer(positionLocation, 3, gl.FLOAT, false, 0, 0);

  const identity = new Float32Array([
    1, 0, 0, 0,
    0, 1, 0, 0,
    0, 0, 1, 0,
    0, 0, 0, 1
  ]);

  gl.uniformMatrix4fv(modelViewLocation, false, identity);
  gl.uniformMatrix4fv(projLocation, false, identity);

  function createTexture(unit) {
    const texture = gl.createTexture();
    gl.activeTexture(unit);
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.REPEAT);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
    gl.texImage2D(
      gl.TEXTURE_2D,
      0,
      gl.RGBA,
      1,
      1,
      0,
      gl.RGBA,
      gl.UNSIGNED_BYTE,
      new Uint8Array([0, 0, 0, 255])
    );
    return texture;
  }

  const texture0 = createTexture(gl.TEXTURE0);
  const texture1 = createTexture(gl.TEXTURE1);

  const END_PORTAL_LAYERS = 15;
  const TIME_SCALE = 0.000002;

  gl.uniform1i(sampler0Location, 0);
  gl.uniform1i(sampler1Location, 1);
  gl.uniform1i(layersLocation, END_PORTAL_LAYERS);

  const image = new Image();
  image.src = "end_portal.png";

  let textureReady = false;

  image.addEventListener("load", function () {
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, texture0);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);

    gl.activeTexture(gl.TEXTURE1);
    gl.bindTexture(gl.TEXTURE_2D, texture1);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);

    textureReady = true;
  });

  image.addEventListener("error", function () {
    console.error("Failed to load end_portal.png");
  });

  function resize() {
    const dpr = Math.max(1, window.devicePixelRatio || 1);
    const width = Math.floor(window.innerWidth * dpr);
    const height = Math.floor(window.innerHeight * dpr);

    if (canvas.width !== width || canvas.height !== height) {
      canvas.width = width;
      canvas.height = height;
    }

    gl.viewport(0, 0, canvas.width, canvas.height);
  }

  function render(timeMs) {
    resize();

    gl.clearColor(0, 0, 0, 1);
    gl.clear(gl.COLOR_BUFFER_BIT);

    if (textureReady) {
      gl.uniform1f(gameTimeLocation, timeMs * TIME_SCALE);
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    }

    requestAnimationFrame(render);
  }

  window.addEventListener("resize", resize);
  resize();
  requestAnimationFrame(render);
})();