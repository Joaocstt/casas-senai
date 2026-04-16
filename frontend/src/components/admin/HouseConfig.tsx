import React, { useState, useEffect } from 'react';
import { useCasas } from '../../hooks/useCasas';
import { Save, Palette, Image as ImageIcon, Type, Sparkles } from 'lucide-react';
import toast from 'react-hot-toast';

const API_URL = import.meta.env.VITE_API_URL || '';

const HouseConfig: React.FC = () => {
    const { data: casas = [], isLoading, refetch } = useCasas();
    const [selectedSlug, setSelectedSlug] = useState<string>('');
    const [formData, setFormData] = useState({
        nome: '',
        cor: '',
        image: '',
        brasao: '',
        fraze: '',
        descricao: '',
        config: { titleSize: '', rankScale: 1 }
    });
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        if (casas.length > 0 && !selectedSlug) {
            setSelectedSlug(casas[0].slug);
        }
    }, [casas, selectedSlug]);

    useEffect(() => {
        const casa = casas.find(c => c.slug === selectedSlug);
        if (casa) {
            setFormData({
                nome: casa.nome || '',
                cor: casa.cor || '#ffffff',
                image: casa.image || '',
                brasao: casa.brasao || '',
                fraze: casa.fraze || '',
                descricao: casa.descricao || '',
                config: casa.config || { titleSize: '', rankScale: 1 }
            });
        }
    }, [selectedSlug, casas]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        if (name.startsWith('config.')) {
            const configKey = name.split('.')[1];
            setFormData(prev => ({
                ...prev,
                config: { ...prev.config, [configKey]: value }
            }));
        } else {
            setFormData(prev => ({ ...prev, [name]: value }));
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSaving(true);
        try {
            const response = await fetch(`${API_URL}/api/casas/${selectedSlug}`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('arcanum_token')}`
                },
                body: JSON.stringify(formData),
            });

            if (response.ok) {
                toast.success('Configurações da casa atualizadas!');
                refetch();
            } else {
                toast.error('Erro ao salvar configurações');
            }
        } catch (error) {
            toast.error('Erro de conexão com o servidor');
        } finally {
            setIsSaving(false);
        }
    };

    if (isLoading) return <div className="p-8 text-[#c9a84c]/60">Carregando linas...</div>;

    return (
        <div className="p-8 max-w-5xl mx-auto">
            <header className="mb-10">
                <h2 className="text-3xl font-['Cinzel_Decorative'] text-[#c9a84c] mb-2">Configurações das Casas</h2>
                <p className="text-[#d6c9a5]/60 font-['Cinzel'] text-sm tracking-widest">PERSONALIZAÇÃO DA IDENTIDADE VISUAL E LORE</p>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
                {/* Sidebar selection */}
                <div className="lg:col-span-3 space-y-3">
                    {casas.map((casa) => (
                        <button
                            key={casa.id}
                            onClick={() => setSelectedSlug(casa.slug)}
                            className={`w-full flex items-center gap-4 p-4 rounded-lg border transition-all duration-300 ${selectedSlug === casa.slug
                                ? 'bg-[#c9a84c]/10 border-[#c9a84c] text-white shadow-[0_0_15px_rgba(201,168,76,0.2)]'
                                : 'bg-black/20 border-[#c9a84c]/10 text-white/50 hover:border-[#c9a84c]/40 hover:text-white/80'
                                }`}
                        >
                            <div
                                className="w-4 h-4 rounded-full shadow-sm"
                                style={{ backgroundColor: casa.cor, boxShadow: `0 0 8px ${casa.cor}66` }}
                            />
                            <span className="font-['Cinzel'] text-xs font-bold tracking-wider uppercase">{casa.nome}</span>
                        </button>
                    ))}
                </div>

                {/* Form area */}
                <div className="lg:col-span-9">
                    <form onSubmit={handleSubmit} className="bg-[#1a0f12] border border-[#c9a84c]/20 rounded-xl overflow-hidden shadow-2xl">
                        <div className="p-8 space-y-8">
                            {/* Preview section */}
                            <div className="flex items-center gap-6 p-6 bg-black/40 rounded-lg border border-[#c9a84c]/10">
                                <div className="w-20 h-20 bg-black/60 rounded-lg border border-[#c9a84c]/20 flex items-center justify-center overflow-hidden">
                                    <img src={formData.brasao || '/images/placeholder.png'} alt="Preview Brasão" className="w-14 h-14 object-contain opacity-80" />
                                </div>
                                <div className="flex-1">
                                    <div className="flex items-center gap-2 mb-1">
                                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: formData.cor }} />
                                        <span className="text-xl font-['Cinzel_Decorative'] text-white uppercase tracking-widest">{formData.nome || 'Nome da Casa'}</span>
                                    </div>
                                    <div className="text-[#c9a84c] text-xs font-bold tracking-[0.2em] italic">"{formData.fraze || 'Slogan da Casa'}"</div>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                <div className="space-y-6">
                                    <section>
                                        <label className="flex items-center gap-2 text-xs font-bold text-[#c9a84c] mb-3 uppercase tracking-widest">
                                            <Type size={14} /> Nome da Casa
                                        </label>
                                        <input
                                            name="nome"
                                            value={formData.nome}
                                            onChange={handleChange}
                                            className="w-full bg-black/40 border border-[#c9a84c]/20 rounded px-4 py-3 text-white focus:outline-none focus:border-[#c9a84c] transition-colors font-['Cinzel']"
                                        />
                                    </section>

                                    <section>
                                        <label className="flex items-center gap-2 text-xs font-bold text-[#c9a84c] mb-3 uppercase tracking-widest">
                                            <Palette size={14} /> Cor da Identidade (HEX)
                                        </label>
                                        <div className="flex gap-3">
                                            <input
                                                type="color"
                                                name="cor"
                                                value={formData.cor}
                                                onChange={handleChange}
                                                className="w-12 h-12 bg-transparent border-none p-0 cursor-pointer"
                                            />
                                            <input
                                                name="cor"
                                                value={formData.cor}
                                                onChange={handleChange}
                                                className="flex-1 bg-black/40 border border-[#c9a84c]/20 rounded px-4 py-3 text-white focus:outline-none focus:border-[#c9a84c] transition-colors font-mono"
                                            />
                                        </div>
                                    </section>
                                </div>

                                <div className="space-y-6">
                                    <section>
                                        <label className="flex items-center gap-2 text-xs font-bold text-[#c9a84c] mb-3 uppercase tracking-widest">
                                            <Sparkles size={14} /> Slogan / Frase de Efeito
                                        </label>
                                        <input
                                            name="fraze"
                                            value={formData.fraze}
                                            onChange={handleChange}
                                            className="w-full bg-black/40 border border-[#c9a84c]/20 rounded px-4 py-3 text-white focus:outline-none focus:border-[#c9a84c] transition-colors font-['Cinzel']"
                                            placeholder="Ex: CORAGEM E HONRA"
                                        />
                                    </section>

                                    <section>
                                        <label className="flex items-center gap-2 text-xs font-bold text-[#c9a84c] mb-3 uppercase tracking-widest">
                                            <ImageIcon size={14} /> Caminho do Brasão (PNG)
                                        </label>
                                        <input
                                            name="brasao"
                                            value={formData.brasao}
                                            onChange={handleChange}
                                            className="w-full bg-black/40 border border-[#c9a84c]/20 rounded px-4 py-3 text-white focus:outline-none focus:border-[#c9a84c] transition-colors text-xs font-mono"
                                            placeholder="/images/casa.brasao.png"
                                        />
                                    </section>
                                </div>
                            </div>

                            <section>
                                <label className="flex items-center gap-2 text-xs font-bold text-[#c9a84c] mb-3 uppercase tracking-widest">
                                    <ImageIcon size={14} /> Caminho do Mascote (PNG)
                                </label>
                                <input
                                    name="image"
                                    value={formData.image}
                                    onChange={handleChange}
                                    className="w-full bg-black/40 border border-[#c9a84c]/20 rounded px-4 py-3 text-white focus:outline-none focus:border-[#c9a84c] transition-colors text-xs font-mono"
                                    placeholder="/images/casa_mascot.png"
                                />
                            </section>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                <section>
                                    <label className="flex items-center gap-2 text-xs font-bold text-[#c9a84c] mb-3 uppercase tracking-widest">
                                        Tamanho da Fonte do Nome (CSS)
                                    </label>
                                    <input
                                        name="config.titleSize"
                                        value={formData.config.titleSize}
                                        onChange={handleChange}
                                        className="w-full bg-black/40 border border-[#c9a84c]/20 rounded px-4 py-3 text-white focus:outline-none focus:border-[#c9a84c] transition-colors font-mono"
                                        placeholder="Ex: 2.5rem ou 5vw"
                                    />
                                </section>

                                <section>
                                    <label className="flex items-center gap-2 text-xs font-bold text-[#c9a84c] mb-3 uppercase tracking-widest">
                                        Escala do Numeral Romano
                                    </label>
                                    <input
                                        type="number"
                                        step="0.1"
                                        name="config.rankScale"
                                        value={formData.config.rankScale}
                                        onChange={handleChange}
                                        className="w-full bg-black/40 border border-[#c9a84c]/20 rounded px-4 py-3 text-white focus:outline-none focus:border-[#c9a84c] transition-colors font-mono"
                                        placeholder="Ex: 1.2"
                                    />
                                </section>
                            </div>

                            <section>
                                <label className="flex items-center gap-2 text-xs font-bold text-[#c9a84c] mb-3 uppercase tracking-widest">
                                    História / Descrição
                                </label>
                                <textarea
                                    name="descricao"
                                    value={formData.descricao}
                                    onChange={handleChange}
                                    rows={3}
                                    className="w-full bg-black/40 border border-[#c9a84c]/20 rounded px-4 py-3 text-white focus:outline-none focus:border-[#c9a84c] transition-colors font-['Cinzel'] resize-none"
                                    placeholder="Conte sobre a origem desta linhagem..."
                                />
                            </section>
                        </div>

                        <div className="bg-black/60 p-6 flex justify-end border-t border-[#c9a84c]/10">
                            <button
                                type="submit"
                                disabled={isSaving}
                                className="flex items-center gap-3 bg-[#c9a84c] hover:bg-[#b08e35] text-black font-bold py-3 px-10 rounded shadow-[0_4px_15px_rgba(201,168,76,0.3)] transition-all transform active:scale-95 disabled:opacity-50"
                            >
                                <Save size={18} />
                                {isSaving ? 'Salvando...' : 'Gravar Alterações'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default HouseConfig;
