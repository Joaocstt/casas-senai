import React from 'react';
import { Routes, Route, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { LogOut, Home, Users, Award, History } from 'lucide-react';
import PontuacaoForm from '../components/admin/PontuacaoForm';
import AlunosManagement from '../components/admin/AlunosManagement';
import HistoricoGlobal from '../components/admin/HistoricoGlobal';
import { useCasas } from '../hooks/useCasas';

const DashboardOverview = () => {
    const { data: casas = [], isLoading } = useCasas();

    return (
        <div className="p-6">
            <h2 className="text-2xl font-['Cinzel_Decorative'] text-[#c9a84c] mb-6">Visão Geral</h2>
            {isLoading ? (
                <div className="text-[#d6c9a5]/70">Carregando casas...</div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {casas.map((casa) => (
                        <div key={casa.id} className="bg-[#1a0f12] border border-[#c9a84c]/20 p-6 rounded-lg">
                            <div className="text-[#c9a84c] text-sm opacity-60 mb-1">{casa.nome}</div>
                            <div className="text-3xl font-bold">{casa.points} pts</div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

const AdminPage: React.FC = () => {
    const { logout, user } = useAuth();
    const navigate = useNavigate();

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    const navItemClassName = ({ isActive }: { isActive: boolean }) =>
        `flex items-center gap-3 rounded px-4 py-2 transition-colors ${
            isActive
                ? 'bg-[#c9a84c]/12 text-[#f4e9c8]'
                : 'text-white/60 hover:bg-[#c9a84c]/10 hover:text-white'
        }`;

    return (
        <div className="flex h-screen bg-[#0a0305] text-white overflow-hidden">
            {/* Sidebar */}
            <aside className="w-64 bg-[#140a0c] border-r border-[#c9a84c]/10 flex flex-col">
                <div className="p-6 border-b border-[#c9a84c]/10">
                    <h1 className="text-xl font-['Cinzel_Decorative'] text-[#c9a84c]">Arcanum Admin</h1>
                </div>

                <nav className="flex-1 p-4 space-y-2">
                    <NavLink to="/admin" end className={navItemClassName}>
                        <Home size={20} /> Painel
                    </NavLink>
                    <NavLink to="/admin/alunos" className={navItemClassName}>
                        <Users size={20} /> Alunos
                    </NavLink>
                    <NavLink to="/admin/pontuar" className={navItemClassName}>
                        <Award size={20} /> Pontuar
                    </NavLink>
                    <NavLink to="/admin/historico" className={navItemClassName}>
                        <History size={20} /> Histórico
                    </NavLink>
                </nav>

                <div className="p-4 border-t border-[#c9a84c]/10">
                    <div className="flex items-center gap-3 mb-4 px-4 text-sm opacity-60">
                        <span className="truncate">{user?.nome}</span>
                    </div>
                    <button
                        onClick={handleLogout}
                        className="flex items-center gap-3 w-full px-4 py-2 text-red-400 hover:bg-red-400/10 rounded transition-colors"
                    >
                        <LogOut size={20} /> Sair
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 overflow-auto bg-[radial-gradient(circle_at_top,rgba(201,168,76,0.08),transparent_32%),linear-gradient(180deg,#12080b_0%,#0a0305_100%)]">
                <Routes>
                    <Route index element={<DashboardOverview />} />
                    <Route path="alunos" element={<AlunosManagement />} />
                    <Route path="pontuar" element={<PontuacaoForm />} />
                    <Route path="historico" element={<HistoricoGlobal />} />
                </Routes>
            </main>
        </div>
    );
};

export default AdminPage;
