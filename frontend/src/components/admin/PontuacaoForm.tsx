import React, { useEffect, useMemo, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { AlertTriangle, Award, ClipboardList, Search, ShieldAlert, Sparkles, Trophy, Users } from 'lucide-react';
import { useAlunos } from '../../hooks/useAlunos';
import { useAuth } from '../../hooks/useAuth';
import { useCasas } from '../../hooks/useCasas';
import type { Aluno } from '../../types/arcanum';

const API_URL = import.meta.env.VITE_API_URL || '';

type PontuarTab = 'launch' | 'students' | 'ranking';
type PontuarMode = 'score' | 'penalty';
type ScoreCriterion =
    | 'MEDIA_UC'
    | 'COMPETICAO'
    | 'PARTICIPACAO'
    | 'SAEP'
    | 'EXERCICIOS'
    | 'TRABALHOS'
    | 'AVALIACAO_FINAL'
    | 'PRESENCA'
    | 'FALTAS';

const penaltyItems = [
    'Comportamento inadequado',
    'Pontualidade',
    'Zelo pelo SENAI',
    'Desempenho no simulado SAEP',
    'Exercícios não entregues',
    'Trabalhos não entregues',
    'Esquecer uniforme',
];

type ParticipacaoNivel = 'NAO_SE_APLICA' | 'BASE' | 'INTERMEDIARIO_1' | 'INTERMEDIARIO_2' | 'INTERMEDIARIO_3' | 'MAXIMO';
type NivelAtividade = 'N0' | 'N1' | 'N2' | 'N3' | 'N4' | 'N5';

interface ScoreUcForm {
    mediaUc: number;
    colocacaoCompeticao: string;
    participacaoNivel: ParticipacaoNivel;
    saepNota: number;
    exerciciosNivel: NivelAtividade;
    trabalhosNivel: NivelAtividade;
    avaliacaoFinalNota: number;
    totalPresencas: number;
}

interface ScoreManualPreview {
    criterio: ScoreCriterion;
    label: string;
    entrada: string;
    pontos: number;
}

const initialScoreUcForm: ScoreUcForm = {
    mediaUc: 0,
    colocacaoCompeticao: '',
    participacaoNivel: 'NAO_SE_APLICA',
    saepNota: 0,
    exerciciosNivel: 'N0',
    trabalhosNivel: 'N0',
    avaliacaoFinalNota: 0,
    totalPresencas: 0,
};

const participationOptions: Array<{ value: ParticipacaoNivel; label: string }> = [
    { value: 'NAO_SE_APLICA', label: 'Não se aplica' },
    { value: 'BASE', label: 'Base (+5)' },
    { value: 'INTERMEDIARIO_1', label: 'Intermediário 1 (+15)' },
    { value: 'INTERMEDIARIO_2', label: 'Intermediário 2 (+25)' },
    { value: 'INTERMEDIARIO_3', label: 'Intermediário 3 (+35)' },
    { value: 'MAXIMO', label: 'Máximo (+50)' },
];

const nivelOptions: Array<{ value: NivelAtividade; label: string }> = [
    { value: 'N0', label: 'Não pontua' },
    { value: 'N1', label: 'N1' },
    { value: 'N2', label: 'N2' },
    { value: 'N3', label: 'N3' },
    { value: 'N4', label: 'N4' },
    { value: 'N5', label: 'N5' },
];

const scoreCriterionOptions: Array<{ value: ScoreCriterion; label: string }> = [
    { value: 'MEDIA_UC', label: 'Média das Notas (UC)' },
    { value: 'COMPETICAO', label: 'Competição / Pódio' },
    { value: 'PARTICIPACAO', label: 'Participação / Grand Prix' },
    { value: 'SAEP', label: 'Desempenho no SAEP' },
    { value: 'EXERCICIOS', label: 'Exercícios' },
    { value: 'TRABALHOS', label: 'Trabalhos' },
    { value: 'AVALIACAO_FINAL', label: 'Avaliação Final' },
    { value: 'PRESENCA', label: 'Presença' },
    { value: 'FALTAS', label: 'Faltas da UC' },
];

const replaceStudentInList = (students: Aluno[] | undefined, updatedStudent: Aluno) => {
    if (!students) {
        return students;
    }

    return students.map((student) => (student.id === updatedStudent.id ? updatedStudent : student));
};

const PontuacaoForm: React.FC = () => {
    const queryClient = useQueryClient();
    const { user } = useAuth();
    const { data: students = [], isLoading: isLoadingStudents } = useAlunos();
    const { data: casas = [], isLoading: isLoadingCasas } = useCasas();
    const [activeTab, setActiveTab] = useState<PontuarTab>('launch');
    const [selectedStudent, setSelectedStudent] = useState('');
    const [selectedCasaId, setSelectedCasaId] = useState('');
    const [studentQuery, setStudentQuery] = useState('');
    const [launchMode, setLaunchMode] = useState<PontuarMode>('score');
    const [scoreCriterion, setScoreCriterion] = useState<ScoreCriterion>('MEDIA_UC');
    const [scoreUcForm, setScoreUcForm] = useState<ScoreUcForm>(initialScoreUcForm);
    const [scoreUcPreview, setScoreUcPreview] = useState<ScoreManualPreview | null>(null);
    const [observation, setObservation] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isCalculatingScore, setIsCalculatingScore] = useState(false);
    const [penaltyItem, setPenaltyItem] = useState(penaltyItems[0]);
    const [faltasInput, setFaltasInput] = useState(0);
    const [isSavingFaltas, setIsSavingFaltas] = useState(false);

    const selectableStudents = useMemo(
        () => students.filter((student) => student.status !== 'INATIVO'),
        [students]
    );

    const filteredStudents = useMemo(() => {
        const normalize = (str: string) => str.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
        const query = normalize(studentQuery.trim());
        const searchWords = query.split(/\s+/).filter(Boolean);

        return selectableStudents
            .filter((student) => !selectedCasaId || student.casaId === selectedCasaId)
            .filter((student) => {
                if (searchWords.length === 0) return true;
                const studentData = normalize(`${student.nome} ${student.casa}`);
                return searchWords.every(word => studentData.includes(word));
            })
            .sort((a, b) => b.points - a.points || a.nome.localeCompare(b.nome, 'pt-BR'));
    }, [selectableStudents, selectedCasaId, studentQuery]);

    const selectedStudentData = useMemo(
        () => selectableStudents.find((student) => student.id === selectedStudent),
        [selectableStudents, selectedStudent]
    );

    const nextPenaltySeverity = useMemo(() => {
        const nextCount = (selectedStudentData?.totalInfracoes || 0) + 1;

        if (nextCount <= 15) {
            return { label: 'Leve', points: -1 };
        }

        if (nextCount <= 30) {
            return { label: 'Média', points: -5 };
        }

        return { label: 'Grave', points: -10 };
    }, [selectedStudentData]);

    useEffect(() => {
        setFaltasInput(selectedStudentData?.faltas ?? 0);
    }, [selectedStudentData?.id, selectedStudentData?.faltas]);

    useEffect(() => {
        setScoreUcPreview(null);
    }, [scoreUcForm, scoreCriterion, selectedStudent]);

    const buildManualPayload = () => ({
        criterio: scoreCriterion,
        nota:
            scoreCriterion === 'MEDIA_UC'
                ? scoreUcForm.mediaUc
                : scoreCriterion === 'SAEP'
                    ? scoreUcForm.saepNota
                    : scoreCriterion === 'AVALIACAO_FINAL'
                        ? scoreUcForm.avaliacaoFinalNota
                        : null,
        colocacaoCompeticao: scoreCriterion === 'COMPETICAO' && scoreUcForm.colocacaoCompeticao
            ? Number(scoreUcForm.colocacaoCompeticao)
            : null,
        participacaoNivel: scoreCriterion === 'PARTICIPACAO' ? scoreUcForm.participacaoNivel : undefined,
        atividadeNivel:
            scoreCriterion === 'EXERCICIOS'
                ? scoreUcForm.exerciciosNivel
                : scoreCriterion === 'TRABALHOS'
                    ? scoreUcForm.trabalhosNivel
                    : undefined,
        totalPresencas: (scoreCriterion === 'PRESENCA' || scoreCriterion === 'FALTAS') ? scoreUcForm.totalPresencas : null,
    });

    const rankingInHouse = useMemo(() => {
        if (!selectedStudentData) {
            return null;
        }

        const houseStudents = selectableStudents
            .filter((student) => student.casaId === selectedStudentData.casaId)
            .sort((a, b) => b.points - a.points || a.nome.localeCompare(b.nome, 'pt-BR'));

        const index = houseStudents.findIndex((student) => student.id === selectedStudentData.id);
        return index >= 0 ? index + 1 : null;
    }, [selectableStudents, selectedStudentData]);

    const topHouses = useMemo(() => {
        return casas
            .map((casa) => ({
                ...casa,
                alunos: selectableStudents
                    .filter((student) => student.casaId === casa.id)
                    .sort((a, b) => b.points - a.points || a.nome.localeCompare(b.nome, 'pt-BR')),
            }))
            .filter((casa) => !selectedCasaId || casa.id === selectedCasaId)
            .sort((a, b) => b.points - a.points || a.nome.localeCompare(b.nome, 'pt-BR'));
    }, [casas, selectableStudents, selectedCasaId]);

    const selectedCasaName = useMemo(
        () => casas.find((casa) => casa.id === selectedCasaId)?.nome || 'Todas as casas',
        [casas, selectedCasaId]
    );

    useEffect(() => {
        if (selectedStudent && !filteredStudents.some((student) => student.id === selectedStudent)) {
            setSelectedStudent('');
        }
    }, [filteredStudents, selectedStudent]);

    const clearFilters = () => {
        setSelectedCasaId('');
        setStudentQuery('');
    };

    const clearForm = () => {
        setSelectedStudent('');
        setScoreCriterion('MEDIA_UC');
        setScoreUcForm(initialScoreUcForm);
        setScoreUcPreview(null);
        setObservation('');
        setPenaltyItem(penaltyItems[0]);
        setFaltasInput(0);
    };

    const syncUpdatedStudent = (updatedStudent: Aluno) => {
        queryClient.setQueriesData<Aluno[]>({ queryKey: ['alunos'] }, (current) =>
            replaceStudentInList(current, updatedStudent)
        );
        setFaltasInput(updatedStudent.faltas);
    };

    const selectStudentForLaunch = (studentId: string) => {
        setSelectedStudent(studentId);
        setActiveTab('launch');
    };

    useEffect(() => {
        if (scoreCriterion === 'FALTAS' && selectedStudentData) {
            setScoreUcForm(current => ({ ...current, totalPresencas: selectedStudentData.faltas }));
        }
    }, [scoreCriterion, selectedStudentData]);

    const handleCalculateScore = async () => {
        setIsCalculatingScore(true);

        try {
            const response = await fetch(`${API_URL}/api/pontuacao/calcular-manual`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(buildManualPayload()),
            });

            if (!response.ok) {
                throw new Error('Erro ao calcular pontuação manual');
            }

            const data = await response.json();
            setScoreUcPreview(data);
        } catch (error) {
            toast.error(error instanceof Error ? error.message : 'Falha ao calcular pontuação');
        } finally {
            setIsCalculatingScore(false);
        }
    };

    const handleSubmit = async (event: React.FormEvent) => {
        event.preventDefault();

        if (!selectedStudent) {
            toast.error('Selecione um aluno para lançar a pontuação.');
            return;
        }

        setIsSubmitting(true);

        try {
            const response = await fetch(`${API_URL}/api/pontuacao/lancar-manual`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('arcanum_token')}`,
                },
                body: JSON.stringify({
                    criadoPor: user?.nome || 'Admin',
                    alunoId: selectedStudent,
                    observacao: observation.trim(),
                    ...buildManualPayload(),
                }),
            });

            if (!response.ok) {
                throw new Error('Erro ao registrar pontuação manual');
            }

            const data = await response.json();

            await Promise.all([
                queryClient.invalidateQueries({ queryKey: ['alunos'] }),
                queryClient.invalidateQueries({ queryKey: ['casas'] }),
                queryClient.invalidateQueries({ queryKey: ['casa'] }),
            ]);

            setScoreUcPreview(data.calculo);
            toast.success('Pontuação registrada com sucesso!');
            setObservation('');
        } catch (error) {
            toast.error(error instanceof Error ? error.message : 'Falha na conexão com o servidor');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleRegistrarPenalizacao = async (event: React.FormEvent) => {
        event.preventDefault();

        if (!selectedStudent) {
            toast.error('Selecione um aluno para registrar a infração.');
            return;
        }

        setIsSubmitting(true);

        try {
            const response = await fetch(`${API_URL}/api/alunos/${selectedStudent}/infracoes`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    item: penaltyItem,
                    tipo: penaltyItem,
                    gravidade: nextPenaltySeverity.label.toUpperCase(),
                    descricao: observation.trim(),
                    criadoPor: user?.nome || 'Admin',
                }),
            });

            if (!response.ok) {
                throw new Error('Erro ao registrar infração');
            }

            const data = await response.json();

            syncUpdatedStudent(data);
            await Promise.all([
                queryClient.invalidateQueries({ queryKey: ['alunos'] }),
                queryClient.invalidateQueries({ queryKey: ['casas'] }),
                queryClient.invalidateQueries({ queryKey: ['casa'] }),
            ]);

            toast.success('Infração registrada com sucesso!');
            setObservation('');
        } catch (error) {
            toast.error(error instanceof Error ? error.message : 'Falha ao registrar infração');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleSalvarFaltas = async () => {
        if (!selectedStudent) {
            toast.error('Selecione um aluno para atualizar as faltas.');
            return;
        }

        setIsSavingFaltas(true);

        try {
            const response = await fetch(`${API_URL}/api/alunos/${selectedStudent}/faltas`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    faltas: Math.max(0, Number(faltasInput) || 0),
                }),
            });

            if (!response.ok) {
                throw new Error('Erro ao atualizar faltas');
            }

            const data = await response.json();

            syncUpdatedStudent(data);
            await queryClient.invalidateQueries({ queryKey: ['alunos'] });
            toast.success('Faltas atualizadas com sucesso!');
        } catch (error) {
            toast.error(error instanceof Error ? error.message : 'Falha ao atualizar faltas');
        } finally {
            setIsSavingFaltas(false);
        }
    };

    return (
        <div className="p-6 md:p-8 space-y-6">
            <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
                <div>
                    <h2 className="text-2xl font-['Cinzel_Decorative'] text-[#c9a84c]">Central de Pontuação</h2>
                    <p className="mt-2 text-sm text-[#d6c9a5]/70">
                        Escolha a área na lateral: buscar alunos, consultar ranking ou lançar pontos.
                    </p>
                </div>
                <div className="text-sm text-[#d6c9a5]/60">
                    {filteredStudents.length} aluno{filteredStudents.length === 1 ? '' : 's'} visível{filteredStudents.length === 1 ? '' : 'eis'}
                </div>
            </div>

            <section className="rounded-2xl border border-[#c9a84c]/15 bg-[#120a0d] p-5 shadow-[0_20px_80px_rgba(0,0,0,0.25)]">
                <div className="grid gap-4 lg:grid-cols-[220px,minmax(0,1fr),140px]">
                    <div>
                        <label className="mb-2 block text-xs uppercase tracking-[0.16em] text-[#c9a84c]/70">Casa</label>
                        <select
                            value={selectedCasaId}
                            onChange={(event) => setSelectedCasaId(event.target.value)}
                            className="w-full rounded-lg border border-[#c9a84c]/25 bg-black/40 px-4 py-3 text-white outline-none transition-colors focus:border-[#c9a84c]"
                        >
                            <option value="">{isLoadingCasas ? 'Carregando...' : 'Todas as casas'}</option>
                            {casas.map((casa) => (
                                <option key={casa.id} value={casa.id}>
                                    {casa.nome}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label className="mb-2 block text-xs uppercase tracking-[0.16em] text-[#c9a84c]/70">Buscar aluno</label>
                        <div className="flex items-center gap-3 rounded-lg border border-[#c9a84c]/25 bg-black/40 px-4 py-3 focus-within:border-[#c9a84c]">
                            <Search size={16} className="text-[#c9a84c]/70" />
                            <input
                                type="text"
                                value={studentQuery}
                                onChange={(event) => setStudentQuery(event.target.value)}
                                placeholder="Nome do aluno"
                                className="w-full bg-transparent text-white outline-none placeholder:text-[#d6c9a5]/35"
                            />
                        </div>
                    </div>

                    <div className="flex items-end">
                        <button
                            type="button"
                            onClick={clearFilters}
                            className="w-full rounded-lg border border-[#c9a84c]/20 px-4 py-3 text-[#f4e9c8] transition hover:bg-[#c9a84c]/10"
                        >
                            Limpar
                        </button>
                    </div>
                </div>
            </section>

            <div className="grid gap-6 xl:grid-cols-[240px,minmax(0,1fr)]">
                <aside className="rounded-2xl border border-[#c9a84c]/15 bg-[#120a0d] p-4 shadow-[0_20px_80px_rgba(0,0,0,0.25)]">
                    <div className="space-y-2">
                        <SidebarTab
                            active={activeTab === 'launch'}
                            icon={<Award size={18} />}
                            title="Lançar Pontos"
                            description="Registrar pontuação"
                            onClick={() => setActiveTab('launch')}
                        />
                        <SidebarTab
                            active={activeTab === 'students'}
                            icon={<Users size={18} />}
                            title="Alunos"
                            description="Buscar e selecionar"
                            onClick={() => setActiveTab('students')}
                        />
                        <SidebarTab
                            active={activeTab === 'ranking'}
                            icon={<Trophy size={18} />}
                            title="Ranking"
                            description="Ver casas e líderes"
                            onClick={() => setActiveTab('ranking')}
                        />
                    </div>

                    <div className="mt-6 rounded-xl border border-[#c9a84c]/10 bg-black/20 p-4 text-sm text-[#d6c9a5]/75">
                        <div className="text-xs uppercase tracking-[0.16em] text-[#c9a84c]/60">Contexto Atual</div>
                        <div className="mt-3">Casa: {selectedCasaName}</div>
                        <div className="mt-2">Busca: {studentQuery.trim() || 'Sem filtro'}</div>
                        <div className="mt-2">Selecionado: {selectedStudentData?.nome || 'Nenhum aluno'}</div>
                    </div>
                </aside>

                <div className="min-w-0">
                    {activeTab === 'launch' ? (
                        <section className="rounded-2xl border border-[#c9a84c]/15 bg-[#1a0f12] p-6 shadow-[0_20px_80px_rgba(0,0,0,0.25)]">
                            <div className="flex items-start gap-4">
                                <div className="rounded-2xl bg-[#c9a84c]/12 p-3 text-[#c9a84c]">
                                    {launchMode === 'score' ? <Award size={22} /> : <ShieldAlert size={22} />}
                                </div>
                                <div>
                                    <h3 className="text-lg font-semibold text-[#f4e9c8]">
                                        {launchMode === 'score' ? 'Lançar Pontos' : 'Lançar Penalização'}
                                    </h3>
                                    <p className="mt-1 text-sm text-[#d6c9a5]/65">
                                        {launchMode === 'score'
                                            ? 'Escolha um aluno e registre o ajuste de forma objetiva.'
                                            : 'Registre infrações por item, gravidade e faltas com cálculo automático.'}
                                    </p>
                                </div>
                            </div>

                            <div className="mt-6 grid gap-3 md:grid-cols-2">
                                <button
                                    type="button"
                                    onClick={() => setLaunchMode('score')}
                                    className={`rounded-xl border px-4 py-4 text-left transition ${launchMode === 'score'
                                        ? 'border-[#c9a84c]/30 bg-[#c9a84c]/10 text-white'
                                        : 'border-[#c9a84c]/10 bg-black/20 text-[#d6c9a5]/75 hover:bg-[#c9a84c]/5'
                                        }`}
                                >
                                    <div className="flex items-center gap-3">
                                        <Award size={18} className="text-[#c9a84c]" />
                                        <div className="font-semibold">Pontuação Manual</div>
                                    </div>
                                    <div className="mt-2 text-sm opacity-75">
                                        Mérito, eventos, bonificações e ajustes diretos.
                                    </div>
                                </button>

                                <button
                                    type="button"
                                    onClick={() => setLaunchMode('penalty')}
                                    className={`rounded-xl border px-4 py-4 text-left transition ${launchMode === 'penalty'
                                        ? 'border-[#c9a84c]/30 bg-[#c9a84c]/10 text-white'
                                        : 'border-[#c9a84c]/10 bg-black/20 text-[#d6c9a5]/75 hover:bg-[#c9a84c]/5'
                                        }`}
                                >
                                    <div className="flex items-center gap-3">
                                        <ShieldAlert size={18} className="text-[#c9a84c]" />
                                        <div className="font-semibold">Infrações e Faltas</div>
                                    </div>
                                    <div className="mt-2 text-sm opacity-75">
                                        Comportamento, pontualidade, uniforme e faltas da UC.
                                    </div>
                                </button>
                            </div>

                            <div className="mt-6">
                                <div>
                                    <label className="mb-2 block text-sm font-medium text-[#c9a84c]">Aluno</label>
                                    <select
                                        value={selectedStudent}
                                        onChange={(event) => setSelectedStudent(event.target.value)}
                                        disabled={isLoadingStudents || filteredStudents.length === 0}
                                        className="w-full rounded-lg border border-[#c9a84c]/25 bg-black/40 px-4 py-3 text-white outline-none transition-colors focus:border-[#c9a84c] disabled:cursor-not-allowed disabled:opacity-60"
                                    >
                                        <option value="">
                                            {isLoadingStudents ? 'Carregando alunos...' : 'Selecione um aluno'}
                                        </option>
                                        {filteredStudents.map((student) => (
                                            <option key={student.id} value={student.id}>
                                                {student.nome} ({student.casa}) - {student.points} pts
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                {selectedStudentData ? (
                                    <div className="grid gap-3 rounded-xl border border-[#c9a84c]/10 bg-black/20 p-4 md:grid-cols-3 xl:grid-cols-6">
                                        <InfoPill label="Casa" value={selectedStudentData.casa} />
                                        <InfoPill label="Pontos" value={`${selectedStudentData.points} pts`} />
                                        <InfoPill label="Posição" value={rankingInHouse ? `${rankingInHouse}º lugar` : '-'} />
                                        <InfoPill label="Infrações" value={`${selectedStudentData.totalInfracoes}`} />
                                        <InfoPill label="Faltas" value={`${selectedStudentData.faltas}`} />
                                    </div>
                                ) : null}
                            </div>

                            {launchMode === 'score' ? (
                                <form onSubmit={handleSubmit} className="mt-6 space-y-5">
                                    <div>
                                        <label className="mb-2 block text-sm font-medium text-[#c9a84c]">Critério</label>
                                        <select
                                            value={scoreCriterion}
                                            onChange={(event) => setScoreCriterion(event.target.value as ScoreCriterion)}
                                            className="w-full rounded-lg border border-[#c9a84c]/25 bg-black/40 px-4 py-3 text-white outline-none transition-colors focus:border-[#c9a84c]"
                                        >
                                            {scoreCriterionOptions.map((option) => (
                                                <option key={option.value} value={option.value}>
                                                    {option.label}
                                                </option>
                                            ))}
                                        </select>
                                    </div>

                                    <div className="grid gap-4 md:grid-cols-2">
                                        {(scoreCriterion === 'MEDIA_UC' || scoreCriterion === 'SAEP' || scoreCriterion === 'AVALIACAO_FINAL') ? (
                                            <div>
                                                <label className="mb-2 block text-sm font-medium text-[#c9a84c]">
                                                    {scoreCriterion === 'MEDIA_UC'
                                                        ? 'Média das Notas (UC)'
                                                        : scoreCriterion === 'SAEP'
                                                            ? 'Nota SAEP'
                                                            : 'Avaliação Final'}
                                                </label>
                                                <input
                                                    type="number"
                                                    min={0}
                                                    max={10}
                                                    value={
                                                        scoreCriterion === 'MEDIA_UC'
                                                            ? scoreUcForm.mediaUc
                                                            : scoreCriterion === 'SAEP'
                                                                ? scoreUcForm.saepNota
                                                                : scoreUcForm.avaliacaoFinalNota
                                                    }
                                                    onChange={(event) => {
                                                        const value = Number(event.target.value) || 0;
                                                        setScoreUcForm((current) => ({
                                                            ...current,
                                                            mediaUc: scoreCriterion === 'MEDIA_UC' ? value : current.mediaUc,
                                                            saepNota: scoreCriterion === 'SAEP' ? value : current.saepNota,
                                                            avaliacaoFinalNota: scoreCriterion === 'AVALIACAO_FINAL' ? value : current.avaliacaoFinalNota,
                                                        }));
                                                    }}
                                                    className="w-full rounded-lg border border-[#c9a84c]/25 bg-black/40 px-4 py-3 text-white outline-none transition-colors focus:border-[#c9a84c]"
                                                />
                                            </div>
                                        ) : null}

                                        {scoreCriterion === 'COMPETICAO' ? (
                                            <div>
                                                <label className="mb-2 block text-sm font-medium text-[#c9a84c]">Competição / Pódio</label>
                                                <select
                                                    value={scoreUcForm.colocacaoCompeticao}
                                                    onChange={(event) => setScoreUcForm((current) => ({ ...current, colocacaoCompeticao: event.target.value }))}
                                                    className="w-full rounded-lg border border-[#c9a84c]/25 bg-black/40 px-4 py-3 text-white outline-none transition-colors focus:border-[#c9a84c]"
                                                >
                                                    <option value="">Não participou</option>
                                                    <option value="5">5º lugar (+5)</option>
                                                    <option value="4">4º lugar (+10)</option>
                                                    <option value="3">3º lugar (+20)</option>
                                                    <option value="2">2º lugar (+30)</option>
                                                    <option value="1">1º lugar (+40)</option>
                                                </select>
                                            </div>
                                        ) : null}

                                        {scoreCriterion === 'PARTICIPACAO' ? (
                                            <div>
                                                <label className="mb-2 block text-sm font-medium text-[#c9a84c]">Participação / Grand Prix</label>
                                                <select
                                                    value={scoreUcForm.participacaoNivel}
                                                    onChange={(event) => setScoreUcForm((current) => ({ ...current, participacaoNivel: event.target.value as ParticipacaoNivel }))}
                                                    className="w-full rounded-lg border border-[#c9a84c]/25 bg-black/40 px-4 py-3 text-white outline-none transition-colors focus:border-[#c9a84c]"
                                                >
                                                    {participationOptions.map((option) => (
                                                        <option key={option.value} value={option.value}>
                                                            {option.label}
                                                        </option>
                                                    ))}
                                                </select>
                                            </div>
                                        ) : null}

                                        {(scoreCriterion === 'EXERCICIOS' || scoreCriterion === 'TRABALHOS') ? (
                                            <div>
                                                <label className="mb-2 block text-sm font-medium text-[#c9a84c]">
                                                    {scoreCriterion === 'EXERCICIOS' ? 'Exercícios' : 'Trabalhos'}
                                                </label>
                                                <select
                                                    value={scoreCriterion === 'EXERCICIOS' ? scoreUcForm.exerciciosNivel : scoreUcForm.trabalhosNivel}
                                                    onChange={(event) =>
                                                        setScoreUcForm((current) => ({
                                                            ...current,
                                                            exerciciosNivel: scoreCriterion === 'EXERCICIOS' ? event.target.value as NivelAtividade : current.exerciciosNivel,
                                                            trabalhosNivel: scoreCriterion === 'TRABALHOS' ? event.target.value as NivelAtividade : current.trabalhosNivel,
                                                        }))
                                                    }
                                                    className="w-full rounded-lg border border-[#c9a84c]/25 bg-black/40 px-4 py-3 text-white outline-none transition-colors focus:border-[#c9a84c]"
                                                >
                                                    {nivelOptions.map((option) => (
                                                        <option key={option.value} value={option.value}>
                                                            {option.label}
                                                        </option>
                                                    ))}
                                                </select>
                                            </div>
                                        ) : null}

                                        {scoreCriterion === 'PRESENCA' || scoreCriterion === 'FALTAS' ? (
                                            <div>
                                                <label className="mb-2 block text-sm font-medium text-[#c9a84c]">
                                                    {scoreCriterion === 'PRESENCA' ? 'Presenças' : 'Total de Faltas'}
                                                </label>
                                                <input
                                                    type="number"
                                                    min={0}
                                                    value={scoreUcForm.totalPresencas}
                                                    onChange={(event) => setScoreUcForm((current) => ({ ...current, totalPresencas: Number(event.target.value) || 0 }))}
                                                    className="w-full rounded-lg border border-[#c9a84c]/25 bg-black/40 px-4 py-3 text-white outline-none transition-colors focus:border-[#c9a84c]"
                                                />
                                            </div>
                                        ) : null}
                                    </div>

                                    <div className="rounded-xl border border-[#c9a84c]/10 bg-black/20 p-4 text-sm text-[#d6c9a5]/80">
                                        O professor escolhe um único critério por vez, calcula os pontos e registra apenas esse lançamento.
                                    </div>

                                    <div>
                                        <label className="mb-2 block text-sm font-medium text-[#c9a84c]">Observação</label>
                                        <textarea
                                            value={observation}
                                            onChange={(event) => setObservation(event.target.value)}
                                            className="h-28 w-full rounded-lg border border-[#c9a84c]/25 bg-black/40 px-4 py-3 text-white outline-none transition-colors focus:border-[#c9a84c]"
                                            placeholder="Observações sobre o lançamento"
                                        />
                                    </div>

                                    {scoreUcPreview ? (
                                        <div className="rounded-xl border border-[#c9a84c]/10 bg-black/20 p-4">
                                            <div className="text-sm font-semibold text-[#f4e9c8]">Prévia da Pontuação</div>
                                            <div className="mt-4 grid gap-3 sm:grid-cols-3">
                                                <InfoPill label="Critério" value={scoreUcPreview.label} />
                                                <InfoPill label="Entrada" value={scoreUcPreview.entrada} />
                                                <InfoPill label="Pontos" value={`${scoreUcPreview.pontos} pts`} />
                                            </div>
                                        </div>
                                    ) : null}

                                    <div className="grid gap-3 sm:grid-cols-3">
                                        <button
                                            type="button"
                                            onClick={handleCalculateScore}
                                            disabled={isCalculatingScore || !selectedStudent}
                                            className="w-full rounded-lg border border-[#c9a84c]/20 px-4 py-3 text-[#f4e9c8] transition hover:bg-[#c9a84c]/10 disabled:cursor-not-allowed disabled:opacity-50"
                                        >
                                            {isCalculatingScore ? 'Calculando...' : 'Calcular Pontuação'}
                                        </button>
                                        <button
                                            type="submit"
                                            disabled={isSubmitting || isLoadingStudents || filteredStudents.length === 0}
                                            className="flex w-full items-center justify-center gap-2 rounded-lg bg-[#c9a84c] px-4 py-3 font-bold text-black transition hover:bg-[#b08e35] disabled:cursor-not-allowed disabled:opacity-50"
                                        >
                                            <Sparkles size={18} />
                                            {isSubmitting ? 'Registrando...' : 'Lançar Pontuação'}
                                        </button>
                                        <button
                                            type="button"
                                            onClick={clearForm}
                                            disabled={isSubmitting}
                                            className="w-full rounded-lg border border-[#c9a84c]/20 px-4 py-3 text-[#f4e9c8] transition hover:bg-[#c9a84c]/10 disabled:cursor-not-allowed disabled:opacity-50"
                                        >
                                            Limpar Formulário
                                        </button>
                                    </div>
                                </form>
                            ) : null}

                            {launchMode === 'penalty' ? (
                                <div className="mt-6 grid gap-6 xl:grid-cols-[minmax(0,1.2fr),360px]">
                                    <form onSubmit={handleRegistrarPenalizacao} className="space-y-5">
                                        <div className="grid gap-4 md:grid-cols-2">
                                            <div>
                                                <label className="mb-2 block text-sm font-medium text-[#c9a84c]">Item Avaliado</label>
                                                <select
                                                    value={penaltyItem}
                                                    onChange={(event) => setPenaltyItem(event.target.value)}
                                                    className="w-full rounded-lg border border-[#c9a84c]/25 bg-black/40 px-4 py-3 text-white outline-none transition-colors focus:border-[#c9a84c]"
                                                >
                                                    {penaltyItems.map((item) => (
                                                        <option key={item} value={item}>
                                                            {item}
                                                        </option>
                                                    ))}
                                                </select>
                                            </div>

                                            <div>
                                                <label className="mb-2 block text-sm font-medium text-[#c9a84c]">Gravidade Automática</label>
                                                <div className="rounded-lg border border-[#c9a84c]/25 bg-black/40 px-4 py-3 text-white">
                                                    {nextPenaltySeverity.label} ({nextPenaltySeverity.points} pt)
                                                </div>
                                                <div className="mt-2 text-xs text-[#d6c9a5]/60">
                                                    Definida pelo total acumulado. A próxima infração será a de número {(selectedStudentData?.totalInfracoes || 0) + 1}.
                                                </div>
                                            </div>
                                        </div>

                                        <div>
                                            <label className="mb-2 block text-sm font-medium text-[#c9a84c]">Observação</label>
                                            <textarea
                                                value={observation}
                                                onChange={(event) => setObservation(event.target.value)}
                                                className="h-28 w-full rounded-lg border border-[#c9a84c]/25 bg-black/40 px-4 py-3 text-white outline-none transition-colors focus:border-[#c9a84c]"
                                                placeholder="Detalhes da ocorrência"
                                            />
                                        </div>

                                        <div className="grid gap-3 sm:grid-cols-2">
                                            <button
                                                type="submit"
                                                disabled={isSubmitting || !selectedStudent}
                                                className="flex w-full items-center justify-center gap-2 rounded-lg bg-[#c84d4d] px-4 py-3 font-bold text-white transition hover:bg-[#b13f3f] disabled:cursor-not-allowed disabled:opacity-50"
                                            >
                                                <AlertTriangle size={18} />
                                                {isSubmitting ? 'Registrando...' : 'Registrar Infração'}
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    setPenaltyItem(penaltyItems[0]);
                                                    setObservation('');
                                                }}
                                                disabled={isSubmitting}
                                                className="w-full rounded-lg border border-[#c9a84c]/20 px-4 py-3 text-[#f4e9c8] transition hover:bg-[#c9a84c]/10 disabled:cursor-not-allowed disabled:opacity-50"
                                            >
                                                Limpar Penalização
                                            </button>
                                        </div>

                                        <div className="rounded-xl border border-[#c9a84c]/10 bg-black/20 p-4">
                                            <div className="flex items-center gap-2 text-[#c9a84c]">
                                                <ClipboardList size={16} />
                                                <span className="text-sm font-semibold">Regras Aplicadas</span>
                                            </div>
                                            <ul className="mt-3 space-y-2 text-sm text-[#d6c9a5]/80">
                                                <li>Até a 15ª infração: o sistema registra automaticamente como leve e perde 1 ponto.</li>
                                                <li>Da 16ª até a 30ª: o sistema registra automaticamente como média e perde 5 pontos.</li>
                                                <li>Acima da 30ª: o sistema registra automaticamente como grave e perde 10 pontos.</li>
                                                <li>Até 15 infrações: penalização final de -1 ponto.</li>
                                                <li>16 a 30 infrações: penalização final de -5 pontos.</li>
                                                <li>Acima de 30 infrações: penalização final de -10 pontos.</li>
                                                <li>Cada falta vale -2 pontos no fechamento da UC.</li>
                                            </ul>
                                        </div>
                                    </form>

                                    <div className="space-y-5">
                                        <div className="rounded-xl border border-[#c9a84c]/10 bg-black/20 p-4">
                                            <div className="text-sm font-semibold text-[#f4e9c8]">Faltas da UC</div>
                                            <div className="mt-1 text-sm text-[#d6c9a5]/70">
                                                Atualize a quantidade total de faltas do aluno para calcular a perda final.
                                            </div>
                                            <div className="mt-4 flex gap-3">
                                                <input
                                                    type="number"
                                                    min={0}
                                                    value={faltasInput}
                                                    onChange={(event) => setFaltasInput(Math.max(0, Number(event.target.value) || 0))}
                                                    className="w-full rounded-lg border border-[#c9a84c]/25 bg-black/40 px-4 py-3 text-white outline-none transition-colors focus:border-[#c9a84c]"
                                                />
                                                <button
                                                    type="button"
                                                    onClick={handleSalvarFaltas}
                                                    disabled={isSavingFaltas || !selectedStudent}
                                                    className="rounded-lg bg-[#c9a84c] px-4 py-3 font-bold text-black transition hover:bg-[#b08e35] disabled:cursor-not-allowed disabled:opacity-50"
                                                >
                                                    {isSavingFaltas ? 'Salvando...' : 'Salvar'}
                                                </button>
                                            </div>
                                        </div>

                                        {selectedStudentData ? (
                                            <div className="rounded-xl border border-[#c9a84c]/10 bg-black/20 p-4">
                                                <div className="text-sm font-semibold text-[#f4e9c8]">Resumo da Penalização</div>
                                                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                                                    <InfoPill label="Leves" value={`${selectedStudentData.penalizacao.totaisPorGravidade.leve}`} />
                                                    <InfoPill label="Médias" value={`${selectedStudentData.penalizacao.totaisPorGravidade.media}`} />
                                                    <InfoPill label="Graves" value={`${selectedStudentData.penalizacao.totaisPorGravidade.grave}`} />
                                                    <InfoPill label="Nível Final" value={selectedStudentData.penalizacao.nivelInfracoes} />
                                                    <InfoPill label="Perda por Ocorrências" value={`${selectedStudentData.penalizacao.penalidadeOcorrencias} pts`} />
                                                    <InfoPill label="Perda por Faltas" value={`${selectedStudentData.penalizacao.penalidadeFaltas} pts`} />
                                                    <InfoPill label="Penalidade por Quantidade" value={`${selectedStudentData.penalizacao.penalidadeInfracoes} pts`} />
                                                    <InfoPill label="Penalidade Final" value={`${selectedStudentData.penalizacao.penalidadeTotal} pts`} />
                                                </div>
                                            </div>
                                        ) : null}

                                        <div className="rounded-xl border border-[#c9a84c]/10 bg-black/20 p-4">
                                            <div className="text-sm font-semibold text-[#f4e9c8]">Últimas Infrações</div>
                                            <div className="mt-4 space-y-3">
                                                {selectedStudentData?.infracoes?.length ? (
                                                    selectedStudentData.infracoes.slice(0, 5).map((infracao) => (
                                                        <div key={infracao.id} className="rounded-lg border border-[#c9a84c]/10 bg-[#1a0f12] px-4 py-3">
                                                            <div className="flex items-center justify-between gap-3">
                                                                <div className="font-medium text-[#f4e9c8]">
                                                                    {infracao.item || infracao.tipo || 'Infração'}
                                                                </div>
                                                                <div className="text-xs text-[#c9a84c]/70">
                                                                    {infracao.gravidade || 'SEM GRAVIDADE'}
                                                                </div>
                                                            </div>
                                                            {infracao.descricao ? (
                                                                <div className="mt-2 text-sm text-[#d6c9a5]/75">{infracao.descricao}</div>
                                                            ) : null}
                                                        </div>
                                                    ))
                                                ) : (
                                                    <div className="rounded-lg border border-dashed border-[#c9a84c]/10 px-4 py-4 text-sm text-[#d6c9a5]/60">
                                                        Nenhuma infração registrada para o aluno selecionado.
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ) : null}
                        </section>
                    ) : null}

                    {activeTab === 'students' ? (
                        <section className="rounded-2xl border border-[#c9a84c]/15 bg-[#120a0d] p-6 shadow-[0_20px_80px_rgba(0,0,0,0.25)]">
                            <div className="flex items-center justify-between gap-4">
                                <div>
                                    <h3 className="text-lg font-semibold text-[#f4e9c8]">Selecionar Aluno</h3>
                                    <p className="mt-1 text-sm text-[#d6c9a5]/65">
                                        Use esta lista para localizar rapidamente quem vai receber a pontuação.
                                    </p>
                                </div>
                                <div className="text-sm text-[#d6c9a5]/60">{filteredStudents.length} resultados</div>
                            </div>

                            <div className="mt-5 overflow-hidden rounded-xl border border-[#c9a84c]/10">
                                <div className="hidden grid-cols-[minmax(0,1.5fr),1fr,110px,160px] gap-4 bg-[#1a0f12] px-5 py-4 text-xs uppercase tracking-[0.16em] text-[#c9a84c]/70 md:grid">
                                    <span>Aluno</span>
                                    <span>Casa</span>
                                    <span>Pontos</span>
                                    <span>Ação</span>
                                </div>

                                {isLoadingStudents ? (
                                    <div className="px-5 py-10 text-center text-[#d6c9a5]/70">Carregando alunos...</div>
                                ) : filteredStudents.length === 0 ? (
                                    <div className="px-5 py-10 text-center text-[#d6c9a5]/70">
                                        Nenhum aluno encontrado com os filtros atuais.
                                    </div>
                                ) : (
                                    <div className="max-h-[680px] divide-y divide-[#c9a84c]/10 overflow-auto">
                                        {filteredStudents.map((student) => (
                                            <div
                                                key={student.id}
                                                className={`grid gap-3 px-5 py-4 md:grid-cols-[minmax(0,1.5fr),1fr,110px,160px] md:items-center ${selectedStudent === student.id ? 'bg-[#c9a84c]/10' : ''
                                                    }`}
                                            >
                                                <div>
                                                    <div className="font-semibold text-white">{student.nome}</div>
                                                    <div className="mt-1 text-xs text-[#d6c9a5]/60 md:hidden">{student.casa}</div>
                                                </div>
                                                <div className="hidden text-[#d6c9a5] md:block">{student.casa}</div>
                                                <div className="text-lg font-bold text-[#f4e9c8]">{student.points}</div>
                                                <button
                                                    type="button"
                                                    onClick={() => selectStudentForLaunch(student.id)}
                                                    className="rounded-lg border border-[#c9a84c]/20 px-3 py-2 text-sm text-[#f4e9c8] transition hover:bg-[#c9a84c]/10"
                                                >
                                                    Pontuar
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </section>
                    ) : null}

                    {activeTab === 'ranking' ? (
                        <section className="rounded-2xl border border-[#c9a84c]/15 bg-[#120a0d] p-6 shadow-[0_20px_80px_rgba(0,0,0,0.25)]">
                            <div className="flex items-center gap-3">
                                <div className="rounded-xl bg-white/5 p-3 text-[#c9a84c]">
                                    <Trophy size={18} />
                                </div>
                                <div>
                                    <h3 className="text-lg font-semibold text-[#f4e9c8]">Ranking das Casas</h3>
                                    <p className="mt-1 text-sm text-[#d6c9a5]/65">
                                        Consulte a liderança por casa e escolha alguém para pontuar.
                                    </p>
                                </div>
                            </div>

                            <div className="mt-5 space-y-4">
                                {topHouses.length === 0 ? (
                                    <div className="rounded-xl border border-[#c9a84c]/10 bg-black/20 px-4 py-6 text-center text-[#d6c9a5]/70">
                                        Nenhuma casa encontrada para o filtro atual.
                                    </div>
                                ) : (
                                    topHouses.map((casa, index) => (
                                        <div key={casa.id} className="rounded-xl border border-[#c9a84c]/10 bg-black/20 p-4">
                                            <div className="flex items-center justify-between gap-3">
                                                <div>
                                                    <div className="text-xs uppercase tracking-[0.16em] text-[#c9a84c]/60">
                                                        {index + 1}º lugar
                                                    </div>
                                                    <div className="mt-1 font-semibold text-[#f4e9c8]">{casa.nome}</div>
                                                </div>
                                                <div className="text-right">
                                                    <div className="text-xs uppercase tracking-[0.16em] text-[#c9a84c]/60">Pontos</div>
                                                    <div className="mt-1 text-xl font-bold text-white">{casa.points}</div>
                                                </div>
                                            </div>

                                            <div className="mt-4 space-y-2">
                                                {casa.alunos.slice(0, 5).map((student, studentIndex) => (
                                                    <div
                                                        key={student.id}
                                                        className="flex items-center justify-between gap-3 rounded-lg border border-transparent bg-white/[0.03] px-3 py-2"
                                                    >
                                                        <div className="min-w-0">
                                                            <div className="text-xs uppercase tracking-[0.16em] text-[#c9a84c]/55">
                                                                {studentIndex + 1}º da casa
                                                            </div>
                                                            <div className="truncate text-sm font-medium text-[#f4e9c8]">{student.nome}</div>
                                                        </div>
                                                        <div className="flex items-center gap-3">
                                                            <div className="text-sm font-bold text-white">{student.points} pts</div>
                                                            <button
                                                                type="button"
                                                                onClick={() => selectStudentForLaunch(student.id)}
                                                                className="rounded-lg border border-[#c9a84c]/20 px-3 py-2 text-sm text-[#f4e9c8] transition hover:bg-[#c9a84c]/10"
                                                            >
                                                                Pontuar
                                                            </button>
                                                        </div>
                                                    </div>
                                                ))}

                                                {casa.alunos.length === 0 ? (
                                                    <div className="rounded-lg border border-dashed border-[#c9a84c]/10 px-3 py-3 text-sm text-[#d6c9a5]/55">
                                                        Nenhum aluno ativo nesta casa.
                                                    </div>
                                                ) : null}
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </section>
                    ) : null}
                </div>
            </div>
        </div>
    );
};

interface SidebarTabProps {
    active: boolean;
    icon: React.ReactNode;
    title: string;
    description: string;
    onClick: () => void;
}

const SidebarTab: React.FC<SidebarTabProps> = ({ active, icon, title, description, onClick }) => (
    <button
        type="button"
        onClick={onClick}
        className={`flex w-full items-start gap-3 rounded-xl border px-4 py-3 text-left transition ${active
            ? 'border-[#c9a84c]/30 bg-[#c9a84c]/10 text-white'
            : 'border-transparent bg-black/20 text-[#d6c9a5]/75 hover:border-[#c9a84c]/15 hover:bg-[#c9a84c]/5'
            }`}
    >
        <div className="mt-0.5 text-[#c9a84c]">{icon}</div>
        <div>
            <div className="font-semibold">{title}</div>
            <div className="mt-1 text-sm opacity-75">{description}</div>
        </div>
    </button>
);

interface InfoPillProps {
    label: string;
    value: string;
}

const InfoPill: React.FC<InfoPillProps> = ({ label, value }) => (
    <div className="rounded-lg border border-[#c9a84c]/10 bg-white/[0.03] px-3 py-3">
        <div className="text-xs uppercase tracking-[0.16em] text-[#c9a84c]/60">{label}</div>
        <div className="mt-2 text-sm font-medium text-[#f4e9c8]">{value}</div>
    </div>
);

export default PontuacaoForm;
