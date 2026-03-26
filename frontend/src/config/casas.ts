import type { CasaConfig } from '../types/arcanum';

export const LEAO_LAYOUT = {
    imageWidth: 1424,
    imageHeight: 748,
    bars: [
        { top: 37.5, left: 33.5, right: 33.5, height: 5 }, // Barra I
        { top: 50.3, left: 33.5, right: 33.5, height: 5 }, // Barra II
        { top: 60.4, left: 33.5, right: 33.5, height: 5 }, // Barra III
        { top: 70.1, left: 33.5, right: 33.5, height: 5 }, // Barra IV
        { top: 80.0, left: 33.5, right: 33.5, height: 5 }, // Barra V
    ],
};

export const DRAGAO_LAYOUT = {
    imageWidth: 1424,
    imageHeight: 748,
    bars: [
        { top: 38.7, left: 33.5, right: 33.5, height: 5 }, // Barra I
        { top: 48.8, left: 33.5, right: 33.5, height: 5 }, // Barra II
        { top: 58.5, left: 33.5, right: 33.5, height: 5 }, // Barra III
        { top: 69.1, left: 33.5, right: 33.5, height: 5 }, // Barra IV
        { top: 79.0, left: 33.5, right: 33.5, height: 5 }, // Barra V
    ],
};

export const CORVO_LAYOUT = {
    imageWidth: 1424,
    imageHeight: 748,
    bars: [
        { top: 40.7, left: 18, right: 18, height: 5 }, // Barra I
        { top: 50.3, left: 18, right: 18, height: 5 }, // Barra II
        { top: 60.4, left: 18, right: 18, height: 5 }, // Barra III
        { top: 70.1, left: 18, right: 18, height: 5 }, // Barra IV
        { top: 80.0, left: 18, right: 18, height: 5 }, // Barra V
    ],
};

export const LOBO_LAYOUT = {
    imageWidth: 1424,
    imageHeight: 748,
    bars: [
        { top: 39.11, left: 45, right: 38.9, height: 5 }, // Barra I
        { top: 48.7, left: 45, right: 38.9, height: 5 }, // Barra II
        { top: 58.85, left: 45, right: 38.9, height: 5 }, // Barra III
        { top: 68.5, left: 45, right: 38.9, height: 5 }, // Barra IV
        { top: 78.49, left: 45, right: 38.9, height: 5 }, // Barra V
    ],
};

export const CASAS_CONFIG: Record<string, Omit<CasaConfig, 'id' | 'members'>> = {
    leao: {
        slug: 'leao',
        nome: 'Casa de Leão',
        cor: '#d24242ff   ',
        image: '/images/leao.png',
        fonts: { name: 18, score: 22, rankScale: 2.2, rankLeft: '14%', rankColor: '#bc1818ff' },
        layout: LEAO_LAYOUT,
    },
    corvo: {
        slug: 'corvo',
        nome: 'Casa de Corvo',
        cor: '#1A237E',
        image: '/images/corvo.png',
        fonts: { name: 18, score: 22, rankScale: 2.2, rankLeft: '4%', rankColor: '#C0C0C0' },
        layout: CORVO_LAYOUT,
    },
    lobo: {
        slug: 'lobo',
        nome: 'Casa de Lobo',
        cor: '#3D3630',
        image: '/images/lobo.png',
        fonts: { name: 16, score: 18, rankScale: 2.2, rankLeft: '4%', rankColor: '#D3D3D3' },
        layout: LOBO_LAYOUT,
    },
    dragao: {
        slug: 'dragao',
        nome: 'Casa de Dragão',
        cor: '#065118ff',
        image: '/images/dragao.png',
        fonts: { name: 20, score: 30, rankScale: 2.2, rankLeft: '15%', rankColor: 'rgb(4, 68, 19)' },
        layout: DRAGAO_LAYOUT,
    },
};

export const resolveCasaImage = (imagePath: string) => {
    if (!imagePath) {
        return imagePath;
    }

    if (
        imagePath.startsWith('/') ||
        imagePath.startsWith('http://') ||
        imagePath.startsWith('https://')
    ) {
        return imagePath;
    }

    if (imagePath.startsWith('images/') || imagePath.startsWith('imagens/')) {
        return `/${imagePath}`;
    }

    return `/images/${imagePath}`;
};
