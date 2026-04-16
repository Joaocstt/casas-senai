import { Router } from 'express';
import prisma from '../lib/prisma.js';
import { calcularPenalizacao, calcularPenalizacaoPorOcorrencia, calcularPontosAluno, definirGravidadePorQuantidade } from '../lib/penalizacao.js';
import { io } from '../server.js';
import { emitScoreUpdate } from '../socket/handlers.js';
import { mapAluno } from '../lib/aluno.js';

const router = Router();

router.get('/', async (req, res) => {
    const { casaId, status } = req.query;
    try {
        const alunos = await prisma.aluno.findMany({
            where: {
                casaId: casaId ? String(casaId) : undefined,
                status: status ? (String(status) as any) : undefined,
            },
            include: {
                casa: true,
                registros: true,
                infracoes: {
                    orderBy: {
                        criadoEm: 'desc',
                    },
                },
            },
        });

        const result = alunos.map(mapAluno);

        res.json(result);
    } catch (error) {
        res.status(500).json({ error: 'Erro ao buscar alunos' });
    }
});

router.post('/', async (req, res) => {
    const { nome, casaId, status, faltas } = req.body;
    try {
        const aluno = await prisma.aluno.create({
            data: {
                nome,
                casaId,
                status,
                faltas: Math.max(0, Number(faltas) || 0),
            },
            include: {
                casa: true,
                registros: true,
                infracoes: true
            }
        });
        res.json(mapAluno(aluno));
    } catch (error) {
        res.status(500).json({ error: 'Erro ao criar aluno' });
    }
});

router.put('/:id', async (req, res) => {
    const { id } = req.params;
    const { nome, casaId, status, faltas } = req.body;
    try {
        const aluno = await prisma.aluno.update({
            where: { id },
            data: {
                nome,
                casaId,
                status,
                faltas: Math.max(0, Number(faltas) || 0),
            },
            include: {
                casa: true,
                registros: true,
                infracoes: true
            }
        });
        res.json(mapAluno(aluno));
    } catch (error) {
        res.status(500).json({ error: 'Erro ao atualizar aluno' });
    }
});

router.patch('/:id/faltas', async (req, res) => {
    const { id } = req.params;
    const { faltas } = req.body;

    try {
        const aluno = await prisma.aluno.update({
            where: { id },
            data: {
                faltas: Math.max(0, Number(faltas) || 0),
            },
            include: {
                casa: true,
                registros: true,
                infracoes: {
                    orderBy: {
                        criadoEm: 'desc',
                    },
                },
            },
        });

        const casaSlug = aluno.casa.slug;
        const casa = await prisma.casa.findUnique({
            where: { slug: casaSlug },
            include: {
                alunos: {
                    where: { status: 'ATIVO' },
                    include: { registros: true, infracoes: true }
                }
            }
        });

        if (casa) {
            const allMembers = casa.alunos.map((a: any) => ({
                id: a.id,
                points: calcularPontosAluno(a)
            })).sort((a: any, b: any) => b.points - a.points);

            const index = allMembers.findIndex((m: any) => m.id === id);
            const points = allMembers[index]?.points || 0;
            emitScoreUpdate(io, casa.slug, index, points);
        }

        res.json(mapAluno(aluno));
    } catch (error) {
        res.status(500).json({ error: 'Erro ao atualizar faltas do aluno' });
    }
});

router.post('/:id/infracoes', async (req, res) => {
    const { id } = req.params;
    const { descricao, tipo, item, criadoPor } = req.body;

    try {
        const aluno = await prisma.aluno.findUnique({
            where: { id },
            include: {
                infracoes: true,
            },
        });

        if (!aluno) {
            return res.status(404).json({ error: 'Aluno não encontrado' });
        }

        const proximaQuantidade = aluno.infracoes.length + 1;
        const gravidade = definirGravidadePorQuantidade(proximaQuantidade);
        const itemNormalizado = item?.trim() || tipo?.trim() || null;
        const descricaoNormalizada = descricao?.trim() || null;
        const autor = criadoPor?.trim() || null;
        const valorPenalidade = calcularPenalizacaoPorOcorrencia(gravidade);

        await prisma.$transaction(async (tx) => {
            const novaInfracao = await tx.infracao.create({
                data: {
                    alunoId: id,
                    item: itemNormalizado,
                    gravidade,
                    descricao: descricaoNormalizada,
                    tipo: tipo?.trim() || null,
                    criadoPor: autor,
                },
            });

            const novoRegistro = await tx.registro.create({
                data: {
                    alunoId: id,
                    categoria: `Infração ${gravidade}`,
                    valor: valorPenalidade,
                    observacao: [
                        itemNormalizado ? `Item: ${itemNormalizado}` : null,
                        descricaoNormalizada ? `Descrição: ${descricaoNormalizada}` : null,
                        `Ocorrência #${proximaQuantidade}`,
                    ].filter(Boolean).join('\n'),
                    criadoPor: autor || 'Admin',
                },
            });

            return { infracao: novaInfracao, registro: novoRegistro };
        });

        const alunoAtualizado = await prisma.aluno.findUnique({
            where: { id },
            include: {
                casa: true,
                registros: true,
                infracoes: {
                    orderBy: {
                        criadoEm: 'desc',
                    },
                },
            },
        });

        if (!alunoAtualizado) {
            return res.status(404).json({ error: 'Aluno não encontrado após registrar infração' });
        }

        const casaSlug = alunoAtualizado.casa.slug;
        const casa = await prisma.casa.findUnique({
            where: { slug: casaSlug },
            include: {
                alunos: {
                    where: { status: 'ATIVO' },
                    include: { registros: true, infracoes: true }
                }
            }
        });

        if (casa) {
            const allMembers = casa.alunos.map((a: any) => ({
                id: a.id,
                points: calcularPontosAluno(a)
            })).sort((a: any, b: any) => b.points - a.points);

            const index = allMembers.findIndex((m: any) => m.id === id);
            const points = allMembers[index]?.points || 0;
            emitScoreUpdate(io, casa.slug, index, points);
        }

        res.status(201).json(mapAluno(alunoAtualizado));
    } catch (error) {
        res.status(500).json({ error: 'Erro ao registrar infração' });
    }
});

router.get('/:id/penalizacao', async (req, res) => {
    const { id } = req.params;

    try {
        const aluno = await prisma.aluno.findUnique({
            where: { id },
            include: {
                casa: true,
                registros: true,
                infracoes: {
                    orderBy: {
                        criadoEm: 'desc',
                    },
                },
            },
        });

        if (!aluno) {
            return res.status(404).json({ error: 'Aluno não encontrado' });
        }

        res.json(mapAluno(aluno));
    } catch (error) {
        res.status(500).json({ error: 'Erro ao buscar penalização do aluno' });
    }
});

router.delete('/:id', async (req, res) => {
    const { id } = req.params;
    try {
        await prisma.aluno.update({
            where: { id },
            data: { status: 'INATIVO' },
        });
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: 'Erro ao desativar aluno' });
    }
});

export default router;
