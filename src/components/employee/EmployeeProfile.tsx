import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { Camera, DollarSign, FileImage, Info, Loader2 } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { employeeService } from "@/services/employeeService";
import { hourlyRateHistoryService } from "@/services/hourlyRateHistoryService";
import type { Employee, EmployeeExtraDocument } from "@/types/employee";
import type { HourlyRateHistoryEntry } from "@/types/hourlyRateHistory";
import { HourlyRateHistoryTable } from "./HourlyRateHistoryTable";

function maskSsn(ssn: string | null): string {
  if (!ssn) return "";
  const digits = ssn.replace(/\D/g, "").slice(-4);
  return `***-**-${digits}`;
}

function getAge(birthDate: string | null): string {
  if (!birthDate) return "";
  const today = new Date();
  const birth = new Date(birthDate);
  const age = Math.floor((today.getTime() - birth.getTime()) / (365.25 * 24 * 60 * 60 * 1000));
  return `${age} anos`;
}

function getLanguageLabel(lang: string | null | undefined): string {
  if (!lang) return "-";
  const map: Record<string, string> = { pt: "Português", en: "English", es: "Español" };
  return map[lang] ?? lang;
}

function formatDate(value: string | null | undefined): string {
  if (!value) return "";
  try {
    return new Date(value).toLocaleDateString("pt-BR");
  } catch {
    return value;
  }
}

function normalizeExtraDocuments(raw: Employee["extra_documents"]): EmployeeExtraDocument[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .filter((doc) => doc && typeof doc === "object")
    .map((doc) => {
      const d = doc as Record<string, unknown>;
      const id =
        typeof d.id === "string" && d.id.trim()
          ? d.id
          : `${Date.now()}-${Math.random().toString(16).slice(2)}`;
      const title = typeof d.title === "string" ? d.title : "";
      const image_url = typeof d.image_url === "string" ? d.image_url : "";
      return { id, title, image_url };
    })
    .filter((doc) => doc.title.trim() || doc.image_url);
}

function parseWorkNotesHistory(raw: string | null | undefined): string[] {
  if (!raw) return [];
  return raw
    .split("\n")
    .map((item) => item.trim())
    .filter(Boolean);
}

function normalizeEmployeeMovements(raw: unknown): Array<{
  id: string;
  factory: string;
  start_date: string;
  end_date: string;
  clock_in_time?: string | null;
  clock_out_time?: string | null;
  notes?: string | null;
}> {
  if (!Array.isArray(raw)) return [];
  return raw
    .map((item) => {
      if (!item || typeof item !== "object") return null;
      const row = item as Record<string, unknown>;
      const factory = typeof row.factory === "string" ? row.factory.trim() : "";
      const startDate = typeof row.start_date === "string" ? row.start_date : "";
      const endDate = typeof row.end_date === "string" ? row.end_date : "";
      if (!factory || !startDate || !endDate) return null;
      return {
        id:
          typeof row.id === "string" && row.id.trim()
            ? row.id
            : `${Date.now()}-${Math.random().toString(16).slice(2)}`,
        factory,
        start_date: startDate,
        end_date: endDate,
        clock_in_time: typeof row.clock_in_time === "string" ? row.clock_in_time : null,
        clock_out_time: typeof row.clock_out_time === "string" ? row.clock_out_time : null,
        notes: typeof row.notes === "string" ? row.notes : null,
      };
    })
    .filter(Boolean) as Array<{
    id: string;
    factory: string;
    start_date: string;
    end_date: string;
    clock_in_time?: string | null;
    clock_out_time?: string | null;
    notes?: string | null;
  }>;
}

interface EmployeeProfileProps {
  employeeId: string;
  onBack: () => void;
  onEdit: (id: string) => void;
  onLoaded?: (employee: Employee) => void;
}

export function EmployeeProfile({
  employeeId,
  onBack,
  onEdit,
  onLoaded,
}: EmployeeProfileProps) {
  const [employee, setEmployee] = useState<Employee | null>(null);
  const [loading, setLoading] = useState(true);
  const [hourlyRateHistory, setHourlyRateHistory] = useState<HourlyRateHistoryEntry[]>([]);

  useEffect(() => {
    setLoading(true);
    employeeService
      .getById(employeeId)
      .then((data) => {
        setEmployee(data);
        onLoaded?.(data);
      })
      .catch(() => alert("Erro ao carregar perfil"))
      .finally(() => setLoading(false));
  }, [employeeId, onLoaded]);

  useEffect(() => {
    hourlyRateHistoryService
      .getByEmployeeId(employeeId)
      .then(setHourlyRateHistory)
      .catch(() => setHourlyRateHistory([]));
  }, [employeeId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        <span className="ml-3 text-muted-foreground">Carregando perfil...</span>
      </div>
    );
  }

  if (!employee) {
    return (
      <div className="text-center py-16">
        <p className="text-muted-foreground mb-4">Funcionário não encontrado</p>
        <Button variant="outline" onClick={onBack}>
          Voltar
        </Button>
      </div>
    );
  }

  const extraDocs = normalizeExtraDocuments(employee.extra_documents);
  const observationHistory = parseWorkNotesHistory(employee.work_notes);
  const movementHistory = normalizeEmployeeMovements((employee as { employee_movements?: unknown }).employee_movements);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8">
        {/* Coluna esquerda: Foto + Pagamento rápido */}
        <div className="lg:col-span-4 xl:col-span-3 space-y-6">
          {/* Card Foto — mesmo layout que Editar (Dados pessoais) */}
          <Card>
            <CardContent className="relative p-6 text-center">
              <div className="flex flex-col items-center gap-2 mb-4">
                <div className="w-32 h-32 rounded-lg bg-muted overflow-hidden border border-border-color shrink-0">
                  {employee.photo_url ? (
                    <img
                      src={employee.photo_url}
                      alt="Foto do funcionario"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Camera className="h-8 w-8 text-muted-foreground" />
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Card Pagamento rápido */}
          <Card className="border border-border">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-charcoal text-base font-semibold">
                <DollarSign className="h-5 w-5" />
                Pagamento rápido
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-semibold text-charcoal">
                US${" "}
                {employee.hourly_rate
                  ? Number(employee.hourly_rate).toFixed(2).replace(".", ",")
                  : "0,00"}
                /h
              </p>
              <p className="text-sm text-muted-foreground mt-1">
                Valor por hora
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Coluna direita: Abas e formulário */}
        <div className="lg:col-span-8 xl:col-span-9">
          <Card className="border border-border">
            <CardContent className="p-0">
              <Tabs defaultValue="pessoais" className="w-full">
                <TabsList className="w-full justify-start rounded-none border-b border-border bg-transparent p-0 h-auto gap-0 rounded-t-xl">
                  <TabsTrigger
                    value="pessoais"
                    className="rounded-none border-b-2 border-transparent data-[state=active]:border-charcoal data-[state=active]:bg-muted/50 data-[state=active]:shadow-none px-4 py-3 text-sm"
                  >
                    Informações pessoais
                  </TabsTrigger>
                  <TabsTrigger
                    value="trabalho"
                    className="rounded-none border-b-2 border-transparent data-[state=active]:border-charcoal data-[state=active]:bg-muted/50 data-[state=active]:shadow-none px-4 py-3 text-sm"
                  >
                    Trabalho
                  </TabsTrigger>
                  <TabsTrigger
                    value="pagamento"
                    className="rounded-none border-b-2 border-transparent data-[state=active]:border-charcoal data-[state=active]:bg-muted/50 data-[state=active]:shadow-none px-4 py-3 text-sm"
                  >
                    Pagamento
                  </TabsTrigger>
                  <TabsTrigger
                    value="documentos"
                    className="rounded-none border-b-2 border-transparent data-[state=active]:border-charcoal data-[state=active]:bg-muted/50 data-[state=active]:shadow-none px-4 py-3 text-sm"
                  >
                    Documentos
                  </TabsTrigger>
                  <TabsTrigger
                    value="observacoes"
                    className="rounded-none border-b-2 border-transparent data-[state=active]:border-charcoal data-[state=active]:bg-muted/50 data-[state=active]:shadow-none px-4 py-3 text-sm"
                  >
                    Observações
                  </TabsTrigger>
                  <TabsTrigger
                    value="movimentacoes"
                    className="rounded-none border-b-2 border-transparent data-[state=active]:border-charcoal data-[state=active]:bg-muted/50 data-[state=active]:shadow-none px-4 py-3 text-sm"
                  >
                    Movimentações
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="pessoais" className="p-6 mt-0">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="full_name" className="text-charcoal">
                        Nome completo *
                      </Label>
                      <Input
                        id="full_name"
                        value={employee.full_name}
                        readOnly
                        className="bg-input-background border-border text-charcoal"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="residence_state" className="text-charcoal">
                        Estado que reside (EUA)
                      </Label>
                      <Input
                        id="residence_state"
                        value={employee.residence_state || ""}
                        readOnly
                        className="bg-input-background border-border text-charcoal"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="email" className="text-charcoal">
                        E-mail *
                      </Label>
                      <Input
                        id="email"
                        type="email"
                        value={employee.email}
                        readOnly
                        className="bg-input-background border-border text-charcoal"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="address" className="text-charcoal">
                        Endereço completo
                      </Label>
                      <Input
                        id="address"
                        value={employee.address || ""}
                        readOnly
                        className="bg-input-background border-border text-charcoal"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="phone" className="text-charcoal">
                        Telefone
                      </Label>
                      <Input
                        id="phone"
                        value={employee.phone || ""}
                        readOnly
                        className="bg-input-background border-border text-charcoal"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div className="space-y-2">
                        <Label htmlFor="city" className="text-charcoal">
                          Cidade
                        </Label>
                        <Input
                          id="city"
                          value={employee.city || ""}
                          readOnly
                          className="bg-input-background border-border text-charcoal"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="zip_code" className="text-charcoal">
                          CEP
                        </Label>
                        <Input
                          id="zip_code"
                          value={employee.zip_code || ""}
                          readOnly
                          className="bg-input-background border-border text-charcoal"
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="ssn" className="text-charcoal flex items-center gap-1.5">
                        SSN
                        <Info className="h-4 w-4 text-muted-foreground cursor-help" aria-label="Informação" />
                      </Label>
                      <Input
                        id="ssn"
                        type="password"
                        value={maskSsn(employee.ssn)}
                        readOnly
                        className="bg-input-background border-border text-charcoal font-mono"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="passport" className="text-charcoal">
                        Passaporte / ID
                      </Label>
                      <Input
                        id="passport"
                        value={employee.passport || ""}
                        readOnly
                        className="bg-input-background border-border text-charcoal"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="issuing_country" className="text-charcoal">
                        País emissor
                      </Label>
                      <Input
                        id="issuing_country"
                        value={employee.issuing_country || ""}
                        readOnly
                        className="bg-input-background border-border text-charcoal"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="birth_date" className="text-charcoal">
                        Data de nascimento
                      </Label>
                      <Input
                        id="birth_date"
                        value={formatDate(employee.birth_date)}
                        readOnly
                        className="bg-input-background border-border text-charcoal"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-charcoal">Idade</Label>
                      <div className="flex items-center h-10">
                        {employee.birth_date ? (
                          <Badge variant="secondary" className="bg-muted text-charcoal">
                            {getAge(employee.birth_date)}
                          </Badge>
                        ) : (
                          <span className="text-sm text-muted-foreground">-</span>
                        )}
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="origin_country" className="text-charcoal">
                        País de origem
                      </Label>
                      <Input
                        id="origin_country"
                        value={employee.origin_country || ""}
                        readOnly
                        className="bg-input-background border-border text-charcoal"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="language" className="text-charcoal">
                        Idioma preferido
                      </Label>
                      <Input
                        id="language"
                        value={getLanguageLabel(employee.language)}
                        readOnly
                        className="bg-input-background border-border text-charcoal"
                      />
                    </div>
                    {!employee.same_city && (
                      <div className="space-y-2 sm:col-span-2">
                        <Label htmlFor="distance" className="text-charcoal">
                          Distância/Cidade de origem
                        </Label>
                        <Input
                          id="distance"
                          value={employee.distance || ""}
                          placeholder="Ex: 50 milhas / São Paulo"
                          readOnly
                          className="bg-input-background border-border text-charcoal"
                        />
                      </div>
                    )}
                  </div>
                </TabsContent>

                <TabsContent value="trabalho" className="p-6 mt-0">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <InfoField label="Local" value={employee.location} />
                    <InfoField label="Fábrica/Obra" value={employee.factory} />
                    <InfoField label="Função" value={employee.role} />
                    <InfoField label="Setor" value={employee.department} />
                    <InfoField label="Projeto" value={employee.project} />
                    <InfoField label="Supervisor" value={employee.supervisor} />
                    <InfoField
                      label="Data de início"
                      value={
                        employee.start_date
                          ? new Date(employee.start_date).toLocaleDateString(
                              "pt-BR"
                            )
                          : null
                      }
                    />
                    <InfoField
                      label="Data de fim"
                      value={
                        employee.end_date
                          ? new Date(employee.end_date).toLocaleDateString(
                              "pt-BR"
                            )
                          : null
                      }
                    />
                    {employee.work_notes && (
                      <InfoField
                        label="Observações"
                        value={employee.work_notes}
                        className="sm:col-span-2"
                      />
                    )}
                  </div>
                </TabsContent>

                <TabsContent value="pagamento" className="p-6 mt-0 space-y-6">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <InfoField
                      label="Valor/hora (atual)"
                      value={
                        employee.hourly_rate
                          ? `US$ ${Number(employee.hourly_rate).toFixed(2)}`
                          : null
                      }
                    />
                    <InfoField
                      label="Vigente desde (atual)"
                      value={
                        employee.effective_date
                          ? new Date(
                              employee.effective_date
                            ).toLocaleDateString("pt-BR")
                          : null
                      }
                    />
                  </div>
                  <div className="space-y-3 max-w-3xl">
                    <h3 className="text-sm font-semibold text-charcoal">
                      Histórico de valor por hora
                    </h3>
                    <HourlyRateHistoryTable
                      rows={hourlyRateHistory}
                      emptyMessage="Nenhum registro de histórico. Alterações feitas na edição do funcionário (aba Pagamento) passam a aparecer aqui."
                    />
                  </div>
                </TabsContent>

                <TabsContent value="documentos" className="p-6 mt-0">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <ProfileDocumentCard
                      title="Passaporte"
                      imageUrl={employee.passport_image_url}
                    />
                    <ProfileDocumentCard
                      title="Driver's License"
                      imageUrl={employee.drivers_license_url}
                    />
                    {extraDocs.map((doc) => (
                      <ProfileDocumentCard
                        key={doc.id}
                        title={doc.title.trim() || "Documento"}
                        imageUrl={doc.image_url}
                      />
                    ))}
                  </div>
                  {!employee.passport_image_url &&
                    !employee.drivers_license_url &&
                    extraDocs.length === 0 && (
                      <p className="text-sm text-muted-foreground mt-4">
                        Nenhum documento cadastrado. Edite o funcionário na aba Documentos do cadastro para adicionar imagens.
                      </p>
                    )}
                </TabsContent>

                <TabsContent value="observacoes" className="p-6 mt-0">
                  {observationHistory.length > 0 ? (
                    <div className="space-y-2">
                      {observationHistory.map((item, index) => (
                        <div
                          key={`${item}-${index}`}
                          className="rounded-md border border-border bg-muted/30 px-3 py-2 text-sm text-charcoal"
                        >
                          {item}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-muted-foreground text-sm">
                      Nenhuma observação registrada.
                    </p>
                  )}
                </TabsContent>

                <TabsContent value="movimentacoes" className="p-6 mt-0">
                  {movementHistory.length === 0 ? (
                    <p className="text-muted-foreground text-sm">
                      Nenhuma movimentação registrada.
                    </p>
                  ) : (
                    <div className="space-y-2">
                      {movementHistory.map((item) => (
                        <div key={item.id} className="rounded-md border border-border bg-muted/30 px-3 py-2">
                          <p className="text-sm font-medium text-charcoal">{item.factory}</p>
                          <p className="text-xs text-muted-foreground">
                            {new Date(`${item.start_date}T12:00:00`).toLocaleDateString("pt-BR")} a{" "}
                            {new Date(`${item.end_date}T12:00:00`).toLocaleDateString("pt-BR")}
                            {" · "}
                            {item.clock_in_time || "--:--"} - {item.clock_out_time || "--:--"}
                          </p>
                          {item.notes ? (
                            <p className="text-sm text-charcoal mt-1">{item.notes}</p>
                          ) : null}
                        </div>
                      ))}
                    </div>
                  )}
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

function InfoField({
  label,
  value,
  className = "",
}: {
  label: string;
  value: string | null | undefined;
  className?: string;
}) {
  return (
    <div className={`space-y-1 ${className}`}>
      <p className="text-sm font-medium text-muted-foreground">{label}</p>
      <p className="text-sm text-charcoal">{value || "-"}</p>
    </div>
  );
}

function ProfileDocumentCard({
  title,
  imageUrl,
}: {
  title: string;
  imageUrl: string | null | undefined;
}) {
  return (
    <div className="space-y-2">
      <p className="text-sm font-medium text-charcoal">{title}</p>
      <div className="relative border border-border rounded-lg p-4 bg-muted/30 min-h-[180px] flex flex-col items-center justify-center">
        {imageUrl ? (
          <img
            src={imageUrl}
            alt={title}
            className="max-h-48 w-auto mx-auto rounded object-contain"
          />
        ) : (
          <>
            <FileImage className="h-10 w-10 text-muted-foreground mb-2" />
            <p className="text-xs text-muted-foreground text-center">
              Nenhuma imagem cadastrada
            </p>
          </>
        )}
      </div>
    </div>
  );
}
