import { useState } from "react";
import { Button } from "../../ui/button";
import { Input } from "../../ui/input";
import { Label } from "../../ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../ui/select";
import { Card, CardContent } from "../../ui/card";
import { Badge } from "../../ui/badge";
import { Avatar, AvatarFallback } from "../../ui/avatar";
import { Calendar, Download, FileText, Clock, ArrowRight, User, DollarSign, MapPin, Building } from "lucide-react";

export function MovementsTab() {
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [userFilter, setUserFilter] = useState("all");

  const movements = [
    {
      id: 1,
      type: "creation",
      title: "Criação de perfil",
      description: "Perfil criado no sistema",
      user: "Maria Santos",
      userInitials: "MS",
      date: "15/01/2023",
      time: "10:30",
      before: null,
      after: "Funcionário ativo",
      hasFile: false
    },
    {
      id: 2,
      type: "rate_change",
      title: "Alteração de Valor por hora",
      description: "Rate atualizado por desempenho",
      user: "Maria Santos",
      userInitials: "MS",
      date: "15/01/2023",
      time: "14:15",
      before: "US$ 12,00/h",
      after: "US$ 16,00/h",
      hasFile: false
    },
    {
      id: 3,
      type: "upload",
      title: "Upload de documento",
      description: "Certificado AWS adicionado",
      user: "João Silva",
      userInitials: "JS",
      date: "25/05/2022",
      time: "16:20",
      before: null,
      after: "aws_certificate.pdf",
      hasFile: true
    },
    {
      id: 4,
      type: "location_change",
      title: "Alteração de Local",
      description: "Mudança de local de trabalho",
      user: "Carlos Oliveira",
      userInitials: "CO",
      date: "01/06/2022",
      time: "09:45",
      before: "Houston, TX - Construction Site",
      after: "Houston, TX - Petrochemical Plant",
      hasFile: false
    },
    {
      id: 5,
      type: "note",
      title: "Observação adicionada",
      description: "Nova observação sobre desempenho",
      user: "Ana Rodrigues",
      userInitials: "AR",
      date: "02/03/2023",
      time: "11:30",
      before: null,
      after: "Concluiu treinamento de segurança...",
      hasFile: false
    },
    {
      id: 6,
      type: "data_edit",
      title: "Edição de dados pessoais",
      description: "Atualização de endereço",
      user: "João Silva",
      userInitials: "JS",
      date: "10/03/2023",
      time: "15:20",
      before: "123 Old Street, Houston, TX",
      after: "456 New Avenue, Houston, TX",
      hasFile: false
    }
  ];

  const getMovementIcon = (type: string) => {
    switch (type) {
      case "creation":
        return <User className="h-4 w-4" />;
      case "rate_change":
        return <DollarSign className="h-4 w-4" />;
      case "upload":
        return <FileText className="h-4 w-4" />;
      case "location_change":
        return <MapPin className="h-4 w-4" />;
      case "note":
        return <FileText className="h-4 w-4" />;
      case "data_edit":
        return <User className="h-4 w-4" />;
      default:
        return <Clock className="h-4 w-4" />;
    }
  };

  const getMovementColor = (type: string) => {
    switch (type) {
      case "creation":
        return "bg-green-100 text-green-700 border-green-200";
      case "rate_change":
        return "bg-blue-100 text-blue-700 border-blue-200";
      case "upload":
        return "bg-purple-100 text-purple-700 border-purple-200";
      case "location_change":
        return "bg-orange-100 text-orange-700 border-orange-200";
      case "note":
        return "bg-gray-100 text-gray-700 border-gray-200";
      case "data_edit":
        return "bg-yellow-100 text-yellow-700 border-yellow-200";
      default:
        return "bg-gray-100 text-gray-700 border-gray-200";
    }
  };

  return (
    <div className="space-y-6">
      {/* Filter Bar */}
      <Card>
        <CardContent className="p-4">
          <div className="grid grid-cols-4 gap-4 items-end">
            <div className="space-y-2">
              <Label htmlFor="dateFrom" className="text-charcoal">Período - De</Label>
              <Input
                id="dateFrom"
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                className="border-border-color focus:border-charcoal"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="dateTo" className="text-charcoal">Até</Label>
              <Input
                id="dateTo"
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                className="border-border-color focus:border-charcoal"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="typeFilter" className="text-charcoal">Tipo</Label>
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger className="border-border-color focus:border-charcoal">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os tipos</SelectItem>
                  <SelectItem value="creation">Criação</SelectItem>
                  <SelectItem value="rate_change">Alteração de rate</SelectItem>
                  <SelectItem value="upload">Upload</SelectItem>
                  <SelectItem value="location_change">Mudança de local</SelectItem>
                  <SelectItem value="note">Observação</SelectItem>
                  <SelectItem value="data_edit">Edição de dados</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <Button 
              variant="outline"
              className="border-border-color text-charcoal hover:bg-muted"
            >
              <Download className="h-4 w-4 mr-2" />
              Exportar
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Timeline */}
      <div className="space-y-4">
        <h3 className="font-semibold text-charcoal flex items-center gap-2">
          <Clock className="h-5 w-5" />
          Histórico de movimentações
        </h3>
        
        <div className="space-y-3">
          {movements.map((movement) => (
            <Card key={movement.id}>
              <CardContent className="p-4">
                <div className="flex gap-4">
                  <div className="flex-shrink-0">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center border ${getMovementColor(movement.type)}`}>
                      {getMovementIcon(movement.type)}
                    </div>
                  </div>
                  
                  <div className="flex-1 space-y-2">
                    <div className="flex items-start justify-between">
                      <div>
                        <h4 className="font-medium text-charcoal">{movement.title}</h4>
                        <p className="text-sm text-muted-foreground">{movement.description}</p>
                      </div>
                      <div className="text-right text-sm text-muted-foreground">
                        <p>{movement.date}</p>
                        <p>{movement.time}</p>
                      </div>
                    </div>
                    
                    {(movement.before || movement.after) && (
                      <div className="flex items-center gap-2 text-sm">
                        {movement.before && (
                          <span className="px-2 py-1 bg-red-50 text-red-700 rounded border border-red-200">
                            {movement.before}
                          </span>
                        )}
                        {movement.before && movement.after && (
                          <ArrowRight className="h-4 w-4 text-muted-foreground" />
                        )}
                        {movement.after && (
                          <span className="px-2 py-1 bg-green-50 text-green-700 rounded border border-green-200">
                            {movement.after}
                          </span>
                        )}
                        {movement.hasFile && (
                          <Button variant="ghost" size="sm" className="h-6 px-2 text-xs hover:bg-muted">
                            ver arquivo
                          </Button>
                        )}
                      </div>
                    )}
                    
                    <div className="flex items-center gap-2">
                      <Avatar className="h-6 w-6">
                        <AvatarFallback className="bg-charcoal text-white text-xs">
                          {movement.userInitials}
                        </AvatarFallback>
                      </Avatar>
                      <span className="text-sm text-muted-foreground">{movement.user}</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      <div className="p-4 bg-accent/20 rounded-lg border border-border-color">
        <p className="text-sm text-muted-foreground">
          <strong>Tipos de movimentação:</strong> Criação de perfil, Alteração de Local/Fábrica/Obra, Alteração de Função/Setor, 
          Alteração de Valor por hora, Upload (novo/excl.), Edição de dados pessoais críticos (SSN, endereço), 
          Ativação/Inativação, Observação adicionada.
        </p>
      </div>
    </div>
  );
}