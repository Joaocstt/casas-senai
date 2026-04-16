import { calcularPenalizacao, calcularPontosAluno } from './penalizacao.js';

export const mapAluno = (aluno: any) => {
    const totalInfracoes = aluno.infracoes?.length ?? 0;
    const totalFaltas = aluno.faltas ?? 0;
    const penalizacao = calcularPenalizacao(totalInfracoes, totalFaltas, aluno.infracoes || []);
    const basePoints = aluno.registros?.reduce((acc: number, reg: any) => acc + reg.valor, 0) ?? 0;

    return {
        id: aluno.id,
        nome: aluno.nome,
        casa: aluno.casa?.nome || '',
        casaId: aluno.casaId,
        status: aluno.status,
        faltas: totalFaltas,
        points: calcularPontosAluno(aluno),
        totalInfracoes,
        infracoes: (aluno.infracoes || []).map((infracao: any) => ({
            id: infracao.id,
            item: infracao.item,
            gravidade: infracao.gravidade,
            descricao: infracao.descricao,
            tipo: infracao.tipo,
            data: infracao.data,
            criadoPor: infracao.criadoPor,
            criadoEm: infracao.criadoEm,
        })),
        penalizacao,
        registros: aluno.registros || [],
    };
};
