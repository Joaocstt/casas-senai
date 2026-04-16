import React, { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import * as THREE from 'three';
import { useCasas } from '../hooks/useCasas';
import './HouseScores.css';

interface HouseData {
    id: string;
    name: string;
    color: string;
    pts: number;
    trait: string;
    crest: string;
    mascot: string;
    desc: string;
    config?: any;
}

const HouseScores: React.FC = () => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const sceneRef = useRef<THREE.Scene | null>(null);
    const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
    const pedestalsRef = useRef<THREE.Group[]>([]);
    const [sortedHouses, setSortedHouses] = useState<HouseData[]>([]);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [isAutoPlaying, setIsAutoPlaying] = useState(true);

    const { data: casasBackend, isLoading } = useCasas();

    // Initialize and sort houses based on Dynamic API data
    useEffect(() => {
        if (!casasBackend || casasBackend.length === 0) return;

        const houses: HouseData[] = casasBackend.map(cb => ({
            id: cb.id,
            name: cb.nome,
            color: cb.cor || '#fff',
            pts: cb.points,
            trait: cb.fraze || 'PODER',
            crest: cb.brasao || '/images/default_crest.png',
            mascot: cb.image || '/images/default_mascot.png',
            desc: cb.descricao || 'Uma linhagem de grandes feitos em Arcanum.',
            config: cb.config || { titleSize: '', rankScale: 1 }
        }));

        const sorted = houses.sort((a, b) => b.pts - a.pts);
        setSortedHouses(sorted);
    }, [casasBackend]);

    // Slideshow Auto-play
    useEffect(() => {
        if (!isAutoPlaying || sortedHouses.length === 0 || isLoading) return;
        const interval = setInterval(() => {
            setCurrentIndex(prev => (prev + 1) % sortedHouses.length);
        }, 6000);
        return () => clearInterval(interval);
    }, [isAutoPlaying, sortedHouses, isLoading]);

    // Three.js Scene Setup (Mount only)
    useEffect(() => {
        if (!canvasRef.current) return;

        const scene = new THREE.Scene();
        scene.fog = new THREE.FogExp2(0x10101a, 0.04);

        const camera = new THREE.PerspectiveCamera(65, window.innerWidth / window.innerHeight, 0.1, 1000);
        const renderer = new THREE.WebGLRenderer({ canvas: canvasRef.current, antialias: true, alpha: false });
        renderer.setClearColor(0x0a0a14, 1);
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        renderer.setSize(window.innerWidth, window.innerHeight);
        renderer.shadowMap.enabled = true;
        renderer.outputColorSpace = THREE.SRGBColorSpace;
        renderer.toneMapping = THREE.ReinhardToneMapping;
        renderer.toneMappingExposure = 1.1;

        // Shiny Reflective Floor
        const floorGeom = new THREE.PlaneGeometry(100, 100);
        const floorMat = new THREE.MeshStandardMaterial({
            color: 0x08081a,
            roughness: 0.15,
            metalness: 0.85
        });
        const floor = new THREE.Mesh(floorGeom, floorMat);
        floor.rotation.x = -Math.PI / 2;
        floor.position.y = -0.01;
        floor.receiveShadow = true;
        scene.add(floor);

        const grid = new THREE.GridHelper(80, 40, 0xC8A44D, 0x1a1a2e);
        grid.material.transparent = true;
        grid.material.opacity = 0.06;
        grid.position.y = 0.01;
        scene.add(grid);

        const texLoader = new THREE.TextureLoader();

        // Clear existing pedestals if any
        pedestalsRef.current.forEach(p => scene.remove(p));
        pedestalsRef.current = [];

        // Use dynamic backend data for 3D pedestals
        if (casasBackend) {
            casasBackend.forEach((cb, i) => {
                const group = new THREE.Group();
                const color = cb.cor || '#fff';

                // Pillars
                const pillarGeom = new THREE.BoxGeometry(1.5, 8, 1.5);
                const pillarMat = new THREE.MeshStandardMaterial({
                    color: color,
                    metalness: 0.9,
                    roughness: 0.1,
                    transparent: true,
                    opacity: 0.35,
                    emissive: color,
                    emissiveIntensity: 0.15
                });
                const pillar = new THREE.Mesh(pillarGeom, pillarMat);
                pillar.position.y = 4;
                group.add(pillar);

                // Energy Fill
                const energyGeom = new THREE.BoxGeometry(1.48, 1, 1.48);
                const energyMat = new THREE.MeshStandardMaterial({
                    color: color,
                    emissive: color,
                    emissiveIntensity: 1.8,
                    transparent: true,
                    opacity: 0.6
                });
                const energy = new THREE.Mesh(energyGeom, energyMat);
                energy.scale.y = 4; // Placeholder height
                energy.position.y = 2;
                group.add(energy);

                // Crest
                const crestGeom = new THREE.PlaneGeometry(1.2, 1.2);
                const crestMat = new THREE.MeshBasicMaterial({
                    map: texLoader.load(cb.brasao || '/images/default_crest.png'),
                    transparent: true,
                    color: color,
                    opacity: 0.8
                });
                const crest = new THREE.Mesh(crestGeom, crestMat);
                crest.position.set(0, 5.5, 0.76);
                group.add(crest);

                group.position.set((i - (casasBackend.length - 1) / 2) * 9, 0, -15);
                scene.add(group);
                pedestalsRef.current.push(group);
            });
        }

        const ambient = new THREE.AmbientLight(0x4040ff, 0.3);
        scene.add(ambient);

        const starGeom = new THREE.BufferGeometry();
        const starPos = new Float32Array(4000 * 3);
        for (let s = 0; s < 4000; s++) {
            starPos[s * 3] = (Math.random() - 0.5) * 200;
            starPos[s * 3 + 1] = (Math.random()) * 100;
            starPos[s * 3 + 2] = (Math.random() - 0.5) * 200;
        }
        starGeom.setAttribute('position', new THREE.BufferAttribute(starPos, 3));
        const starMat = new THREE.PointsMaterial({ size: 0.15, color: 0xffffff, transparent: true, opacity: 0.4 });
        scene.add(new THREE.Points(starGeom, starMat));

        camera.position.set(0, 10, 30);
        camera.lookAt(0, 5, 0);

        sceneRef.current = scene;
        cameraRef.current = camera;

        const clock = new THREE.Clock();
        const animateLoop = () => {
            const time = clock.getElapsedTime();
            requestAnimationFrame(animateLoop);

            pedestalsRef.current.forEach((group, i) => {
                group.position.y = Math.sin(time + i) * 0.15;
                const energy = group.children[1] as THREE.Mesh;
                if (energy) {
                    (energy.material as THREE.MeshStandardMaterial).emissiveIntensity = 1.2 + Math.sin(time * 2.5 + i) * 0.6;
                }
            });

            camera.position.x = Math.sin(time * 0.1) * 5;
            camera.lookAt(0, 5, 0);

            renderer.render(scene, camera);
        };
        animateLoop();

        const handleResize = () => {
            camera.aspect = window.innerWidth / window.innerHeight;
            camera.updateProjectionMatrix();
            renderer.setSize(window.innerWidth, window.innerHeight);
        };
        window.addEventListener('resize', handleResize);
        return () => {
            window.removeEventListener('resize', handleResize);
            renderer.dispose();
        };
    }, [casasBackend]);

    const getRomanRank = (index: number) => ['I', 'II', 'III', 'IV'][index] || (index + 1).toString();

    const handleManualSelect = (index: number) => {
        setIsAutoPlaying(false);
        setCurrentIndex(index);
        setTimeout(() => setIsAutoPlaying(true), 15000); // Resume autoplay after 15s
    };

    return (
        <div className="house-scores-container">
            <canvas ref={canvasRef} className="scores-canvas" />

            <video
                className="background-video"
                autoPlay
                loop
                muted
                playsInline
            >
                <source src="/images/Vídeo_Animado_de_Bandeiras.mp4" type="video/mp4" />
            </video>

            <div className="hologram-overlay"></div>
            <div className="scanline-sweep"></div>

            <div className="ranking-ui slideshow-mode">
                <header className="ranking-header">
                    <button className="btn-back-v4" onClick={() => window.location.href = '/'}>
                        ᚛ VOLTAR AO PORTAL
                    </button>
                    <div className="header-content">
                        <span className="section-label">O Mérito de Arcanum</span>
                        <h1 className="ranking-title">Ranking de <em>Linhagens</em></h1>
                    </div>
                </header>

                <div className="slideshow-stage">
                    <AnimatePresence mode="wait">
                        {isLoading ? (
                            <motion.div
                                key="loading"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                className="loading-state"
                            >
                                <div className="loading-ring"></div>
                                <span>SINCRONIZANDO COM O ORÁCULO...</span>
                            </motion.div>
                        ) : sortedHouses[currentIndex] && (
                            <motion.div
                                key={sortedHouses[currentIndex].id}
                                className={`ranking-card-v5 ${currentIndex === 0 ? 'hero-winner' : ''}`}
                                initial={{ opacity: 0, scale: 0.8, x: 200, rotateY: 30 }}
                                animate={{ opacity: 1, scale: currentIndex === 0 ? 1.1 : 1.0, x: 0, rotateY: 0 }}
                                exit={{ opacity: 0, scale: 0.8, x: -200, rotateY: -30 }}
                                transition={{ type: "spring", stiffness: 180, damping: 22 }}
                                style={{ '--house-color': sortedHouses[currentIndex].color } as any}
                            >
                                <div className="card-rank-badge-v5">
                                    {currentIndex === 0 && (
                                        <div className="leader-badge-wrapper">
                                            <div className="leader-glow"></div>
                                            <span className="leader-label">SOBERANO ATUAL</span>
                                        </div>
                                    )}
                                    <span
                                        className="rank-num"
                                        style={{ transform: `scale(${sortedHouses[currentIndex].config?.rankScale || 1})` }}
                                    >
                                        {getRomanRank(currentIndex)}
                                    </span>
                                </div>

                                <div className="card-glow-v5"></div>
                                <div className="card-inner-v5">
                                    <div className="card-top-v5">
                                        <div className="house-crest-v5">
                                            <div className="crest-shine"></div>
                                            <img src={sortedHouses[currentIndex].crest} alt="crest" />
                                        </div>
                                        <div className="house-info-v5">
                                            <span className="house-trait-v5">{sortedHouses[currentIndex].trait}</span>
                                            <h2
                                                className="house-name-v5"
                                                style={{ fontSize: sortedHouses[currentIndex].config?.titleSize || undefined }}
                                            >
                                                {sortedHouses[currentIndex].name}
                                            </h2>
                                        </div>
                                    </div>

                                    <div className="card-stats-v5">
                                        <div className="stat-row-v5">
                                            <span className="stat-name-v5">HONRA ACUMULADA</span>
                                            <span className="stat-val-v5">{sortedHouses[currentIndex].pts}</span>
                                        </div>
                                        <div className="progress-container-v5">
                                            <motion.div
                                                className="progress-fill-v5"
                                                initial={{ width: 0 }}
                                                animate={{ width: `${Math.min(100, (sortedHouses[currentIndex].pts / 2000) * 100)}%` }}
                                                transition={{ duration: 2, ease: "circOut" }}
                                            />
                                        </div>
                                    </div>

                                    <div className="card-desc-v5">
                                        {sortedHouses[currentIndex].desc}
                                    </div>

                                    <div className="card-footer-v5">
                                        <div className="rune-decoration"> ᚑ ᚑ ᚑ ᚕ ᚑ ᚑ ᚑ </div>
                                    </div>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                <div className="slideshow-nav">
                    {!isLoading && sortedHouses.map((house, idx) => (
                        <div
                            key={house.id}
                            className={`nav-dot-v5 ${currentIndex === idx ? 'active' : ''}`}
                            onClick={() => handleManualSelect(idx)}
                            style={{ '--house-color': house.color } as any}
                        >
                            <div className="nav-thumb">
                                <img src={house.crest} alt="nav crest" />
                            </div>
                            <span className="nav-rank">{getRomanRank(idx)}</span>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default HouseScores;
