import { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";
import { Textarea } from "../ui/textarea";
import { Badge } from "../ui/badge";
import { Avatar, AvatarFallback } from "../ui/avatar";
import { Separator } from "../ui/separator";
import { Save, X, Calculator, AlertCircle } from "lucide-react";
import { useFactories } from "@/contexts/FactoriesContext";

export interface PayrollEntry {
  id: number;
  employee: string;
  employeeInitials: string;
  factory: string;
  period: string;
  regularHours: number;
  overtimeHours: number;
  hourlyRate: number;
  bonuses: number;
  deductions: number;
  status: string;
  payDate: string;
  benefitsOutsideCity?: boolean;
  receivesHousingAllowance?: boolean;
  grossPay?: number;
  netPay?: number;
  benefitOutsideCityAmount?: number;
  benefitHousingAmount?: number;
  qualifyingDaysOutsideCity?: number;
  regularPay?: number;
  overtimePay?: number;
}

interface PayrollEditDialogProps {
  open: boolean;
  entry: PayrollEntry | null;
  onOpenChange: (open: boolean) => void;
}

export function PayrollEditDialog({ open, entry, onOpenChange }: PayrollEditDialogProps) {
  const { factories } = useFactories();

  const [formData, setFormData] = useState({
    employee: "",
    employeeInitials: "",
    factoryId: "",
    period: "",
    regularHours: 0,
    overtimeHours: 0,
    hourlyRate: 0,
    overtimeMultiplier: 1.5,
    bonuses: 0,
    bonusDescription: "",
    deductions: 0,
    deductionDescription: "",
    healthInsurance: 0,
    tax: 0,
    status: "draft",
    payDate: "",
    notes: "",
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!entry) return;
    const d = entry.deductions;
    const health = Math.round(d * 0.65 * 100) / 100;
    const taxVal = Math.round((d - health) * 100) / 100;
    let factoryId = "";
    const f = factories.find(
      (x) =>
        entry.factory.includes(x.code) ||
        entry.factory.includes(x.name) ||
        `${x.name} · ${x.code}` === entry.factory.trim()
    );
    factoryId = f?.id ?? factories[0]?.id ?? "";

    setFormData({
      employee: entry.employee,
      employeeInitials: entry.employeeInitials,
      factoryId,
      period: entry.period,
      regularHours: entry.regularHours,
      overtimeHours: entry.overtimeHours,
      hourlyRate: entry.hourlyRate,
      overtimeMultiplier: 1.5,
      bonuses: entry.bonuses,
      bonusDescription: "",
      deductions: d,
      deductionDescription: "",
      healthInsurance: health,
      tax: taxVal,
      status: entry.status,
      payDate: entry.payDate,
      notes: "",
    });
    setErrors({});
  }, [entry, factories]);

  const handleInputChange = (field: string, value: unknown) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: "" }));
    }
  };

  const calculateRegularPay = () => formData.regularHours * formData.hourlyRate;
  const calculateOvertimePay = () =>
    formData.overtimeHours * formData.hourlyRate * formData.overtimeMultiplier;
  const calculateGrossPay = () => calculateRegularPay() + calculateOvertimePay() + formData.bonuses;
  const calculateNetPay = () => calculateGrossPay() - formData.deductions;

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(amount);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    if (!formData.regularHours || formData.regularHours < 0) {
      newErrors.regularHours = "Horas regulares inválidas";
    }
    if (formData.overtimeHours < 0) {
      newErrors.overtimeHours = "Horas extras inválidas";
    }
    if (!formData.hourlyRate || formData.hourlyRate <= 0) {
      newErrors.hourlyRate = "Valor por hora inválido";
    }
    if (!formData.payDate) {
      newErrors.payDate = "Data de pagamento é obrigatória";
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = () => {
    if (validateForm()) {
      onOpenChange(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "processed":
        return <Badge className="bg-green-100 text-green-700 border-green-200">Processada</Badge>;
      case "pending":
        return <Badge className="bg-orange-100 text-orange-700 border-orange-200">Pendente</Badge>;
      case "draft":
        return <Badge variant="secondary" className="bg-gray-100 text-gray-700">Rascunho</Badge>;
      case "approved":
        return <Badge className="bg-blue-100 text-blue-700 border-blue-200">Aprovada</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  if (!open || !entry) return null;

  return (
    <div className="space-y-6">
      {/* Cabeçalho — FIGMA PayrollForm */}
      <Card className="border-border-color">
        <CardHeader>
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div className="flex flex-col sm:flex-row sm:items-center gap-3 lg:gap-4">
              <CardTitle className="text-charcoal">Editar Folha de Pagamento</CardTitle>
              {getStatusBadge(formData.status)}
            </div>
            <div className="flex gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                className="border-border-color text-charcoal hover:bg-muted flex-1 lg:flex-none"
              >
                <X className="h-4 w-4 mr-2" />
                Cancelar
              </Button>
              <Button
                type="button"
                onClick={handleSave}
                className="bg-charcoal hover:bg-charcoal/90 text-white flex-1 lg:flex-none"
              >
                <Save className="h-4 w-4 mr-2" />
                Salvar
              </Button>
            </div>
          </div>
        </CardHeader>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card className="border-border-color">
            <CardHeader>
              <CardTitle className="text-charcoal">Informações do Funcionário</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-4 p-4 bg-muted/30 rounded-lg">
                <Avatar className="h-12 w-12">
                  <AvatarFallback className="bg-charcoal text-white">{formData.employeeInitials}</AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-semibold text-charcoal">{formData.employee}</p>
                  <p className="text-sm text-muted-foreground">ID: #{entry.id}</p>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="factory" className="text-charcoal">
                    Fábrica / Obra
                  </Label>
                  <Select
                    value={formData.factoryId || undefined}
                    onValueChange={(value) => handleInputChange("factoryId", value)}
                  >
                    <SelectTrigger id="factory" className="border-border-color focus:border-charcoal bg-input-background">
                      <SelectValue placeholder="Selecione o local" />
                    </SelectTrigger>
                    <SelectContent>
                      {factories.map((fac) => (
                        <SelectItem key={fac.id} value={fac.id}>
                          {fac.name} · {fac.code}
                          {fac.state ? ` · ${fac.state}` : ""}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="period" className="text-charcoal">
                    Período
                  </Label>
                  <Input
                    id="period"
                    value={formData.period}
                    readOnly
                    disabled
                    className="border-border-color focus:border-charcoal bg-muted/50"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-border-color">
            <CardHeader>
              <CardTitle className="text-charcoal">Horas Trabalhadas</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="regularHours" className="text-charcoal">
                    Horas Regulares <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="regularHours"
                    type="number"
                    value={formData.regularHours}
                    onChange={(e) => handleInputChange("regularHours", parseFloat(e.target.value) || 0)}
                    className={`border-border-color focus:border-charcoal bg-input-background ${errors.regularHours ? "border-destructive" : ""}`}
                  />
                  {errors.regularHours && <p className="text-xs text-destructive">{errors.regularHours}</p>}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="overtimeHours" className="text-charcoal">
                    Horas Extras
                  </Label>
                  <Input
                    id="overtimeHours"
                    type="number"
                    value={formData.overtimeHours}
                    onChange={(e) => handleInputChange("overtimeHours", parseFloat(e.target.value) || 0)}
                    className={`border-border-color focus:border-charcoal bg-input-background ${errors.overtimeHours ? "border-destructive" : ""}`}
                  />
                  {errors.overtimeHours && <p className="text-xs text-destructive">{errors.overtimeHours}</p>}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="overtimeMultiplier" className="text-charcoal">
                    Multiplicador (Extra)
                  </Label>
                  <Select
                    value={formData.overtimeMultiplier.toString()}
                    onValueChange={(value) => handleInputChange("overtimeMultiplier", parseFloat(value))}
                  >
                    <SelectTrigger
                      id="overtimeMultiplier"
                      className="border-border-color focus:border-charcoal bg-input-background"
                    >
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1.5">1.5x</SelectItem>
                      <SelectItem value="2">2.0x</SelectItem>
                      <SelectItem value="2.5">2.5x</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2 col-span-1 sm:col-span-2 lg:col-span-3">
                  <Label htmlFor="hourlyRate" className="text-charcoal">
                    Valor por Hora (USD) <span className="text-destructive">*</span>
                  </Label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
                    <Input
                      id="hourlyRate"
                      type="number"
                      step="0.01"
                      value={formData.hourlyRate}
                      onChange={(e) => handleInputChange("hourlyRate", parseFloat(e.target.value) || 0)}
                      className={`pl-8 border-border-color focus:border-charcoal bg-input-background ${errors.hourlyRate ? "border-destructive" : ""}`}
                    />
                  </div>
                  {errors.hourlyRate && <p className="text-xs text-destructive">{errors.hourlyRate}</p>}
                </div>
              </div>

              <Separator className="my-4" />

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-3 bg-blue-50 rounded-lg border border-blue-200 dark:bg-blue-950/30 dark:border-blue-900">
                  <p className="text-sm text-blue-800 dark:text-blue-200 mb-1">Pagamento Regular</p>
                  <p className="text-xl font-semibold text-blue-900 dark:text-blue-100">{formatCurrency(calculateRegularPay())}</p>
                  <p className="text-xs text-blue-600 dark:text-blue-300 mt-1">
                    {formData.regularHours}h × {formatCurrency(formData.hourlyRate)}
                  </p>
                </div>

                <div className="p-3 bg-orange-50 rounded-lg border border-orange-200 dark:bg-orange-950/30 dark:border-orange-900">
                  <p className="text-sm text-orange-800 dark:text-orange-200 mb-1">Pagamento Extra</p>
                  <p className="text-xl font-semibold text-orange-900 dark:text-orange-100">{formatCurrency(calculateOvertimePay())}</p>
                  <p className="text-xs text-orange-600 dark:text-orange-300 mt-1">
                    {formData.overtimeHours}h × {formatCurrency(formData.hourlyRate)} × {formData.overtimeMultiplier}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-border-color">
            <CardHeader>
              <CardTitle className="text-charcoal">Bônus e Deduções</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="bonuses" className="text-charcoal">
                      Bônus (USD)
                    </Label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
                      <Input
                        id="bonuses"
                        type="number"
                        step="0.01"
                        value={formData.bonuses}
                        onChange={(e) => handleInputChange("bonuses", parseFloat(e.target.value) || 0)}
                        className="pl-8 border-border-color focus:border-charcoal bg-input-background"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="bonusDescription" className="text-charcoal">
                      Descrição do Bônus
                    </Label>
                    <Input
                      id="bonusDescription"
                      value={formData.bonusDescription}
                      onChange={(e) => handleInputChange("bonusDescription", e.target.value)}
                      className="border-border-color focus:border-charcoal bg-input-background"
                      placeholder="Ex: Bônus de desempenho"
                    />
                  </div>
                </div>

                <Separator />

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="healthInsurance" className="text-charcoal">
                      Plano de Saúde
                    </Label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
                      <Input
                        id="healthInsurance"
                        type="number"
                        step="0.01"
                        value={formData.healthInsurance}
                        onChange={(e) => {
                          const health = parseFloat(e.target.value) || 0;
                          const tax = formData.tax;
                          handleInputChange("healthInsurance", health);
                          handleInputChange("deductions", Math.round((health + tax) * 100) / 100);
                        }}
                        className="pl-8 border-border-color focus:border-charcoal bg-input-background"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="tax" className="text-charcoal">
                      Impostos
                    </Label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
                      <Input
                        id="tax"
                        type="number"
                        step="0.01"
                        value={formData.tax}
                        onChange={(e) => {
                          const taxValue = parseFloat(e.target.value) || 0;
                          const health = formData.healthInsurance;
                          handleInputChange("tax", taxValue);
                          handleInputChange("deductions", Math.round((health + taxValue) * 100) / 100);
                        }}
                        className="pl-8 border-border-color focus:border-charcoal bg-input-background"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="deductions" className="text-charcoal">
                      Total de Deduções
                    </Label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
                      <Input
                        id="deductions"
                        type="number"
                        step="0.01"
                        value={formData.deductions}
                        onChange={(e) => {
                          const total = parseFloat(e.target.value) || 0;
                          handleInputChange("deductions", total);
                          const h = Math.round(total * 0.65 * 100) / 100;
                          const t = Math.round((total - h) * 100) / 100;
                          handleInputChange("healthInsurance", h);
                          handleInputChange("tax", t);
                        }}
                        className="pl-8 border-border-color focus:border-charcoal bg-input-background text-red-600 font-semibold"
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="deductionDescription" className="text-charcoal">
                    Descrição das Deduções
                  </Label>
                  <Input
                    id="deductionDescription"
                    value={formData.deductionDescription}
                    onChange={(e) => handleInputChange("deductionDescription", e.target.value)}
                    className="border-border-color focus:border-charcoal bg-input-background"
                    placeholder="Ex: INSS, Plano de Saúde"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-border-color">
            <CardHeader>
              <CardTitle className="text-charcoal">Informações Adicionais</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="status" className="text-charcoal">
                    Status
                  </Label>
                  <Select value={formData.status} onValueChange={(value) => handleInputChange("status", value)}>
                    <SelectTrigger id="status" className="border-border-color focus:border-charcoal bg-input-background">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="draft">Rascunho</SelectItem>
                      <SelectItem value="pending">Pendente</SelectItem>
                      <SelectItem value="approved">Aprovada</SelectItem>
                      <SelectItem value="processed">Processada</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="payDate" className="text-charcoal">
                    Data de Pagamento <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="payDate"
                    type="date"
                    value={formData.payDate}
                    onChange={(e) => handleInputChange("payDate", e.target.value)}
                    className={`border-border-color focus:border-charcoal bg-input-background ${errors.payDate ? "border-destructive" : ""}`}
                  />
                  {errors.payDate && <p className="text-xs text-destructive">{errors.payDate}</p>}
                </div>
              </div>

              <div className="space-y-2 mt-4">
                <Label htmlFor="notes" className="text-charcoal">
                  Observações
                </Label>
                <Textarea
                  id="notes"
                  value={formData.notes}
                  onChange={(e) => handleInputChange("notes", e.target.value)}
                  className="min-h-24 border-border-color focus:border-charcoal bg-input-background"
                  placeholder="Adicione observações sobre esta folha de pagamento..."
                />
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card className="border-border-color lg:sticky lg:top-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-charcoal">
                <Calculator className="h-5 w-5 shrink-0" />
                Resumo do Cálculo
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex justify-between items-center p-2 rounded">
                  <span className="text-sm text-muted-foreground">Pagamento Regular</span>
                  <span className="font-mono text-sm">{formatCurrency(calculateRegularPay())}</span>
                </div>

                <div className="flex justify-between items-center p-2 rounded">
                  <span className="text-sm text-muted-foreground">Horas Extras</span>
                  <span className="font-mono text-sm text-orange-600">+{formatCurrency(calculateOvertimePay())}</span>
                </div>

                <div className="flex justify-between items-center p-2 rounded">
                  <span className="text-sm text-muted-foreground">Bônus</span>
                  <span className="font-mono text-sm text-blue-600">+{formatCurrency(formData.bonuses)}</span>
                </div>

                <Separator />

                <div className="flex justify-between items-center p-2 bg-green-50 rounded-lg dark:bg-green-950/40">
                  <span className="text-sm font-medium text-green-800 dark:text-green-200">Salário Bruto</span>
                  <span className="font-mono font-semibold text-green-900 dark:text-green-100">{formatCurrency(calculateGrossPay())}</span>
                </div>

                <div className="flex justify-between items-center p-2 rounded">
                  <span className="text-sm text-muted-foreground">Deduções</span>
                  <span className="font-mono text-sm text-red-600">-{formatCurrency(formData.deductions)}</span>
                </div>

                <Separator />

                <div className="flex justify-between items-center p-3 bg-charcoal rounded-lg">
                  <span className="font-semibold text-white">Salário Líquido</span>
                  <span className="font-mono text-xl font-bold text-gold">{formatCurrency(calculateNetPay())}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-orange-200 bg-orange-50 dark:bg-orange-950/30 dark:border-orange-900">
            <CardContent className="p-4">
              <div className="flex gap-3">
                <AlertCircle className="h-5 w-5 text-orange-600 shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-orange-800 dark:text-orange-200">Atenção</p>
                  <p className="text-xs text-orange-700 dark:text-orange-300 mt-1">
                    Verifique todos os valores antes de salvar. Alterações em folhas processadas podem exigir aprovação adicional.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
