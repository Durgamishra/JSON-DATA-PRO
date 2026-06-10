/**
 * JSON DATA PRO - Premium Loader Implementation
 * High-Fidelity 3D Visuals & Orchestration
 */

class PremiumLoader {
    constructor() {
        this.initThree();
        this.initUI();
        this.initAnimations();
        this.startLoadingSequence();
        this.animate();

        window.addEventListener('resize', () => this.onWindowResize());
        window.addEventListener('mousemove', (e) => this.onMouseMove(e));

        // Sync with real page load
        const MIN_LOADER_MS = 8000;
        const startedAt = (performance && performance.now) ? performance.now() : Date.now();

        window.addEventListener('load', () => {
            const now = (performance && performance.now) ? performance.now() : Date.now();
            const elapsed = now - startedAt;

            if (elapsed < MIN_LOADER_MS) {
                setTimeout(() => this.finish(), MIN_LOADER_MS - elapsed);
            } else {
                this.finish();
            }
        }, { once: true });

        // Safety timeout
        setTimeout(() => this.finish(), 12000);
    }

    initThree() {
        this.scene = new THREE.Scene();
        this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
        this.camera.position.z = 5;

        this.renderer = new THREE.WebGLRenderer({
            canvas: document.getElementById('webgl-canvas'),
            antialias: true,
            alpha: true
        });
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

        // 1. Holographic JSON Cube
        const cubeGroup = new THREE.Group();

        const geo = new THREE.BoxGeometry(2, 2, 2);
        const mat = new THREE.MeshBasicMaterial({
            color: 0x00E5FF,
            wireframe: true,
            transparent: true,
            opacity: 0.5
        });
        const cube = new THREE.Mesh(geo, mat);
        cubeGroup.add(cube);

        const coreGeo = new THREE.BoxGeometry(1.2, 1.2, 1.2);
        const coreMat = new THREE.MeshBasicMaterial({
            color: 0x7C3AED,
            transparent: true,
            opacity: 0.3,
            blending: THREE.AdditiveBlending
        });
        const core = new THREE.Mesh(coreGeo, coreMat);
        cubeGroup.add(core);

        const createBracket = (text, pos) => {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            canvas.width = 256; canvas.height = 256;
            ctx.fillStyle = '#00E5FF';
            ctx.font = 'Bold 120px Fira Code';
            ctx.textAlign = 'center';
            ctx.fillText(text, 128, 160);

            const texture = new THREE.CanvasTexture(canvas);
            const spriteMat = new THREE.SpriteMaterial({ map: texture, transparent: true, opacity: 0.8 });
            const sprite = new THREE.Sprite(spriteMat);
            sprite.position.set(pos.x, pos.y, pos.z);
            sprite.scale.set(1, 1, 1);
            return sprite;
        };

        cubeGroup.add(createBracket('{', {x: 1.5, y: 0.5, z: 0}));
        cubeGroup.add(createBracket('}', {x: -1.5, y: -0.5, z: 0}));

        this.cubeGroup = cubeGroup;
        this.scene.add(this.cubeGroup);

        // 2. Neural Network Background
        this.nodes = [];
        this.links = [];
        const nodeCount = 80;
        const nodeGeo = new THREE.SphereGeometry(0.03, 8, 8);
        const nodeMat = new THREE.MeshBasicMaterial({ color: 0x00E5FF });

        for (let i = 0; i < nodeCount; i++) {
            const node = new THREE.Mesh(nodeGeo, nodeMat);
            node.position.set(
                (Math.random() - 0.5) * 20,
                (Math.random() - 0.5) * 20,
                (Math.random() - 0.5) * 20
            );
            this.scene.add(node);
            this.nodes.push(node);
        }

        const lineMat = new THREE.LineBasicMaterial({ color: 0x7C3AED, transparent: true, opacity: 0.1 });
        for (let i = 0; i < nodeCount; i++) {
            for (let j = i + 1; j < nodeCount; j++) {
                const dist = this.nodes[i].position.distanceTo(this.nodes[j].position);
                if (dist < 4) {
                    const geo = new THREE.BufferGeometry().setFromPoints([
                        this.nodes[i].position,
                        this.nodes[j].position
                    ]);
                    const line = new THREE.Line(geo, lineMat);
                    this.scene.add(line);
                    this.links.push(line);
                }
            }
        }

        // 3. Particle System
        this.particlesGeo = new THREE.BufferGeometry();
        const pCount = 1000;
        const pPos = new Float32Array(pCount * 3);
        for (let i = 0; i < pCount * 3; i++) pPos[i] = (Math.random() - 0.5) * 15;
        this.particlesGeo.setAttribute('position', new THREE.BufferAttribute(pPos, 3));
        const pMat = new THREE.PointsMaterial({ color: 0x00FF88, size: 0.02, transparent: true, opacity: 0.6 });
        this.particles = new THREE.Points(this.particlesGeo, pMat);
        this.scene.add(this.particles);

        this.targetCameraPos = { x: 0, y: 0 };
        this.currentProgress = 0;
    }

    initUI() {
        this.ui = {
            panel: document.getElementById('premium-main-panel'),
            logo: document.getElementById('premium-logo-box'),
            bar: document.getElementById('premium-progress-bar'),
            pct: document.getElementById('premium-pct-text'),
            status: document.getElementById('premium-status-text'),
            pulse: document.getElementById('premium-pulse'),
            wrapper: document.getElementById('premium-loader-wrapper')
        };
    }

    initAnimations() {
        this.timeline = gsap.timeline();
    }

    async startLoadingSequence() {
        const stages = [
            { text: "Initializing Engine...", duration: 1.2, progress: 20 },
            { text: "Loading Data Structures...", duration: 1.8, progress: 45 },
            { text: "Analyzing Schema...", duration: 2.5, progress: 75 },
            { text: "Optimizing Performance...", duration: 1.5, progress: 90 },
            { text: "Finalizing Resources...", duration: 1.0, progress: 100 },
        ];

        this.timeline.to(this.ui.logo, { opacity: 1, y: 0, duration: 1, ease: "power4.out" });
        this.timeline.to(this.ui.panel, { opacity: 1, duration: 1 }, "-=0.5");

        for (const stage of stages) {
            this.timeline.to(this.ui.bar, {
                width: `${stage.progress}%`,
                duration: stage.duration,
                ease: "power2.inOut",
                onStart: () => {
                    this.ui.status.innerText = stage.text;
                }
            });

            this.timeline.to({}, {
                duration: stage.duration,
                onUpdate: function() {
                    const currentWidth = parseFloat(this.ui.bar.style.width || "0%");
                    this.currentProgress = currentWidth;
                    this.ui.pct.innerText = `${Math.round(currentWidth)}%`;
                }
            }, "=-0");
        }

        this.timeline.to(this.ui.status, { innerText: "System Ready.", duration: 0.5 });
    }

    finish() {
        if (this.isFinished) return;

        // Ensure we reach at least 100% before the flash starts
        if (this.currentProgress < 100) {
            gsap.set(this.ui.bar, { width: "100%" });
            this.ui.pct.innerText = "100%";
        }

        this.isFinished = true;

        const exitTimeline = gsap.timeline();
        exitTimeline.to(this.ui.pulse, { opacity: 1, duration: 0.1, scale: 1.5 });
        exitTimeline.to(this.ui.pulse, { opacity: 0, duration: 1, ease: "power2.out" });
        exitTimeline.to(this.ui.wrapper, { opacity: 0, duration: 0.8, ease: "power4.in" }, "-=0.8");
        exitTimeline.call(() => {
            this.ui.wrapper.remove();
            this.renderer.dispose();
        });
    }

    onMouseMove(e) {
        this.targetCameraPos.x = (e.clientX / window.innerWidth - 0.5) * 1.5;
        this.targetCameraPos.y = (e.clientY / window.innerHeight - 0.5) * 1.5;
    }

    onWindowResize() {
        this.camera.aspect = window.innerWidth / window.innerHeight;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(window.innerWidth, window.innerHeight);
    }

    animate() {
        if (this.isFinished) return;
        requestAnimationFrame(() => this.animate());

        this.cubeGroup.rotation.y += 0.005;
        this.cubeGroup.rotation.z += 0.003;
        this.particles.rotation.y += 0.001;

        const time = Date.now() * 0.001;
        this.links.forEach((line, i) => {
            line.material.opacity = 0.1 + Math.sin(time + i) * 0.05;
        });

        this.camera.position.x += (this.targetCameraPos.x - this.camera.position.x) * 0.05;
        this.camera.position.y += (-this.targetCameraPos.y - this.camera.position.y) * 0.05;
        this.camera.lookAt(0, 0, 0);

        this.renderer.render(this.scene, this.camera);
    }
}

// Initialize the loader
(function() {
    new PremiumLoader();
})();
