import { Input } from "../../ui/input";
import { Label } from "../../ui/label";
import { Button } from "../../ui/button";
import { Badge } from "../../ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "../../ui/card";
import { DollarSign, Plus } from "lucide-react";

export function PaymentTab() {
  const rateHistory = [
    {
      value: "16.00",
      period: "15/01/2023 → atual",
      reason: "Aumento por desempenho",
      approvedBy: "Maria Santos",
      createdAt: "15/01/2023 09:30"
    },
    {
      value: "14.50",
      period: "01/06/2022 → 14/01/2023",
      reason: "Certificação AWS",
      approvedBy: "Carlos Oliveira",
      createdAt: "01/06/2022 14:15"
    },
    {
      value: "12.00",
      period: "15/01/2022 → 31/05/2022",
      reason: "Valor inicial",
      approvedBy: "Ana Rodrigues",
      createdAt: "15/01/2022 10:00"
    }
  ];

  return (
    <div className="space-y-8">
      {/* Resumo da semana atual */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-charcoal">
            <DollarSign className="h-5 w-5" />
            Resumo (semana atual)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6 text-center">
            <div>
              <p className="text-2xl font-semibold text-charcoal">US$ 16,00/h</p>
              <p className="text-sm text-muted-foreground">Valor por hora atual</p>
            </div>
            <div>
              <p className="text-2xl font-semibold text-charcoal">40</p>
              <p className="text-sm text-muted-foreground">Horas totais</p>
            </div>
            <div>
              <p className="text-2xl font-semibold text-charcoal">5</p>
              <p className="text-sm text-muted-foreground">Dias trabalhados</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Rate atual */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-charcoal">Rate atual (editável)</h3>
          <Button 
            variant="outline" 
            size="sm"
            className="border-border-color text-charcoal hover:bg-muted"
          >
            <Plus className="h-4 w-4 mr-2" />
            Adicionar rate
          </Button>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <div className="space-y-2">
            <Label htmlFor="currentRate" className="text-charcoal">
              Valor por hora (USD)
            </Label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground">$</span>
              <Input 
                id="currentRate" 
                type="number"
                step="0.01"
                defaultValue="16.00"
                className="pl-8 border-border-color focus:border-charcoal"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="effectiveDate" className="text-charcoal">
              Vigente a partir de
            </Label>
            <Input 
              id="effectiveDate" 
              type="date"
              defaultValue="2023-01-15"
              className="border-border-color focus:border-charcoal"
            />
          </div>
        </div>
      </div>

      {/* Histórico de rates */}
      <div>
        <h3 className="text-lg font-semibold text-charcoal mb-4">Histórico de rates</h3>
        
        <div className="border border-border-color rounded-lg overflow-x-auto">
          <Table className="min-w-[600px]">
            <TableHeader>
              <TableRow className="bg-muted/50">
                <TableHead className="text-charcoal">Valor (USD/h)</TableHead>
                <TableHead className="text-charcoal">Vigência</TableHead>
                <TableHead className="text-charcoal">Motivo</TableHead>
                <TableHead className="text-charcoal">Aprovado por</TableHead>
                <TableHead className="text-charcoal">Criado em</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rateHistory.map((rate, index) => (
                <TableRow key={index} className="border-border-color">
                  <TableCell className="font-semibold">
                    ${rate.value}
                    {index === 0 && (
                      <Badge variant="secondary" className="ml-2 bg-accent/20 text-charcoal">
                        Atual
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell>{rate.period}</TableCell>
                  <TableCell>{rate.reason}</TableCell>
                  <TableCell>{rate.approvedBy}</TableCell>
                  <TableCell className="text-muted-foreground">{rate.createdAt}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>

      <div className="p-4 bg-accent/20 rounded-lg border border-border-color">
        <p className="text-sm text-muted-foreground">
          <strong>Nota:</strong> Alteração de rate → Movimentações. Botão "Adicionar rate" cria nova vigência (não retroage).
        </p>
      </div>
    </div>
  );
}
