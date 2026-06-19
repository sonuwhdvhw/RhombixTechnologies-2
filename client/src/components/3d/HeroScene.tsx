import { useEffect, useRef } from 'react';
import * as THREE from 'three';

export default function HeroScene() {
  const mountRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;

    const W = mount.clientWidth, H = mount.clientHeight;
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(W, H);
    renderer.setClearColor(0x000000, 0);
    mount.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(60, W / H, 0.1, 1000);
    camera.position.z = 5;

    // ── Ring of particles ──────────────────────────────────
    const COUNT = 3000;
    const geo = new THREE.BufferGeometry();
    const pos = new Float32Array(COUNT * 3);
    const col = new Float32Array(COUNT * 3);
    const sz  = new Float32Array(COUNT);

    const colors = [
      new THREE.Color('#6366f1'),
      new THREE.Color('#a78bfa'),
      new THREE.Color('#ec4899'),
      new THREE.Color('#f472b6'),
      new THREE.Color('#06b6d4'),
      new THREE.Color('#38bdf8'),
      new THREE.Color('#ffffff'),
    ];

    for (let i = 0; i < COUNT; i++) {
      const theta = Math.random() * Math.PI * 2;
      const phi   = Math.acos(2 * Math.random() - 1);
      const r     = 3 + Math.random() * 6;
      pos[i*3]   = r * Math.sin(phi) * Math.cos(theta);
      pos[i*3+1] = r * Math.sin(phi) * Math.sin(theta);
      pos[i*3+2] = (Math.random() - 0.5) * 8;
      const c = colors[Math.floor(Math.random() * colors.length)];
      col[i*3] = c.r; col[i*3+1] = c.g; col[i*3+2] = c.b;
      sz[i] = Math.random() * 3 + 0.5;
    }

    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    geo.setAttribute('color',    new THREE.BufferAttribute(col, 3));
    geo.setAttribute('size',     new THREE.BufferAttribute(sz, 1));

    const mat = new THREE.ShaderMaterial({
      uniforms: { uTime: { value: 0 }, uMouse: { value: new THREE.Vector2() } },
      vertexShader: `
        attribute float size; attribute vec3 color;
        varying vec3 vCol; varying float vAlpha;
        uniform float uTime; uniform vec2 uMouse;
        void main() {
          vCol = color;
          vec3 p = position;
          p.x += sin(uTime*0.3 + position.y*0.5)*0.15 + uMouse.x*1.2;
          p.y += cos(uTime*0.25+ position.x*0.4)*0.12 + uMouse.y*0.9;
          p.z += sin(uTime*0.4 + position.z*0.3)*0.08;
          float d = length(p.xy);
          vAlpha = 1.0 - smoothstep(4.0, 12.0, d);
          vec4 mv = modelViewMatrix * vec4(p, 1.0);
          gl_PointSize = size * (320.0 / -mv.z);
          gl_Position = projectionMatrix * mv;
        }
      `,
      fragmentShader: `
        varying vec3 vCol; varying float vAlpha;
        void main() {
          vec2 uv = gl_PointCoord - 0.5;
          float d = length(uv);
          if(d > 0.5) discard;
          float core = 1.0 - smoothstep(0.0, 0.2, d);
          float glow = 1.0 - smoothstep(0.1, 0.5, d);
          gl_FragColor = vec4(vCol + core*0.4, (core*0.95 + glow*0.35)*vAlpha);
        }
      `,
      transparent: true, depthWrite: false, vertexColors: true,
    });

    const pts = new THREE.Points(geo, mat);
    scene.add(pts);

    // ── Glowing torus ───────────────────────────────────────
    const torusGeo = new THREE.TorusGeometry(2.8, 0.015, 8, 200);
    const torusMat = new THREE.MeshBasicMaterial({ color: new THREE.Color('#8b5cf6'), transparent: true, opacity: 0.4 });
    const torus = new THREE.Mesh(torusGeo, torusMat);
    torus.rotation.x = Math.PI * 0.15;
    scene.add(torus);

    const torus2Geo = new THREE.TorusGeometry(4, 0.01, 8, 200);
    const torus2Mat = new THREE.MeshBasicMaterial({ color: new THREE.Color('#ec4899'), transparent: true, opacity: 0.25 });
    const torus2 = new THREE.Mesh(torus2Geo, torus2Mat);
    torus2.rotation.x = -Math.PI * 0.25;
    torus2.rotation.y = Math.PI * 0.1;
    scene.add(torus2);

    // ── Mouse ───────────────────────────────────────────────
    const mouse = new THREE.Vector2();
    const tMouse = new THREE.Vector2();
    const onMove = (e: MouseEvent) => {
      tMouse.x = (e.clientX / window.innerWidth  - 0.5) * 0.2;
      tMouse.y = -(e.clientY / window.innerHeight - 0.5) * 0.15;
    };
    window.addEventListener('mousemove', onMove);

    const onResize = () => {
      const w = mount.clientWidth, h = mount.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener('resize', onResize);

    let t = 0, raf = 0;
    const tick = () => {
      raf = requestAnimationFrame(tick);
      t += 0.006;
      mouse.lerp(tMouse, 0.05);
      mat.uniforms.uTime.value  = t;
      mat.uniforms.uMouse.value = mouse;
      pts.rotation.y = t * 0.04;
      pts.rotation.x = Math.sin(t * 0.03) * 0.08;
      torus.rotation.z  = t * 0.08;
      torus2.rotation.z = -t * 0.05;
      (torus2Mat as THREE.MeshBasicMaterial).opacity = 0.15 + Math.sin(t * 0.6) * 0.1;
      renderer.render(scene, camera);
    };
    tick();

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('resize', onResize);
      geo.dispose(); mat.dispose(); torusGeo.dispose(); torus2Geo.dispose();
      renderer.dispose();
      if (mount.contains(renderer.domElement)) mount.removeChild(renderer.domElement);
    };
  }, []);

  return <div ref={mountRef} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }} />;
}
