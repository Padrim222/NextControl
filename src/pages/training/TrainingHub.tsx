import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
    GraduationCap,
    Sparkles,
    BookOpen,
    Target,
    Lightbulb,
    Shield,
    AlertTriangle,
    FileText,
    ArrowRight,
    X,
} from '@/components/ui/icons';
import type { TrainingMaterial, TrainingCategory } from '@/types';

const categoryConfig: Record<TrainingCategory, { label: string; icon: React.ElementType; iconBg: string; iconColor: string }> = {
    script: { label: 'Scripts', icon: FileText, iconBg: '#FEF9C3', iconColor: '#CA8A04' },
    methodology: { label: 'Metodologia', icon: BookOpen, iconBg: '#EFF6FF', iconColor: '#2563EB' },
    strategy: { label: 'Estratégia', icon: Target, iconBg: '#F0FDF4', iconColor: '#059669' },
    best_practice: { label: 'Boas Práticas', icon: Lightbulb, iconBg: '#FFF7ED', iconColor: '#EA580C' },
    error_pattern: { label: 'Erros Comuns', icon: AlertTriangle, iconBg: '#FEF2F2', iconColor: '#DC2626' },
};

const card: React.CSSProperties = {
    background: '#FFFFFF',
    border: '1px solid #E5E7EB',
    borderRadius: '12px',
    boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
};

export default function TrainingHub() {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [materials, setMaterials] = useState<TrainingMaterial[]>([]);
    const [filter, setFilter] = useState<TrainingCategory | 'all'>('all');
    const [selectedMaterial, setSelectedMaterial] = useState<TrainingMaterial | null>(null);

    useEffect(() => {
        fetchMaterials();
    }, []);

    const fetchMaterials = async () => {
        if (!supabase) return;
        try {
            const { data, error } = await (supabase as any)
                .from('training_materials')
                .select('*')
                .eq('is_active', true)
                .order('created_at', { ascending: false });
            if (data?.length) setMaterials(data);
        } catch (error) {
            console.error('Error fetching training materials:', error);
        }
    };

    const filtered = filter === 'all'
        ? materials
        : materials.filter(m => m.category === filter);

    const categories: (TrainingCategory | 'all')[] = ['all', 'script', 'methodology', 'strategy', 'best_practice', 'error_pattern'];

    return (
        <div style={{ background: '#FAFAFA', minHeight: '100vh', padding: '24px' }}>
            <div style={{ maxWidth: '900px', margin: '0 auto' }}>

                {/* Header */}
                <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    style={{ marginBottom: '24px' }}
                >
                    <h1 style={{
                        fontFamily: 'Plus Jakarta Sans, system-ui, sans-serif',
                        fontSize: '26px',
                        fontWeight: 700,
                        color: '#1A1A1A',
                        margin: '0 0 4px 0',
                    }}>
                        Materiais de Treinamento
                    </h1>
                    <p style={{
                        fontFamily: 'DM Sans, system-ui, sans-serif',
                        fontSize: '14px',
                        color: '#6B7280',
                        margin: 0,
                    }}>
                        Scripts, metodologias e boas práticas do time
                    </p>
                </motion.div>

                {/* Coach CTA Card */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.1 }}
                    style={{ marginBottom: '24px' }}
                >
                    <div
                        onClick={() => navigate('/training/coach')}
                        style={{
                            ...card,
                            padding: '20px',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '16px',
                            borderTop: '3px solid #E6B84D',
                            transition: 'box-shadow 0.15s',
                            position: 'relative',
                            overflow: 'hidden',
                        }}
                        onMouseEnter={e => (e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.10)')}
                        onMouseLeave={e => (e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.06)')}
                    >
                        <div style={{
                            width: '48px',
                            height: '48px',
                            borderRadius: '12px',
                            background: 'linear-gradient(135deg, #1B2B4A, #1a6b4a)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            flexShrink: 0,
                        }}>
                            <Sparkles size={22} strokeWidth={1.5} color="#E6B84D" />
                        </div>
                        <div style={{ flex: 1 }}>
                            <h3 style={{
                                fontFamily: 'Plus Jakarta Sans, system-ui, sans-serif',
                                fontSize: '15px',
                                fontWeight: 600,
                                color: '#1A1A1A',
                                margin: '0 0 3px 0',
                            }}>
                                Consultoria de Bolso
                            </h3>
                            <p style={{
                                fontFamily: 'DM Sans, system-ui, sans-serif',
                                fontSize: '13px',
                                color: '#6B7280',
                                margin: 0,
                            }}>
                                Converse com seu coach IA personalizado em tempo real
                            </p>
                        </div>
                        <ArrowRight size={18} strokeWidth={1.5} color="#1B2B4A" />
                    </div>
                </motion.div>

                {/* Category Filter Pills */}
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '20px' }}>
                    {categories.map(cat => {
                        const config = cat === 'all' ? null : categoryConfig[cat];
                        const isActive = filter === cat;
                        return (
                            <button
                                key={cat}
                                onClick={() => setFilter(cat)}
                                style={{
                                    fontFamily: 'DM Sans, system-ui, sans-serif',
                                    fontSize: '13px',
                                    fontWeight: isActive ? 600 : 400,
                                    padding: '6px 14px',
                                    borderRadius: '999px',
                                    border: isActive ? 'none' : '1px solid #E5E7EB',
                                    background: isActive ? '#1B2B4A' : '#FFFFFF',
                                    color: isActive ? '#FFFFFF' : '#6B7280',
                                    cursor: 'pointer',
                                    transition: 'all 0.15s',
                                    boxShadow: isActive ? '0 1px 4px rgba(10,61,44,0.2)' : 'none',
                                }}
                                onMouseEnter={e => {
                                    if (!isActive) e.currentTarget.style.background = '#F3F4F6';
                                }}
                                onMouseLeave={e => {
                                    if (!isActive) e.currentTarget.style.background = '#FFFFFF';
                                }}
                            >
                                {cat === 'all' ? 'Todos' : config?.label}
                            </button>
                        );
                    })}
                </div>

                {/* Materials Grid */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px' }}>
                    {filtered.map((material, i) => {
                        const config = categoryConfig[material.category];
                        const Icon = config?.icon || BookOpen;
                        return (
                            <motion.div
                                key={material.id}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: i * 0.05 }}
                            >
                                <div
                                    onClick={() => setSelectedMaterial(material)}
                                    style={{
                                        ...card,
                                        padding: '16px',
                                        cursor: 'pointer',
                                        height: '100%',
                                        display: 'flex',
                                        flexDirection: 'column',
                                        transition: 'box-shadow 0.15s, border-color 0.15s',
                                    }}
                                    onMouseEnter={e => {
                                        e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.09)';
                                        e.currentTarget.style.borderColor = '#D1D5DB';
                                    }}
                                    onMouseLeave={e => {
                                        e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.06)';
                                        e.currentTarget.style.borderColor = '#E5E7EB';
                                    }}
                                >
                                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                                        <div style={{
                                            width: '38px',
                                            height: '38px',
                                            borderRadius: '10px',
                                            background: config?.iconBg || '#F3F4F6',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            flexShrink: 0,
                                        }}>
                                            <Icon size={18} strokeWidth={1.5} color={config?.iconColor || '#6B7280'} />
                                        </div>
                                        <div style={{ flex: 1, minWidth: 0 }}>
                                            <h3 style={{
                                                fontFamily: 'Plus Jakarta Sans, system-ui, sans-serif',
                                                fontSize: '14px',
                                                fontWeight: 600,
                                                color: '#1A1A1A',
                                                margin: '0 0 5px 0',
                                                overflow: 'hidden',
                                                textOverflow: 'ellipsis',
                                                whiteSpace: 'nowrap',
                                            }}>
                                                {material.title}
                                            </h3>
                                            <p style={{
                                                fontFamily: 'DM Sans, system-ui, sans-serif',
                                                fontSize: '12px',
                                                color: '#6B7280',
                                                margin: '0 0 10px 0',
                                                display: '-webkit-box',
                                                WebkitLineClamp: 2,
                                                WebkitBoxOrient: 'vertical',
                                                overflow: 'hidden',
                                            }}>
                                                {material.content}
                                            </p>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                                <span style={{
                                                    fontFamily: 'DM Sans, system-ui, sans-serif',
                                                    fontSize: '11px',
                                                    fontWeight: 500,
                                                    padding: '2px 8px',
                                                    borderRadius: '999px',
                                                    background: config?.iconBg || '#F3F4F6',
                                                    color: config?.iconColor || '#6B7280',
                                                }}>
                                                    {config?.label}
                                                </span>
                                                <span style={{
                                                    fontFamily: 'DM Sans, system-ui, sans-serif',
                                                    fontSize: '11px',
                                                    padding: '2px 8px',
                                                    borderRadius: '999px',
                                                    background: '#F3F4F6',
                                                    color: '#9CA3AF',
                                                }}>
                                                    {material.target_role === 'both' ? 'Todos' : material.target_role}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        );
                    })}
                </div>

                {filtered.length === 0 && (
                    <div style={{
                        background: '#FFFFFF',
                        border: '1px dashed #E5E7EB',
                        borderRadius: '12px',
                        padding: '48px 24px',
                        textAlign: 'center',
                    }}>
                        <BookOpen size={36} strokeWidth={1.5} color="#D1D5DB" style={{ margin: '0 auto 12px', display: 'block' }} />
                        <p style={{ fontFamily: 'DM Sans, system-ui, sans-serif', fontSize: '14px', color: '#9CA3AF', margin: 0 }}>
                            Nenhum material encontrado nesta categoria.
                        </p>
                    </div>
                )}

            </div>

            {/* Material Detail Modal */}
            {selectedMaterial && (
                <div
                    onClick={() => setSelectedMaterial(null)}
                    style={{
                        position: 'fixed',
                        inset: 0,
                        zIndex: 50,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        background: 'rgba(0,0,0,0.4)',
                        backdropFilter: 'blur(4px)',
                        padding: '16px',
                    }}
                >
                    <motion.div
                        initial={{ opacity: 0, scale: 0.96 }}
                        animate={{ opacity: 1, scale: 1 }}
                        onClick={e => e.stopPropagation()}
                        style={{
                            ...card,
                            maxWidth: '520px',
                            width: '100%',
                            padding: '24px',
                        }}
                    >
                        {(() => {
                            const config = categoryConfig[selectedMaterial.category];
                            const Icon = config?.icon || BookOpen;
                            return (
                                <>
                                    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '12px', marginBottom: '16px' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                            <div style={{
                                                width: '44px',
                                                height: '44px',
                                                borderRadius: '12px',
                                                background: config?.iconBg || '#F3F4F6',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                flexShrink: 0,
                                            }}>
                                                <Icon size={20} strokeWidth={1.5} color={config?.iconColor || '#6B7280'} />
                                            </div>
                                            <div>
                                                <h2 style={{
                                                    fontFamily: 'Plus Jakarta Sans, system-ui, sans-serif',
                                                    fontSize: '17px',
                                                    fontWeight: 700,
                                                    color: '#1A1A1A',
                                                    margin: '0 0 4px 0',
                                                }}>
                                                    {selectedMaterial.title}
                                                </h2>
                                                <span style={{
                                                    fontFamily: 'DM Sans, system-ui, sans-serif',
                                                    fontSize: '11px',
                                                    fontWeight: 500,
                                                    padding: '2px 8px',
                                                    borderRadius: '999px',
                                                    background: config?.iconBg || '#F3F4F6',
                                                    color: config?.iconColor || '#6B7280',
                                                }}>
                                                    {config?.label}
                                                </span>
                                            </div>
                                        </div>
                                        <button
                                            onClick={() => setSelectedMaterial(null)}
                                            style={{
                                                background: '#F3F4F6',
                                                border: 'none',
                                                borderRadius: '8px',
                                                width: '30px',
                                                height: '30px',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                cursor: 'pointer',
                                                flexShrink: 0,
                                            }}
                                        >
                                            <X size={15} strokeWidth={1.5} color="#6B7280" />
                                        </button>
                                    </div>

                                    <div style={{
                                        background: '#FAFAFA',
                                        border: '1px solid #F3F4F6',
                                        borderRadius: '8px',
                                        padding: '16px',
                                        marginBottom: '20px',
                                    }}>
                                        <p style={{
                                            fontFamily: 'DM Sans, system-ui, sans-serif',
                                            fontSize: '14px',
                                            color: '#374151',
                                            lineHeight: '1.65',
                                            margin: 0,
                                            whiteSpace: 'pre-wrap',
                                        }}>
                                            {selectedMaterial.content}
                                        </p>
                                    </div>

                                    <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                                        <button
                                            onClick={() => setSelectedMaterial(null)}
                                            style={{
                                                background: '#F3F4F6',
                                                color: '#1A1A1A',
                                                border: '1px solid #E5E7EB',
                                                borderRadius: '8px',
                                                padding: '8px 18px',
                                                cursor: 'pointer',
                                                fontFamily: 'DM Sans, system-ui, sans-serif',
                                                fontSize: '13px',
                                                fontWeight: 500,
                                            }}
                                        >
                                            Fechar
                                        </button>
                                    </div>
                                </>
                            );
                        })()}
                    </motion.div>
                </div>
            )}
        </div>
    );
}
