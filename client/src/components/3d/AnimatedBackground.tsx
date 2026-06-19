import { useEffect, useRef } from 'react';
import * as THREE from 'three';

export default function AnimatedBackground() {
  const mountRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;

    // ── Renderer ──────────────────────────────────────────
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setClearColor(0x000000, 0);
    mount.appendChild(renderer.domElement);

    // ── Scene / Camera ────────────────────────────────────
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.z = 5;

    // ── Particles ─────────────────────────────────────────
    const COUNT = 1200;
    const geo = new THREE.BufferGeometry();
    const positions = new Float32Array(COUNT * 3);
    const colors = new Float32Array(COUNT * 3);
    const sizes = new Float32Array(COUNT);

    const palette = [
      new THREE.Color('#6366f1'),
      new THREE.Color('#8b5cf6'),
      new THREE.Color('#a78bfa'),
      new THREE.Color('#ec4899'),
      new THREE.Color('#06b6d4'),
      new THREE.Color('#ffffff'),
    ];

    for (let i = 0; i < COUNT; i++) {
      positions[i * 3]     = (Math.random() - 0.5) * 20;
      positions[i * 3 + 1] = (Math.random() - 0.5) * 20;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 12;

      const c = palette[Math.floor(Math.random() * palette.length)];
      colors[i * 3]     = c.r;
      colors[i * 3 + 1] = c.g;
      colors[i * 3 + 2] = c.b;

      sizes[i] = Math.random() * 2.5 + 0.5;
    }

    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geo.setAttribute('color',    new THREE.BufferAttribute(colors, 3));
    geo.setAttribute('size',     new THREE.BufferAttribute(sizes, 1));

    const mat = new THREE.ShaderMaterial({
      uniforms: {
        uTime:  { value: 0 },
        uMouse: { value: new THREE.Vector2(0, 0) },
      },
      vertexShader: `
        attribute float size;
        attribute vec3 color;
        varying vec3 vColor;
        varying float vAlpha;
        uniform float uTime;
        uniform vec2  uMouse;

        void main() {
          vColor = color;
          vec3 pos = position;

          // Gentle wave
          pos.x += sin(uTime * 0.25 + position.y * 0.4) * 0.08;
          pos.y += cos(uTime * 0.2  + position.x * 0.3) * 0.07;
          pos.z += sin(uTime * 0.3  + position.z * 0.5) * 0.05;

          // Mouse parallax
          pos.x += uMouse.x * 0.8;
          pos.y += uMouse.y * 0.6;

          float dist = length(pos.xy);
          vAlpha = 1.0 - smoothstep(6.0, 14.0, dist);

          vec4 mv = modelViewMatrix * vec4(pos, 1.0);
          gl_PointSize = size * (280.0 / -mv.z);
          gl_Position  = projectionMatrix * mv;
        }
      `,
      fragmentShader: `
        varying vec3  vColor;
        varying float vAlpha;

        void main() {
          vec2  uv   = gl_PointCoord - 0.5;
          float dist = length(uv);
          if (dist > 0.5) discard;

          float core  = 1.0 - smoothstep(0.0, 0.25, dist);
          float glow  = 1.0 - smoothstep(0.2, 0.5, dist);
          float alpha = (core * 0.9 + glow * 0.4) * vAlpha;

          gl_FragColor = vec4(vColor + core * 0.3, alpha);
        }
      `,
      transparent: true,
      depthWrite: false,
      vertexColors: true,
    });

    const particles = new THREE.Points(geo, mat);
    scene.add(particles);

    // ── Floating orbs ─────────────────────────────────────
    const orbGeometry = new THREE.SphereGeometry(1, 32, 32);
    const orbs: THREE.Mesh[] = [];
    const orbData = [
      { color: '#6366f1', pos: [-4, 2, -3], size: 1.2 },
      { color: '#ec4899', pos: [4, -2, -4], size: 0.9 },
      { color: '#06b6d4', pos: [2, 3, -5],  size: 0.7 },
    ];

    orbData.forEach(d => {
      const orbMat = new THREE.MeshBasicMaterial({
        color: new THREE.Color(d.color),
        transparent: true,
        opacity: 0.06,
      });
      const orb = new THREE.Mesh(orbGeometry, orbMat);
      orb.position.set(d.pos[0], d.pos[1], d.pos[2]);
      orb.scale.setScalar(d.size);
      scene.add(orb);
      orbs.push(orb);
    });

    // ── Mouse ─────────────────────────────────────────────
    const mouse    = new THREE.Vector2();
    const tMouse   = new THREE.Vector2();
    const onMove   = (e: MouseEvent) => {
      tMouse.x = (e.clientX / window.innerWidth  - 0.5) * 0.15;
      tMouse.y = -(e.clientY / window.innerHeight - 0.5) * 0.15;
    };
    window.addEventListener('mousemove', onMove);

    // ── Resize ────────────────────────────────────────────
    const onResize = () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    };
    window.addEventListener('resize', onResize);

    // ── Loop ──────────────────────────────────────────────
    let t = 0;
    let raf = 0;
    const tick = () => {
      raf = requestAnimationFrame(tick);
      t += 0.008;

      mouse.lerp(tMouse, 0.04);
      mat.uniforms.uTime.value  = t;
      mat.uniforms.uMouse.value = mouse;

      particles.rotation.y = t * 0.015;
      particles.rotation.x = Math.sin(t * 0.008) * 0.06;

      orbs.forEach((orb, i) => {
        orb.position.y = orbData[i].pos[1] + Math.sin(t * 0.4 + i) * 0.5;
        orb.position.x = orbData[i].pos[0] + Math.cos(t * 0.3 + i) * 0.3;
        (orb.material as THREE.MeshBasicMaterial).opacity =
          0.04 + Math.sin(t * 0.5 + i) * 0.02;
      });

      renderer.render(scene, camera);
    };
    tick();

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('resize', onResize);
      geo.dispose();
      mat.dispose();
      renderer.dispose();
      mount.removeChild(renderer.domElement);
    };
  }, []);

  return (
    <div
      ref={mountRef}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 0,
        pointerEvents: 'none',
      }}
    />
  );
}
