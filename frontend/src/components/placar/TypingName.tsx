import React from 'react';
import { motion } from 'framer-motion';

interface TypingNameProps {
    name: string;
    fontSize: string;
    color: string;
}

const TypingName: React.FC<TypingNameProps> = ({ name, fontSize, color }) => {
    const characters = name.split('');

    return (
        <div
            className="bar-name-container"
            style={{
                display: 'flex',
                fontSize: fontSize,
                color: color,
                fontFamily: "'Cinzel', serif",
                fontWeight: 900,
                letterSpacing: '0.06em',
                padding: '0 4.5em',
                justifyContent: 'center',
                alignItems: 'center',
                zIndex: 5,
                textTransform: 'uppercase',
            }}
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
                        scale: [0.8, 1.1, 1, 0.9],
                    }}
                    transition={{
                        duration: 5,
                        repeat: Infinity,
                        repeatDelay: 2,
                        delay: index * 0.1,
                        times: [0, 0.1, 0.9, 1],
                    }}
                >
                    {char === ' ' ? '\u00A0' : char}
                </motion.span>
            ))}
        </div>
    );
};

export default TypingName;
