import { Input } from "../../ui/input";
import { Label } from "../../ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../ui/select";
import { Textarea } from "../../ui/textarea";
import { Badge } from "../../ui/badge";
import { getDepartmentOptions } from "@/data/factories";
import { useFactories } from "@/contexts/FactoriesContext";

export function WorkTab() {
  const { factories } = useFactories();
  const departmentOptions = getDepartmentOptions(factories);
  return (
    <div className="space-y-8">
      {/* Alocação */}
      <div>
        <h3 className="text-lg font-semibold text-charcoal mb-4">Alocação</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <div className="space-y-2">
            <Label htmlFor="location" className="text-charcoal">Local (cidade/estado)</Label>
            <Select defaultValue="houston-tx">
              <SelectTrigger className="border-border-color focus:border-charcoal">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="houston-tx">Houston, TX</SelectItem>
                <SelectItem value="dallas-tx">Dallas, TX</SelectItem>
                <SelectItem value="austin-tx">Austin, TX</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="factory" className="text-charcoal">Fábrica / Obra</Label>
            <Select defaultValue="petrochemical-01">
              <SelectTrigger className="border-border-color focus:border-charcoal">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="petrochemical-01">Petrochemical Plant · PC001 · TX</SelectItem>
                <SelectItem value="refinery-02">Oil Refinery · OR002 · TX</SelectItem>
                <SelectItem value="construction-03">Construction Site · CS003 · TX</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2 col-span-2">
            <Label htmlFor="project" className="text-charcoal">Projeto/Cliente (opcional)</Label>
            <Input 
              id="project" 
              defaultValue="Expansão Unidade A - Petrobras"
              className="border-border-color focus:border-charcoal"
            />
          </div>
        </div>
      </div>

      {/* Função & Setor */}
      <div>
        <h3 className="text-lg font-semibold text-charcoal mb-4">Função & Setor</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <div className="space-y-2">
            <Label htmlFor="role" className="text-charcoal">Função</Label>
            <Select defaultValue="welder">
              <SelectTrigger className="border-border-color focus:border-charcoal">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="welder">Soldador</SelectItem>
                <SelectItem value="operator">Operador</SelectItem>
                <SelectItem value="technician">Técnico</SelectItem>
                <SelectItem value="supervisor">Supervisor</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="department" className="text-charcoal">Setor</Label>
            <Select defaultValue={departmentOptions[0] ?? ""}>
              <SelectTrigger className="border-border-color focus:border-charcoal">
                <SelectValue placeholder="Selecionar setor" />
              </SelectTrigger>
              <SelectContent>
                {departmentOptions.map((dept) => (
                  <SelectItem key={dept} value={dept}>
                    {dept}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2 col-span-2">
            <Label htmlFor="supervisor" className="text-charcoal">Líder/Supervisor (opcional)</Label>
            <Select>
              <SelectTrigger className="border-border-color focus:border-charcoal">
                <SelectValue placeholder="Selecionar supervisor" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="maria-santos">Maria Santos - Supervisora de Produção</SelectItem>
                <SelectItem value="carlos-oliveira">Carlos Oliveira - Coordenador de Manutenção</SelectItem>
                <SelectItem value="ana-rodrigues">Ana Rodrigues - Líder de Turno</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Datas de vínculo */}
      <div>
        <h3 className="text-lg font-semibold text-charcoal mb-4">Datas de vínculo</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <div className="space-y-2">
            <Label htmlFor="startDate" className="text-charcoal">
              Data de início <span className="text-destructive">*</span>
            </Label>
            <Input 
              id="startDate" 
              type="date"
              defaultValue="2023-01-15"
              className="border-border-color focus:border-charcoal"
            />
          </div>

          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Label htmlFor="endDate" className="text-charcoal">Data de fim (opcional)</Label>
              <Badge variant="outline" className="text-xs border-border-color text-muted-foreground">
                Ativo
              </Badge>
            </div>
            <Input 
              id="endDate" 
              type="date"
              className="border-border-color focus:border-charcoal"
            />
          </div>
        </div>
      </div>

      {/* Observações do trabalho */}
      <div>
        <h3 className="text-lg font-semibold text-charcoal mb-4">Observações do trabalho</h3>
        <Textarea 
          placeholder="Adicione observações sobre o trabalho do funcionário..."
          defaultValue="Funcionário experiente em soldas em aço inoxidável. Certificado AWS D1.1. Excelente desempenho em ambientes de alta pressão."
          className="min-h-24 border-border-color focus:border-charcoal"
        />
      </div>

      <div className="p-4 bg-accent/20 rounded-lg border border-border-color">
        <p className="text-sm text-muted-foreground">
          <strong>Regra visual:</strong> Qualquer mudança aqui cria item em Movimentações (antes→depois, quem, quando).
        </p>
      </div>
    </div>
  );
}
