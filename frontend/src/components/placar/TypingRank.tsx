import React from 'react';
import { motion } from 'framer-motion';

interface TypingRankProps {
    rank: string;
    fontSize: string;
    color: string;
}

const TypingRank: React.FC<TypingRankProps> = ({ rank, fontSize, color }) => {
    const characters = rank.split('');

    return (
        <div
            className="bar-rank"
            style={{
                display: 'flex',
                fontSize: fontSize,
                color: color,
                fontFamily: "'Cinzel Decorative', serif",
                fontWeight: 900,
                justifyContent: 'center',
                alignItems: 'center',
                '--rank-color': color,
            } as React.CSSProperties}
        >
            {characters.map((char, index) => (
                <motion.span
                    key={`${char}-${index}`}
                    style={{
                        display: 'inline-block',
                        minWidth: char === ' ' ? '0.3em' : 'auto',
                    }}
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{
                        opacity: [0, 1, 1, 0],
                        scale: [0.8, 1.08, 1, 0.92],
                    }}
                    transition={{
                        duration: 5,
                        repeat: Infinity,
                        repeatDelay: 2,
                        delay: index * 0.08,
                        times: [0, 0.1, 0.9, 1],
                    }}
                >
                    {char === ' ' ? '\u00A0' : char}
                </motion.span>
            ))}
        </div>
    );
};

export default TypingRank;
