import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { User, Mail, Phone } from 'lucide-react';

interface FormIdentificationProps {
    name: string;
    email: string;
    phone: string;
    onChange: (field: 'name' | 'email' | 'phone', value: string) => void;
}

export function FormIdentification({ name, email, phone, onChange }: FormIdentificationProps) {
    return (
        <Card className="nc-card-border bg-card">
            <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                    <User className="h-5 w-5 text-solar" />
                    Identificação
                </CardTitle>
                <CardDescription>
                    Precisamos saber quem está preenchendo para rastrear sua evolução.
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="space-y-2">
                    <Label htmlFor="name" className="flex items-center gap-2">
                        <User className="h-3.5 w-3.5" />
                        Nome Completo *
                    </Label>
                    <Input
                        id="name"
                        value={name}
                        onChange={(e) => onChange('name', e.target.value)}
                        placeholder="Seu nome completo"
                        className="h-12 nc-input-glow"
                        required
                    />
                </div>

                <div className="space-y-2">
                    <Label htmlFor="email" className="flex items-center gap-2">
                        <Mail className="h-3.5 w-3.5" />
                        Email
                    </Label>
                    <Input
                        id="email"
                        type="email"
                        value={email}
                        onChange={(e) => onChange('email', e.target.value)}
                        placeholder="seu@email.com"
                        className="h-12 nc-input-glow"
                    />
                    <p className="text-xs text-muted-foreground/70">
                        Se você já tem conta, vinculamos automaticamente.
                    </p>
                </div>

                <div className="space-y-2">
                    <Label htmlFor="phone" className="flex items-center gap-2">
                        <Phone className="h-3.5 w-3.5" />
                        WhatsApp
                    </Label>
                    <Input
                        id="phone"
                        type="tel"
                        value={phone}
                        onChange={(e) => onChange('phone', e.target.value)}
                        placeholder="(11) 99999-9999"
                        className="h-12 nc-input-glow"
                    />
                </div>
            </CardContent>
        </Card>
    );
}
