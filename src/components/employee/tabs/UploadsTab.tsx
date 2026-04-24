import { useState } from "react";
import { Button } from "../../ui/button";
import { Input } from "../../ui/input";
import { Label } from "../../ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../ui/table";
import { Badge } from "../../ui/badge";
import { Card, CardContent } from "../../ui/card";
import { Upload, FileText, Download, Eye, Trash2, Filter } from "lucide-react";

export function UploadsTab() {
  const [selectedFilter, setSelectedFilter] = useState("all");

  const uploads = [
    {
      name: "passport_joao_silva.pdf",
      type: "Identidade",
      documentDate: "15/03/2019",
      validity: "15/03/2029",
      uploadedBy: "João Silva",
      uploadedAt: "10/01/2023",
      validityDays: 1825
    },
    {
      name: "aws_certificate.pdf",
      type: "Certificado",
      documentDate: "20/05/2022",
      validity: "20/05/2025",
      uploadedBy: "Maria Santos",
      uploadedAt: "25/05/2022",
      validityDays: 365
    },
    {
      name: "receipt_equipment.jpg",
      type: "Recibo",
      documentDate: "01/02/2023",
      validity: null,
      uploadedBy: "João Silva",
      uploadedAt: "01/02/2023",
      validityDays: null
    },
    {
      name: "safety_training.pdf",
      type: "Certificado",
      documentDate: "10/12/2022",
      validity: "10/12/2024",
      uploadedBy: "Ana Rodrigues",
      uploadedAt: "15/12/2022",
      validityDays: 280
    }
  ];

  const filteredUploads = uploads.filter(upload => 
    selectedFilter === "all" || upload.type.toLowerCase() === selectedFilter
  );

  const getValidityBadge = (validityDays: number | null) => {
    if (!validityDays) return null;
    
    if (validityDays <= 30) {
      return <Badge variant="destructive">Vence em {validityDays} dias</Badge>;
    } else if (validityDays <= 90) {
      return <Badge variant="outline" className="border-orange-400 text-orange-600">Vence em {validityDays} dias</Badge>;
    } else {
      return <Badge variant="outline" className="border-green-400 text-green-600">Vence em {validityDays} dias</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Upload Area */}
      <Card>
        <CardContent className="p-6">
          <div className="border-2 border-dashed border-border-color rounded-lg p-8 text-center">
            <Upload className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-charcoal mb-2">Arraste arquivos aqui ou</p>
            <Button variant="outline" className="border-border-color text-charcoal hover:bg-muted">
              Selecionar arquivo
            </Button>
            <p className="text-sm text-muted-foreground mt-4">
              Tipos: PDF, JPG, PNG • Máximo: 10 MB
            </p>
          </div>
          
          <div className="grid grid-cols-2 gap-4 mt-6">
            <div className="space-y-2">
              <Label htmlFor="fileType" className="text-charcoal">Tipo</Label>
              <Select>
                <SelectTrigger className="border-border-color focus:border-charcoal">
                  <SelectValue placeholder="Selecionar tipo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="identidade">Identidade</SelectItem>
                  <SelectItem value="recibo">Recibo</SelectItem>
                  <SelectItem value="documento">Documento</SelectItem>
                  <SelectItem value="certificado">Certificado</SelectItem>
                  <SelectItem value="outro">Outro</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="description" className="text-charcoal">Descrição</Label>
              <Input 
                id="description" 
                placeholder="Descrição do documento"
                className="border-border-color focus:border-charcoal"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="documentDate" className="text-charcoal">Data do documento</Label>
              <Input 
                id="documentDate" 
                type="date"
                className="border-border-color focus:border-charcoal"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="validity" className="text-charcoal">Validade (opcional)</Label>
              <Input 
                id="validity" 
                type="date"
                className="border-border-color focus:border-charcoal"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Filter */}
      <div className="flex items-center gap-4">
        <Label className="text-charcoal">Filtro rápido:</Label>
        <div className="flex gap-2">
          <Button 
            variant={selectedFilter === "all" ? "default" : "outline"}
            size="sm"
            onClick={() => setSelectedFilter("all")}
            className={selectedFilter === "all" ? "bg-charcoal text-white" : "border-border-color text-charcoal hover:bg-muted"}
          >
            Todos
          </Button>
          <Button 
            variant={selectedFilter === "identidade" ? "default" : "outline"}
            size="sm"
            onClick={() => setSelectedFilter("identidade")}
            className={selectedFilter === "identidade" ? "bg-charcoal text-white" : "border-border-color text-charcoal hover:bg-muted"}
          >
            Identidade
          </Button>
          <Button 
            variant={selectedFilter === "certificado" ? "default" : "outline"}
            size="sm"
            onClick={() => setSelectedFilter("certificado")}
            className={selectedFilter === "certificado" ? "bg-charcoal text-white" : "border-border-color text-charcoal hover:bg-muted"}
          >
            Certificado
          </Button>
          <Button 
            variant={selectedFilter === "recibo" ? "default" : "outline"}
            size="sm"
            onClick={() => setSelectedFilter("recibo")}
            className={selectedFilter === "recibo" ? "bg-charcoal text-white" : "border-border-color text-charcoal hover:bg-muted"}
          >
            Recibo
          </Button>
        </div>
      </div>

      {/* Files Table */}
      <div className="border border-border-color rounded-lg overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50">
              <TableHead className="text-charcoal">Nome</TableHead>
              <TableHead className="text-charcoal">Tipo</TableHead>
              <TableHead className="text-charcoal">Data doc</TableHead>
              <TableHead className="text-charcoal">Validade</TableHead>
              <TableHead className="text-charcoal">Enviado por</TableHead>
              <TableHead className="text-charcoal">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredUploads.map((file, index) => (
              <TableRow key={index} className="border-border-color">
                <TableCell className="flex items-center gap-2">
                  <FileText className="h-4 w-4 text-muted-foreground" />
                  {file.name}
                </TableCell>
                <TableCell>
                  <Badge variant="outline" className="border-border-color">
                    {file.type}
                  </Badge>
                </TableCell>
                <TableCell>{file.documentDate}</TableCell>
                <TableCell>
                  {file.validity ? (
                    <div className="space-y-1">
                      <p className="text-sm">{file.validity}</p>
                      {getValidityBadge(file.validityDays)}
                    </div>
                  ) : (
                    <span className="text-muted-foreground">-</span>
                  )}
                </TableCell>
                <TableCell>{file.uploadedBy}</TableCell>
                <TableCell>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0 hover:bg-muted">
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0 hover:bg-muted">
                      <Download className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0 hover:bg-destructive/10 hover:text-destructive">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <div className="p-4 bg-accent/20 rounded-lg border border-border-color">
        <p className="text-sm text-muted-foreground">
          Se veio do atalho da esquerda, iniciar filtrado em Identidade. Cada upload também aparece em Movimentações.
        </p>
      </div>
    </div>
  );
}