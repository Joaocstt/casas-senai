import { Router } from 'express';
import prisma from '../lib/prisma.js';

const router = Router();

router.get('/', async (req, res) => {
    try {
        const casas = await prisma.casa.findMany({
            include: {
                alunos: {
                    include: {
                        registros: true,
                    },
                },
            },
        });

        const result = casas.map((casa: any) => {
            const totalPoints = casa.alunos.reduce((acc: number, aluno: any) => {
                return acc + aluno.registros.reduce((p: number, reg: any) => p + reg.valor, 0);
            }, 0);

            return {
                id: casa.id,
                slug: casa.slug,
                nome: casa.nome,
                cor: casa.cor,
                points: totalPoints,
            };
        });

        res.json(result);
    } catch (error) {
        res.status(500).json({ error: 'Erro ao buscar casas' });
    }
});

router.get('/:slug', async (req, res) => {
    const { slug } = req.params;
    try {
        const casa = await prisma.casa.findUnique({
            where: { slug },
            include: {
                alunos: {
                    where: { status: 'ATIVO' },
                    include: {
                        registros: true,
                    },
                },
            },
        });

        if (!casa) return res.status(404).json({ error: 'Casa não encontrada' });

        // Sum points for each active student and sort by points descending
        const members = casa.alunos.map((aluno: any) => ({
            id: aluno.id,
            name: aluno.nome,
            points: aluno.registros.reduce((acc: number, reg: any) => acc + reg.valor, 0),
        })).sort((a: any, b: any) => b.points - a.points).slice(0, 5); // top 5 members for SceneBoard

        res.json({
            id: casa.id,
            slug: casa.slug,
            nome: casa.nome,
            cor: casa.cor,
            image: casa.image,
            members,
        });
    } catch (error) {
        res.status(500).json({ error: 'Erro ao buscar casa' });
    }
});

router.get('/:slug/members', async (req, res) => {
    const { slug } = req.params;
    try {
        const casa = await prisma.casa.findUnique({
            where: { slug },
            include: {
                alunos: {
                    where: { status: 'ATIVO' },
                    include: {
                        registros: true,
                    },
                },
            },
        });

        if (!casa) return res.status(404).json({ error: 'Casa não encontrada' });

        const members = casa.alunos.map((aluno: any) => ({
            id: aluno.id,
            name: aluno.nome,
            points: aluno.registros.reduce((acc: number, reg: any) => acc + reg.valor, 0),
        })).sort((a: any, b: any) => b.points - a.points);

        res.json(members);
    } catch (error) {
        res.status(500).json({ error: 'Erro ao buscar membros' });
    }
});

export default router;
