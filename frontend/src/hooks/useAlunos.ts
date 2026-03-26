import { useQuery } from '@tanstack/react-query';
import type { Aluno, Status } from '../types/arcanum';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

export const useAlunos = (casaId?: string, status?: Status | 'TODOS') => {
    return useQuery<Aluno[]>({
        queryKey: ['alunos', casaId, status],
        queryFn: async () => {
            const params = new URLSearchParams();
            if (casaId) params.set('casaId', casaId);
            if (status && status !== 'TODOS') params.set('status', status);
            const suffix = params.toString() ? `?${params.toString()}` : '';
            const url = `${API_URL}/api/alunos${suffix}`;
            const response = await fetch(url);
            if (!response.ok) throw new Error('Erro ao buscar alunos');
            return response.json();
        }
    });
};
