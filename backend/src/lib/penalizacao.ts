export interface PenalizacaoAluno {
    totalInfracoes: number;
    totalFaltas: number;
    nivelInfracoes: 'SEM_PENALIDADE' | 'LEVE' | 'MEDIA' | 'GRAVE';
    totaisPorGravidade: {
        leve: number;
        media: number;
        grave: number;
    };
    penalidadeOcorrencias: number;
    penalidadeInfracoes: number;
    penalidadeFaltas: number;
    penalidadeTotal: number;
}

export function calcularPenalizacaoPorOcorrencia(gravidade?: string | null): number {
    switch (gravidade) {
        case 'LEVE':
            return -1;
        case 'MEDIA':
            return -5;
        case 'GRAVE':
            return -10;
        default:
            return 0;
    }
}

export function definirGravidadePorQuantidade(totalInfracoes: number): 'LEVE' | 'MEDIA' | 'GRAVE' {
    if (totalInfracoes <= 15) {
        return 'LEVE';
    }

    if (totalInfracoes <= 30) {
        return 'MEDIA';
    }

    return 'GRAVE';
}

interface InfracaoParaCalculo {
    gravidade?: string | null;
}

export function calcularPenalizacao(totalInfracoes: number, totalFaltas: number, infracoes: InfracaoParaCalculo[] = []): PenalizacaoAluno {
    let nivelInfracoes: PenalizacaoAluno['nivelInfracoes'] = 'SEM_PENALIDADE';
    let penalidadeInfracoes = 0;
    const totaisPorGravidade = {
        leve: 0,
        media: 0,
        grave: 0,
    };

    for (const infracao of infracoes) {
        if (infracao.gravidade === 'LEVE') totaisPorGravidade.leve += 1;
        if (infracao.gravidade === 'MEDIA') totaisPorGravidade.media += 1;
        if (infracao.gravidade === 'GRAVE') totaisPorGravidade.grave += 1;
    }

    if (totalInfracoes >= 1 && totalInfracoes <= 15) {
        nivelInfracoes = 'LEVE';
        penalidadeInfracoes = -1;
    } else if (totalInfracoes >= 16 && totalInfracoes <= 30) {
        nivelInfracoes = 'MEDIA';
        penalidadeInfracoes = -5;
    } else if (totalInfracoes > 30) {
        nivelInfracoes = 'GRAVE';
        penalidadeInfracoes = -10;
    }

    const penalidadeFaltas = totalFaltas > 0 ? totalFaltas * -2 : 0;
    const penalidadeOcorrencias = infracoes.reduce(
        (acc, infracao) => acc + calcularPenalizacaoPorOcorrencia(infracao.gravidade),
        0
    );

    return {
        totalInfracoes,
        totalFaltas,
        nivelInfracoes,
        totaisPorGravidade,
        penalidadeOcorrencias,
        penalidadeInfracoes,
        penalidadeFaltas,
        penalidadeTotal: penalidadeInfracoes + penalidadeFaltas,
    };
}

export function calcularPontosAluno(aluno: { registros: { valor: number }[], faltas: number }): number {
    const basePoints = aluno.registros.reduce((acc, reg) => acc + reg.valor, 0);
    return basePoints - ((aluno.faltas ?? 0) * 2);
}
