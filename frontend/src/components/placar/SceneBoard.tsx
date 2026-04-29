import React from 'react';
import type { CasaConfig } from '../../types/arcanum';
import BarRow from './BarRow';
import logoSenai from '../../assets/logo-senai.png';

interface SceneBoardProps {
    casa: CasaConfig;
}

const SceneBoard: React.FC<SceneBoardProps> = ({ casa }) => {
    const { layout, members, nome, fonts, cor, image } = casa;
    const { imageWidth, imageHeight, bars } = layout;
    const videoExtensions = ['.mp4', '.webm', '.ogg', '.mov', '.m4v'];
    const normalizedMediaPath = image.toLowerCase().split('?')[0].split('#')[0];
    const isVideo = videoExtensions.some((extension) => normalizedMediaPath.endsWith(extension));

    // Proportional scaling style
    const sceneStyle: React.CSSProperties = {
        position: 'relative',
        width: `min(100vw, calc(100vh * ${imageWidth} / ${imageHeight}))`,
        height: `min(100vh, calc(100vw * ${imageHeight} / ${imageWidth}))`,
        containerType: 'size' as any,
    };

    // Font sizes using cqh (container query height) for perfect scaling
    const nameSize = `${(fonts.name / imageHeight) * 100}cqh`;
    const scoreSize = `${(fonts.score / imageHeight) * 100}cqh`;

    // Dynamic style with CSS variable for house color
    const containerStyle: React.CSSProperties = {
        '--house-color': cor,
    } as React.CSSProperties;

    return (
        <div className="flex items-center justify-center w-full h-screen bg-black overflow-hidden font-['Cinzel']" style={containerStyle}>
            <div className="scene" style={sceneStyle}>
                {isVideo ? (
                    <video
                        src={image}
                        aria-label={nome}
                        autoPlay
                        muted
                        loop
                        playsInline
                        className="absolute inset-0 w-full h-full block object-contain"
                    />
                ) : (
                    <img
                        src={image}
                        alt={nome}
                        className="absolute inset-0 w-full h-full block object-contain"
                    />
                )}

                <img
                    src={logoSenai}
                    alt="SENAI"
                    style={{
                        position: 'absolute',
                        right: '2.2%',
                        bottom: '5.8%',
                        width: '12cqh',
                        maxWidth: '18%',
                        height: 'auto',
                        pointerEvents: 'none',
                        filter: 'drop-shadow(0 6px 18px rgba(0,0,0,0.55))',
                        opacity: 0.95,
                    }}
                />
                {/* Sorted Members Ranking */}
                {[...members]
                    .sort((a, b) => b.points - a.points)
                    .slice(0, bars.length)
                    .map((member, i) => {
                        const barConfig = bars[i];
                        if (!barConfig) return null;

                        return (
                            <BarRow
                                key={member.id}
                                rank={i}
                                name={member.name}
                                points={member.points}
                                config={barConfig}
                                nameFontSize={nameSize}
                                scoreFontSize={scoreSize}
                                houseColor={cor}
                                houseSlug={casa.slug}
                                fontConfig={fonts}
                            />
                        );
                    })}
            </div>
        </div>
    );
};

export default SceneBoard;
