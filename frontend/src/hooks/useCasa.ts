import { useQuery } from '@tanstack/react-query';
import type { CasaConfig } from '../types/arcanum';
import { CASAS_CONFIG, resolveCasaImage } from '../config/casas';

const API_URL = import.meta.env.VITE_API_URL || '';

export const fetchCasa = async (slug: string): Promise<CasaConfig> => {
    const response = await fetch(`${API_URL}/api/casas/${slug}`);
    if (!response.ok) {
        throw new Error('Erro ao buscar dados da casa');
    }

    const data = await response.json();
    const staticConfig = CASAS_CONFIG[slug];

    if (!staticConfig) {
        return data;
    }

    return {
        ...data,
        nome: staticConfig.nome,
        cor: staticConfig.cor,
        image: resolveCasaImage(staticConfig.image),
        fonts: staticConfig.fonts,
        layout: staticConfig.layout,
    };
};

export const useCasa = (slug: string) => {
    return useQuery<CasaConfig>({
        queryKey: ['casa', slug],
        queryFn: () => fetchCasa(slug),
        enabled: !!slug,
    });
};
