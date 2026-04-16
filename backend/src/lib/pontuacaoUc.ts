export interface PontuacaoUcInput {
    mediaUc: number;
    colocacaoCompeticao?: number | null;
    participacaoNivel: 'BASE' | 'INTERMEDIARIO_1' | 'INTERMEDIARIO_2' | 'INTERMEDIARIO_3' | 'MAXIMO' | 'NAO_SE_APLICA';
    saepNota: number;
    exerciciosNivel: 'N0' | 'N1' | 'N2' | 'N3' | 'N4' | 'N5';
    trabalhosNivel: 'N0' | 'N1' | 'N2' | 'N3' | 'N4' | 'N5';
    avaliacaoFinalNota: number;
    totalPresencas: number;
}

export interface PontuacaoUcResultado {
    entradas: PontuacaoUcInput;
    componentes: {
        mediaUc: number;
        competicoes: number;
        participacao: number;
        saep: number;
        exercicios: number;
        trabalhos: number;
        avaliacaoFinal: number;
        presenca: number;
    };
    total: number;
}

export type PontuacaoManualCriterio =
    | 'MEDIA_UC'
    | 'COMPETICAO'
    | 'PARTICIPACAO'
    | 'SAEP'
    | 'EXERCICIOS'
    | 'TRABALHOS'
    | 'AVALIACAO_FINAL'
    | 'PRESENCA'
    | 'FALTAS';

export interface PontuacaoManualInput {
    criterio: PontuacaoManualCriterio;
    nota?: number | null;
    colocacaoCompeticao?: number | null;
    participacaoNivel?: PontuacaoUcInput['participacaoNivel'];
    atividadeNivel?: PontuacaoUcInput['exerciciosNivel'];
    totalPresencas?: number | null;
}

export interface PontuacaoManualResultado {
    criterio: PontuacaoManualCriterio;
    label: string;
    entrada: string;
    pontos: number;
}

const MEDIA_POINTS: Record<number, number> = {
    7: 5,
    8: 7,
    9: 11,
    10: 14,
};

const COMPETITION_POINTS: Record<number, number> = {
    5: 5,
    4: 10,
    3: 20,
    2: 30,
    1: 40,
};

const PARTICIPATION_POINTS: Record<PontuacaoUcInput['participacaoNivel'], number> = {
    NAO_SE_APLICA: 0,
    BASE: 5,
    INTERMEDIARIO_1: 15,
    INTERMEDIARIO_2: 25,
    INTERMEDIARIO_3: 35,
    MAXIMO: 50,
};

const SAEP_POINTS: Record<number, number> = {
    7: 15,
    8: 25,
    9: 35,
    10: 55,
};

const EXERCISE_POINTS: Record<PontuacaoUcInput['exerciciosNivel'], number> = {
    N0: 0,
    N1: 1,
    N2: 2,
    N3: 3,
    N4: 4,
    N5: 5,
};

const TRABALHO_POINTS: Record<PontuacaoUcInput['trabalhosNivel'], number> = {
    N0: 0,
    N1: 5,
    N2: 6,
    N3: 7,
    N4: 8,
    N5: 10,
};

const FINAL_EVALUATION_POINTS: Record<number, number> = {
    7: 15,
    8: 25,
    9: 45,
    10: 55,
};

function clampNota(value: number): number {
    if (!Number.isFinite(value)) {
        return 0;
    }

    const rounded = Math.round(value);
    return Math.min(10, Math.max(0, rounded));
}

function clampPresencas(value: number): number {
    if (!Number.isFinite(value)) {
        return 0;
    }

    return Math.max(0, Math.round(value));
}

export function calcularPontuacaoUc(input: PontuacaoUcInput): PontuacaoUcResultado {
    const entradas: PontuacaoUcInput = {
        mediaUc: clampNota(input.mediaUc),
        colocacaoCompeticao: input.colocacaoCompeticao ? Math.round(input.colocacaoCompeticao) : null,
        participacaoNivel: input.participacaoNivel,
        saepNota: clampNota(input.saepNota),
        exerciciosNivel: input.exerciciosNivel,
        trabalhosNivel: input.trabalhosNivel,
        avaliacaoFinalNota: clampNota(input.avaliacaoFinalNota),
        totalPresencas: clampPresencas(input.totalPresencas),
    };

    const componentes = {
        mediaUc: MEDIA_POINTS[entradas.mediaUc] || 0,
        competicoes: entradas.colocacaoCompeticao ? (COMPETITION_POINTS[entradas.colocacaoCompeticao] || 0) : 0,
        participacao: PARTICIPATION_POINTS[entradas.participacaoNivel] || 0,
        saep: SAEP_POINTS[entradas.saepNota] || 0,
        exercicios: EXERCISE_POINTS[entradas.exerciciosNivel] || 0,
        trabalhos: TRABALHO_POINTS[entradas.trabalhosNivel] || 0,
        avaliacaoFinal: FINAL_EVALUATION_POINTS[entradas.avaliacaoFinalNota] || 0,
        presenca: entradas.totalPresencas * 2,
    };

    const total = Object.values(componentes).reduce((acc, value) => acc + value, 0);

    return {
        entradas,
        componentes,
        total,
    };
}

export function formatarResumoPontuacaoUc(resultado: PontuacaoUcResultado, observacao?: string | null): string {
    const linhas = [
        `Media UC: ${resultado.entradas.mediaUc} -> ${resultado.componentes.mediaUc} pts`,
        `Competicoes: ${resultado.entradas.colocacaoCompeticao ?? 'N/A'} -> ${resultado.componentes.competicoes} pts`,
        `Participacao: ${resultado.entradas.participacaoNivel} -> ${resultado.componentes.participacao} pts`,
        `SAEP: ${resultado.entradas.saepNota} -> ${resultado.componentes.saep} pts`,
        `Exercicios: ${resultado.entradas.exerciciosNivel} -> ${resultado.componentes.exercicios} pts`,
        `Trabalhos: ${resultado.entradas.trabalhosNivel} -> ${resultado.componentes.trabalhos} pts`,
        `Avaliacao Final: ${resultado.entradas.avaliacaoFinalNota} -> ${resultado.componentes.avaliacaoFinal} pts`,
        `Presencas: ${resultado.entradas.totalPresencas} -> ${resultado.componentes.presenca} pts`,
        `Total UC: ${resultado.total} pts`,
    ];

    if (observacao?.trim()) {
        linhas.push(`Observacao: ${observacao.trim()}`);
    }

    return linhas.join('\n');
}

export function calcularPontuacaoManual(input: PontuacaoManualInput): PontuacaoManualResultado {
    switch (input.criterio) {
        case 'MEDIA_UC': {
            const nota = clampNota(input.nota || 0);
            return { criterio: input.criterio, label: 'Média UC', entrada: String(nota), pontos: MEDIA_POINTS[nota] || 0 };
        }
        case 'COMPETICAO': {
            const colocacao = input.colocacaoCompeticao ? Math.round(input.colocacaoCompeticao) : 0;
            return { criterio: input.criterio, label: 'Competição / Pódio', entrada: colocacao ? `${colocacao}º lugar` : 'Não participou', pontos: COMPETITION_POINTS[colocacao] || 0 };
        }
        case 'PARTICIPACAO': {
            const nivel = input.participacaoNivel || 'NAO_SE_APLICA';
            return { criterio: input.criterio, label: 'Participação / Grand Prix', entrada: nivel, pontos: PARTICIPATION_POINTS[nivel] || 0 };
        }
        case 'SAEP': {
            const nota = clampNota(input.nota || 0);
            return { criterio: input.criterio, label: 'SAEP', entrada: String(nota), pontos: SAEP_POINTS[nota] || 0 };
        }
        case 'EXERCICIOS': {
            const nivel = input.atividadeNivel || 'N0';
            return { criterio: input.criterio, label: 'Exercícios', entrada: nivel, pontos: EXERCISE_POINTS[nivel] || 0 };
        }
        case 'TRABALHOS': {
            const nivel = input.atividadeNivel || 'N0';
            return { criterio: input.criterio, label: 'Trabalhos', entrada: nivel, pontos: TRABALHO_POINTS[nivel] || 0 };
        }
        case 'AVALIACAO_FINAL': {
            const nota = clampNota(input.nota || 0);
            return { criterio: input.criterio, label: 'Avaliação Final', entrada: String(nota), pontos: FINAL_EVALUATION_POINTS[nota] || 0 };
        }
        case 'PRESENCA': {
            const totalPresencas = clampPresencas(input.totalPresencas || 0);
            return { criterio: input.criterio, label: 'Presença', entrada: `${totalPresencas} presenças`, pontos: totalPresencas * 2 };
        }
        case 'FALTAS': {
            const totalFaltas = clampPresencas(input.totalPresencas || 0);
            return { criterio: input.criterio, label: 'Faltas da UC', entrada: `${totalFaltas} faltas`, pontos: totalFaltas * -2 };
        }
        default:
            return { criterio: input.criterio, label: 'Pontuação Manual', entrada: '-', pontos: 0 };
    }
}

export function formatarResumoPontuacaoManual(resultado: PontuacaoManualResultado, observacao?: string | null): string {
    const linhas = [
        `Critério: ${resultado.label}`,
        `Entrada: ${resultado.entrada}`,
        `Pontos: ${resultado.pontos} pts`,
    ];

    if (observacao?.trim()) {
        linhas.push(`Observacao: ${observacao.trim()}`);
    }

    return linhas.join('\n');
}
