import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../ui/table";
import { Badge } from "../ui/badge";
import { Avatar, AvatarFallback } from "../ui/avatar";
import { 
  Building2, 
  MapPin, 
  Users, 
  Calendar, 
  Phone, 
  Mail,
  Filter,
  Search,
  Plus,
  Eye,
  Edit,
  Bed,
  Wifi,
  Car,
  Coffee
} from "lucide-react";

export function AccommodationList() {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [locationFilter, setLocationFilter] = useState("all");

  const accommodations = [
    {
      id: 1,
      name: "RC Lodge Houston",
      type: "Hotel/Lodge",
      address: "2450 Industrial Blvd, Houston, TX 77002",
      city: "Houston",
      state: "TX",
      capacity: 120,
      occupied: 89,
      available: 31,
      status: "active",
      manager: "Sarah Johnson",
      phone: "+1 (713) 555-0123",
      email: "houston@rccast.com",
      amenities: ["wifi", "parking", "breakfast", "laundry"],
      pricePerNight: 85.00,
      employees: [
        { name: "João Silva", nights: 14 },
        { name: "Carlos Lima", nights: 7 },
        { name: "Maria Santos", nights: 21 }
      ]
    },
    {
      id: 2,
      name: "Riverside Apartments",
      type: "Apartamentos",
      address: "1875 River Oaks Dr, Dallas, TX 75201",
      city: "Dallas", 
      state: "TX",
      capacity: 45,
      occupied: 32,
      available: 13,
      status: "active",
      manager: "Mike Rodriguez",
      phone: "+1 (214) 555-0156",
      email: "dallas@rccast.com",
      amenities: ["wifi", "parking", "kitchen"],
      pricePerNight: 65.00,
      employees: [
        { name: "Roberto Silva", nights: 28 },
        { name: "Ana Rodrigues", nights: 14 }
      ]
    },
    {
      id: 3,
      name: "Comfort Inn & Suites",
      type: "Hotel Parceiro",
      address: "3200 Airport Blvd, Austin, TX 78722",
      city: "Austin",
      state: "TX", 
      capacity: 80,
      occupied: 45,
      available: 35,
      status: "active",
      manager: "Linda Thompson",
      phone: "+1 (512) 555-0198",
      email: "austin@comfortinn.com",
      amenities: ["wifi", "parking", "pool", "gym"],
      pricePerNight: 95.00,
      employees: [
        { name: "Pedro Santos", nights: 10 },
        { name: "Luis Garcia", nights: 5 }
      ]
    },
    {
      id: 4,
      name: "RC Corporate Housing",
      type: "Casa Corporativa",
      address: "1456 Executive Dr, Houston, TX 77056", 
      city: "Houston",
      state: "TX",
      capacity: 24,
      occupied: 18,
      available: 6,
      status: "maintenance",
      manager: "James Wilson",
      phone: "+1 (713) 555-0167",
      email: "corporate@rccast.com",
      amenities: ["wifi", "parking", "kitchen", "laundry"],
      pricePerNight: 120.00,
      employees: [
        { name: "Carlos Oliveira", nights: 35 }
      ]
    },
    {
      id: 5,
      name: "Extended Stay America",
      type: "Hotel Parceiro",
      address: "9855 Katy Fwy, Houston, TX 77024",
      city: "Houston",
      state: "TX",
      capacity: 60,
      occupied: 38,
      available: 22,
      status: "active",
      manager: "Patricia Davis", 
      phone: "+1 (713) 555-0134",
      email: "houston@extendedstay.com",
      amenities: ["wifi", "parking", "kitchen"],
      pricePerNight: 75.00,
      employees: [
        { name: "Fernando Costa", nights: 12 },
        { name: "Ricardo Mendes", nights: 8 }
      ]
    }
  ];

  const summary = {
    totalProperties: accommodations.length,
    totalCapacity: accommodations.reduce((sum, acc) => sum + acc.capacity, 0),
    totalOccupied: accommodations.reduce((sum, acc) => sum + acc.occupied, 0),
    totalAvailable: accommodations.reduce((sum, acc) => sum + acc.available, 0),
    averageCost: accommodations.reduce((sum, acc) => sum + acc.pricePerNight, 0) / accommodations.length,
    occupancyRate: (accommodations.reduce((sum, acc) => sum + acc.occupied, 0) / accommodations.reduce((sum, acc) => sum + acc.capacity, 0)) * 100
  };

  const filteredAccommodations = accommodations.filter(accommodation => {
    const matchesSearch = accommodation.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         accommodation.address.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "all" || accommodation.status === statusFilter;
    const matchesLocation = locationFilter === "all" || accommodation.city === locationFilter;
    
    return matchesSearch && matchesStatus && matchesLocation;
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "active":
        return <Badge className="bg-green-100 text-green-700 border-green-200">Ativo</Badge>;
      case "maintenance":
        return <Badge className="bg-orange-100 text-orange-700 border-orange-200">Manutenção</Badge>;
      case "inactive":
        return <Badge variant="secondary" className="bg-gray-100 text-gray-700">Inativo</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const getTypeBadge = (type: string) => {
    switch (type) {
      case "Hotel/Lodge":
        return <Badge variant="outline" className="border-blue-200 text-blue-700">Lodge</Badge>;
      case "Apartamentos":
        return <Badge variant="outline" className="border-purple-200 text-purple-700">Apartamento</Badge>;
      case "Hotel Parceiro":
        return <Badge variant="outline" className="border-green-200 text-green-700">Parceiro</Badge>;
      case "Casa Corporativa":
        return <Badge variant="outline" className="border-gold text-gold">Corporativo</Badge>;
      default:
        return <Badge variant="outline">{type}</Badge>;
    }
  };

  const getAmenityIcon = (amenity: string) => {
    switch (amenity) {
      case "wifi":
        return <Wifi className="h-4 w-4" />;
      case "parking":
        return <Car className="h-4 w-4" />;
      case "breakfast":
        return <Coffee className="h-4 w-4" />;
      case "kitchen":
        return <Building2 className="h-4 w-4" />;
      case "laundry":
        return <Bed className="h-4 w-4" />;
      case "pool":
        return <Building2 className="h-4 w-4" />;
      case "gym":
        return <Building2 className="h-4 w-4" />;
      default:
        return <Building2 className="h-4 w-4" />;
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const getOccupancyColor = (occupied: number, capacity: number) => {
    const rate = (occupied / capacity) * 100;
    if (rate >= 90) return "text-red-600";
    if (rate >= 75) return "text-orange-600";
    if (rate >= 50) return "text-yellow-600";
    return "text-green-600";
  };

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Propriedades</p>
                <p className="text-2xl font-semibold text-charcoal">{summary.totalProperties}</p>
                <p className="text-xs text-muted-foreground mt-1">Ativos e inativos</p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <Building2 className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Capacidade Total</p>
                <p className="text-2xl font-semibold text-charcoal">{summary.totalCapacity}</p>
                <p className="text-xs text-muted-foreground mt-1">{summary.totalOccupied} ocupados</p>
              </div>
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                <Bed className="h-6 w-6 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Taxa de Ocupação</p>
                <p className="text-2xl font-semibold text-charcoal">{summary.occupancyRate.toFixed(1)}%</p>
                <p className="text-xs text-muted-foreground mt-1">{summary.totalAvailable} disponíveis</p>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <Users className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Custo Médio/Noite</p>
                <p className="text-2xl font-semibold text-charcoal">{formatCurrency(summary.averageCost)}</p>
                <p className="text-xs text-muted-foreground mt-1">Por funcionário</p>
              </div>
              <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                <Calendar className="h-6 w-6 text-orange-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Actions */}
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <CardTitle className="flex items-center gap-2 text-charcoal">
              <Building2 className="h-5 w-5" />
              Hospedagem
            </CardTitle>
            <Button className="bg-charcoal hover:bg-charcoal/90 text-white">
              <Plus className="h-4 w-4 mr-2" />
              Nova Propriedade
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="space-y-2">
              <Label htmlFor="search" className="text-charcoal">Buscar</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="search"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 border-border-color focus:border-charcoal"
                  placeholder="Nome ou endereço..."
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="status" className="text-charcoal">Status</Label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="border-border-color focus:border-charcoal">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os status</SelectItem>
                  <SelectItem value="active">Ativo</SelectItem>
                  <SelectItem value="maintenance">Manutenção</SelectItem>
                  <SelectItem value="inactive">Inativo</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="location" className="text-charcoal">Localização</Label>
              <Select value={locationFilter} onValueChange={setLocationFilter}>
                <SelectTrigger className="border-border-color focus:border-charcoal">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas as cidades</SelectItem>
                  <SelectItem value="Houston">Houston, TX</SelectItem>
                  <SelectItem value="Dallas">Dallas, TX</SelectItem>
                  <SelectItem value="Austin">Austin, TX</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label className="text-charcoal">Tipo</Label>
              <Select defaultValue="all">
                <SelectTrigger className="border-border-color focus:border-charcoal">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os tipos</SelectItem>
                  <SelectItem value="lodge">Hotel/Lodge</SelectItem>
                  <SelectItem value="apartment">Apartamentos</SelectItem>
                  <SelectItem value="partner">Hotel Parceiro</SelectItem>
                  <SelectItem value="corporate">Casa Corporativa</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Accommodations Table */}
      <Card>
        <CardContent className="p-0">
          <div className="border border-border-color rounded-lg overflow-x-auto">
            <Table className="min-w-[1200px]">
              <TableHeader>
                <TableRow className="bg-muted/50 border-border-color">
                  <TableHead className="text-charcoal">Propriedade</TableHead>
                  <TableHead className="text-charcoal">Localização</TableHead>
                  <TableHead className="text-charcoal">Tipo</TableHead>
                  <TableHead className="text-charcoal">Capacidade</TableHead>
                  <TableHead className="text-charcoal">Ocupação</TableHead>
                  <TableHead className="text-charcoal">Preço/Noite</TableHead>
                  <TableHead className="text-charcoal">Status</TableHead>
                  <TableHead className="text-charcoal">Comodidades</TableHead>
                  <TableHead className="text-charcoal">Contato</TableHead>
                  <TableHead className="text-charcoal">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredAccommodations.map((accommodation) => (
                  <TableRow key={accommodation.id} className="border-border-color hover:bg-muted/30">
                    <TableCell>
                      <div>
                        <p className="font-medium text-charcoal">{accommodation.name}</p>
                        <p className="text-sm text-muted-foreground">{accommodation.address}</p>
                        <p className="text-xs text-muted-foreground">Gerente: {accommodation.manager}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <MapPin className="h-4 w-4 text-muted-foreground" />
                        <span>{accommodation.city}, {accommodation.state}</span>
                      </div>
                    </TableCell>
                    <TableCell>{getTypeBadge(accommodation.type)}</TableCell>
                    <TableCell className="text-center">
                      <div>
                        <p className="font-medium">{accommodation.capacity}</p>
                        <p className="text-xs text-muted-foreground">quartos</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-center">
                        <p className={`font-medium ${getOccupancyColor(accommodation.occupied, accommodation.capacity)}`}>
                          {accommodation.occupied}/{accommodation.capacity}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {((accommodation.occupied / accommodation.capacity) * 100).toFixed(0)}%
                        </p>
                      </div>
                    </TableCell>
                    <TableCell className="font-medium">
                      {formatCurrency(accommodation.pricePerNight)}
                    </TableCell>
                    <TableCell>{getStatusBadge(accommodation.status)}</TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        {accommodation.amenities.slice(0, 3).map((amenity, index) => (
                          <div
                            key={index}
                            className="w-6 h-6 bg-muted rounded flex items-center justify-center"
                            title={amenity}
                          >
                            {getAmenityIcon(amenity)}
                          </div>
                        ))}
                        {accommodation.amenities.length > 3 && (
                          <div className="w-6 h-6 bg-muted rounded flex items-center justify-center text-xs">
                            +{accommodation.amenities.length - 3}
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <Phone className="h-3 w-3 text-muted-foreground" />
                          <span className="text-xs">{accommodation.phone}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Mail className="h-3 w-3 text-muted-foreground" />
                          <span className="text-xs">{accommodation.email}</span>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button 
                          variant="ghost" 
                          size="sm"
                          className="h-8 w-8 p-0 hover:bg-muted"
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          className="h-8 w-8 p-0 hover:bg-muted"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Button variant="outline" className="p-6 h-auto flex flex-col gap-2 border-border-color text-charcoal hover:bg-muted">
          <Calendar className="h-6 w-6" />
          <span>Reservas Pendentes</span>
          <span className="text-xs text-muted-foreground">3 solicitações</span>
        </Button>
        <Button variant="outline" className="p-6 h-auto flex flex-col gap-2 border-border-color text-charcoal hover:bg-muted">
          <Users className="h-6 w-6" />
          <span>Check-ins Hoje</span>
          <span className="text-xs text-muted-foreground">7 funcionários</span>
        </Button>
        <Button variant="outline" className="p-6 h-auto flex flex-col gap-2 border-border-color text-charcoal hover:bg-muted">
          <Building2 className="h-6 w-6" />
          <span>Relatório Mensal</span>
          <span className="text-xs text-muted-foreground">Gerar relatório</span>
        </Button>
      </div>
    </div>
  );
}
