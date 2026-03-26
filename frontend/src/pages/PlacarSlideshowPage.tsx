import React, { useEffect, useRef, useState } from 'react';
import { SwitchTransition, CSSTransition } from 'react-transition-group';
import { useQueryClient } from '@tanstack/react-query';
import PlacarPage from './PlacarPage';
import { CASAS_CONFIG } from '../config/casas';
import { fetchCasa } from '../hooks/useCasa';

const SLIDE_DURATION_MS = 7000;
const TRANSITION_DURATION_MS = 1100;
const HOUSE_ORDER = Object.keys(CASAS_CONFIG);

const PlacarSlideshowPage: React.FC = () => {
    const [currentIndex, setCurrentIndex] = useState(0);
    const queryClient = useQueryClient();
    const nodeRefs = useRef<Record<string, React.RefObject<HTMLDivElement>>>({});

    HOUSE_ORDER.forEach((houseId) => {
        if (!nodeRefs.current[houseId]) {
            nodeRefs.current[houseId] = React.createRef<HTMLDivElement>();
        }
    });

    useEffect(() => {
        if (HOUSE_ORDER.length <= 1) {
            return undefined;
        }

        const intervalId = window.setInterval(() => {
            setCurrentIndex((prevIndex) => (prevIndex + 1) % HOUSE_ORDER.length);
        }, SLIDE_DURATION_MS);

        return () => {
            window.clearInterval(intervalId);
        };
    }, []);

    useEffect(() => {
        HOUSE_ORDER.forEach((slug) => {
            void queryClient.prefetchQuery({
                queryKey: ['casa', slug],
                queryFn: () => fetchCasa(slug),
            });
        });
    }, [queryClient]);

    const currentCasaId = HOUSE_ORDER[currentIndex] || 'lobo';
    const nodeRef = nodeRefs.current[currentCasaId];

    return (
        <div className="slideshow-shell">
            <SwitchTransition mode="out-in">
                <CSSTransition
                    key={currentCasaId}
                    nodeRef={nodeRef}
                    classNames="placar-slide"
                    timeout={TRANSITION_DURATION_MS}
                    unmountOnExit
                >
                    <div ref={nodeRef} className="slideshow-panel">
                        <PlacarPage casaIdOverride={currentCasaId} />
                    </div>
                </CSSTransition>
            </SwitchTransition>
        </div>
    );
};

export default PlacarSlideshowPage;
