import React, { useState, useEffect } from 'react';

interface ScoreNumberProps {
    value: number;
    fontSize: string;
}

const ScoreNumber: React.FC<ScoreNumberProps> = ({ value, fontSize }) => {
    const [displayValue, setDisplayValue] = useState(value);
    const [isPopping, setIsPopping] = useState(false);

    useEffect(() => {
        if (value !== displayValue) {
            setIsPopping(true);
            setDisplayValue(value);
            const timer = setTimeout(() => setIsPopping(false), 450);
            return () => clearTimeout(timer);
        }
    }, [value, displayValue]);

    const ptClass = displayValue > 0 ? 'pos' : displayValue < 0 ? 'neg' : 'zero';
    const formattedValue = (displayValue > 0 ? '+' : '') + displayValue;

    return (
        <span
            className={`bar-score ${ptClass} ${isPopping ? 'pop' : ''}`}
            style={{
                fontSize,
                fontFamily: "'Cinzel Decorative', serif",
                fontWeight: 700,
                lineHeight: 1,
                letterSpacing: '0.03em',
                whiteSpace: 'nowrap',
                flexShrink: 0,
                textShadow: `
                    0px 0px 8px rgba(255, 255, 255, 0.4),
                    1px 1px 0px rgba(255, 255, 255, 0.6),
                    -1px -1px 0px rgba(0, 0, 0, 0.5)
                `,
                transition: 'all 0.3s ease-out',
                zIndex: 10,
            }}
        >
            {formattedValue}
            <style>{`
        @keyframes pop {
          0%   { opacity: 0; transform: scale(1.8); filter: brightness(2); }
          60%  { transform: scale(0.85); filter: brightness(1.2); }
          100% { opacity: 1; transform: scale(1); filter: brightness(1); }
        }
        .bar-score.pop {
          animation: pop 0.6s cubic-bezier(0.175, 0.885, 0.32, 1.275);
        }
        .bar-score.pos  { color: #1a1208; filter: brightness(1.2) contrast(1.1); }
        .bar-score.neg  { color: #3d0000; }
        .bar-score.zero { color: #1a1208; opacity: 0.8; }
      `}</style>
        </span>
    );
};

export default ScoreNumber;
