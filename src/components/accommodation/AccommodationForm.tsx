import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";
import { Textarea } from "../ui/textarea";
import { Checkbox } from "../ui/checkbox";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";
import { Save, X, Building2, MapPin, DollarSign, Settings } from "lucide-react";

interface AccommodationFormProps {
  mode: "create" | "edit";
  onSave: () => void;
  onCancel: () => void;
  initialData?: any;
}

export function AccommodationForm({ mode, onSave, onCancel, initialData }: AccommodationFormProps) {
  const [formData, setFormData] = useState({
    // Basic Info
    name: initialData?.name || "",
    type: initialData?.type || "",
    status: initialData?.status || "active",
    
    // Location
    address: initialData?.address || "",
    city: initialData?.city || "",
    state: initialData?.state || "",
    zipCode: initialData?.zipCode || "",
    country: initialData?.country || "us",
    
    // Capacity & Pricing
    totalRooms: initialData?.totalRooms || "",
    singleRooms: initialData?.singleRooms || "",
    doubleRooms: initialData?.doubleRooms || "",
    suiteRooms: initialData?.suiteRooms || "",
    pricePerNight: initialData?.pricePerNight || "",
    
    // Contact
    manager: initialData?.manager || "",
    phone: initialData?.phone || "",
    email: initialData?.email || "",
    website: initialData?.website || "",
    
    // Amenities
    amenities: initialData?.amenities || {
      wifi: false,
      parking: false,
      breakfast: false,
      laundry: false,
      kitchen: false,
      pool: false,
      gym: false,
      airConditioning: false,
      heating: false,
      tv: false,
      safe: false,
      minibar: false
    },
    
    // Policies
    checkInTime: initialData?.checkInTime || "15:00",
    checkOutTime: initialData?.checkOutTime || "11:00",
    cancellationPolicy: initialData?.cancellationPolicy || "",
    specialRequirements: initialData?.specialRequirements || "",
    notes: initialData?.notes || ""
  });

  const [activeTab, setActiveTab] = useState("basic");
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: ""
      }));
    }
  };

  const handleAmenityChange = (amenity: string, checked: boolean) => {
    setFormData(prev => ({
      ...prev,
      amenities: {
        ...prev.amenities,
        [amenity]: checked
      }
    }));
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    
    // Required fields
    if (!formData.name.trim()) newErrors.name = "Nome é obrigatório";
    if (!formData.type) newErrors.type = "Tipo é obrigatório";
    if (!formData.address.trim()) newErrors.address = "Endereço é obrigatório";
    if (!formData.city.trim()) newErrors.city = "Cidade é obrigatória";
    if (!formData.state) newErrors.state = "Estado é obrigatório";
    if (!formData.totalRooms) newErrors.totalRooms = "Total de quartos é obrigatório";
    if (!formData.pricePerNight) newErrors.pricePerNight = "Preço por noite é obrigatório";
    if (!formData.manager.trim()) newErrors.manager = "Gerente é obrigatório";
    if (!formData.phone.trim()) newErrors.phone = "Telefone é obrigatório";
    
    // Email validation
    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = "E-mail inválido";
    }
    
    // Room validation
    const totalCalculated = parseInt(formData.singleRooms || "0") + 
                           parseInt(formData.doubleRooms || "0") + 
                           parseInt(formData.suiteRooms || "0");
    if (totalCalculated > parseInt(formData.totalRooms || "0")) {
      newErrors.roomDistribution = "Soma dos tipos de quartos não pode exceder o total";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = () => {
    if (validateForm()) {
      console.log("Saving accommodation data:", formData);
      onSave();
    }
  };

  const amenityOptions = [
    { key: "wifi", label: "Wi-Fi Gratuito" },
    { key: "parking", label: "Estacionamento" },
    { key: "breakfast", label: "Café da Manhã" },
    { key: "laundry", label: "Lavanderia" },
    { key: "kitchen", label: "Cozinha/Kitchenette" },
    { key: "pool", label: "Piscina" },
    { key: "gym", label: "Academia" },
    { key: "airConditioning", label: "Ar Condicionado" },
    { key: "heating", label: "Aquecimento" },
    { key: "tv", label: "TV a Cabo" },
    { key: "safe", label: "Cofre" },
    { key: "minibar", label: "Frigobar" }
  ];

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <CardTitle className="text-charcoal">
              {mode === "create" ? "Nova Propriedade de Hospedagem" : "Editar Propriedade"}
            </CardTitle>
            <div className="flex gap-3">
              <Button 
                variant="outline" 
                onClick={onCancel}
                className="border-border-color text-charcoal hover:bg-muted"
              >
                <X className="h-4 w-4 mr-2" />
                Cancelar
              </Button>
              <Button 
                onClick={handleSave}
                className="bg-charcoal hover:bg-charcoal/90 text-white"
              >
                <Save className="h-4 w-4 mr-2" />
                Salvar
              </Button>
            </div>
          </div>
        </CardHeader>
        
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid grid-cols-2 sm:grid-cols-4 w-full sm:max-w-2xl bg-muted">
              <TabsTrigger 
                value="basic"
                className="data-[state=active]:bg-card data-[state=active]:text-charcoal data-[state=active]:font-semibold"
              >
                <Building2 className="h-4 w-4 mr-2" />
                Básico
              </TabsTrigger>
              <TabsTrigger 
                value="location"
                className="data-[state=active]:bg-card data-[state=active]:text-charcoal data-[state=active]:font-semibold"
              >
                <MapPin className="h-4 w-4 mr-2" />
                Localização
              </TabsTrigger>
              <TabsTrigger 
                value="pricing"
                className="data-[state=active]:bg-card data-[state=active]:text-charcoal data-[state=active]:font-semibold"
              >
                <DollarSign className="h-4 w-4 mr-2" />
                Preços
              </TabsTrigger>
              <TabsTrigger 
                value="amenities"
                className="data-[state=active]:bg-card data-[state=active]:text-charcoal data-[state=active]:font-semibold"
              >
                <Settings className="h-4 w-4 mr-2" />
                Comodidades
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="basic" className="mt-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="name" className="text-charcoal">
                    Nome da Propriedade <span className="text-destructive">*</span>
                  </Label>
                  <Input 
                    id="name"
                    value={formData.name}
                    onChange={(e) => handleInputChange("name", e.target.value)}
                    className={`border-border-color focus:border-charcoal ${errors.name ? "border-destructive" : ""}`}
                    placeholder="Ex: RC Lodge Houston"
                  />
                  {errors.name && <p className="text-xs text-destructive">{errors.name}</p>}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="type" className="text-charcoal">
                    Tipo de Propriedade <span className="text-destructive">*</span>
                  </Label>
                  <Select value={formData.type} onValueChange={(value) => handleInputChange("type", value)}>
                    <SelectTrigger className={`border-border-color focus:border-charcoal ${errors.type ? "border-destructive" : ""}`}>
                      <SelectValue placeholder="Selecionar tipo" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Hotel/Lodge">Hotel/Lodge RC</SelectItem>
                      <SelectItem value="Apartamentos">Apartamentos</SelectItem>
                      <SelectItem value="Hotel Parceiro">Hotel Parceiro</SelectItem>
                      <SelectItem value="Casa Corporativa">Casa Corporativa</SelectItem>
                      <SelectItem value="Pousada">Pousada</SelectItem>
                    </SelectContent>
                  </Select>
                  {errors.type && <p className="text-xs text-destructive">{errors.type}</p>}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="status" className="text-charcoal">Status</Label>
                  <Select value={formData.status} onValueChange={(value) => handleInputChange("status", value)}>
                    <SelectTrigger className="border-border-color focus:border-charcoal">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">Ativo</SelectItem>
                      <SelectItem value="maintenance">Em Manutenção</SelectItem>
                      <SelectItem value="inactive">Inativo</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="manager" className="text-charcoal">
                    Gerente Responsável <span className="text-destructive">*</span>
                  </Label>
                  <Input 
                    id="manager"
                    value={formData.manager}
                    onChange={(e) => handleInputChange("manager", e.target.value)}
                    className={`border-border-color focus:border-charcoal ${errors.manager ? "border-destructive" : ""}`}
                    placeholder="Nome do gerente"
                  />
                  {errors.manager && <p className="text-xs text-destructive">{errors.manager}</p>}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone" className="text-charcoal">
                    Telefone <span className="text-destructive">*</span>
                  </Label>
                  <Input 
                    id="phone"
                    value={formData.phone}
                    onChange={(e) => handleInputChange("phone", e.target.value)}
                    className={`border-border-color focus:border-charcoal ${errors.phone ? "border-destructive" : ""}`}
                    placeholder="+1 (555) 123-4567"
                  />
                  {errors.phone && <p className="text-xs text-destructive">{errors.phone}</p>}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email" className="text-charcoal">E-mail</Label>
                  <Input 
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => handleInputChange("email", e.target.value)}
                    className={`border-border-color focus:border-charcoal ${errors.email ? "border-destructive" : ""}`}
                    placeholder="contato@propriedade.com"
                  />
                  {errors.email && <p className="text-xs text-destructive">{errors.email}</p>}
                </div>

                <div className="space-y-2 sm:col-span-2">
                  <Label htmlFor="website" className="text-charcoal">Website (opcional)</Label>
                  <Input 
                    id="website"
                    value={formData.website}
                    onChange={(e) => handleInputChange("website", e.target.value)}
                    className="border-border-color focus:border-charcoal"
                    placeholder="https://www.propriedade.com"
                  />
                </div>
              </div>
            </TabsContent>
            
            <TabsContent value="location" className="mt-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="space-y-2 sm:col-span-2">
                  <Label htmlFor="address" className="text-charcoal">
                    Endereço Completo <span className="text-destructive">*</span>
                  </Label>
                  <Input 
                    id="address"
                    value={formData.address}
                    onChange={(e) => handleInputChange("address", e.target.value)}
                    className={`border-border-color focus:border-charcoal ${errors.address ? "border-destructive" : ""}`}
                    placeholder="Rua, número, bairro"
                  />
                  {errors.address && <p className="text-xs text-destructive">{errors.address}</p>}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="city" className="text-charcoal">
                    Cidade <span className="text-destructive">*</span>
                  </Label>
                  <Input 
                    id="city"
                    value={formData.city}
                    onChange={(e) => handleInputChange("city", e.target.value)}
                    className={`border-border-color focus:border-charcoal ${errors.city ? "border-destructive" : ""}`}
                    placeholder="Nome da cidade"
                  />
                  {errors.city && <p className="text-xs text-destructive">{errors.city}</p>}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="state" className="text-charcoal">
                    Estado <span className="text-destructive">*</span>
                  </Label>
                  <Select value={formData.state} onValueChange={(value) => handleInputChange("state", value)}>
                    <SelectTrigger className={`border-border-color focus:border-charcoal ${errors.state ? "border-destructive" : ""}`}>
                      <SelectValue placeholder="Selecionar estado" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="tx">Texas</SelectItem>
                      <SelectItem value="ca">California</SelectItem>
                      <SelectItem value="fl">Florida</SelectItem>
                      <SelectItem value="ny">New York</SelectItem>
                      <SelectItem value="la">Louisiana</SelectItem>
                    </SelectContent>
                  </Select>
                  {errors.state && <p className="text-xs text-destructive">{errors.state}</p>}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="zipCode" className="text-charcoal">ZIP Code</Label>
                  <Input 
                    id="zipCode"
                    value={formData.zipCode}
                    onChange={(e) => handleInputChange("zipCode", e.target.value)}
                    className="border-border-color focus:border-charcoal"
                    placeholder="12345"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="country" className="text-charcoal">País</Label>
                  <Select value={formData.country} onValueChange={(value) => handleInputChange("country", value)}>
                    <SelectTrigger className="border-border-color focus:border-charcoal">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="us">Estados Unidos</SelectItem>
                      <SelectItem value="ca">Canadá</SelectItem>
                      <SelectItem value="mx">México</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </TabsContent>
            
            <TabsContent value="pricing" className="mt-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="space-y-6 sm:col-span-2">
                  <h3 className="text-lg font-semibold text-charcoal">Capacidade</h3>
                  
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="totalRooms" className="text-charcoal">
                        Total de Quartos <span className="text-destructive">*</span>
                      </Label>
                      <Input 
                        id="totalRooms"
                        type="number"
                        value={formData.totalRooms}
                        onChange={(e) => handleInputChange("totalRooms", e.target.value)}
                        className={`border-border-color focus:border-charcoal ${errors.totalRooms ? "border-destructive" : ""}`}
                        placeholder="0"
                      />
                      {errors.totalRooms && <p className="text-xs text-destructive">{errors.totalRooms}</p>}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="singleRooms" className="text-charcoal">Quartos Simples</Label>
                      <Input 
                        id="singleRooms"
                        type="number"
                        value={formData.singleRooms}
                        onChange={(e) => handleInputChange("singleRooms", e.target.value)}
                        className="border-border-color focus:border-charcoal"
                        placeholder="0"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="doubleRooms" className="text-charcoal">Quartos Duplos</Label>
                      <Input 
                        id="doubleRooms"
                        type="number"
                        value={formData.doubleRooms}
                        onChange={(e) => handleInputChange("doubleRooms", e.target.value)}
                        className="border-border-color focus:border-charcoal"
                        placeholder="0"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="suiteRooms" className="text-charcoal">Suítes</Label>
                      <Input 
                        id="suiteRooms"
                        type="number"
                        value={formData.suiteRooms}
                        onChange={(e) => handleInputChange("suiteRooms", e.target.value)}
                        className="border-border-color focus:border-charcoal"
                        placeholder="0"
                      />
                    </div>
                  </div>
                  
                  {errors.roomDistribution && (
                    <p className="text-xs text-destructive">{errors.roomDistribution}</p>
                  )}
                </div>

                <div className="space-y-6 sm:col-span-2">
                  <h3 className="text-lg font-semibold text-charcoal">Preços e Políticas</h3>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="pricePerNight" className="text-charcoal">
                        Preço por Noite (USD) <span className="text-destructive">*</span>
                      </Label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground">$</span>
                        <Input 
                          id="pricePerNight"
                          type="number"
                          step="0.01"
                          value={formData.pricePerNight}
                          onChange={(e) => handleInputChange("pricePerNight", e.target.value)}
                          className={`pl-8 border-border-color focus:border-charcoal ${errors.pricePerNight ? "border-destructive" : ""}`}
                          placeholder="0.00"
                        />
                      </div>
                      {errors.pricePerNight && <p className="text-xs text-destructive">{errors.pricePerNight}</p>}
                    </div>

                    <div className="space-y-2">
                      <Label className="text-charcoal">Preço Mensal Estimado</Label>
                      <div className="flex items-center h-10 px-3 bg-muted rounded-md">
                        <span className="text-sm text-muted-foreground">
                          {formData.pricePerNight ? `$${(parseFloat(formData.pricePerNight) * 30).toFixed(2)}` : "Inserir preço/noite"}
                        </span>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="checkInTime" className="text-charcoal">Horário Check-in</Label>
                      <Input 
                        id="checkInTime"
                        type="time"
                        value={formData.checkInTime}
                        onChange={(e) => handleInputChange("checkInTime", e.target.value)}
                        className="border-border-color focus:border-charcoal"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="checkOutTime" className="text-charcoal">Horário Check-out</Label>
                      <Input 
                        id="checkOutTime"
                        type="time"
                        value={formData.checkOutTime}
                        onChange={(e) => handleInputChange("checkOutTime", e.target.value)}
                        className="border-border-color focus:border-charcoal"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="cancellationPolicy" className="text-charcoal">Política de Cancelamento</Label>
                    <Textarea 
                      id="cancellationPolicy"
                      value={formData.cancellationPolicy}
                      onChange={(e) => handleInputChange("cancellationPolicy", e.target.value)}
                      className="min-h-20 border-border-color focus:border-charcoal"
                      placeholder="Ex: Cancelamento gratuito até 24h antes..."
                    />
                  </div>
                </div>
              </div>
            </TabsContent>
            
            <TabsContent value="amenities" className="mt-6">
              <div className="space-y-6">
                <h3 className="text-lg font-semibold text-charcoal">Comodidades Disponíveis</h3>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {amenityOptions.map((amenity) => (
                    <div key={amenity.key} className="flex items-center space-x-2">
                      <Checkbox 
                        id={amenity.key}
                        checked={formData.amenities[amenity.key]}
                        onCheckedChange={(checked) => handleAmenityChange(amenity.key, checked as boolean)}
                        className="border-border-color data-[state=checked]:bg-charcoal data-[state=checked]:border-charcoal"
                      />
                      <Label htmlFor={amenity.key} className="text-charcoal">
                        {amenity.label}
                      </Label>
                    </div>
                  ))}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="specialRequirements" className="text-charcoal">Requisitos Especiais</Label>
                  <Textarea 
                    id="specialRequirements"
                    value={formData.specialRequirements}
                    onChange={(e) => handleInputChange("specialRequirements", e.target.value)}
                    className="min-h-20 border-border-color focus:border-charcoal"
                    placeholder="Ex: Documentos necessários, regras especiais..."
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="notes" className="text-charcoal">Observações Gerais</Label>
                  <Textarea 
                    id="notes"
                    value={formData.notes}
                    onChange={(e) => handleInputChange("notes", e.target.value)}
                    className="min-h-24 border-border-color focus:border-charcoal"
                    placeholder="Informações adicionais sobre a propriedade..."
                  />
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
