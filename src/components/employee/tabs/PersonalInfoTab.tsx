import { Input } from "../../ui/input";
import { Label } from "../../ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../ui/select";
import { Badge } from "../../ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "../../ui/tooltip";
import { Info } from "lucide-react";

export function PersonalInfoTab() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {/* Left Column */}
      <div className="space-y-6">
        <div className="space-y-2">
          <Label htmlFor="fullName" className="text-charcoal">
            Nome completo <span className="text-destructive">*</span>
          </Label>
          <Input 
            id="fullName" 
            defaultValue="João Silva Santos"
            className="border-border-color focus:border-charcoal"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="email" className="text-charcoal">
            E-mail <span className="text-destructive">*</span>
          </Label>
          <Input 
            id="email" 
            type="email"
            defaultValue="joao.silva@rccast.com"
            className="border-border-color focus:border-charcoal"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="phone" className="text-charcoal">Telefone</Label>
          <Input 
            id="phone" 
            defaultValue="+1 (555) 123-4567"
            className="border-border-color focus:border-charcoal"
          />
        </div>

        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Label htmlFor="ssn" className="text-charcoal">SSN</Label>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger>
                  <Info className="h-4 w-4 text-muted-foreground" />
                </TooltipTrigger>
                <TooltipContent>
                  <p>Visível completo só para RH admin</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
          <Input 
            id="ssn" 
            defaultValue="***-**-1234"
            className="border-border-color focus:border-charcoal"
            readOnly
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="passport" className="text-charcoal">Passaporte / ID</Label>
            <Input 
              id="passport" 
              defaultValue="AB1234567"
              className="border-border-color focus:border-charcoal"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="issuingCountry" className="text-charcoal">País emissor</Label>
            <Select defaultValue="br">
              <SelectTrigger className="border-border-color focus:border-charcoal">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="br">Brasil</SelectItem>
                <SelectItem value="us">Estados Unidos</SelectItem>
                <SelectItem value="mx">México</SelectItem>
                <SelectItem value="ca">Canadá</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="birthDate" className="text-charcoal">
              Data de nascimento <span className="text-destructive">*</span>
            </Label>
            <Input 
              id="birthDate" 
              type="date"
              defaultValue="1990-03-15"
              className="border-border-color focus:border-charcoal"
            />
          </div>
          <div className="space-y-2">
            <Label className="text-charcoal">Idade</Label>
            <div className="flex items-center h-10">
              <Badge variant="secondary" className="bg-muted text-charcoal">
                34 anos
              </Badge>
            </div>
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="originCountry" className="text-charcoal">País de origem</Label>
          <Select defaultValue="br">
            <SelectTrigger className="border-border-color focus:border-charcoal">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="br">Brasil</SelectItem>
              <SelectItem value="mx">México</SelectItem>
              <SelectItem value="us">Estados Unidos</SelectItem>
              <SelectItem value="other">Outro</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Right Column */}
      <div className="space-y-6">
        <div className="space-y-2">
          <Label htmlFor="residenceState" className="text-charcoal">Estado que reside (EUA)</Label>
          <Select defaultValue="tx">
            <SelectTrigger className="border-border-color focus:border-charcoal">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="tx">Texas</SelectItem>
              <SelectItem value="ca">California</SelectItem>
              <SelectItem value="fl">Florida</SelectItem>
              <SelectItem value="ny">New York</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="address" className="text-charcoal">Endereço completo</Label>
          <Input 
            id="address" 
            defaultValue="123 Main Street"
            placeholder="Rua"
            className="border-border-color focus:border-charcoal mb-2"
          />
          <div className="grid grid-cols-2 gap-2">
            <Input 
              placeholder="Cidade"
              defaultValue="Houston"
              className="border-border-color focus:border-charcoal"
            />
            <Input 
              placeholder="ZIP"
              defaultValue="77001"
              className="border-border-color focus:border-charcoal"
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="distance" className="text-charcoal">
            Distância/Cidade de origem
          </Label>
          <Input 
            id="distance" 
            placeholder="Ex: 50 milhas / São Paulo"
            className="border-border-color focus:border-charcoal"
            disabled
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="language" className="text-charcoal">Idioma preferido</Label>
          <Select defaultValue="pt">
            <SelectTrigger className="border-border-color focus:border-charcoal">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="pt">Português</SelectItem>
              <SelectItem value="en">English</SelectItem>
              <SelectItem value="es">Español</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="p-4 bg-muted rounded-lg border border-border-color">
          <p className="text-sm text-muted-foreground">
            <strong>Nota dev:</strong> Idade = floor((hoje − data_nascimento)/365.2425). 
            Recalcular ao salvar.
          </p>
        </div>
      </div>
    </div>
  );
}
