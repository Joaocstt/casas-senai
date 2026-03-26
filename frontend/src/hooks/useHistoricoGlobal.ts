import { useQuery } from '@tanstack/react-query';
import type { HistoricoGlobalResponse } from '../types/arcanum';

const API_URL = import.meta.env.VITE_API_URL || '';

export interface HistoricoGlobalFilters {
    startDate?: string;
    endDate?: string;
    casaId?: string;
    alunoId?: string;
    categoria?: string;
    tipo?: string;
    criadoPor?: string;
}

export const useHistoricoGlobal = (filters: HistoricoGlobalFilters) => {
    return useQuery<HistoricoGlobalResponse>({
        queryKey: ['historico-global', filters],
        queryFn: async () => {
            const params = new URLSearchParams();

            Object.entries(filters).forEach(([key, value]) => {
                if (value) {
                    params.set(key, value);
                }
            });

            const suffix = params.toString() ? `?${params.toString()}` : '';
            const endpoints = Array.from(
                new Set([
                    `${API_URL}/api/pontuacao/historico-global${suffix}`,
                    `/api/pontuacao/historico-global${suffix}`,
                ])
            );

            let lastError: Error | null = null;

            for (const endpoint of endpoints) {
                try {
                    const response = await fetch(endpoint);

                    if (!response.ok) {
                        let message = 'Erro ao buscar histórico global';

                        try {
                            const payload = await response.json();
                            if (payload?.error) {
                                message = payload.error;
                            }
                        } catch {
                            // Ignore invalid JSON and keep the default message.
                        }

                        throw new Error(message);
                    }

                    return response.json();
                } catch (error) {
                    lastError = error instanceof Error ? error : new Error('Erro ao buscar histórico global');
                }
            }

            throw lastError || new Error('Erro ao buscar histórico global');
        },
    });
};
