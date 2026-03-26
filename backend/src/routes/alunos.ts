import { Router } from 'express';
import prisma from '../lib/prisma.js';

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
            },
        });

        const result = alunos.map((aluno: any) => ({
            id: aluno.id,
            nome: aluno.nome,
            casa: aluno.casa.nome,
            casaId: aluno.casaId,
            status: aluno.status,
            points: aluno.registros.reduce((acc: number, reg: any) => acc + reg.valor, 0),
        }));

        res.json(result);
    } catch (error) {
        res.status(500).json({ error: 'Erro ao buscar alunos' });
    }
});

router.post('/', async (req, res) => {
    const { nome, casaId, status } = req.body;
    try {
        const aluno = await prisma.aluno.create({
            data: { nome, casaId, status },
        });
        res.json(aluno);
    } catch (error) {
        res.status(500).json({ error: 'Erro ao criar aluno' });
    }
});

router.put('/:id', async (req, res) => {
    const { id } = req.params;
    const { nome, casaId, status } = req.body;
    try {
        const aluno = await prisma.aluno.update({
            where: { id },
            data: { nome, casaId, status },
        });
        res.json(aluno);
    } catch (error) {
        res.status(500).json({ error: 'Erro ao atualizar aluno' });
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
