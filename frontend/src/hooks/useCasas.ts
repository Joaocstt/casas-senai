import { useQuery } from '@tanstack/react-query';
import type { CasaSummary } from '../types/arcanum';

const API_URL = import.meta.env.VITE_API_URL || '';

export const useCasas = () => {
    return useQuery<CasaSummary[]>({
        queryKey: ['casas'],
        queryFn: async () => {
            const response = await fetch(`${API_URL}/api/casas`);
            if (!response.ok) {
                throw new Error('Erro ao buscar casas');
            }
            return response.json();
        },
    });
};
