import { Router } from 'express';
import prisma from '../lib/prisma.js';
import { calcularPontosAluno } from '../lib/penalizacao.js';

const router = Router();

router.get('/', async (req, res) => {
    try {
        const casas = await prisma.casa.findMany({
            include: {
                alunos: {
                    include: {
                        registros: true,
                        infracoes: true,
                    },
                },
            },
        });

        const result = casas.map((casa: any) => {
            const totalPoints = casa.alunos.reduce((acc: number, aluno: any) => {
                return acc + calcularPontosAluno(aluno);
            }, 0);

            return {
                id: casa.id,
                slug: casa.slug,
                nome: casa.nome,
                cor: casa.cor,
                image: casa.image,
                brasao: casa.brasao,
                fraze: casa.fraze,
                descricao: casa.descricao,
                config: casa.config,
                points: totalPoints,
            };
        });

        res.json(result);
    } catch (error) {
        console.error(error);
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
                        infracoes: true,
                    },
                },
            },
        });

        if (!casa) return res.status(404).json({ error: 'Casa não encontrada' });

        // Sum points for each active student and sort by points descending
        const members = casa.alunos.map((aluno: any) => ({
            id: aluno.id,
            name: aluno.nome,
            points: calcularPontosAluno(aluno),
        })).sort((a: any, b: any) => b.points - a.points).slice(0, 5); // top 5 members for SceneBoard

        res.json({
            id: casa.id,
            slug: casa.slug,
            nome: casa.nome,
            cor: casa.cor,
            image: casa.image,
            brasao: casa.brasao,
            fraze: casa.fraze,
            descricao: casa.descricao,
            config: casa.config,
            members,
        });
    } catch (error) {
        res.status(500).json({ error: 'Erro ao buscar casa' });
    }
});

router.patch('/:slug', async (req, res) => {
    const { slug } = req.params;
    const { nome, cor, image, brasao, fraze, descricao, config } = req.body;
    try {
        const casa = await prisma.casa.update({
            where: { slug },
            data: {
                nome,
                cor,
                image,
                brasao,
                fraze,
                descricao,
                config: config || undefined
            },
        });
        res.json(casa);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Erro ao atualizar casa' });
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
                        infracoes: true,
                    },
                },
            },
        });

        if (!casa) return res.status(404).json({ error: 'Casa não encontrada' });

        const members = casa.alunos.map((aluno: any) => ({
            id: aluno.id,
            name: aluno.nome,
            points: calcularPontosAluno(aluno),
        })).sort((a: any, b: any) => b.points - a.points);

        res.json(members);
    } catch (error) {
        res.status(500).json({ error: 'Erro ao buscar membros' });
    }
});

export default router;
