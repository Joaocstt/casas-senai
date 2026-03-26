import React, { useEffect, useMemo, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { Award, Search, Sparkles, Trophy, Users } from 'lucide-react';
import { useAlunos } from '../../hooks/useAlunos';
import { useAuth } from '../../hooks/useAuth';
import { useCasas } from '../../hooks/useCasas';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

const categories = [
    'Mérito Acadêmico',
    'Participação em Evento',
    'Comportamento Exemplar',
    'Organização de Atividade',
    'Infração (Negativo)',
    'Outros',
];

type PontuarTab = 'launch' | 'students' | 'ranking';

const PontuacaoForm: React.FC = () => {
    const queryClient = useQueryClient();
    const { user } = useAuth();
    const { data: students = [], isLoading: isLoadingStudents } = useAlunos();
    const { data: casas = [], isLoading: isLoadingCasas } = useCasas();
    const [activeTab, setActiveTab] = useState<PontuarTab>('launch');
    const [selectedStudent, setSelectedStudent] = useState('');
    const [selectedCasaId, setSelectedCasaId] = useState('');
    const [studentQuery, setStudentQuery] = useState('');
    const [category, setCategory] = useState(categories[0]);
    const [points, setPoints] = useState<number>(0);
    const [observation, setObservation] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const selectableStudents = useMemo(
        () => students.filter((student) => student.status !== 'INATIVO'),
        [students]
    );

    const filteredStudents = useMemo(() => {
        const query = studentQuery.trim().toLowerCase();

        return selectableStudents
            .filter((student) => !selectedCasaId || student.casaId === selectedCasaId)
            .filter((student) => !query || `${student.nome} ${student.casa}`.toLowerCase().includes(query))
            .sort((a, b) => b.points - a.points || a.nome.localeCompare(b.nome, 'pt-BR'));
    }, [selectableStudents, selectedCasaId, studentQuery]);

    const selectedStudentData = useMemo(
        () => selectableStudents.find((student) => student.id === selectedStudent),
        [selectableStudents, selectedStudent]
    );

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

    const isNegativeCategory = category === 'Infração (Negativo)';

    useEffect(() => {
        if (selectedStudent && !filteredStudents.some((student) => student.id === selectedStudent)) {
            setSelectedStudent('');
        }
    }, [filteredStudents, selectedStudent]);

    const handleCategoryChange = (value: string) => {
        setCategory(value);

        if (value === 'Infração (Negativo)' && points > 0) {
            setPoints(-points);
        }

        if (value !== 'Infração (Negativo)' && points < 0) {
            setPoints(Math.abs(points));
        }
    };

    const handlePointsChange = (value: string) => {
        const numericValue = Number(value);

        if (Number.isNaN(numericValue)) {
            setPoints(0);
            return;
        }

        setPoints(isNegativeCategory ? -Math.abs(numericValue) : numericValue);
    };

    const clearFilters = () => {
        setSelectedCasaId('');
        setStudentQuery('');
    };

    const clearForm = () => {
        setSelectedStudent('');
        setCategory(categories[0]);
        setPoints(0);
        setObservation('');
    };

    const selectStudentForLaunch = (studentId: string) => {
        setSelectedStudent(studentId);
        setActiveTab('launch');
    };

    const handleSubmit = async (event: React.FormEvent) => {
        event.preventDefault();

        if (!selectedStudent || points === 0) {
            toast.error('Selecione um aluno e informe uma pontuação diferente de zero.');
            return;
        }

        setIsSubmitting(true);

        try {
            const response = await fetch(`${API_URL}/api/pontuacao`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('arcanum_token')}`,
                },
                body: JSON.stringify({
                    alunoId: selectedStudent,
                    categoria: category,
                    valor: points,
                    observacao: observation.trim(),
                    criadoPor: user?.nome || 'Admin',
                }),
            });

            if (!response.ok) {
                throw new Error('Erro ao registrar pontuação');
            }

            await Promise.all([
                queryClient.invalidateQueries({ queryKey: ['alunos'] }),
                queryClient.invalidateQueries({ queryKey: ['casas'] }),
                queryClient.invalidateQueries({ queryKey: ['casa'] }),
            ]);

            toast.success('Pontuação registrada com sucesso!');
            setPoints(0);
            setObservation('');
        } catch (error) {
            toast.error(error instanceof Error ? error.message : 'Falha na conexão com o servidor');
        } finally {
            setIsSubmitting(false);
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
                                    <Award size={22} />
                                </div>
                                <div>
                                    <h3 className="text-lg font-semibold text-[#f4e9c8]">Lançar Pontos</h3>
                                    <p className="mt-1 text-sm text-[#d6c9a5]/65">
                                        Escolha um aluno e registre o ajuste de forma objetiva.
                                    </p>
                                </div>
                            </div>

                            <form onSubmit={handleSubmit} className="mt-6 space-y-5">
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
                                    <div className="grid gap-3 rounded-xl border border-[#c9a84c]/10 bg-black/20 p-4 md:grid-cols-3">
                                        <InfoPill label="Casa" value={selectedStudentData.casa} />
                                        <InfoPill label="Pontos" value={`${selectedStudentData.points} pts`} />
                                        <InfoPill label="Posição" value={rankingInHouse ? `${rankingInHouse}º lugar` : '-'} />
                                    </div>
                                ) : null}

                                <div className="grid gap-4 md:grid-cols-[minmax(0,1fr),160px]">
                                    <div>
                                        <label className="mb-2 block text-sm font-medium text-[#c9a84c]">Categoria</label>
                                        <select
                                            value={category}
                                            onChange={(event) => handleCategoryChange(event.target.value)}
                                            className="w-full rounded-lg border border-[#c9a84c]/25 bg-black/40 px-4 py-3 text-white outline-none transition-colors focus:border-[#c9a84c]"
                                        >
                                            {categories.map((item) => (
                                                <option key={item} value={item}>
                                                    {item}
                                                </option>
                                            ))}
                                        </select>
                                    </div>

                                    <div>
                                        <label className="mb-2 block text-sm font-medium text-[#c9a84c]">Pontos</label>
                                        <input
                                            type="number"
                                            value={points}
                                            onChange={(event) => handlePointsChange(event.target.value)}
                                            className="w-full rounded-lg border border-[#c9a84c]/25 bg-black/40 px-4 py-3 text-white outline-none transition-colors focus:border-[#c9a84c]"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="mb-2 block text-sm font-medium text-[#c9a84c]">Observação</label>
                                    <textarea
                                        value={observation}
                                        onChange={(event) => setObservation(event.target.value)}
                                        className="h-28 w-full rounded-lg border border-[#c9a84c]/25 bg-black/40 px-4 py-3 text-white outline-none transition-colors focus:border-[#c9a84c]"
                                        placeholder="Motivo da pontuação"
                                    />
                                </div>

                                <div className="grid gap-3 sm:grid-cols-2">
                                    <button
                                        type="submit"
                                        disabled={isSubmitting || isLoadingStudents || filteredStudents.length === 0}
                                        className="flex w-full items-center justify-center gap-2 rounded-lg bg-[#c9a84c] px-4 py-3 font-bold text-black transition hover:bg-[#b08e35] disabled:cursor-not-allowed disabled:opacity-50"
                                    >
                                        <Sparkles size={18} />
                                        {isSubmitting ? 'Registrando...' : 'Confirmar Lançamento'}
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
                                                className={`grid gap-3 px-5 py-4 md:grid-cols-[minmax(0,1.5fr),1fr,110px,160px] md:items-center ${
                                                    selectedStudent === student.id ? 'bg-[#c9a84c]/10' : ''
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
        className={`flex w-full items-start gap-3 rounded-xl border px-4 py-3 text-left transition ${
            active
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
