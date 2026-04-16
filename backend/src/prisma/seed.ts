import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
    // Create user
    const hashedPassword = await bcrypt.hash('admin123', 10);
    await prisma.usuario.upsert({
        where: { email: 'admin@arcanum.com' },
        update: {
            nome: 'Admin Arcanum',
            senha: hashedPassword,
            perfil: 'ADMIN',
        },
        create: {
            nome: 'Admin Arcanum',
            email: 'admin@arcanum.com',
            senha: hashedPassword,
            perfil: 'ADMIN',
        },
    });

    // Create houses
    const houses = [
        {
            slug: 'leao',
            nome: 'Casa de Leão',
            cor: '#ff4d4d',
            image: '/images/leao_mascot.png',
            brasao: '/images/leao.brasao.png',
            fraze: 'CORAGEM',
            descricao: 'A linhagem da audácia e força técnica.'
        },
        {
            slug: 'corvo',
            nome: 'Casa de Corvo',
            cor: '#4d7cff',
            image: '/images/corvo_mascot.png',
            brasao: '/images/corvo.brasao.png',
            fraze: 'SABEDORIA',
            descricao: 'A linhagem da análise e conhecimento.'
        },
        {
            slug: 'lobo',
            nome: 'Casa de Lobo',
            cor: '#ffd700',
            image: '/images/lobo_mascot.png',
            brasao: '/images/lobo.brasao.png',
            fraze: 'LEALDADE',
            descricao: 'A linhagem da união e persistência.'
        },
        {
            slug: 'dragao',
            nome: 'Casa de Dragão',
            cor: '#4dff4d',
            image: '/images/dragao_mascot.png',
            brasao: '/images/dragao.brasao.png',
            fraze: 'AMBIÇÃO',
            descricao: 'A linhagem da evolução e excelência.'
        },
    ];

    for (const house of houses) {
        await prisma.casa.upsert({
            where: { slug: house.slug },
            update: house,
            create: house,
        });
    }

    console.log('Seed completed successfully with admin user and base houses only');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
