import React from 'react';
import type { BarConfig } from '../../types/arcanum';
import ScoreNumber from './ScoreNumber';
import TypingName from './TypingName';
import TypingRank from './TypingRank';

interface BarRowProps {
    rank: number;
    name: string;
    points: number;
    config: BarConfig;
    nameFontSize: string;
    scoreFontSize: string;
    houseColor: string;
    houseSlug?: string;
    fontConfig?: { rankScale?: number; rankLeft?: string; rankColor?: string };
}

const BarRow: React.FC<BarRowProps> = ({
    rank,
    name,
    points,
    config,
    nameFontSize,
    scoreFontSize,
    houseColor,
    houseSlug,
    fontConfig,
}) => {
    const romanRanks = ['I', 'II', 'III', 'IV', 'V'];
    const rankLabel = romanRanks[rank] || `${rank + 1}`;

    const finalRankScale = fontConfig?.rankScale ?? 2.2;
    const finalRankLeft = fontConfig?.rankLeft ?? '4%';

    return (
        <div
            className="bar-row"
            style={{
                position: 'absolute',
                display: 'flex',
                alignItems: 'center',
                pointerEvents: 'none',
                top: `${config.top}%`,
                height: `${config.height}%`,
                left: `${config.left}%`,
                right: `${config.right}%`,
            }}
        >
            <div
                className="bar-label-group"
                style={{
                    position: 'absolute',
                    inset: 0,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center', // Centers the name by default
                }}
            >
                {/* Independent Rank Label with Typing Effect */}
                <div style={{
                    position: 'absolute',
                    left: finalRankLeft,
                    zIndex: 10,
                    transform: 'translateX(-50%)',
                }}>
                    <TypingRank
                        rank={rankLabel}
                        fontSize={`calc(${nameFontSize} * ${finalRankScale})`}
                        color={fontConfig?.rankColor || houseColor}
                    />
                </div>

                {/* Independent Name Label - Always Centered with Typing Effect */}
                <TypingName
                    name={name}
                    fontSize={nameFontSize}
                    color={houseColor}
                />
            </div>
            <div style={{ position: 'absolute', right: '6%' }}>
                <ScoreNumber value={points} fontSize={scoreFontSize} />
            </div>
        </div>
    );
};

export default BarRow;
