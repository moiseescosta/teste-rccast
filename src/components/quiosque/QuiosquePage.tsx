import { useState } from "react";
import { Card, CardContent, CardHeader } from "../ui/card";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Clock, ArrowRight, ArrowLeft } from "lucide-react";
import { isSupabaseConfigured } from "@/lib/supabase";

interface QuiosquePageProps {
  onContinue: (phoneDigits: string) => void;
  onCancel: () => void;
}

export function QuiosquePage({ onContinue, onCancel }: QuiosquePageProps) {
  const [phone, setPhone] = useState("");
  const [message, setMessage] = useState<{ type: "error"; text: string } | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);
    const trimmed = phone.replace(/\D/g, "").trim();
    if (!trimmed) {
      setMessage({ type: "error", text: "Digite seu número de telefone (sem DDD ou com DDD)." });
      return;
    }
    if (!isSupabaseConfigured()) {
      setMessage({ type: "error", text: "Sistema não configurado (Supabase)." });
      return;
    }
    onContinue(trimmed);
  };

  const formatInputPhone = (value: string) => {
    const numbers = value.replace(/\D/g, "").slice(0, 11);
    if (numbers.length <= 3) return numbers;
    if (numbers.length <= 7) return `${numbers.slice(0, 3)}-${numbers.slice(3)}`;
    return `${numbers.slice(0, 2)} ${numbers.slice(2, 7)}-${numbers.slice(7)}`;
  };

  return (
    <div className="space-y-6 max-w-md mx-auto">
      <Card className="border-border-color shadow-md">
        <CardHeader className="text-center pb-2">
          <div className="flex justify-center gap-3 items-center mb-4">
            <div className="h-10 bg-charcoal rounded flex items-center justify-center shrink-0" style={{ width: "40px" }}>
              <span className="text-white font-bold text-sm">RC</span>
            </div>
            <span className="font-semibold text-charcoal text-xl">RC CAST</span>
          </div>
          <h1 className="text-lg font-semibold text-charcoal flex items-center justify-center gap-2">
            <Clock className="h-5 w-5" />
            Bater Ponto
          </h1>
          <p className="text-sm text-muted-foreground">Digite seu número de telefone (sem DDD) para acessar o painel.</p>
        </CardHeader>
        <CardContent className="pt-2">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="quiosque-phone" className="text-charcoal">
                Telefone
              </Label>
              <Input
                id="quiosque-phone"
                type="tel"
                value={phone}
                onChange={(e) => setPhone(formatInputPhone(e.target.value))}
                className="border-border-color focus:border-charcoal bg-input-background"
                placeholder="Ex.: 555-5555 ou 11 99999-9999"
                autoComplete="tel"
                maxLength={14}
              />
            </div>
            {message && (
              <p className="text-sm text-destructive" role="alert">
                {message.text}
              </p>
            )}
            <Button type="submit" className="w-full bg-charcoal hover:bg-charcoal/90 text-white">
              Acessar painel
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          </form>
        </CardContent>
      </Card>
      <Button
        type="button"
        variant="ghost"
        className="w-full text-muted-foreground hover:text-charcoal"
        onClick={onCancel}
      >
        <ArrowLeft className="h-4 w-4 mr-2" />
        Voltar ao início
      </Button>
    </div>
  );
}
