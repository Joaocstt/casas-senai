import { Router } from 'express';
import prisma from '../lib/prisma.js';
import { io } from '../server.js';
import { emitScoreUpdate } from '../socket/handlers.js';

const router = Router();

interface HistoricoLancamento {
    id: string;
    alunoId: string;
    alunoNome: string;
    casaId: string;
    casaNome: string;
    categoria: string;
    valor: number;
    tipo: 'positivo' | 'negativo';
    observacao: string | null;
    criadoPor: string;
    criadoEm: Date;
}

interface HistoricoCasaResumo {
    casaId: string;
    casaNome: string;
    saldo: number;
    totalRegistros: number;
    totalPositivo: number;
    totalNegativo: number;
}

interface HistoricoAlunoResumo {
    alunoId: string;
    alunoNome: string;
    casaId: string;
    casaNome: string;
    saldo: number;
    totalRegistros: number;
    totalPositivo: number;
    totalNegativo: number;
    ultimaMovimentacao: Date;
}

router.get('/historico-global', async (req, res) => {
    const { startDate, endDate, casaId, alunoId, categoria, tipo, criadoPor } = req.query;

    try {
        const filters = {
            alunoId: alunoId ? String(alunoId) : undefined,
            categoria: categoria ? String(categoria) : undefined,
            criadoPor: criadoPor ? String(criadoPor) : undefined,
            valor:
                tipo === 'positivo'
                    ? { gt: 0 }
                    : tipo === 'negativo'
                      ? { lt: 0 }
                      : undefined,
            criadoEm:
                startDate || endDate
                    ? {
                          gte: startDate ? new Date(String(startDate)) : undefined,
                          lte: endDate ? new Date(String(endDate)) : undefined,
                      }
                    : undefined,
            aluno: casaId
                ? {
                      casaId: String(casaId),
                  }
                : undefined,
        };

        const registros = await prisma.registro.findMany({
            where: filters,
            include: {
                aluno: {
                    include: {
                        casa: true,
                    },
                },
            },
            orderBy: {
                criadoEm: 'desc',
            },
        });

        const lancamentos: HistoricoLancamento[] = registros.map((registro: any) => ({
            id: registro.id,
            alunoId: registro.alunoId,
            alunoNome: registro.aluno.nome,
            casaId: registro.aluno.casaId,
            casaNome: registro.aluno.casa.nome,
            categoria: registro.categoria,
            valor: registro.valor,
            tipo: registro.valor >= 0 ? 'positivo' : 'negativo',
            observacao: registro.observacao,
            criadoPor: registro.criadoPor,
            criadoEm: registro.criadoEm,
        }));

        const resumo = lancamentos.reduce(
                (acc: { totalRegistros: number; saldoTotal: number; totalPositivo: number; totalNegativo: number }, registro: HistoricoLancamento) => {
                acc.totalRegistros += 1;
                acc.saldoTotal += registro.valor;
                if (registro.valor > 0) acc.totalPositivo += registro.valor;
                if (registro.valor < 0) acc.totalNegativo += registro.valor;
                return acc;
            },
            {
                totalRegistros: 0,
                saldoTotal: 0,
                totalPositivo: 0,
                totalNegativo: 0,
            }
        );

        const casasMap = new Map<string, HistoricoCasaResumo>();

        const alunosMap = new Map<string, HistoricoAlunoResumo>();

        for (const registro of lancamentos) {
            const casaEntry = casasMap.get(registro.casaId) ?? {
                casaId: registro.casaId,
                casaNome: registro.casaNome,
                saldo: 0,
                totalRegistros: 0,
                totalPositivo: 0,
                totalNegativo: 0,
            };

            casaEntry.saldo += registro.valor;
            casaEntry.totalRegistros += 1;
            if (registro.valor > 0) casaEntry.totalPositivo += registro.valor;
            if (registro.valor < 0) casaEntry.totalNegativo += registro.valor;
            casasMap.set(registro.casaId, casaEntry);

            const alunoEntry = alunosMap.get(registro.alunoId) ?? {
                alunoId: registro.alunoId,
                alunoNome: registro.alunoNome,
                casaId: registro.casaId,
                casaNome: registro.casaNome,
                saldo: 0,
                totalRegistros: 0,
                totalPositivo: 0,
                totalNegativo: 0,
                ultimaMovimentacao: registro.criadoEm,
            };

            alunoEntry.saldo += registro.valor;
            alunoEntry.totalRegistros += 1;
            if (registro.valor > 0) alunoEntry.totalPositivo += registro.valor;
            if (registro.valor < 0) alunoEntry.totalNegativo += registro.valor;
            if (registro.criadoEm > alunoEntry.ultimaMovimentacao) {
                alunoEntry.ultimaMovimentacao = registro.criadoEm;
            }
            alunosMap.set(registro.alunoId, alunoEntry);
        }

        const casas = Array.from(casasMap.values()).sort((a: HistoricoCasaResumo, b: HistoricoCasaResumo) => b.saldo - a.saldo || a.casaNome.localeCompare(b.casaNome));
        const alunos = Array.from(alunosMap.values()).sort((a: HistoricoAlunoResumo, b: HistoricoAlunoResumo) => b.saldo - a.saldo || a.alunoNome.localeCompare(b.alunoNome));

        res.json({
            filtros: {
                startDate: startDate || null,
                endDate: endDate || null,
                casaId: casaId || null,
                alunoId: alunoId || null,
                categoria: categoria || null,
                tipo: tipo || null,
                criadoPor: criadoPor || null,
            },
            resumo: {
                ...resumo,
                casaLider: casas[0] || null,
                alunoDestaque: alunos[0] || null,
            },
            categorias: Array.from(new Set(lancamentos.map((registro: HistoricoLancamento) => registro.categoria))).sort((a: string, b: string) => a.localeCompare(b)),
            autores: Array.from(new Set(lancamentos.map((registro: HistoricoLancamento) => registro.criadoPor))).sort((a: string, b: string) => a.localeCompare(b)),
            lancamentos,
            casas,
            alunos,
        });
    } catch (error) {
        res.status(500).json({ error: 'Erro ao buscar histórico global' });
    }
});

router.post('/', async (req, res) => {
    const { alunoId, categoria, valor, observacao, criadoPor } = req.body;

    try {
        const registro = await prisma.registro.create({
            data: { alunoId, categoria, valor, observacao, criadoPor },
            include: {
                aluno: {
                    include: {
                        casa: true,
                        registros: true,
                    }
                }
            }
        });

        // Find the current index of the member in the top 5 for the SceneBoard
        const casaSlug = registro.aluno.casa.slug;
        const casa = await prisma.casa.findUnique({
            where: { slug: casaSlug },
            include: {
                alunos: {
                    where: { status: 'ATIVO' },
                    include: { registros: true }
                }
            }
        });

        if (casa) {
            const allMembers = casa.alunos.map((a: any) => ({
                id: a.id,
                points: a.registros.reduce((acc: number, r: any) => acc + r.valor, 0)
            })).sort((a: any, b: any) => b.points - a.points);

            const index = allMembers.findIndex((m: any) => m.id === alunoId);
            const points = allMembers[index]?.points || 0;

            // Emit real-time update
            emitScoreUpdate(io, casa.slug, index, points);
        }

        res.json(registro);
    } catch (error) {
        res.status(500).json({ error: 'Erro ao lançar pontos' });
    }
});

router.post('/lote', async (req, res) => {
    const { alunoIds, categoria, valor, observacao, criadoPor } = req.body;

    try {
        const registros = await Promise.all(
            alunoIds.map((alunoId: string) =>
                prisma.registro.create({
                    data: { alunoId, categoria, valor, observacao, criadoPor },
                })
            )
        );

        // For simplicity in batch updates, we could emit a full refresh or individual updates
        // Here we'll just return the results and assume the client might need to refresh
        res.json(registros);
    } catch (error) {
        res.status(500).json({ error: 'Erro ao lançar pontos em lote' });
    }
});

router.get('/historico/:alunoId', async (req, res) => {
    const { alunoId } = req.params;
    try {
        const historico = await prisma.registro.findMany({
            where: { alunoId },
            orderBy: { data: 'desc' },
        });
        res.json(historico);
    } catch (error) {
        res.status(500).json({ error: 'Erro ao buscar histórico' });
    }
});

export default router;
