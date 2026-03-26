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
        { slug: 'leao', nome: 'Casa de Leão', cor: '#FFD700', image: '/images/leao.png' },
        { slug: 'corvo', nome: 'Casa de Corvo', cor: '#1A237E', image: '/images/corvo.png' },
        { slug: 'lobo', nome: 'Casa de Lobo', cor: '#607D8B', image: '/images/lobo.png' },
        { slug: 'dragao', nome: 'Casa de Dragão', cor: '#B71C1C', image: '/images/dragao.png' },
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
