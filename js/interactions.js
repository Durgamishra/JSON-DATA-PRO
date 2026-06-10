/**
 * JSON DATA PRO - Post-Loader Interactive Animations
 * Handles mouse parallax, floating effects, and interactive background.
 */

class WindowInteractions {
    constructor() {
        this.codeWindow = document.querySelector('.code-window');
        this.inputArea = document.querySelector('.input-area');
        this.heroParticlesCanvas = document.getElementById('hero-particles');

        if (!this.codeWindow || !this.inputArea) return;

        this.initParallax();
        this.initFloatingEffect();
        this.initInteractiveParticles();
        this.initScrollReveal();

        window.addEventListener('mousemove', (e) => this.handleMouseMove(e));
    }

    initParallax() {
        this.mouseX = 0;
        this.mouseY = 0;
    }

    initFloatingEffect() {
        // Add floating class to trigger the CSS animation
        this.codeWindow.classList.add('floating');
    }

    handleMouseMove(e) {
        // Calculate mouse offset from center (-0.5 to 0.5)
        this.mouseX = (e.clientX / window.innerWidth) - 0.5;
        this.mouseY = (e.clientY / window.innerHeight) - 0.5;

        this.updateWindowTransform();
        this.updateParticles();
    }

    updateWindowTransform() {
        if (!this.codeWindow) return;

        // Create a subtle tilt based on mouse position
        // RotateX depends on mouseY, RotateY on mouseX
        const tiltX = this.mouseY * -10; // Max 5deg tilt
        const tiltY = this.mouseX * 10;  // Max 5deg tilt

        // We use a template literal to apply the transform
        // Note: the 'floating' animation is handled by CSS, this overrides it slightly
        this.codeWindow.style.transform = `rotateY(${tiltY}deg) rotateX(${tiltX}deg)`;
    }

    initInteractiveParticles() {
        if (!this.heroParticlesCanvas) return;

        const canvas = this.heroParticlesCanvas;
        const ctx = canvas.getContext('2d');
        let particles = [];

        const resize = () => {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
        };

        window.addEventListener('resize', resize);
        resize();

        class Particle {
            constructor() {
                this.reset();
            }

            reset() {
                this.x = Math.random() * canvas.width;
                this.y = Math.random() * canvas.height;
                this.size = Math.random() * 2 + 0.5;
                this.speedX = (Math.random() - 0.5) * 0.5;
                this.speedY = (Math.random() - 0.5) * 0.5;
                this.opacity = Math.random() * 0.5 + 0.2;
            }

            update(mX, mY) {
                this.x += this.speedX;
                this.y += this.speedY;

                // Subtle attraction to mouse
                const dx = mX - this.x;
                const dy = mY - this.y;
                const dist = Math.sqrt(dx*dx + dy*dy);
                if (dist < 200) {
                    this.x += dx * 0.001;
                    this.y += dy * 0.001;
                }

                if (this.x < 0 || this.x > canvas.width || this.y < 0 || this.y > canvas.height) {
                    this.reset();
                }
            }

            draw() {
                ctx.fillStyle = `rgba(0, 229, 255, ${this.opacity})`;
                ctx.beginPath();
                ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
                ctx.fill();
            }
        }

        for (let i = 0; i < 150; i++) {
            particles.push(new Particle());
        }

        const render = () => {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            particles.forEach(p => {
                p.update(this.mouseX * canvas.width + canvas.width/2, this.mouseY * canvas.height + canvas.height/2);
                p.draw();
            });
            requestAnimationFrame(render);
        };

        render();
    }

    updateParticles() {
        // Handled by the internal render loop in initInteractiveParticles
    }

    initScrollReveal() {
        const observerOptions = {
            threshold: 0.1,
            rootMargin: '0px 0px -50px 0px'
        };

        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('active');
                    observer.unobserve(entry.target);
                }
            });
        }, observerOptions);

        document.querySelectorAll('.reveal').forEach(el => observer.observe(el));
    }
}

// Initialize after DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    new WindowInteractions();
});
