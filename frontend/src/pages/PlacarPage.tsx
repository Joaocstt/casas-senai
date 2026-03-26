import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import SceneBoard from '../components/placar/SceneBoard';
import { useCasa } from '../hooks/useCasa';
import { useSocket } from '../hooks/useSocket';

interface PlacarPageProps {
    casaIdOverride?: string;
}

const PlacarPage: React.FC<PlacarPageProps> = ({ casaIdOverride }) => {
    const { casaId: routeCasaId } = useParams<{ casaId: string }>();
    const casaId = casaIdOverride || routeCasaId || 'lobo';
    const { data: casa, isLoading, error, refetch } = useCasa(casaId);
    const [localMembers, setLocalMembers] = useState(casa?.members || []);

    useEffect(() => {
        if (casa) {
            setLocalMembers(casa.members);
        }
    }, [casa]);

    useSocket(casaId, (data) => {
        if (data.casaId === casaId) {
            setLocalMembers((prev) => {
                const next = [...prev];
                if (next[data.index]) {
                    next[data.index].points = data.points;
                } else {
                    void refetch();
                }
                return next;
            });
            void refetch();
        }
    });

    if (isLoading) {
        return (
            <div className="flex flex-col items-center justify-center w-full h-screen bg-black text-[#c9a84c] tracking-[0.2em] uppercase">
                <span>Carregando</span>
                <div className="flex gap-2 mt-4">
                    <div className="w-1.5 h-1.5 bg-[#c9a84c] rounded-full animate-pulse" />
                    <div className="w-1.5 h-1.5 bg-[#c9a84c] rounded-full animate-pulse delay-75" />
                    <div className="w-1.5 h-1.5 bg-[#c9a84c] rounded-full animate-pulse delay-150" />
                </div>
            </div>
        );
    }

    if (error || !casa) {
        return (
            <div className="flex flex-col items-center justify-center w-full h-screen bg-[#0a0305] text-[#e05050] p-10 text-center">
                <div className="text-xl mb-4">Casa não encontrada</div>
                <code className="bg-white/5 px-4 py-2 rounded text-[#c9a84c] text-sm">
                    {casaId}
                </code>
            </div>
        );
    }

    return <SceneBoard casa={{ ...casa, members: localMembers }} />;
};

export default PlacarPage;
