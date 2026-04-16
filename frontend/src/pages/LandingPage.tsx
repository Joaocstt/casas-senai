import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import Particles, { initParticlesEngine } from "@tsparticles/react";
import { loadSlim } from "@tsparticles/slim";
import './LandingPage.css';

gsap.registerPlugin(ScrollTrigger);

const LandingPage: React.FC = () => {
    const cursorOuterRef = useRef<HTMLDivElement>(null);
    const cursorInnerRef = useRef<HTMLDivElement>(null);
    const orbCanvasRef = useRef<HTMLCanvasElement>(null);
    const abismoCanvasRef = useRef<HTMLCanvasElement>(null);
    const [init, setInit] = React.useState(false);
    const [openFaq, setOpenFaq] = React.useState<number | null>(null);

    useEffect(() => {
        initParticlesEngine(async (engine) => {
            await loadSlim(engine);
        }).then(() => {
            setInit(true);
        }).catch((error) => {
            console.error('Falha ao iniciar particulas da landing page:', error);
        });
    }, []);

    useEffect(() => {
        let orbRenderer: THREE.WebGLRenderer | null = null;
        let abismoRenderer: THREE.WebGLRenderer | null = null;
        let revealObs: IntersectionObserver | null = null;
        let orbAnimationFrameId = 0;
        let abismoAnimationFrameId = 0;
        const tiltHandlers = new Map<HTMLElement, { move: (e: MouseEvent) => void; leave: () => void }>();

        // --- CUSTOM CURSOR ---
        const moveCursor = (e: MouseEvent) => {
            if (cursorOuterRef.current && cursorInnerRef.current) {
                gsap.to(cursorOuterRef.current, { x: e.clientX, y: e.clientY, duration: 0.12 });
                gsap.set(cursorInnerRef.current, { x: e.clientX, y: e.clientY });
            }
        };
        window.addEventListener('mousemove', moveCursor);

        // --- NAVBAR SCROLL ---
        const handleScroll = () => {
            const nav = document.getElementById('navbar');
            if (nav) {
                if (window.scrollY > 50) nav.classList.add('scrolled');
                else nav.classList.remove('scrolled');
            }

            const vid = document.getElementById('heroBgVideo') as HTMLVideoElement;
            if (vid) {
                const progress = Math.min(window.scrollY / window.innerHeight, 1);
                vid.style.opacity = (0.4 - progress * 0.4).toString();
            }
        };
        window.addEventListener('scroll', handleScroll);

        const onMove = (e: MouseEvent) => {
            mouseY = (e.clientY / window.innerHeight - 0.5) * 2;
        };
        const onResize = () => {
            if (!abismoRenderer) {
                return;
            }
            abismoRenderer.setSize(window.innerWidth, window.innerHeight);
        };
        const handleTilt = (e: MouseEvent, card: HTMLElement) => {
            const r = card.getBoundingClientRect();
            const cx = r.left + r.width / 2;
            const cy = r.top + r.height / 2;
            const dx = (e.clientX - cx) / (r.width / 2);
            const dy = (e.clientY - cy) / (r.height / 2);
            card.style.transform = `perspective(800px) rotateX(${dy * -10}deg) rotateY(${dx * 10}deg) translateY(-6px)`;
            card.style.transition = 'transform 0.05s linear';
        };
        const resetTilt = (card: HTMLElement) => {
            card.style.transform = 'perspective(800px) rotateX(0) rotateY(0)';
            card.style.transition = 'transform 0.5s ease';
        };
        let mouseY = 0;

        try {
            // --- THREE.JS ORB ---
            if (orbCanvasRef.current) {
                const canvas = orbCanvasRef.current;
                const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });
                orbRenderer = renderer;
                renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
                renderer.setSize(340, 340);
                const scene = new THREE.Scene();
                const camera = new THREE.PerspectiveCamera(60, 1, 0.1, 100);
                camera.position.z = 4;

                const orb = new THREE.Mesh(
                    new THREE.SphereGeometry(1.2, 64, 64),
                    new THREE.MeshPhongMaterial({
                        color: 0x0a0520,
                        emissive: 0x1a0060,
                        emissiveIntensity: 0.4,
                        specular: 0xC8A44D,
                        shininess: 100,
                        transparent: true,
                        opacity: 0.85
                    })
                );
                scene.add(orb);

                const wire = new THREE.Mesh(
                    new THREE.SphereGeometry(1.25, 18, 18),
                    new THREE.MeshBasicMaterial({ color: 0xC8A44D, wireframe: true, transparent: true, opacity: 0.12 })
                );
                scene.add(wire);

                const r1 = new THREE.Mesh(
                    new THREE.TorusGeometry(1.65, 0.012, 8, 80),
                    new THREE.MeshBasicMaterial({ color: 0xC8A44D, transparent: true, opacity: 0.45 })
                );
                r1.rotation.x = Math.PI / 2;
                scene.add(r1);

                const r2 = r1.clone();
                r2.rotation.x = Math.PI / 3;
                r2.rotation.y = Math.PI / 4;
                scene.add(r2);

                const pn = 280;
                const pg = new THREE.BufferGeometry();
                const pp = new Float32Array(pn * 3);
                for (let i = 0; i < pn; i++) {
                    const th = Math.random() * Math.PI * 2;
                    const ph = Math.acos(2 * Math.random() - 1);
                    const r = 1.5 + Math.random() * 1.2;
                    pp[i * 3] = r * Math.sin(ph) * Math.cos(th);
                    pp[i * 3 + 1] = r * Math.sin(ph) * Math.sin(th);
                    pp[i * 3 + 2] = r * Math.cos(ph);
                }
                pg.setAttribute('position', new THREE.BufferAttribute(pp, 3));
                scene.add(new THREE.Points(pg, new THREE.PointsMaterial({ color: 0xC8A44D, size: 0.03, transparent: true, opacity: 0.7 })));

                scene.add(new THREE.AmbientLight(0x220044, 2));
                const gl = new THREE.PointLight(0xC8A44D, 3, 8);
                gl.position.set(2, 2, 2);
                scene.add(gl);
                const bl = new THREE.PointLight(0x3040ff, 2, 8);
                bl.position.set(-2, -2, 1);
                scene.add(bl);
                window.addEventListener('mousemove', onMove);

                let t = 0;
                const anim = () => {
                    t += 0.01;
                    orb.rotation.y += 0.005;
                    orb.rotation.x = mouseY * 0.3;
                    wire.rotation.y += 0.008;
                    wire.rotation.z += 0.003;
                    r1.rotation.z += 0.006;
                    r2.rotation.y += 0.009;
                    gl.intensity = 2.5 + Math.sin(t * 1.5) * 1.2;
                    bl.intensity = 1.5 + Math.cos(t * 0.8) * 0.8;
                    orb.position.y = Math.sin(t * 0.6) * 0.06;
                    renderer.render(scene, camera);
                    orbAnimationFrameId = requestAnimationFrame(anim);
                };
                anim();
            }

            // --- THREE.JS ABISMO ---
            if (abismoCanvasRef.current) {
                const canvas = abismoCanvasRef.current;
                const w = window.innerWidth;
                const h = window.innerHeight;
                const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });
                abismoRenderer = renderer;
                renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
                renderer.setSize(w, h);
                const scene = new THREE.Scene();
                const camera = new THREE.PerspectiveCamera(75, w / h, 0.1, 200);
                camera.position.z = 40;

                const ec = 600;
                const eg = new THREE.BufferGeometry();
                const ep = new Float32Array(ec * 3);
                const ecol = new Float32Array(ec * 3);
                const ev = new Float32Array(ec * 3);
                for (let i = 0; i < ec; i++) {
                    const i3 = i * 3;
                    const t = Math.random();
                    ep[i3] = (Math.random() - 0.5) * 80;
                    ep[i3 + 1] = (Math.random() - 0.5) * 60 - 10;
                    ep[i3 + 2] = (Math.random() - 0.5) * 30;
                    ev[i3] = (Math.random() - 0.5) * 0.05;
                    ev[i3 + 1] = Math.random() * 0.12 + 0.03;
                    ev[i3 + 2] = (Math.random() - 0.5) * 0.04;
                    ecol[i3] = 1;
                    ecol[i3 + 1] = t * 0.4;
                    ecol[i3 + 2] = 0;
                }
                eg.setAttribute('position', new THREE.BufferAttribute(ep, 3));
                eg.setAttribute('color', new THREE.BufferAttribute(ecol, 3));
                const embers = new THREE.Points(eg, new THREE.PointsMaterial({ size: 0.5, vertexColors: true, transparent: true, opacity: 0.75 }));
                scene.add(embers);

                const anim = () => {
                    const a = embers.geometry.attributes.position.array as Float32Array;
                    for (let i = 0; i < ec; i++) {
                        const i3 = i * 3;
                        a[i3] += ev[i3];
                        a[i3 + 1] += ev[i3 + 1];
                        a[i3 + 2] += ev[i3 + 2];
                        if (a[i3 + 1] > 35) {
                            a[i3] = (Math.random() - 0.5) * 80;
                            a[i3 + 1] = -30;
                            a[i3 + 2] = (Math.random() - 0.5) * 30;
                        }
                    }
                    embers.geometry.attributes.position.needsUpdate = true;
                    renderer.render(scene, camera);
                    abismoAnimationFrameId = requestAnimationFrame(anim);
                };
                anim();
                window.addEventListener('resize', onResize);
            }
        } catch (error) {
            console.error('Falha ao iniciar efeitos 3D da landing page:', error);
            orbRenderer?.dispose();
            abismoRenderer?.dispose();
            orbRenderer = null;
            abismoRenderer = null;
        }

        // --- INTERSECTION OBSERVERS ---
        revealObs = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('visible');
                    if (entry.target.classList.contains('tabela-row')) {
                        const sev = (entry.target as HTMLElement).dataset.severity;
                        const w = { leve: '20%', media: '50%', grave: '100%' }[sev || ''] || '0%';
                        entry.target.querySelectorAll('.severity-fill').forEach(f => {
                            (f as HTMLElement).style.width = w;
                        });
                    }
                }
            });
        }, { threshold: 0.12 });

        document.querySelectorAll('.conceito-inner, .casas-header, .pontos-header, .penalidades-inner, .abismo-content, .final-inner, .tabela-row').forEach(el => {
            el.classList.add('reveal');
            revealObs?.observe(el);
        });

        // --- GSAP ANIMATIONS ---
        gsap.from('.casa-card', {
            opacity: 0, y: 50, scale: 0.96, stagger: 0.12, duration: 0.8, ease: 'power3.out',
            scrollTrigger: { trigger: '.casas-grid', start: 'top 85%', once: true }
        });

        gsap.from('.ponto-card', {
            opacity: 0, x: -20, stagger: 0.08, duration: 0.6, ease: 'power2.out',
            scrollTrigger: { trigger: '.pontos-grid', start: 'top 85%', once: true }
        });

        // --- TILT EFFECT ---
        document.querySelectorAll('[data-tilt]').forEach(el => {
            const card = el as HTMLElement;
            const move = (e: MouseEvent) => handleTilt(e, card);
            const leave = () => resetTilt(card);
            tiltHandlers.set(card, { move, leave });
            card.addEventListener('mousemove', move);
            card.addEventListener('mouseleave', leave);
        });

        // --- ABISMO RED PARTICLES ---
        const abismoParticlesContainer = document.getElementById('abismoParticles');
        if (abismoParticlesContainer) {
            const colors = ['rgba(255,40,40,.9)', 'rgba(255,100,0,.8)', 'rgba(200,20,20,.7)', 'rgba(255,60,30,.6)'];
            for (let i = 0; i < 40; i++) {
                const p = document.createElement('div');
                p.classList.add('abismo-particle');
                const s = Math.random() * 4 + 1;
                const l = Math.random() * 100;
                const d = Math.random() * 10;
                const dur = Math.random() * 8 + 5;
                const color = colors[Math.floor(Math.random() * colors.length)];
                p.style.cssText = `width:${s}px;height:${s}px;left:${l}%;bottom:0;background:${color};box-shadow:0 0 ${s * 4}px ${color};animation-duration:${dur}s;animation-delay:-${d}s;`;
                abismoParticlesContainer.appendChild(p);
            }
        }

        // --- FINAL STARS ---
        const finalStarsContainer = document.getElementById('finalStars');
        if (finalStarsContainer) {
            for (let i = 0; i < 100; i++) {
                const s = document.createElement('div');
                s.classList.add('final-star');
                const sz = Math.random() * 2 + .5;
                const l = Math.random() * 100;
                const t = Math.random() * 100;
                const dur = Math.random() * 4 + 2;
                const d = Math.random() * 4;
                s.style.cssText = `width:${sz}px;height:${sz}px;left:${l}%;top:${t}%;animation-duration:${dur}s;animation-delay:${d}s;`;
                finalStarsContainer.appendChild(s);
            }
        }

        // --- CLEANUP ---
        return () => {
            window.removeEventListener('mousemove', moveCursor);
            window.removeEventListener('scroll', handleScroll);
            window.removeEventListener('mousemove', onMove);
            window.removeEventListener('resize', onResize);
            if (orbAnimationFrameId) cancelAnimationFrame(orbAnimationFrameId);
            if (abismoAnimationFrameId) cancelAnimationFrame(abismoAnimationFrameId);
            orbRenderer?.dispose();
            abismoRenderer?.dispose();
            revealObs?.disconnect();
            tiltHandlers.forEach((handlers, card) => {
                card.removeEventListener('mousemove', handlers.move);
                card.removeEventListener('mouseleave', handlers.leave);
            });
            ScrollTrigger.getAll().forEach((trigger) => trigger.kill());
            if (abismoParticlesContainer) abismoParticlesContainer.innerHTML = '';
            if (finalStarsContainer) finalStarsContainer.innerHTML = '';
        };
    }, []);

    const handleSmoothScroll = (e: React.MouseEvent<HTMLAnchorElement>, id: string) => {
        e.preventDefault();
        const el = document.getElementById(id);
        if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    };

    return (
        <div className="landing-page-container">
            <div className="cursor-outer" ref={cursorOuterRef}></div>
            <div className="cursor-inner" ref={cursorInnerRef}></div>

            <nav className="navbar" id="navbar">
                <div className="nav-logo"><span>⚔</span><span>ARCANUM SENAI</span></div>
                <div className="nav-links">
                    <a href="#conceito" onClick={(e) => handleSmoothScroll(e, 'conceito')}>Conceito</a>
                    <a href="#casas" onClick={(e) => handleSmoothScroll(e, 'casas')}>Casas</a>
                    <a href="#pontos" onClick={(e) => handleSmoothScroll(e, 'pontos')}>Pontos</a>
                    <a href="#abismo" onClick={(e) => handleSmoothScroll(e, 'abismo')}>Abismo</a>
                    <a href="/pontuacao" style={{ color: 'var(--gold)', fontWeight: 'bold' }}>Rankings</a>
                </div>
            </nav>

            {/* HERO */}
            <section className="hero" id="hero">
                <video id="heroBgVideo" autoPlay muted loop playsInline
                    style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', zIndex: 0, opacity: 0.4, pointerEvents: 'none' }}>
                    <source src="/images/Vídeo_Animado_de_Bandeiras.mp4" type="video/mp4" />
                </video>

                <div className="fog fog-1"></div>
                <div className="fog fog-2"></div>
                <div className="fog fog-3"></div>
                <div className="hero-overlay"></div>

                <div className="hero-content">
                    <div className="hero-badge" style={{ opacity: 1, transform: 'none' }}>Inovação & Excelência</div>
                    <h1 className="hero-title" style={{ opacity: 1, transform: 'none' }}>
                        <span className="title-line-1">As Casas do Mérito</span>
                        <span className="title-line-2">SENAI <em>ARCANUM</em></span>
                    </h1>
                    <p className="hero-subtitle" style={{ opacity: 1, transform: 'none' }}>
                        Onde a tecnologia encontra a tradição. Um sistema gamificado de excelência
                        para os aprendizes que moldarão o futuro da indústria.
                    </p>
                    <div className="hero-cta" style={{ opacity: 1, transform: 'none' }}>
                        <a href="/login" className="btn-primary">
                            <span className="btn-glow"></span>
                            <span className="btn-text">Entrar no Portal</span>
                        </a>
                        <a href="#casas" onClick={(e) => handleSmoothScroll(e, 'casas')} className="btn-secondary">Conhecer as Casas</a>
                    </div>
                    <div className="rune-row">
                        <span>᚛</span><span> </span><span>ᚑ</span><span> </span><span>ᚕ</span><span> </span><span>ᚗ</span><span> </span><span>ᚚ</span>
                    </div>
                </div>

                <div className="scroll-indicator" id="heroScrollHint">
                    <div className="scroll-line"></div>
                    <span>Descubra</span>
                </div>
            </section>

            {/* CONCEITO */}
            <section className="conceito" id="conceito">
                <div className="conceito-inner">
                    <div className="orb-container">
                        <canvas id="orbCanvas" ref={orbCanvasRef}></canvas>
                        <div className="orb-glow"></div>
                    </div>
                    <div className="conceito-text">
                        <span className="section-label">A Ordem</span>
                        <h2 className="section-title">A Força da <em>Colaboração</em></h2>
                        <span className="divider-rune">ᚔ</span>
                        <p className="conceito-desc">
                            O Arcanum não é apenas uma competição; é um <strong>ecossistema de honra</strong>.
                            Aqui, cada ação reflete o compromisso com a <em>técnica, o respeito e a inovação</em>.
                        </p>
                        <p className="conceito-desc">
                            Os aprendizes são divididos em quatro casas ancestrais, cada uma representando um
                            pilar fundamental da indústria moderna e do caráter profissional.
                        </p>
                        <div className="conceito-stats">
                            <div className="stat-item">
                                <span className="stat-num" data-target="4">4</span>
                                <span className="stat-label">Casas</span>
                            </div>
                            <span className="stat-divider">/</span>
                            <div className="stat-item">
                                <span className="stat-num" data-target="100">100</span>
                                <span className="stat-label">Honra</span>
                            </div>
                            <span className="stat-divider">/</span>
                            <div className="stat-item">
                                <span className="stat-num" data-target="1">1</span>
                                <span className="stat-label">Objetivo</span>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* CASAS */}
            <section className="casas" id="casas">
                <div className="casas-header">
                    <span className="section-label">Linhagens</span>
                    <h2>As Quatro <em>Grandes Casas</em></h2>
                    <p>Diferentes em essência, unidas pelo propósito de transformar a indústria.</p>
                </div>

                <div className="casas-grid">
                    {/* LEAO */}
                    <div className="casa-card" data-house="leao" data-tilt>
                        <div className="card-bg"></div>
                        <div className="card-shimmer"></div>
                        <div className="card-glow-effect"></div>
                        <div className="card-inner">
                            <div className="card-header">
                                <div className="brasao">
                                    <div className="brasao-inner">
                                        <img src="/images/leao_mascot.png" alt="Leão" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }} />
                                    </div>
                                    <div className="brasao-ring"></div>
                                </div>
                                <div>
                                    <span className="card-label">Casa da</span>
                                    <h3 className="card-name">Coragem</h3>
                                </div>
                            </div>
                            <div className="card-divider"></div>
                            <div className="card-traits">
                                <span>Liderança</span><span>Fibra</span><span>Resiliência</span>
                            </div>
                            <p className="card-desc">
                                Representada pelo Leão, foca no desenvolvimento de líderes. Aprendizes que
                                não temem desafios complexos e mantêm a postura diante da adversidade.
                            </p>
                            <div className="card-quote">"A força da técnica reside na audácia do agir."</div>
                            <div className="card-colors">
                                <span className="color-swatch" style={{ background: '#7A0F0F' }}></span>
                                <span className="color-name">Vermelho & Ouro</span>
                            </div>
                        </div>
                    </div>

                    {/* CORVO */}
                    <div className="casa-card" data-house="corvo" data-tilt>
                        <div className="card-bg"></div>
                        <div className="card-shimmer"></div>
                        <div className="card-glow-effect"></div>
                        <div className="card-inner">
                            <div className="card-header">
                                <div className="brasao">
                                    <div className="brasao-inner">
                                        <img src="/images/corvo_mascot.png" alt="Corvo" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }} />
                                    </div>
                                    <div className="brasao-ring"></div>
                                </div>
                                <div>
                                    <span className="card-label">Casa da</span>
                                    <h3 className="card-name">Sabedoria</h3>
                                </div>
                            </div>
                            <div className="card-divider"></div>
                            <div className="card-traits">
                                <span>Análise</span><span>Lógica</span><span>Estratégia</span>
                            </div>
                            <p className="card-desc">
                                Sob a égide do Corvo, valoriza o intelecto e a precisão. Ideal para quem
                                busca a perfeição técnica através do estudo constante e raciocínio aguçado.
                            </p>
                            <div className="card-quote">"O conhecimento é a ferramenta mais afiada."</div>
                            <div className="card-colors">
                                <span className="color-swatch" style={{ background: '#1E3A8A' }}></span>
                                <span className="color-name">Azul & Prata</span>
                            </div>
                        </div>
                    </div>

                    {/* LOBO */}
                    <div className="casa-card" data-house="lobo" data-tilt>
                        <div className="card-bg"></div>
                        <div className="card-shimmer"></div>
                        <div className="card-glow-effect"></div>
                        <div className="card-inner">
                            <div className="card-header">
                                <div className="brasao">
                                    <div className="brasao-inner">
                                        <img src="/images/lobo_mascot.png" alt="Lobo" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }} />
                                    </div>
                                    <div className="brasao-ring"></div>
                                </div>
                                <div>
                                    <span className="card-label">Casa da</span>
                                    <h3 className="card-name">Lealdade</h3>
                                </div>
                            </div>
                            <div className="card-divider"></div>
                            <div className="card-traits">
                                <span>União</span><span>Ética</span><span>Suporte</span>
                            </div>
                            <p className="card-desc">
                                O Lobo simboliza a força do coletivo. Esta casa prioriza o trabalho em
                                equipe, a ética profissional e o suporte mútuo entre os pares.
                            </p>
                            <div className="card-quote">"Pela força da alcateia, vencemos a montanha."</div>
                            <div className="card-colors">
                                <span className="color-swatch" style={{ background: '#C8A44D' }}></span>
                                <span className="color-name">Âmbar & Bronze</span>
                            </div>
                        </div>
                    </div>

                    {/* DRAGAO */}
                    <div className="casa-card" data-house="dragao" data-tilt>
                        <div className="card-bg"></div>
                        <div className="card-shimmer"></div>
                        <div className="card-glow-effect"></div>
                        <div className="card-inner">
                            <div className="card-header">
                                <div className="brasao">
                                    <div className="brasao-inner">
                                        <img src="/images/dragao_mascot.png" alt="Dragão" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }} />
                                    </div>
                                    <div className="brasao-ring"></div>
                                </div>
                                <div>
                                    <span className="card-label">Casa da</span>
                                    <h3 className="card-name">Ambição</h3>
                                </div>
                            </div>
                            <div className="card-divider"></div>
                            <div className="card-traits">
                                <span>Visão</span><span>Domínio</span><span>Foco</span>
                            </div>
                            <p className="card-desc">
                                O Dragão representa a busca pelo topo. Aprendizes focados em resultados,
                                superação de metas e domínio absoluto de suas especialidades.
                            </p>
                            <div className="card-quote">"Onde há fogo, há a forja do sucesso."</div>
                            <div className="card-colors">
                                <span className="color-swatch" style={{ background: '#064e3b' }}></span>
                                <span className="color-name">Esmeralda & Ferro</span>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* PONTOS */}
            <section className="pontos" id="pontos">
                <div className="pontos-bg-pattern"></div>
                <div className="pontos-header">
                    <span className="section-label">Mérito</span>
                    <h2 className="section-title">A Senda da <em>Honra</em></h2>
                    <p>Conquiste gemas para sua casa através da excelência diária.</p>
                </div>

                <div className="pontos-grid">
                    <div className="ponto-card featured">
                        <div className="ponto-aura aura-gold"></div>
                        <div className="ponto-icon">✨</div>
                        <div className="ponto-info">
                            <h4>Postura Exemplar</h4>
                            <p>Uniforme impecável, pontualidade e conduta ética no ambiente.</p>
                        </div>
                        <div className="ponto-valor">+50</div>
                    </div>

                    <div className="ponto-card">
                        <div className="ponto-aura aura-blue"></div>
                        <div className="ponto-icon">🧠</div>
                        <div className="ponto-info">
                            <h4>Destaque Técnico</h4>
                            <p>Superar as metas de aprendizagem e propor soluções inovadoras.</p>
                        </div>
                        <div className="ponto-valor">+30</div>
                    </div>

                    <div className="ponto-card">
                        <div className="ponto-aura aura-green"></div>
                        <div className="ponto-icon">🤝</div>
                        <div className="ponto-info">
                            <h4>Trabalho em Equipe</h4>
                            <p>Auxiliar colegas e promover um ambiente de cooperação.</p>
                        </div>
                        <div className="ponto-valor">+20</div>
                    </div>

                    <div className="ponto-card">
                        <div className="ponto-aura aura-purple"></div>
                        <div className="ponto-icon">🛠</div>
                        <div className="ponto-info">
                            <h4>Zelo pelo Espaço</h4>
                            <p>Organização e cuidado extremo com ferramentas e laboratórios.</p>
                        </div>
                        <div className="ponto-valor">+15</div>
                    </div>
                </div>
            </section>

            {/* PENALIDADES */}
            <section className="penalidades" id="penalidades">
                <div className="penalidades-inner">
                    <span className="section-label" style={{ color: '#e87878' }}>Cuidado</span>
                    <h2 className="section-title">O Código de <em>Conduta</em></h2>
                    <p>Falhas na senda podem custar caro ao prestígio de sua linhagem.</p>

                    <div className="tabela-medieval">
                        <div className="tabela-header">
                            <div className="th">Infração</div>
                            <div className="th">Gravidade</div>
                            <div className="th">Pontos</div>
                            <div className="th">Ação</div>
                        </div>

                        <div className="tabela-row" data-severity="leve">
                            <div className="td td-name">Uso de Celular Indevido</div>
                            <div className="td">
                                <div className="severity-bar"><div className="severity-fill"></div></div>
                            </div>
                            <div className="td td-pts pts-neg">-20</div>
                            <div className="td">Advertência</div>
                        </div>

                        <div className="tabela-row" data-severity="media">
                            <div className="td td-name">Desrespeito com Pares</div>
                            <div className="td">
                                <div className="severity-bar"><div className="severity-fill"></div></div>
                            </div>
                            <div className="td td-pts pts-neg">-50</div>
                            <div className="td">Suspensão</div>
                        </div>

                        <div className="tabela-row" data-severity="grave">
                            <div className="td td-name">Dano ao Patrimônio</div>
                            <div className="td">
                                <div className="severity-bar"><div className="severity-fill"></div></div>
                            </div>
                            <div className="td td-pts pts-neg">-100</div>
                            <div className="td">Conselho</div>
                        </div>
                    </div>

                    <div className="penalidade-nota">
                        <p><strong>Nota:</strong> Reincidências multiplicam o peso das penalidades e podem levar ao Abismo.</p>
                    </div>
                </div>
            </section>

            {/* ABISMO */}
            <section className="abismo" id="abismo">
                <canvas id="abismoCanvas" ref={abismoCanvasRef}></canvas>
                <div className="abismo-fog"></div>
                <div className="abismo-particles" id="abismoParticles"></div>

                <div className="abismo-content">
                    <span className="abismo-symbol">👁</span>
                    <span className="section-label abismo-label">O Vazio</span>
                    <h2 className="abismo-title">O Reino do <em>Abismo</em></h2>
                    <div className="abismo-divider"> ᚑ </div>
                    <p className="abismo-desc">
                        Aqueles que ignoram o código e acumulam desonra enfrentam o isolamento.
                        O Abismo é para os que perderam o norte, mas ainda buscam a <strong>redenção</strong>.
                    </p>

                    <div className="abismo-regra">
                        <div className="abismo-regra-inner">
                            <span className="regra-icon">⚡</span>
                            <div className="regra-texto">
                                <strong>Limite Crítico</strong>
                                Abaixo de <em className="pts-threshold">-500 pts</em>, a casa entra em quarentena.
                            </div>
                        </div>
                    </div>

                    <p className="abismo-hope" style={{ fontStyle: 'italic', fontSize: '0.9rem', opacity: 0.8 }}>
                        "Mesmo no fogo mais profundo, a técnica pode forjar uma nova chance."
                    </p>
                </div>
            </section>

            {/* FAQ */}
            <section className="faq" id="faq">
                {init && (
                    <Particles
                        id="faqParticles"
                        options={{
                            fpsLimit: 60,
                            particles: {
                                color: { value: "#C8A44D" },
                                move: { enable: true, speed: 0.6, direction: "top", outModes: { default: "out" } },
                                number: { density: { enable: true, area: 800 }, value: 40 },
                                opacity: { value: { min: 0.1, max: 0.3 } },
                                shape: { type: "circle" },
                                size: { value: { min: 1, max: 3 } },
                            },
                        }}
                        style={{ position: 'absolute', inset: 0, zIndex: 0 }}
                    />
                )}
                <div className="faq-inner">
                    <div className="faq-header">
                        <span className="section-label">Dúvidas</span>
                        <h2 className="section-title">Perguntas <em>Frequentes</em></h2>
                        <span className="divider-rune">ᚔ</span>
                    </div>

                    <div className="faq-list">
                        {[
                            {
                                q: "O que é o sistema Arcanum?",
                                a: "O Arcanum é um sistema de meritocracia gamificada do SENAI, onde aprendizes competem através de casas para alcançar a excelência técnica e comportamental."
                            },
                            {
                                q: "Como as pontuações são calculadas?",
                                a: "As pontuações são atribuídas por mestres e instrutores com base em critérios técnicos (projetos, notas) e comportamentais (postura, zelo, colaboração)."
                            },
                            {
                                q: "Quais são as consequências do Abismo?",
                                a: "Casas com pontuação crítica entram em quarentena, perdendo privilégios e necessitando de ações de redenção para retornar ao ranking principal."
                            },
                            {
                                q: "Posso mudar de casa durante o semestre?",
                                a: "Não. A vinculação a uma casa é definitiva para o ciclo, fomentando a lealdade e o senso de comunidade entre os membros da linhagem."
                            }
                        ].map((item, i) => (
                            <div key={i} className={`faq-item ${openFaq === i ? 'open' : ''}`} onClick={() => setOpenFaq(openFaq === i ? null : i)}>
                                <div className="faq-question">
                                    <span>{item.q}</span>
                                    <span className="faq-toggle">{openFaq === i ? '−' : '+'}</span>
                                </div>
                                <div className="faq-answer">
                                    <div className="faq-answer-content">{item.a}</div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* FINAL */}
            <section className="final">
                <div className="final-bg-stars" id="finalStars"></div>
                <div className="final-inner">
                    <span className="final-emblem">🛡</span>
                    <h2 className="final-title">Pronto para sua <em>Jornada?</em></h2>
                    <p className="final-desc">
                        O destino de sua casa está em suas mãos. Honre sua técnica e lidere seu
                        caminho rumo à excelência industrial.
                    </p>

                    <div className="final-quote">
                        <blockquote>"O futuro não é algo que se espera, é algo que se constrói com precisão."</blockquote>
                        <cite>Mestre das Forjas Arcanum</cite>
                    </div>

                    <a href="/login" className="btn-final">
                        <span className="btn-glow"></span>
                        Iniciar minha Ascensão
                    </a>

                    <div className="rune-row-final">
                        <div className="rune-row">
                            <span>᚛</span><span> </span><span>ᚑ</span><span> </span><span>ᚕ</span><span> </span><span>ᚗ</span><span> </span><span>ᚚ</span>
                        </div>
                    </div>
                </div>
            </section>

            {/* FOOTER */}
            <footer className="footer">
                <div className="footer-inner">
                    <div className="footer-logo">ARCANUM SENAI © 2026</div>
                    <div className="footer-text">Desenvolvido para a Forja de Talentos</div>
                    <div className="nav-links" style={{ display: 'flex', gap: '1.5rem' }}>
                        <a href="#" style={{ fontSize: '0.7rem' }}>Privacidade</a>
                        <a href="#" style={{ fontSize: '0.7rem' }}>Suporte</a>
                    </div>
                </div>
            </footer>
        </div>
    );
};

export default LandingPage;
