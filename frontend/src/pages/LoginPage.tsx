import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import toast from 'react-hot-toast';

const LoginPage: React.FC = () => {
    const [email, setEmail] = useState('');
    const [senha, setSenha] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const { login } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);

        try {
            const response = await fetch('/api/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, senha }),
            });

            const data = await response.json();

            if (response.ok) {
                login(data.token, data.user);
                toast.success(`Bem-vindo, ${data.user.nome}!`);
                navigate('/admin');
            } else {
                toast.error(data.error || 'Falha no login');
            }
        } catch (error) {
            toast.error('Erro ao conectar com o servidor');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="flex items-center justify-center min-h-screen bg-[#0a0305] font-['Cinzel'] text-white">
            <div className="w-full max-w-md p-8 bg-[#1a0f12] border border-[#c9a84c]/20 rounded-lg shadow-2xl">
                <h1 className="text-3xl font-['Cinzel_Decorative'] text-center mb-8 text-[#c9a84c]">
                    Arcanum do Mérito
                </h1>

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div>
                        <label className="block text-sm font-medium text-[#c9a84c] mb-1">
                            E-mail
                        </label>
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                            className="w-full bg-black/50 border border-[#c9a84c]/30 rounded px-4 py-2 focus:outline-none focus:border-[#c9a84c] transition-colors"
                            placeholder="seu@email.com"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-[#c9a84c] mb-1">
                            Senha
                        </label>
                        <input
                            type="password"
                            value={senha}
                            onChange={(e) => setSenha(e.target.value)}
                            required
                            className="w-full bg-black/50 border border-[#c9a84c]/30 rounded px-4 py-2 focus:outline-none focus:border-[#c9a84c] transition-colors"
                            placeholder="••••••••"
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={isLoading}
                        className="w-full bg-[#c9a84c] hover:bg-[#b08e35] text-black font-bold py-3 rounded transition-all transform active:scale-95 disabled:opacity-50 disabled:transform-none"
                    >
                        {isLoading ? 'Entrando...' : 'Acessar Sanctum'}
                    </button>
                </form>
            </div>
        </div>
    );
};

export default LoginPage;
