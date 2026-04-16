import type { CasaConfig } from '../types/arcanum';

export const LEAO_LAYOUT = {
    imageWidth: 1424,
    imageHeight: 748,
    bars: [
        { top: 37.5, left: 33.5, right: 33.5, height: 5 }, // Barra I
        { top: 48.4, left: 33.5, right: 33.5, height: 5 }, // Barra II
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
        { top: 37.7, left: 31, right: 18, height: 5 }, // Barra I
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
        { top: 39.11, left: 38, right: 38.9, height: 5 }, // Barra I
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
        cor: '#000000ff   ',
        image: '/images/leao.png',
        fonts: { name: 18, score: 28, rankScale: 2.2, rankLeft: '14%', rankColor: '#000000ff' },
        layout: LEAO_LAYOUT,
    },
    corvo: {
        slug: 'corvo',
        nome: 'Casa de Corvo',
        cor: '#000000ff',
        image: '/images/corvo.png',
        fonts: { name: 18, score: 28, rankScale: 2.2, rankLeft: '14%', scoreRight: '16%', rankColor: '#000000ff' },
        layout: CORVO_LAYOUT,
    },
    lobo: {
        slug: 'lobo',
        nome: 'Casa de Lobo',
        cor: '#000000ff',
        image: '/images/lobo.png',
        fonts: { name: 16, score: 28, rankScale: 2.2, rankLeft: '14%', rankColor: '#000000ff' },
        layout: LOBO_LAYOUT,
    },
    dragao: {
        slug: 'dragao',
        nome: 'Casa de Dragão',
        cor: '#000000ff',
        image: '/images/dragao.png',
        fonts: { name: 20, score: 28, rankScale: 2.2, rankLeft: '14%', rankColor: '#000000ff' },
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
