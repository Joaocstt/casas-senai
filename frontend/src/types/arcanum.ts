export interface BarConfig {
    top: number;
    height: number;
    left: number;
    right: number;
}

export interface Member {
    id: string;
    name: string;
    points: number;
}

export interface CasaConfig {
    id: string;
    slug: string;
    nome: string;
    cor: string;
    image: string;
    fonts: {
        name: number;
        score: number;
        rankScale?: number; // scale multiplier for the rank numeral
        rankLeft?: string;   // horizontal position (e.g. "4%")
        scoreRight?: string; // right offset for the score label
        rankColor?: string;  // custom color for the rank numeral
    };
    layout: {
        imageWidth: number;
        imageHeight: number;
        bars: BarConfig[];
    };
    members: Member[];
}

export type Status = 'ATIVO' | 'INATIVO' | 'MONITORADO';
export type Perfil = 'ADMIN' | 'PROFESSOR' | 'VISUALIZADOR';

export interface User {
    id: string;
    nome: string;
    email: string;
    perfil: Perfil;
}

export interface CasaSummary {
    id: string;
    slug: string;
    nome: string;
    cor: string;
    image: string;      // mascot
    brasao?: string;    // crest
    fraze?: string;     // trait
    descricao?: string; // desc
    config?: any;       // JSON config
    points: number;
}

export interface Aluno {
    id: string;
    nome: string;
    casa: string;
    casaId: string;
    status: Status;
    faltas: number;
    points: number;
    totalInfracoes: number;
    infracoes: InfracaoAluno[];
    penalizacao: PenalizacaoAluno;
}

export interface InfracaoAluno {
    id: string;
    item?: string | null;
    gravidade?: 'LEVE' | 'MEDIA' | 'GRAVE' | null;
    descricao?: string | null;
    tipo?: string | null;
    data: string;
    criadoPor?: string | null;
    criadoEm: string;
}

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

export interface HistoricoLancamento {
    id: string;
    alunoId: string;
    alunoNome: string;
    casaId: string;
    casaNome: string;
    categoria: string;
    valor: number;
    tipo: 'positivo' | 'negativo';
    observacao?: string | null;
    criadoPor: string;
    criadoEm: string;
}

export interface HistoricoCasaResumo {
    casaId: string;
    casaNome: string;
    saldo: number;
    totalRegistros: number;
    totalPositivo: number;
    totalNegativo: number;
}

export interface HistoricoAlunoResumo {
    alunoId: string;
    alunoNome: string;
    casaId: string;
    casaNome: string;
    saldo: number;
    totalRegistros: number;
    totalPositivo: number;
    totalNegativo: number;
    ultimaMovimentacao: string;
}

export interface HistoricoGlobalResponse {
    filtros: {
        startDate: string | null;
        endDate: string | null;
        casaId: string | null;
        alunoId: string | null;
        categoria: string | null;
        tipo: string | null;
        criadoPor: string | null;
    };
    resumo: {
        totalRegistros: number;
        saldoTotal: number;
        totalPositivo: number;
        totalNegativo: number;
        casaLider: HistoricoCasaResumo | null;
        alunoDestaque: HistoricoAlunoResumo | null;
    };
    categorias: string[];
    autores: string[];
    lancamentos: HistoricoLancamento[];
    casas: HistoricoCasaResumo[];
    alunos: HistoricoAlunoResumo[];
}
