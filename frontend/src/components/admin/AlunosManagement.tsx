import React, { useEffect, useMemo, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { AlertTriangle, Pencil, UserMinus, UserPlus, X, Search } from 'lucide-react';
import { useAlunos } from '../../hooks/useAlunos';
import { useAuth } from '../../hooks/useAuth';
import { useCasas } from '../../hooks/useCasas';
import type { Aluno, Status } from '../../types/arcanum';

const API_URL = import.meta.env.VITE_API_URL || '';

type FilterStatus = Status | 'TODOS';

const statusOptions: FilterStatus[] = ['TODOS', 'ATIVO', 'MONITORADO', 'INATIVO'];

const initialForm = {
    nome: '',
    casaId: '',
    status: 'ATIVO' as Status,
    faltas: 0,
};

const statusLabel: Record<Status, string> = {
    ATIVO: 'Ativo',
    INATIVO: 'Inativo',
    MONITORADO: 'Monitorado',
};

const statusClasses: Record<Status, string> = {
    ATIVO: 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/20',
    INATIVO: 'bg-zinc-500/15 text-zinc-300 border border-zinc-500/20',
    MONITORADO: 'bg-amber-500/15 text-amber-300 border border-amber-500/20',
};

const AlunosManagement: React.FC = () => {
    const queryClient = useQueryClient();
    const { user } = useAuth();
    const [selectedCasaId, setSelectedCasaId] = useState('');
    const [selectedStatus, setSelectedStatus] = useState<FilterStatus>('TODOS');
    const [editingAluno, setEditingAluno] = useState<Aluno | null>(null);
    const [formData, setFormData] = useState(initialForm);
    const [infracaoTipo, setInfracaoTipo] = useState('Infração disciplinar');
    const [infracaoDescricao, setInfracaoDescricao] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isSubmittingInfracao, setIsSubmittingInfracao] = useState(false);
    const [studentQuery, setStudentQuery] = useState('');

    const { data: casas = [], isLoading: isLoadingCasas } = useCasas();
    const { data: alunos = [], isLoading: isLoadingAlunos } = useAlunos(selectedCasaId || undefined, selectedStatus);

    useEffect(() => {
        if (!editingAluno && !formData.casaId && casas.length > 0) {
            setFormData((current) => ({ ...current, casaId: casas[0].id }));
        }
    }, [casas, editingAluno, formData.casaId]);

    useEffect(() => {
        if (!editingAluno) {
            return;
        }

        const refreshedAluno = alunos.find((aluno) => aluno.id === editingAluno.id);
        if (refreshedAluno) {
            setEditingAluno(refreshedAluno);
        }
    }, [alunos, editingAluno]);

    const totalPoints = useMemo(
        () => alunos.reduce((acc, aluno) => acc + aluno.points, 0),
        [alunos]
    );

    const filteredAlunos = useMemo(() => {
        const normalize = (str: string) => str.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
        const query = normalize(studentQuery.trim());
        const searchWords = query.split(/\s+/).filter(Boolean);

        return alunos.filter((aluno) => {
            if (searchWords.length === 0) return true;
            const studentData = normalize(`${aluno.nome} ${aluno.casa}`);
            return searchWords.every(word => studentData.includes(word));
        });
    }, [alunos, studentQuery]);

    const refreshData = async () => {
        await Promise.all([
            queryClient.invalidateQueries({ queryKey: ['alunos'] }),
            queryClient.invalidateQueries({ queryKey: ['casas'] }),
            queryClient.invalidateQueries({ queryKey: ['casa'] }),
        ]);
    };

    const resetForm = () => {
        setEditingAluno(null);
        setFormData({
            ...initialForm,
            casaId: casas[0]?.id || '',
        });
        setInfracaoTipo('Infração disciplinar');
        setInfracaoDescricao('');
    };

    const handleSubmit = async (event: React.FormEvent) => {
        event.preventDefault();

        if (!formData.nome.trim() || !formData.casaId) {
            toast.error('Preencha o nome e selecione uma casa');
            return;
        }

        setIsSubmitting(true);

        try {
            const payload = {
                nome: formData.nome.trim(),
                casaId: formData.casaId,
                status: formData.status,
                faltas: Math.max(0, Number(formData.faltas) || 0),
            };

            const response = await fetch(
                editingAluno ? `${API_URL}/api/alunos/${editingAluno.id}` : `${API_URL}/api/alunos`,
                {
                    method: editingAluno ? 'PUT' : 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload),
                }
            );

            if (!response.ok) {
                throw new Error(editingAluno ? 'Erro ao atualizar aluno' : 'Erro ao criar aluno');
            }

            toast.success(editingAluno ? 'Aluno atualizado com sucesso!' : 'Aluno criado com sucesso!');
            resetForm();
            await refreshData();
        } catch (error) {
            toast.error(error instanceof Error ? error.message : 'Falha ao salvar aluno');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleEdit = (aluno: Aluno) => {
        setEditingAluno(aluno);
        setFormData({
            nome: aluno.nome,
            casaId: aluno.casaId,
            status: aluno.status,
            faltas: aluno.faltas,
        });
    };

    const handleDeactivate = async (aluno: Aluno) => {
        const actionLabel = aluno.status === 'INATIVO' ? 'reativar' : 'desativar';

        try {
            const response = await fetch(`${API_URL}/api/alunos/${aluno.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    nome: aluno.nome,
                    casaId: aluno.casaId,
                    status: aluno.status === 'INATIVO' ? 'ATIVO' : 'INATIVO',
                    faltas: aluno.faltas,
                }),
            });

            if (!response.ok) {
                throw new Error(`Erro ao ${actionLabel} aluno`);
            }

            toast.success(`Aluno ${actionLabel}do com sucesso!`);
            if (editingAluno?.id === aluno.id) {
                resetForm();
            }
            await refreshData();
        } catch (error) {
            toast.error(error instanceof Error ? error.message : `Falha ao ${actionLabel} aluno`);
        }
    };

    const handleRegistrarInfracao = async (event: React.FormEvent) => {
        event.preventDefault();

        if (!editingAluno) {
            toast.error('Selecione um aluno para registrar a infração.');
            return;
        }

        setIsSubmittingInfracao(true);

        try {
            const response = await fetch(`${API_URL}/api/alunos/${editingAluno.id}/infracoes`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    tipo: infracaoTipo.trim(),
                    descricao: infracaoDescricao.trim(),
                    criadoPor: user?.nome || 'Admin',
                }),
            });

            if (!response.ok) {
                throw new Error('Erro ao registrar infração');
            }

            toast.success('Infração registrada com sucesso!');
            setInfracaoTipo('Infração disciplinar');
            setInfracaoDescricao('');
            await refreshData();
        } catch (error) {
            toast.error(error instanceof Error ? error.message : 'Falha ao registrar infração');
        } finally {
            setIsSubmittingInfracao(false);
        }
    };

    return (
        <div className="p-6 md:p-8 space-y-8">
            <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
                <div>
                    <h2 className="text-2xl font-['Cinzel_Decorative'] text-[#c9a84c]">Gestão de Alunos</h2>
                    <p className="text-sm text-[#d6c9a5]/70 mt-2">
                        Cadastre, edite e organize os alunos por casa e status.
                    </p>
                </div>
                <div className="grid grid-cols-2 gap-3 md:flex">
                    <div className="rounded-lg border border-[#c9a84c]/15 bg-[#1a0f12] px-4 py-3">
                        <div className="text-xs uppercase tracking-[0.16em] text-[#c9a84c]/70">Alunos</div>
                        <div className="text-xl font-bold">{alunos.length}</div>
                    </div>
                    <div className="rounded-lg border border-[#c9a84c]/15 bg-[#1a0f12] px-4 py-3">
                        <div className="text-xs uppercase tracking-[0.16em] text-[#c9a84c]/70">Pontos Filtrados</div>
                        <div className="text-xl font-bold">{totalPoints}</div>
                    </div>
                </div>
            </div>

            <div className="grid gap-6 xl:grid-cols-[420px,minmax(0,1fr)]">
                <section className="space-y-6">
                    <section className="rounded-2xl border border-[#c9a84c]/15 bg-[#1a0f12] p-6 shadow-[0_20px_80px_rgba(0,0,0,0.25)]">
                        <div className="flex items-center justify-between">
                            <div>
                                <h3 className="text-lg font-semibold text-[#f4e9c8]">
                                    {editingAluno ? 'Editar Aluno' : 'Novo Aluno'}
                                </h3>
                                <p className="mt-1 text-sm text-[#d6c9a5]/65">
                                    {editingAluno ? 'Atualize os dados do aluno selecionado.' : 'Cadastre um novo aluno na casa desejada.'}
                                </p>
                            </div>
                            {editingAluno ? (
                                <button
                                    type="button"
                                    onClick={resetForm}
                                    className="rounded-full border border-[#c9a84c]/20 p-2 text-[#d6c9a5]/70 transition-colors hover:text-white"
                                    aria-label="Cancelar edição"
                                >
                                    <X size={16} />
                                </button>
                            ) : null}
                        </div>

                        <form onSubmit={handleSubmit} className="mt-6 space-y-5">
                            <div>
                                <label className="mb-2 block text-sm font-medium text-[#c9a84c]">Nome</label>
                                <input
                                    type="text"
                                    value={formData.nome}
                                    onChange={(event) => setFormData((current) => ({ ...current, nome: event.target.value }))}
                                    placeholder="Ex.: Maria Cecília"
                                    className="w-full rounded-lg border border-[#c9a84c]/25 bg-black/40 px-4 py-3 text-white outline-none transition-colors focus:border-[#c9a84c]"
                                />
                            </div>

                            <div>
                                <label className="mb-2 block text-sm font-medium text-[#c9a84c]">Casa</label>
                                <select
                                    value={formData.casaId}
                                    onChange={(event) => setFormData((current) => ({ ...current, casaId: event.target.value }))}
                                    disabled={isLoadingCasas}
                                    className="w-full rounded-lg border border-[#c9a84c]/25 bg-black/40 px-4 py-3 text-white outline-none transition-colors focus:border-[#c9a84c]"
                                >
                                    {casas.map((casa) => (
                                        <option key={casa.id} value={casa.id}>
                                            {casa.nome}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="mb-2 block text-sm font-medium text-[#c9a84c]">Status</label>
                                <select
                                    value={formData.status}
                                    onChange={(event) =>
                                        setFormData((current) => ({ ...current, status: event.target.value as Status }))
                                    }
                                    className="w-full rounded-lg border border-[#c9a84c]/25 bg-black/40 px-4 py-3 text-white outline-none transition-colors focus:border-[#c9a84c]"
                                >
                                    <option value="ATIVO">Ativo</option>
                                    <option value="MONITORADO">Monitorado</option>
                                    <option value="INATIVO">Inativo</option>
                                </select>
                            </div>

                            <div>
                                <label className="mb-2 block text-sm font-medium text-[#c9a84c]">Faltas</label>
                                <input
                                    type="number"
                                    min={0}
                                    value={formData.faltas}
                                    onChange={(event) =>
                                        setFormData((current) => ({
                                            ...current,
                                            faltas: Math.max(0, Number(event.target.value) || 0),
                                        }))
                                    }
                                    className="w-full rounded-lg border border-[#c9a84c]/25 bg-black/40 px-4 py-3 text-white outline-none transition-colors focus:border-[#c9a84c]"
                                />
                            </div>

                            <button
                                type="submit"
                                disabled={isSubmitting || isLoadingCasas}
                                className="flex w-full items-center justify-center gap-2 rounded-lg bg-[#c9a84c] px-4 py-3 font-bold text-black transition hover:bg-[#b08e35] disabled:cursor-not-allowed disabled:opacity-50"
                            >
                                <UserPlus size={18} />
                                {isSubmitting ? 'Salvando...' : editingAluno ? 'Salvar Alterações' : 'Cadastrar Aluno'}
                            </button>
                        </form>
                    </section>

                    <section className="rounded-2xl border border-[#c9a84c]/15 bg-[#120a0d] p-6 shadow-[0_20px_80px_rgba(0,0,0,0.25)]">
                        <div className="flex items-start gap-3">
                            <div className="rounded-2xl bg-[#c9a84c]/12 p-3 text-[#c9a84c]">
                                <AlertTriangle size={20} />
                            </div>
                            <div>
                                <h3 className="text-lg font-semibold text-[#f4e9c8]">Controle de Penalização</h3>
                                <p className="mt-1 text-sm text-[#d6c9a5]/65">
                                    {editingAluno
                                        ? 'Registre infrações individuais e acompanhe a penalização calculada automaticamente.'
                                        : 'Selecione um aluno na lista para controlar faltas e infrações.'}
                                </p>
                            </div>
                        </div>

                        {editingAluno ? (
                            <div className="mt-6 space-y-5">
                                <div className="rounded-xl border border-[#c9a84c]/10 bg-black/20 p-4">
                                    <div className="text-sm text-[#d6c9a5]/75">{editingAluno.nome}</div>
                                    <div className="mt-3 grid gap-3 sm:grid-cols-2">
                                        <SummaryCard label="Infrações" value={editingAluno.totalInfracoes} />
                                        <SummaryCard label="Faltas" value={editingAluno.faltas} />
                                    </div>
                                </div>

                                <form onSubmit={handleRegistrarInfracao} className="space-y-4">
                                    <div>
                                        <label className="mb-2 block text-sm font-medium text-[#c9a84c]">Tipo da infração</label>
                                        <input
                                            type="text"
                                            value={infracaoTipo}
                                            onChange={(event) => setInfracaoTipo(event.target.value)}
                                            className="w-full rounded-lg border border-[#c9a84c]/25 bg-black/40 px-4 py-3 text-white outline-none transition-colors focus:border-[#c9a84c]"
                                        />
                                    </div>

                                    <div>
                                        <label className="mb-2 block text-sm font-medium text-[#c9a84c]">Descrição</label>
                                        <textarea
                                            value={infracaoDescricao}
                                            onChange={(event) => setInfracaoDescricao(event.target.value)}
                                            rows={3}
                                            placeholder="Descreva a ocorrência"
                                            className="w-full rounded-lg border border-[#c9a84c]/25 bg-black/40 px-4 py-3 text-white outline-none transition-colors focus:border-[#c9a84c]"
                                        />
                                    </div>

                                    <button
                                        type="submit"
                                        disabled={isSubmittingInfracao}
                                        className="flex w-full items-center justify-center gap-2 rounded-lg border border-[#c9a84c]/25 px-4 py-3 font-semibold text-[#f4e9c8] transition hover:bg-[#c9a84c]/10 disabled:cursor-not-allowed disabled:opacity-50"
                                    >
                                        <AlertTriangle size={16} />
                                        {isSubmittingInfracao ? 'Registrando...' : 'Registrar Infração'}
                                    </button>
                                </form>

                                <div>
                                    <div className="mb-3 text-xs uppercase tracking-[0.16em] text-[#c9a84c]/70">Histórico de Infrações</div>
                                    <div className="space-y-3">
                                        {editingAluno.infracoes.length === 0 ? (
                                            <div className="rounded-lg border border-[#c9a84c]/10 bg-black/20 px-4 py-3 text-sm text-[#d6c9a5]/65">
                                                Nenhuma infração registrada para este aluno.
                                            </div>
                                        ) : (
                                            editingAluno.infracoes.map((infracao) => (
                                                <div key={infracao.id} className="rounded-lg border border-[#c9a84c]/10 bg-black/20 px-4 py-3">
                                                    <div className="flex items-center justify-between gap-3">
                                                        <div className="font-medium text-[#f4e9c8]">{infracao.tipo || 'Infração'}</div>
                                                        <div className="text-xs text-[#d6c9a5]/60">
                                                            {new Date(infracao.criadoEm).toLocaleString('pt-BR')}
                                                        </div>
                                                    </div>
                                                    {infracao.descricao ? (
                                                        <div className="mt-2 text-sm text-[#d6c9a5]/75">{infracao.descricao}</div>
                                                    ) : null}
                                                    {infracao.criadoPor ? (
                                                        <div className="mt-2 text-xs text-[#c9a84c]/65">Registrado por {infracao.criadoPor}</div>
                                                    ) : null}
                                                </div>
                                            ))
                                        )}
                                    </div>
                                </div>
                            </div>
                        ) : null}
                    </section>
                </section>

                <section className="rounded-2xl border border-[#c9a84c]/15 bg-[#120a0d] p-6 shadow-[0_20px_80px_rgba(0,0,0,0.25)]">
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
                        <div>
                            <h3 className="text-lg font-semibold text-[#f4e9c8]">Lista de Alunos</h3>
                            <p className="mt-1 text-sm text-[#d6c9a5]/65">
                                Filtre por casa ou status para localizar alunos rapidamente.
                            </p>
                        </div>

                        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
                            <div>
                                <label className="mb-2 block text-xs uppercase tracking-[0.16em] text-[#c9a84c]/70">
                                    Casa
                                </label>
                                <select
                                    value={selectedCasaId}
                                    onChange={(event) => setSelectedCasaId(event.target.value)}
                                    className="w-full rounded-lg border border-[#c9a84c]/25 bg-black/40 px-4 py-3 text-white outline-none transition-colors focus:border-[#c9a84c]"
                                >
                                    <option value="">Todas as casas</option>
                                    {casas.map((casa) => (
                                        <option key={casa.id} value={casa.id}>
                                            {casa.nome}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="mb-2 block text-xs uppercase tracking-[0.16em] text-[#c9a84c]/70">
                                    Status
                                </label>
                                <select
                                    value={selectedStatus}
                                    onChange={(event) => setSelectedStatus(event.target.value as FilterStatus)}
                                    className="w-full rounded-lg border border-[#c9a84c]/25 bg-black/40 px-4 py-3 text-white outline-none transition-colors focus:border-[#c9a84c]"
                                >
                                    {statusOptions.map((status) => (
                                        <option key={status} value={status}>
                                            {status === 'TODOS' ? 'Todos' : statusLabel[status]}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div className="md:col-span-2 lg:col-span-1">
                                <label className="mb-2 block text-xs uppercase tracking-[0.16em] text-[#c9a84c]/70">
                                    Buscar Aluno
                                </label>
                                <div className="relative">
                                    <input
                                        type="text"
                                        placeholder="Nome ou Casa..."
                                        value={studentQuery}
                                        onChange={(event) => setStudentQuery(event.target.value)}
                                        className="w-full rounded-lg border border-[#c9a84c]/25 bg-black/40 px-4 py-3 text-white outline-none transition-colors focus:border-[#c9a84c]"
                                    />
                                    <div className="absolute right-3 top-1/2 -translate-y-1/2 text-[#c9a84c]/40">
                                        <Search size={18} />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="mt-6 overflow-hidden rounded-xl border border-[#c9a84c]/10">
                        <div className="hidden grid-cols-[minmax(0,1.4fr),1fr,130px,90px,90px,120px,170px] gap-4 bg-[#1a0f12] px-5 py-4 text-xs uppercase tracking-[0.16em] text-[#c9a84c]/70 md:grid">
                            <span>Aluno</span>
                            <span>Casa</span>
                            <span>Status</span>
                            <span>Faltas</span>
                            <span>Infrações</span>
                            <span>Pontos</span>
                            <span>Ações</span>
                        </div>

                        {isLoadingAlunos ? (
                            <div className="px-5 py-10 text-center text-[#d6c9a5]/70">Carregando alunos...</div>
                        ) : filteredAlunos.length === 0 ? (
                            <div className="px-5 py-10 text-center text-[#d6c9a5]/70">
                                Nenhum aluno encontrado para os filtros selecionados.
                            </div>
                        ) : (
                            <div className="divide-y divide-[#c9a84c]/10">
                                {filteredAlunos.map((aluno) => (
                                    <div
                                        key={aluno.id}
                                        className="grid gap-4 px-5 py-4 md:grid-cols-[minmax(0,1.4fr),1fr,130px,90px,90px,120px,170px] md:items-center"
                                    >
                                        <div>
                                            <div className="font-semibold text-white">{aluno.nome}</div>
                                            <div className="mt-1 text-xs text-[#d6c9a5]/60 md:hidden">
                                                {aluno.casa} | {aluno.faltas} faltas | {aluno.totalInfracoes} infrações
                                            </div>
                                        </div>
                                        <div className="hidden text-[#d6c9a5] md:block">{aluno.casa}</div>
                                        <div>
                                            <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${statusClasses[aluno.status]}`}>
                                                {statusLabel[aluno.status]}
                                            </span>
                                        </div>
                                        <div className="text-[#f4e9c8]">{aluno.faltas}</div>
                                        <div className="text-[#f4e9c8]">{aluno.totalInfracoes}</div>
                                        <div className="text-lg font-bold text-[#f4e9c8]">{aluno.points}</div>
                                        <div className="flex flex-wrap gap-2">
                                            <button
                                                type="button"
                                                onClick={() => handleEdit(aluno)}
                                                className="inline-flex items-center gap-2 rounded-lg border border-[#c9a84c]/20 px-3 py-2 text-sm text-[#f4e9c8] transition hover:bg-[#c9a84c]/10"
                                            >
                                                <Pencil size={16} />
                                                Editar
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => handleDeactivate(aluno)}
                                                className="inline-flex items-center gap-2 rounded-lg border border-red-400/20 px-3 py-2 text-sm text-red-300 transition hover:bg-red-400/10"
                                            >
                                                {aluno.status === 'INATIVO' ? <UserPlus size={16} /> : <UserMinus size={16} />}
                                                {aluno.status === 'INATIVO' ? 'Reativar' : 'Desativar'}
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </section >
            </div >
        </div >
    );
};

const SummaryCard: React.FC<{ label: string; value: string | number }> = ({ label, value }) => (
    <div className="rounded-lg border border-[#c9a84c]/10 bg-[#1a0f12] px-4 py-3">
        <div className="text-xs uppercase tracking-[0.16em] text-[#c9a84c]/70">{label}</div>
        <div className="mt-2 text-lg font-bold text-[#f4e9c8]">{value}</div>
    </div>
);

export default AlunosManagement;
