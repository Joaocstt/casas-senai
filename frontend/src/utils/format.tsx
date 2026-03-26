import React from 'react';

/**
 * Procura por número romano (I, II, III, IV, V, etc) no final do nome
 * e o envolve em um span para estilização diferenciada.
 */
export function formatName(name: string): React.ReactNode {
    const match = name.match(/^(.*?)\s+([IVXLCDM]+)$/i);
    if (match) {
        return (
            <>
                {match[1]} <span className="bar-name-num">{match[2]}</span>
            </>
        );
    }
    return name;
}
