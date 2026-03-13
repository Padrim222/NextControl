import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import {
    Building2,
    Briefcase,
    BarChart3,
    MessageSquare,
    Target,
    CheckCircle,
    ArrowRight,
    ArrowLeft,
    Loader2,
    Sparkles,
} from '@/components/ui/icons';

// ── Design tokens ─────────────────────────────────────────────────────────
const ds = {
    primary: '#1B2B4A',
    accent: '#E6B84D',
    card: '#FFFFFF',
    border: '1px solid #E5E7EB',
    radius: '12px',
    shadow: '0 1px 3px rgba(0,0,0,0.06)',
    fontDisplay: 'Plus Jakarta Sans, system-ui, sans-serif',
    fontBody: 'DM Sans, system-ui, sans-serif',
    textPrimary: '#1A1A1A',
    textSecondary: '#6B7280',
};

// ── Steps Config ──────────────────────────────────────────────────────────
const STEPS = [
    { id: 'empresa',  title: 'Empresa & Fundador',    icon: Building2    },
    { id: 'produto',  title: 'Produto / Serviço',      icon: Briefcase    },
    { id: 'vendas',   title: 'Processo de Vendas',     icon: BarChart3    },
    { id: 'voz',      title: 'Voz & Estilo',           icon: MessageSquare },
    { id: 'metas',    title: 'Metas & Desafios',       icon: Target       },
];

// ── Form Data Type ─────────────────────────────────────────────────────────
interface OnboardingData {
    // Step 1
    company_name: string;
    founder_name: string;
    segment: string;
    years_in_market: string;
    mission: string;
    company_history: string;
    // Step 2
    product_name: string;
    product_price: string;
    icp: string;
    problem_solved: string;
    transformation: string;
    main_objections: string;
    competitive_differentials: string;
    // Step 3
    main_acquisition_channel: string;
    monthly_leads: string;
    conversion_rate: string;
    average_ticket: string;
    sales_cycle: string;
    sales_process: string;
    // Step 4
    communication_tone: string;
    brand_words: string;
    non_brand_words: string;
    successful_message_example: string;
    brand_references: string;
    // Step 5
    monthly_revenue_goal: string;
    main_challenge: string;
    process_improvements: string;
    non_negotiables: string;
}

const emptyData: OnboardingData = {
    company_name: '', founder_name: '', segment: '', years_in_market: '',
    mission: '', company_history: '',
    product_name: '', product_price: '', icp: '', problem_solved: '',
    transformation: '', main_objections: '', competitive_differentials: '',
    main_acquisition_channel: '', monthly_leads: '', conversion_rate: '',
    average_ticket: '', sales_cycle: '', sales_process: '',
    communication_tone: '', brand_words: '', non_brand_words: '',
    successful_message_example: '', brand_references: '',
    monthly_revenue_goal: '', main_challenge: '', process_improvements: '',
    non_negotiables: '',
};

// ── Helpers ────────────────────────────────────────────────────────────────
function buildRagContent(d: OnboardingData): string {
    return `# Briefing Completo da Empresa

## Empresa & Fundador
**Empresa:** ${d.company_name}
**Fundador/Expert:** ${d.founder_name}
**Segmento/Nicho:** ${d.segment}
**Anos no Mercado:** ${d.years_in_market}
**Missão:** ${d.mission}
**História:** ${d.company_history}

## Produto / Serviço
**Produto/Serviço Principal:** ${d.product_name}
**Faixa de Preço:** ${d.product_price}
**ICP (Perfil do Cliente Ideal):** ${d.icp}
**Problema que Resolve:** ${d.problem_solved}
**Transformação que Entrega:** ${d.transformation}
**Principais Objeções:** ${d.main_objections}
**Diferenciais Competitivos:** ${d.competitive_differentials}

## Processo de Vendas
**Canal Principal de Aquisição:** ${d.main_acquisition_channel}
**Volume Mensal de Leads:** ${d.monthly_leads}
**Taxa de Conversão:** ${d.conversion_rate}%
**Ticket Médio:** ${d.average_ticket}
**Tempo Médio do Ciclo de Vendas:** ${d.sales_cycle}
**Processo Atual de Vendas:** ${d.sales_process}

## Voz & Estilo de Comunicação
**Tom de Comunicação:** ${d.communication_tone}
**Palavras que Representam a Marca:** ${d.brand_words}
**Palavras que NÃO Representam a Marca:** ${d.non_brand_words}
**Exemplo de Mensagem que Funcionou:** ${d.successful_message_example}
**Referências de Marcas Admiradas:** ${d.brand_references}

## Metas & Desafios
**Meta de Faturamento Mensal:** ${d.monthly_revenue_goal}
**Principal Desafio Atual:** ${d.main_challenge}
**O que Precisa Melhorar no Processo Comercial:** ${d.process_improvements}
**O que NÃO Pode Mudar:** ${d.non_negotiables}
`.trim();
}

// ── Field Components ───────────────────────────────────────────────────────
function Field({ label, children }: { label: string; children: React.ReactNode }) {
    return (
        <div className="space-y-1.5">
            <Label style={{ color: ds.textPrimary, fontFamily: ds.fontBody, fontSize: '13px', fontWeight: 600 }}>
                {label}
            </Label>
            {children}
        </div>
    );
}

// ── Main Component ─────────────────────────────────────────────────────────
export default function OnboardingForm() {
    const { user } = useAuth();
    const navigate = useNavigate();

    const [step, setStep] = useState(0);
    const [data, setData] = useState<OnboardingData>(emptyData);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submitted, setSubmitted] = useState(false);

    const set = <K extends keyof OnboardingData>(key: K, value: string) =>
        setData(prev => ({ ...prev, [key]: value }));

    const handleNext = () => {
        if (step < STEPS.length - 1) setStep(s => s + 1);
    };
    const handleBack = () => {
        if (step > 0) setStep(s => s - 1);
    };

    const handleSubmit = async () => {
        if (!user || !supabase) {
            toast.error('Erro de autenticação. Recarregue a página.');
            return;
        }

        const clientId = user.client_id ?? user.id;

        setIsSubmitting(true);
        try {
            const sb = supabase as any;

            // 1. Save raw JSON to client_onboarding table
            const { error: dbError } = await sb
                .from('client_onboarding')
                .insert({
                    client_id: clientId,
                    user_id: user.id,
                    ...data,
                    raw_data: data,
                    submitted_at: new Date().toISOString(),
                });

            if (dbError) {
                console.error('DB error:', dbError);
                // Don't block — still try to ingest to RAG
            }

            // 2. Ingest into RAG knowledge base
            const ragContent = buildRagContent(data);
            const { error: ragError } = await supabase.functions.invoke('rag-ingest', {
                body: {
                    title: `Briefing: ${data.company_name || 'Empresa'}`,
                    content: ragContent,
                    category: 'estrategia',
                    agent_type: 'geral',
                    client_id: clientId,
                },
            });

            if (ragError) {
                console.warn('RAG ingest warning:', ragError);
                // Non-blocking — briefing is saved, RAG will retry or be done manually
            }

            setSubmitted(true);
            toast.success('Briefing enviado com sucesso!');
        } catch (err) {
            console.error('Submit error:', err);
            toast.error('Erro ao enviar briefing. Tente novamente.');
        } finally {
            setIsSubmitting(false);
        }
    };

    // ── Success Screen ─────────────────────────────────────────────────────
    if (submitted) {
        return (
            <div
                style={{
                    minHeight: '100vh',
                    background: '#FAFAFA',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '24px',
                    fontFamily: ds.fontBody,
                }}
            >
                <div style={{ maxWidth: '480px', width: '100%', textAlign: 'center' }}>
                    <div
                        style={{
                            width: 72,
                            height: 72,
                            borderRadius: '50%',
                            background: '#ECFDF5',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            margin: '0 auto 24px',
                        }}
                    >
                        <CheckCircle size={36} style={{ color: '#059669' }} />
                    </div>
                    <h1
                        style={{
                            fontFamily: ds.fontDisplay,
                            fontSize: '24px',
                            fontWeight: 700,
                            color: ds.textPrimary,
                            marginBottom: '12px',
                        }}
                    >
                        Briefing enviado!
                    </h1>
                    <p style={{ color: ds.textSecondary, fontSize: '15px', lineHeight: 1.6, marginBottom: '32px' }}>
                        Seu briefing foi salvo! Nossa equipe irá configurar seu agente personalizado.
                    </p>
                    <Button
                        onClick={() => navigate('/client')}
                        style={{
                            background: ds.primary,
                            color: '#fff',
                            fontFamily: ds.fontBody,
                            fontWeight: 600,
                            height: '44px',
                            paddingLeft: '24px',
                            paddingRight: '24px',
                        }}
                    >
                        Voltar ao painel
                    </Button>
                </div>
            </div>
        );
    }

    // ── Progress Bar ───────────────────────────────────────────────────────
    const progressPct = ((step + 1) / STEPS.length) * 100;

    return (
        <div
            style={{
                minHeight: '100vh',
                background: '#FAFAFA',
                fontFamily: ds.fontBody,
                paddingBottom: '48px',
            }}
        >
            {/* Header */}
            <div
                style={{
                    background: ds.card,
                    borderBottom: ds.border,
                    padding: '16px 24px',
                    position: 'sticky',
                    top: 0,
                    zIndex: 10,
                    boxShadow: '0 1px 4px rgba(0,0,0,0.04)',
                }}
            >
                <div style={{ maxWidth: '680px', margin: '0 auto' }}>
                    {/* Title row */}
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <div
                                style={{
                                    width: 32,
                                    height: 32,
                                    borderRadius: '8px',
                                    background: ds.primary,
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                }}
                            >
                                <Sparkles size={16} style={{ color: ds.accent }} />
                            </div>
                            <div>
                                <p
                                    style={{
                                        fontFamily: ds.fontDisplay,
                                        fontWeight: 700,
                                        fontSize: '15px',
                                        color: ds.textPrimary,
                                        lineHeight: 1.2,
                                    }}
                                >
                                    Briefing da Empresa
                                </p>
                                <p style={{ fontSize: '12px', color: ds.textSecondary }}>
                                    Etapa {step + 1} de {STEPS.length} — {STEPS[step].title}
                                </p>
                            </div>
                        </div>
                        <span
                            style={{
                                fontSize: '12px',
                                fontWeight: 600,
                                color: ds.primary,
                                background: '#EFF6FF',
                                padding: '4px 10px',
                                borderRadius: '20px',
                            }}
                        >
                            {Math.round(progressPct)}%
                        </span>
                    </div>

                    {/* Progress bar */}
                    <div style={{ height: '4px', background: '#E5E7EB', borderRadius: '99px', overflow: 'hidden' }}>
                        <div
                            style={{
                                height: '100%',
                                width: `${progressPct}%`,
                                background: ds.accent,
                                borderRadius: '99px',
                                transition: 'width 0.3s ease',
                            }}
                        />
                    </div>

                    {/* Step dots */}
                    <div style={{ display: 'flex', gap: '8px', marginTop: '10px', justifyContent: 'center' }}>
                        {STEPS.map((s, i) => (
                            <div
                                key={s.id}
                                style={{
                                    width: i === step ? '24px' : '8px',
                                    height: '8px',
                                    borderRadius: '99px',
                                    background: i <= step ? ds.primary : '#D1D5DB',
                                    transition: 'all 0.3s ease',
                                    cursor: i < step ? 'pointer' : 'default',
                                }}
                                onClick={() => { if (i < step) setStep(i); }}
                            />
                        ))}
                    </div>
                </div>
            </div>

            {/* Form Content */}
            <div style={{ maxWidth: '680px', margin: '0 auto', padding: '32px 24px 0' }}>

                {/* Step 1: Empresa & Fundador */}
                {step === 0 && (
                    <Card style={{ ...{ background: ds.card, border: ds.border, borderRadius: ds.radius, boxShadow: ds.shadow } }}>
                        <CardHeader style={{ paddingBottom: '8px' }}>
                            <CardTitle style={{ display: 'flex', alignItems: 'center', gap: '10px', fontFamily: ds.fontDisplay, fontSize: '17px', color: ds.textPrimary }}>
                                <Building2 size={20} style={{ color: ds.accent }} />
                                Empresa & Fundador
                            </CardTitle>
                            <p style={{ fontSize: '13px', color: ds.textSecondary, marginTop: '4px' }}>
                                Conte-nos sobre quem você é e o que representa sua empresa.
                            </p>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                                <Field label="Nome da empresa *">
                                    <Input
                                        value={data.company_name}
                                        onChange={e => set('company_name', e.target.value)}
                                        placeholder="Ex: Next Control"
                                        className="nc-input-glow"
                                    />
                                </Field>
                                <Field label="Nome do fundador / expert *">
                                    <Input
                                        value={data.founder_name}
                                        onChange={e => set('founder_name', e.target.value)}
                                        placeholder="Ex: João Silva"
                                        className="nc-input-glow"
                                    />
                                </Field>
                            </div>
                            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                                <Field label="Segmento / nicho de atuação">
                                    <Input
                                        value={data.segment}
                                        onChange={e => set('segment', e.target.value)}
                                        placeholder="Ex: Consultoria de vendas B2B"
                                        className="nc-input-glow"
                                    />
                                </Field>
                                <Field label="Anos no mercado">
                                    <Input
                                        value={data.years_in_market}
                                        onChange={e => set('years_in_market', e.target.value)}
                                        placeholder="Ex: 5 anos"
                                        className="nc-input-glow"
                                    />
                                </Field>
                            </div>
                            <Field label="Missão da empresa">
                                <Textarea
                                    value={data.mission}
                                    onChange={e => set('mission', e.target.value)}
                                    placeholder="O que sua empresa existe para fazer no mundo..."
                                    className="nc-input-glow min-h-[90px]"
                                />
                            </Field>
                            <Field label="História da empresa (3 parágrafos)">
                                <Textarea
                                    value={data.company_history}
                                    onChange={e => set('company_history', e.target.value)}
                                    placeholder="Como surgiu, desafios enfrentados, onde estão hoje..."
                                    className="nc-input-glow min-h-[140px]"
                                />
                            </Field>
                        </CardContent>
                    </Card>
                )}

                {/* Step 2: Produto / Serviço */}
                {step === 1 && (
                    <Card style={{ background: ds.card, border: ds.border, borderRadius: ds.radius, boxShadow: ds.shadow }}>
                        <CardHeader style={{ paddingBottom: '8px' }}>
                            <CardTitle style={{ display: 'flex', alignItems: 'center', gap: '10px', fontFamily: ds.fontDisplay, fontSize: '17px', color: ds.textPrimary }}>
                                <Briefcase size={20} style={{ color: ds.accent }} />
                                Produto / Serviço
                            </CardTitle>
                            <p style={{ fontSize: '13px', color: ds.textSecondary, marginTop: '4px' }}>
                                Detalhe o que você vende e para quem.
                            </p>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                                <Field label="Nome do produto / serviço principal *">
                                    <Input
                                        value={data.product_name}
                                        onChange={e => set('product_name', e.target.value)}
                                        placeholder="Ex: Mentoria Comercial Elite"
                                        className="nc-input-glow"
                                    />
                                </Field>
                                <Field label="Preço (faixa)">
                                    <Input
                                        value={data.product_price}
                                        onChange={e => set('product_price', e.target.value)}
                                        placeholder="Ex: R$ 3.000 – R$ 8.000"
                                        className="nc-input-glow"
                                    />
                                </Field>
                            </div>
                            <Field label="Para quem é — ICP (Perfil do Cliente Ideal)">
                                <Textarea
                                    value={data.icp}
                                    onChange={e => set('icp', e.target.value)}
                                    placeholder="Descreva quem é seu cliente ideal: cargo, setor, dores, situação..."
                                    className="nc-input-glow min-h-[100px]"
                                />
                            </Field>
                            <Field label="Qual problema resolve">
                                <Textarea
                                    value={data.problem_solved}
                                    onChange={e => set('problem_solved', e.target.value)}
                                    placeholder="O que seu cliente está sofrendo antes de te contratar?"
                                    className="nc-input-glow min-h-[90px]"
                                />
                            </Field>
                            <Field label="Qual transformação entrega">
                                <Textarea
                                    value={data.transformation}
                                    onChange={e => set('transformation', e.target.value)}
                                    placeholder="Como fica a vida/negócio do cliente depois de trabalhar com você?"
                                    className="nc-input-glow min-h-[90px]"
                                />
                            </Field>
                            <Field label="Principais objeções dos clientes">
                                <Textarea
                                    value={data.main_objections}
                                    onChange={e => set('main_objections', e.target.value)}
                                    placeholder="Ex: 'Está caro', 'Preciso pensar', 'Já tentei antes'..."
                                    className="nc-input-glow min-h-[90px]"
                                />
                            </Field>
                            <Field label="Diferenciais competitivos">
                                <Textarea
                                    value={data.competitive_differentials}
                                    onChange={e => set('competitive_differentials', e.target.value)}
                                    placeholder="O que te faz único? Por que escolher você e não o concorrente?"
                                    className="nc-input-glow min-h-[90px]"
                                />
                            </Field>
                        </CardContent>
                    </Card>
                )}

                {/* Step 3: Processo de Vendas */}
                {step === 2 && (
                    <Card style={{ background: ds.card, border: ds.border, borderRadius: ds.radius, boxShadow: ds.shadow }}>
                        <CardHeader style={{ paddingBottom: '8px' }}>
                            <CardTitle style={{ display: 'flex', alignItems: 'center', gap: '10px', fontFamily: ds.fontDisplay, fontSize: '17px', color: ds.textPrimary }}>
                                <BarChart3 size={20} style={{ color: ds.accent }} />
                                Processo de Vendas
                            </CardTitle>
                            <p style={{ fontSize: '13px', color: ds.textSecondary, marginTop: '4px' }}>
                                Números e estrutura do seu comercial atual.
                            </p>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <Field label="Canal principal de aquisição">
                                <Select
                                    value={data.main_acquisition_channel}
                                    onValueChange={v => set('main_acquisition_channel', v)}
                                >
                                    <SelectTrigger className="nc-input-glow">
                                        <SelectValue placeholder="Selecione o canal" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="Instagram">Instagram</SelectItem>
                                        <SelectItem value="LinkedIn">LinkedIn</SelectItem>
                                        <SelectItem value="WhatsApp">WhatsApp</SelectItem>
                                        <SelectItem value="Google Ads">Google Ads</SelectItem>
                                        <SelectItem value="Indicação">Indicação</SelectItem>
                                        <SelectItem value="Outro">Outro</SelectItem>
                                    </SelectContent>
                                </Select>
                            </Field>
                            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                                <Field label="Volume mensal de leads (aprox.)">
                                    <Input
                                        value={data.monthly_leads}
                                        onChange={e => set('monthly_leads', e.target.value)}
                                        placeholder="Ex: 50 leads/mês"
                                        className="nc-input-glow"
                                    />
                                </Field>
                                <Field label="Taxa de conversão aprox. (%)">
                                    <Input
                                        value={data.conversion_rate}
                                        onChange={e => set('conversion_rate', e.target.value)}
                                        placeholder="Ex: 20%"
                                        className="nc-input-glow"
                                    />
                                </Field>
                            </div>
                            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                                <Field label="Ticket médio">
                                    <Input
                                        value={data.average_ticket}
                                        onChange={e => set('average_ticket', e.target.value)}
                                        placeholder="Ex: R$ 5.000"
                                        className="nc-input-glow"
                                    />
                                </Field>
                                <Field label="Tempo médio do ciclo de vendas">
                                    <Input
                                        value={data.sales_cycle}
                                        onChange={e => set('sales_cycle', e.target.value)}
                                        placeholder="Ex: 7 a 14 dias"
                                        className="nc-input-glow"
                                    />
                                </Field>
                            </div>
                            <Field label="Descreva o processo atual de vendas">
                                <Textarea
                                    value={data.sales_process}
                                    onChange={e => set('sales_process', e.target.value)}
                                    placeholder="Como o lead entra, como avança, como fecha... Da prospecção ao pós-venda."
                                    className="nc-input-glow min-h-[130px]"
                                />
                            </Field>
                        </CardContent>
                    </Card>
                )}

                {/* Step 4: Voz & Estilo */}
                {step === 3 && (
                    <Card style={{ background: ds.card, border: ds.border, borderRadius: ds.radius, boxShadow: ds.shadow }}>
                        <CardHeader style={{ paddingBottom: '8px' }}>
                            <CardTitle style={{ display: 'flex', alignItems: 'center', gap: '10px', fontFamily: ds.fontDisplay, fontSize: '17px', color: ds.textPrimary }}>
                                <MessageSquare size={20} style={{ color: ds.accent }} />
                                Voz & Estilo
                            </CardTitle>
                            <p style={{ fontSize: '13px', color: ds.textSecondary, marginTop: '4px' }}>
                                Como sua marca fala — para que seu agente soar como você.
                            </p>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <Field label="Tom de comunicação">
                                <Select
                                    value={data.communication_tone}
                                    onValueChange={v => set('communication_tone', v)}
                                >
                                    <SelectTrigger className="nc-input-glow">
                                        <SelectValue placeholder="Selecione o tom" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="Formal">Formal</SelectItem>
                                        <SelectItem value="Semi-formal">Semi-formal</SelectItem>
                                        <SelectItem value="Descontraído">Descontraído</SelectItem>
                                        <SelectItem value="Técnico">Técnico</SelectItem>
                                    </SelectContent>
                                </Select>
                            </Field>
                            <Field label="Palavras que representam a marca">
                                <Textarea
                                    value={data.brand_words}
                                    onChange={e => set('brand_words', e.target.value)}
                                    placeholder="Ex: resultado, clareza, direto, estratégia, confiança..."
                                    className="nc-input-glow min-h-[90px]"
                                />
                            </Field>
                            <Field label="Palavras que NÃO representam a marca">
                                <Textarea
                                    value={data.non_brand_words}
                                    onChange={e => set('non_brand_words', e.target.value)}
                                    placeholder="Ex: fácil, mágico, milagre, guru, hackear..."
                                    className="nc-input-glow min-h-[90px]"
                                />
                            </Field>
                            <Field label="Exemplo de mensagem que funcionou bem">
                                <Textarea
                                    value={data.successful_message_example}
                                    onChange={e => set('successful_message_example', e.target.value)}
                                    placeholder="Cole aqui uma mensagem, caption ou pitch que gerou bom resultado..."
                                    className="nc-input-glow min-h-[110px]"
                                />
                            </Field>
                            <Field label="Referências de marcas que admira">
                                <Textarea
                                    value={data.brand_references}
                                    onChange={e => set('brand_references', e.target.value)}
                                    placeholder="Marcas ou personalidades cuja comunicação te inspira e por quê..."
                                    className="nc-input-glow min-h-[90px]"
                                />
                            </Field>
                        </CardContent>
                    </Card>
                )}

                {/* Step 5: Metas & Desafios */}
                {step === 4 && (
                    <Card style={{ background: ds.card, border: ds.border, borderRadius: ds.radius, boxShadow: ds.shadow }}>
                        <CardHeader style={{ paddingBottom: '8px' }}>
                            <CardTitle style={{ display: 'flex', alignItems: 'center', gap: '10px', fontFamily: ds.fontDisplay, fontSize: '17px', color: ds.textPrimary }}>
                                <Target size={20} style={{ color: ds.accent }} />
                                Metas & Desafios
                            </CardTitle>
                            <p style={{ fontSize: '13px', color: ds.textSecondary, marginTop: '4px' }}>
                                Onde você quer chegar e o que está no caminho.
                            </p>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <Field label="Meta de faturamento mensal">
                                <Input
                                    value={data.monthly_revenue_goal}
                                    onChange={e => set('monthly_revenue_goal', e.target.value)}
                                    placeholder="Ex: R$ 50.000/mês"
                                    className="nc-input-glow"
                                />
                            </Field>
                            <Field label="Principal desafio atual">
                                <Textarea
                                    value={data.main_challenge}
                                    onChange={e => set('main_challenge', e.target.value)}
                                    placeholder="O que está impedindo você de crescer mais rápido hoje?"
                                    className="nc-input-glow min-h-[110px]"
                                />
                            </Field>
                            <Field label="O que precisa melhorar no processo comercial">
                                <Textarea
                                    value={data.process_improvements}
                                    onChange={e => set('process_improvements', e.target.value)}
                                    placeholder="Onde você sente que está perdendo dinheiro ou eficiência?"
                                    className="nc-input-glow min-h-[110px]"
                                />
                            </Field>
                            <Field label="O que NÃO pode mudar">
                                <Textarea
                                    value={data.non_negotiables}
                                    onChange={e => set('non_negotiables', e.target.value)}
                                    placeholder="Valores, práticas ou elementos que devem ser preservados..."
                                    className="nc-input-glow min-h-[110px]"
                                />
                            </Field>

                            {/* Summary box */}
                            <div
                                style={{
                                    background: '#F0FDF4',
                                    border: '1px solid #BBF7D0',
                                    borderRadius: '10px',
                                    padding: '16px',
                                    marginTop: '8px',
                                }}
                            >
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                                    <Sparkles size={16} style={{ color: '#059669' }} />
                                    <span style={{ fontWeight: 700, fontSize: '13px', color: '#047857' }}>
                                        Tudo pronto para enviar!
                                    </span>
                                </div>
                                <p style={{ fontSize: '13px', color: '#065F46', lineHeight: 1.5 }}>
                                    Seu briefing será salvo e nossa equipe irá configurar seu agente personalizado com base nessas informações.
                                    Você poderá atualizar o briefing a qualquer momento pelo painel.
                                </p>
                            </div>
                        </CardContent>
                    </Card>
                )}

                {/* Navigation buttons */}
                <div
                    style={{
                        display: 'flex',
                        justifyContent: step === 0 ? 'flex-end' : 'space-between',
                        marginTop: '24px',
                        gap: '12px',
                    }}
                >
                    {step > 0 && (
                        <Button
                            variant="outline"
                            onClick={handleBack}
                            disabled={isSubmitting}
                            style={{
                                fontFamily: ds.fontBody,
                                fontWeight: 600,
                                height: '44px',
                                paddingLeft: '20px',
                                paddingRight: '20px',
                                borderColor: '#D1D5DB',
                                color: ds.textSecondary,
                            }}
                        >
                            <ArrowLeft size={16} style={{ marginRight: '6px' }} />
                            Voltar
                        </Button>
                    )}

                    {step < STEPS.length - 1 ? (
                        <Button
                            onClick={handleNext}
                            style={{
                                background: ds.primary,
                                color: '#fff',
                                fontFamily: ds.fontBody,
                                fontWeight: 600,
                                height: '44px',
                                paddingLeft: '24px',
                                paddingRight: '24px',
                            }}
                        >
                            Próximo
                            <ArrowRight size={16} style={{ marginLeft: '6px' }} />
                        </Button>
                    ) : (
                        <Button
                            onClick={handleSubmit}
                            disabled={isSubmitting}
                            style={{
                                background: ds.primary,
                                color: '#fff',
                                fontFamily: ds.fontBody,
                                fontWeight: 600,
                                height: '44px',
                                paddingLeft: '24px',
                                paddingRight: '24px',
                                opacity: isSubmitting ? 0.7 : 1,
                            }}
                        >
                            {isSubmitting ? (
                                <>
                                    <Loader2 size={16} style={{ marginRight: '8px', animation: 'spin 1s linear infinite' }} />
                                    Enviando...
                                </>
                            ) : (
                                <>
                                    Enviar Briefing
                                    <ArrowRight size={16} style={{ marginLeft: '6px' }} />
                                </>
                            )}
                        </Button>
                    )}
                </div>
            </div>
        </div>
    );
}
