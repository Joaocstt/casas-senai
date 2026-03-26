import React, { useMemo, useState } from 'react';
import { BarChart3, Calendar, Download, Filter, List, Trophy, Users } from 'lucide-react';
import { useAlunos } from '../../hooks/useAlunos';
import { useCasas } from '../../hooks/useCasas';
import { useHistoricoGlobal } from '../../hooks/useHistoricoGlobal';
import type { HistoricoLancamento } from '../../types/arcanum';

type HistoricoTab = 'lancamentos' | 'casas' | 'alunos';

const formatSignedPoints = (value: number) => `${value > 0 ? '+' : ''}${value}`;

const formatDate = (value: string) =>
    new Intl.DateTimeFormat('pt-BR', {
        dateStyle: 'short',
        timeStyle: 'short',
    }).format(new Date(value));

const HistoricoGlobal: React.FC = () => {
    const [activeTab, setActiveTab] = useState<HistoricoTab>('lancamentos');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [casaId, setCasaId] = useState('');
    const [alunoId, setAlunoId] = useState('');
    const [categoria, setCategoria] = useState('');
    const [tipo, setTipo] = useState('');
    const [criadoPor, setCriadoPor] = useState('');

    const { data: casas = [] } = useCasas();
    const { data: alunos = [] } = useAlunos();
    const { data, isLoading, error } = useHistoricoGlobal({
        startDate,
        endDate,
        casaId,
        alunoId,
        categoria,
        tipo,
        criadoPor,
    });

    const filteredAlunos = useMemo(
        () => alunos.filter((aluno) => !casaId || aluno.casaId === casaId),
        [alunos, casaId]
    );

    const exportCsv = () => {
        if (!data?.lancamentos.length) {
            return;
        }

        const header = ['Data', 'Aluno', 'Casa', 'Categoria', 'Valor', 'Tipo', 'Criado Por', 'Observacao'];
        const rows = data.lancamentos.map((registro) => [
            formatDate(registro.criadoEm),
            registro.alunoNome,
            registro.casaNome,
            registro.categoria,
            String(registro.valor),
            registro.tipo,
            registro.criadoPor,
            (registro.observacao || '').replace(/\n/g, ' '),
        ]);

        const csv = [header, ...rows]
            .map((row) => row.map((cell) => `"${cell.replace(/"/g, '""')}"`).join(','))
            .join('\n');

        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = 'historico-global.csv';
        link.click();
        URL.revokeObjectURL(url);
    };

    const clearFilters = () => {
        setStartDate('');
        setEndDate('');
        setCasaId('');
        setAlunoId('');
        setCategoria('');
        setTipo('');
        setCriadoPor('');
    };

    return (
        <div className="p-6 md:p-8 space-y-8">
            <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
                <div>
                    <h2 className="text-2xl font-['Cinzel_Decorative'] text-[#c9a84c]">Histórico Global</h2>
                    <p className="mt-2 text-sm text-[#d6c9a5]/70">
                        Acompanhe lançamentos, desempenho por casa e movimentação por aluno em um só lugar.
                    </p>
                </div>

                <button
                    type="button"
                    onClick={exportCsv}
                    disabled={!data?.lancamentos.length}
                    className="inline-flex items-center gap-2 rounded-lg border border-[#c9a84c]/20 px-4 py-3 text-[#f4e9c8] transition hover:bg-[#c9a84c]/10 disabled:cursor-not-allowed disabled:opacity-50"
                >
                    <Download size={18} />
                    Exportar CSV
                </button>
            </div>

            <section className="rounded-2xl border border-[#c9a84c]/15 bg-[#120a0d] p-5 shadow-[0_20px_80px_rgba(0,0,0,0.25)]">
                <div className="mb-4 flex items-center gap-3">
                    <div className="rounded-xl bg-white/5 p-3 text-[#c9a84c]">
                        <Filter size={18} />
                    </div>
                    <div>
                        <h3 className="text-base font-semibold text-[#f4e9c8]">Filtros</h3>
                        <p className="text-sm text-[#d6c9a5]/65">Refine o período, a casa, a categoria ou o responsável.</p>
                    </div>
                </div>

                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                    <FilterField label="Data inicial" icon={<Calendar size={16} className="text-[#c9a84c]/70" />}>
                        <input
                            type="date"
                            value={startDate}
                            onChange={(event) => setStartDate(event.target.value)}
                            className="w-full bg-transparent text-white outline-none"
                        />
                    </FilterField>

                    <FilterField label="Data final" icon={<Calendar size={16} className="text-[#c9a84c]/70" />}>
                        <input
                            type="date"
                            value={endDate}
                            onChange={(event) => setEndDate(event.target.value)}
                            className="w-full bg-transparent text-white outline-none"
                        />
                    </FilterField>

                    <SelectField label="Casa" value={casaId} onChange={setCasaId}>
                        <option value="">Todas as casas</option>
                        {casas.map((casa) => (
                            <option key={casa.id} value={casa.id}>
                                {casa.nome}
                            </option>
                        ))}
                    </SelectField>

                    <SelectField label="Aluno" value={alunoId} onChange={setAlunoId}>
                        <option value="">Todos os alunos</option>
                        {filteredAlunos.map((aluno) => (
                            <option key={aluno.id} value={aluno.id}>
                                {aluno.nome}
                            </option>
                        ))}
                    </SelectField>

                    <SelectField label="Categoria" value={categoria} onChange={setCategoria}>
                        <option value="">Todas as categorias</option>
                        {data?.categorias.map((item) => (
                            <option key={item} value={item}>
                                {item}
                            </option>
                        ))}
                    </SelectField>

                    <SelectField label="Tipo" value={tipo} onChange={setTipo}>
                        <option value="">Todos</option>
                        <option value="positivo">Positivo</option>
                        <option value="negativo">Negativo</option>
                    </SelectField>

                    <SelectField label="Responsável" value={criadoPor} onChange={setCriadoPor}>
                        <option value="">Todos</option>
                        {data?.autores.map((autor) => (
                            <option key={autor} value={autor}>
                                {autor}
                            </option>
                        ))}
                    </SelectField>

                    <div className="flex items-end">
                        <button
                            type="button"
                            onClick={clearFilters}
                            className="w-full rounded-lg border border-[#c9a84c]/20 px-4 py-3 text-[#f4e9c8] transition hover:bg-[#c9a84c]/10"
                        >
                            Limpar filtros
                        </button>
                    </div>
                </div>
            </section>

            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                <SummaryCard label="Registros" value={data?.resumo.totalRegistros ?? 0} />
                <SummaryCard label="Saldo do período" value={formatSignedPoints(data?.resumo.saldoTotal ?? 0)} />
                <SummaryCard label="Entradas" value={formatSignedPoints(data?.resumo.totalPositivo ?? 0)} positive />
                <SummaryCard label="Saídas" value={formatSignedPoints(data?.resumo.totalNegativo ?? 0)} negative />
            </div>

            <div className="grid gap-6 xl:grid-cols-[220px,minmax(0,1fr)]">
                <aside className="rounded-2xl border border-[#c9a84c]/15 bg-[#120a0d] p-4 shadow-[0_20px_80px_rgba(0,0,0,0.25)]">
                    <div className="space-y-2">
                        <HistoryTab
                            active={activeTab === 'lancamentos'}
                            title="Lançamentos"
                            description="Linha do tempo completa"
                            icon={<List size={18} />}
                            onClick={() => setActiveTab('lancamentos')}
                        />
                        <HistoryTab
                            active={activeTab === 'casas'}
                            title="Casas"
                            description="Saldo e volume por casa"
                            icon={<Trophy size={18} />}
                            onClick={() => setActiveTab('casas')}
                        />
                        <HistoryTab
                            active={activeTab === 'alunos'}
                            title="Alunos"
                            description="Movimentação individual"
                            icon={<Users size={18} />}
                            onClick={() => setActiveTab('alunos')}
                        />
                    </div>

                    <div className="mt-6 rounded-xl border border-[#c9a84c]/10 bg-black/20 p-4 text-sm text-[#d6c9a5]/75">
                        <div className="text-xs uppercase tracking-[0.16em] text-[#c9a84c]/60">Destaques</div>
                        <div className="mt-3">Casa líder: {data?.resumo.casaLider?.casaNome || '-'}</div>
                        <div className="mt-2">Aluno destaque: {data?.resumo.alunoDestaque?.alunoNome || '-'}</div>
                    </div>
                </aside>

                <div className="min-w-0">
                    {error ? (
                        <div className="rounded-2xl border border-red-400/20 bg-red-950/20 p-6 text-red-200">
                            <div className="font-semibold">Não foi possível carregar o histórico global.</div>
                            <div className="mt-2 text-sm text-red-100/80">
                                {error instanceof Error ? error.message : 'Verifique se o backend está ativo e atualizado.'}
                            </div>
                        </div>
                    ) : null}

                    {activeTab === 'lancamentos' ? (
                        <HistoryPanel
                            icon={<List size={18} />}
                            title="Linha do Tempo"
                            description="Cada lançamento registrado com data, casa, aluno, categoria e responsável."
                        >
                            {isLoading ? (
                                <EmptyState message="Carregando lançamentos..." />
                            ) : data?.lancamentos.length ? (
                                <div className="overflow-hidden rounded-xl border border-[#c9a84c]/10">
                                    <div className="hidden grid-cols-[150px,minmax(0,1.2fr),1fr,140px,140px,140px] gap-4 bg-[#1a0f12] px-5 py-4 text-xs uppercase tracking-[0.16em] text-[#c9a84c]/70 lg:grid">
                                        <span>Data</span>
                                        <span>Aluno</span>
                                        <span>Categoria</span>
                                        <span>Valor</span>
                                        <span>Casa</span>
                                        <span>Responsável</span>
                                    </div>

                                    <div className="divide-y divide-[#c9a84c]/10">
                                        {data.lancamentos.map((registro) => (
                                            <LancamentoRow key={registro.id} registro={registro} />
                                        ))}
                                    </div>
                                </div>
                            ) : (
                                <EmptyState message="Nenhum lançamento encontrado para os filtros atuais." />
                            )}
                        </HistoryPanel>
                    ) : null}

                    {activeTab === 'casas' ? (
                        <HistoryPanel
                            icon={<Trophy size={18} />}
                            title="Desempenho por Casa"
                            description="Saldo total, entradas e saídas acumuladas no período filtrado."
                        >
                            {isLoading ? (
                                <EmptyState message="Carregando casas..." />
                            ) : data?.casas.length ? (
                                <div className="grid gap-4 md:grid-cols-2">
                                    {data.casas.map((casa, index) => (
                                        <div key={casa.casaId} className="rounded-xl border border-[#c9a84c]/10 bg-black/20 p-5">
                                            <div className="flex items-center justify-between gap-3">
                                                <div>
                                                    <div className="text-xs uppercase tracking-[0.16em] text-[#c9a84c]/60">
                                                        {index + 1}º lugar
                                                    </div>
                                                    <div className="mt-2 font-semibold text-[#f4e9c8]">{casa.casaNome}</div>
                                                </div>
                                                <div className="text-right">
                                                    <div className="text-xs uppercase tracking-[0.16em] text-[#c9a84c]/60">Saldo</div>
                                                    <div className="mt-2 text-2xl font-bold text-white">{formatSignedPoints(casa.saldo)}</div>
                                                </div>
                                            </div>

                                            <div className="mt-4 grid gap-3 sm:grid-cols-3">
                                                <InfoTile label="Registros" value={String(casa.totalRegistros)} />
                                                <InfoTile label="Entradas" value={formatSignedPoints(casa.totalPositivo)} positive />
                                                <InfoTile label="Saídas" value={formatSignedPoints(casa.totalNegativo)} negative />
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <EmptyState message="Nenhuma casa encontrada para os filtros atuais." />
                            )}
                        </HistoryPanel>
                    ) : null}

                    {activeTab === 'alunos' ? (
                        <HistoryPanel
                            icon={<BarChart3 size={18} />}
                            title="Movimentação por Aluno"
                            description="Veja quem acumulou mais pontos e quando foi a última movimentação."
                        >
                            {isLoading ? (
                                <EmptyState message="Carregando alunos..." />
                            ) : data?.alunos.length ? (
                                <div className="overflow-hidden rounded-xl border border-[#c9a84c]/10">
                                    <div className="hidden grid-cols-[minmax(0,1.3fr),1fr,120px,120px,160px] gap-4 bg-[#1a0f12] px-5 py-4 text-xs uppercase tracking-[0.16em] text-[#c9a84c]/70 lg:grid">
                                        <span>Aluno</span>
                                        <span>Casa</span>
                                        <span>Saldo</span>
                                        <span>Registros</span>
                                        <span>Última Movimentação</span>
                                    </div>

                                    <div className="divide-y divide-[#c9a84c]/10">
                                        {data.alunos.map((aluno) => (
                                            <div
                                                key={aluno.alunoId}
                                                className="grid gap-3 px-5 py-4 lg:grid-cols-[minmax(0,1.3fr),1fr,120px,120px,160px] lg:items-center"
                                            >
                                                <div className="font-semibold text-white">{aluno.alunoNome}</div>
                                                <div className="text-[#d6c9a5]">{aluno.casaNome}</div>
                                                <div className={aluno.saldo < 0 ? 'font-bold text-red-300' : 'font-bold text-emerald-300'}>
                                                    {formatSignedPoints(aluno.saldo)}
                                                </div>
                                                <div className="text-[#f4e9c8]">{aluno.totalRegistros}</div>
                                                <div className="text-sm text-[#d6c9a5]/75">{formatDate(aluno.ultimaMovimentacao)}</div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ) : (
                                <EmptyState message="Nenhum aluno encontrado para os filtros atuais." />
                            )}
                        </HistoryPanel>
                    ) : null}
                </div>
            </div>
        </div>
    );
};

const LancamentoRow: React.FC<{ registro: HistoricoLancamento }> = ({ registro }) => (
    <div className="grid gap-3 px-5 py-4 lg:grid-cols-[150px,minmax(0,1.2fr),1fr,140px,140px,140px] lg:items-center">
        <div className="text-sm text-[#d6c9a5]/75">{formatDate(registro.criadoEm)}</div>
        <div>
            <div className="font-semibold text-white">{registro.alunoNome}</div>
            {registro.observacao ? <div className="mt-1 text-xs text-[#d6c9a5]/60">{registro.observacao}</div> : null}
        </div>
        <div className="text-[#d6c9a5]">{registro.categoria}</div>
        <div className={registro.valor < 0 ? 'font-bold text-red-300' : 'font-bold text-emerald-300'}>
            {formatSignedPoints(registro.valor)}
        </div>
        <div className="text-[#f4e9c8]">{registro.casaNome}</div>
        <div className="text-sm text-[#d6c9a5]/75">{registro.criadoPor}</div>
    </div>
);

const HistoryPanel: React.FC<{
    icon: React.ReactNode;
    title: string;
    description: string;
    children: React.ReactNode;
}> = ({ icon, title, description, children }) => (
    <section className="rounded-2xl border border-[#c9a84c]/15 bg-[#120a0d] p-6 shadow-[0_20px_80px_rgba(0,0,0,0.25)]">
        <div className="mb-5 flex items-center gap-3">
            <div className="rounded-xl bg-white/5 p-3 text-[#c9a84c]">{icon}</div>
            <div>
                <h3 className="text-lg font-semibold text-[#f4e9c8]">{title}</h3>
                <p className="mt-1 text-sm text-[#d6c9a5]/65">{description}</p>
            </div>
        </div>
        {children}
    </section>
);

const HistoryTab: React.FC<{
    active: boolean;
    icon: React.ReactNode;
    title: string;
    description: string;
    onClick: () => void;
}> = ({ active, icon, title, description, onClick }) => (
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

const SummaryCard: React.FC<{ label: string; value: string | number; positive?: boolean; negative?: boolean }> = ({
    label,
    value,
    positive = false,
    negative = false,
}) => (
    <div className="rounded-xl border border-[#c9a84c]/15 bg-[#120a0d] p-5 shadow-[0_20px_80px_rgba(0,0,0,0.2)]">
        <div className="text-xs uppercase tracking-[0.16em] text-[#c9a84c]/60">{label}</div>
        <div className={`mt-3 text-2xl font-bold ${positive ? 'text-emerald-300' : negative ? 'text-red-300' : 'text-white'}`}>
            {value}
        </div>
    </div>
);

const FilterField: React.FC<{ label: string; icon: React.ReactNode; children: React.ReactNode }> = ({ label, icon, children }) => (
    <div>
        <label className="mb-2 block text-xs uppercase tracking-[0.16em] text-[#c9a84c]/70">{label}</label>
        <div className="flex items-center gap-3 rounded-lg border border-[#c9a84c]/25 bg-black/40 px-4 py-3">
            {icon}
            <div className="w-full">{children}</div>
        </div>
    </div>
);

const SelectField: React.FC<{
    label: string;
    value: string;
    onChange: (value: string) => void;
    children: React.ReactNode;
}> = ({ label, value, onChange, children }) => (
    <div>
        <label className="mb-2 block text-xs uppercase tracking-[0.16em] text-[#c9a84c]/70">{label}</label>
        <select
            value={value}
            onChange={(event) => onChange(event.target.value)}
            className="w-full rounded-lg border border-[#c9a84c]/25 bg-black/40 px-4 py-3 text-white outline-none transition-colors focus:border-[#c9a84c]"
        >
            {children}
        </select>
    </div>
);

const InfoTile: React.FC<{ label: string; value: string; positive?: boolean; negative?: boolean }> = ({
    label,
    value,
    positive = false,
    negative = false,
}) => (
    <div className="rounded-lg border border-[#c9a84c]/10 bg-white/[0.03] px-3 py-3">
        <div className="text-xs uppercase tracking-[0.16em] text-[#c9a84c]/60">{label}</div>
        <div className={`mt-2 text-sm font-semibold ${positive ? 'text-emerald-300' : negative ? 'text-red-300' : 'text-[#f4e9c8]'}`}>
            {value}
        </div>
    </div>
);

const EmptyState: React.FC<{ message: string }> = ({ message }) => (
    <div className="rounded-xl border border-[#c9a84c]/10 bg-black/20 px-4 py-10 text-center text-[#d6c9a5]/70">
        {message}
    </div>
);

export default HistoricoGlobal;
