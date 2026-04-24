import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../ui/table";
import { Badge } from "../ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Search, Plus, Download, Edit, Power, Loader2 } from "lucide-react";
import { useFactories } from "@/contexts/FactoriesContext";

interface FactoryListProps {
  onCreateFactory?: () => void;
  onEditFactory?: (factory: import("@/data/factories").Factory) => void;
}

export function FactoryList({ onCreateFactory, onEditFactory }: FactoryListProps) {
  const { factories, loading, error } = useFactories();

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "Ativo":
        return <Badge className="bg-green-100 text-green-700 border-green-200">Ativo</Badge>;
      case "Inativo":
        return <Badge variant="secondary" className="bg-gray-100 text-gray-700 border-gray-200">Inativo</Badge>;
      case "Em construção":
        return <Badge className="bg-blue-100 text-blue-700 border-blue-200">Em construção</Badge>;
      case "Manutenção":
        return <Badge className="bg-orange-100 text-orange-700 border-orange-200">Manutenção</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const activeCount = factories.filter((f) => f.status === "Ativo").length;
  const constructionCount = factories.filter((f) => f.status === "Em construção").length;
  const inactiveCount = factories.filter((f) => f.status === "Inativo").length;

  return (
    <div className="space-y-6">
      {error && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-2 text-sm text-amber-800">
          {error}
        </div>
      )}
      {/* Header with Actions */}
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <CardTitle className="text-charcoal">Fabricas / Obras</CardTitle>
            <div className="flex gap-3">
              <Button 
                variant="outline"
                className="border-border-color text-charcoal hover:bg-muted"
              >
                <Download className="h-4 w-4 mr-2" />
                <span className="hidden sm:inline">Exportar</span>
              </Button>
              <Button
                className="bg-charcoal hover:bg-charcoal/90 text-white"
                onClick={onCreateFactory}
              >
                <Plus className="h-4 w-4 mr-2" />
                <span className="hidden sm:inline">Nova fabrica/obra</span>
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="relative sm:col-span-2 lg:col-span-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input 
                placeholder="Buscar fabricas/obras..."
                className="pl-10 border-border-color focus:border-charcoal"
              />
            </div>
            
            <Select>
              <SelectTrigger className="border-border-color focus:border-charcoal">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os status</SelectItem>
                <SelectItem value="active">Ativo</SelectItem>
                <SelectItem value="inactive">Inativo</SelectItem>
                <SelectItem value="construction">Em construção</SelectItem>
                <SelectItem value="maintenance">Manutenção</SelectItem>
              </SelectContent>
            </Select>
            
            <Select>
              <SelectTrigger className="border-border-color focus:border-charcoal">
                <SelectValue placeholder="Estado" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os estados</SelectItem>
                <SelectItem value="tx">Texas</SelectItem>
                <SelectItem value="ca">California</SelectItem>
                <SelectItem value="fl">Florida</SelectItem>
                <SelectItem value="ny">New York</SelectItem>
              </SelectContent>
            </Select>
            
            <Select>
              <SelectTrigger className="border-border-color focus:border-charcoal">
                <SelectValue placeholder="Cidade" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas as cidades</SelectItem>
                <SelectItem value="houston">Houston</SelectItem>
                <SelectItem value="dallas">Dallas</SelectItem>
                <SelectItem value="austin">Austin</SelectItem>
                <SelectItem value="beaumont">Beaumont</SelectItem>
                <SelectItem value="elpaso">El Paso</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Factories Table */}
      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              <span className="ml-3 text-muted-foreground">Carregando fábricas/obras...</span>
            </div>
          ) : (
          <div className="border border-border-color rounded-lg overflow-x-auto">
            <Table className="min-w-[800px]">
              <TableHeader>
                <TableRow className="bg-muted/50 border-border-color">
                  <TableHead className="text-charcoal">Nome</TableHead>
                  <TableHead className="text-charcoal">Código</TableHead>
                  <TableHead className="text-charcoal">Status</TableHead>
                  <TableHead className="text-charcoal">Estado</TableHead>
                  <TableHead className="text-charcoal">Cidade</TableHead>
                  <TableHead className="text-charcoal">Endereço</TableHead>
                  <TableHead className="text-charcoal">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {factories.map((factory) => (
                  <TableRow key={factory.id} className="border-border-color hover:bg-muted/30">
                    <TableCell>
                      <div>
                        <p className="font-medium text-charcoal">{factory.name}</p>
                        {factory.notes && (
                          <p className="text-sm text-muted-foreground truncate max-w-xs">
                            {factory.notes}
                          </p>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="font-mono">{factory.code}</TableCell>
                    <TableCell>{getStatusBadge(factory.status)}</TableCell>
                    <TableCell>{factory.state}</TableCell>
                    <TableCell>{factory.city}</TableCell>
                    <TableCell className="max-w-xs">
                      <p className="text-sm text-muted-foreground truncate">
                        {factory.address}
                      </p>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0 hover:bg-muted"
                          onClick={() => onEditFactory?.(factory)}
                          aria-label="Editar fábrica/obra"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          className="h-8 w-8 p-0 hover:bg-muted"
                        >
                          <Power className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          )}
        </CardContent>
      </Card>

      {/* Summary Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-semibold text-charcoal">{factories.length}</p>
            <p className="text-sm text-muted-foreground">Total de locais</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-semibold text-green-600">{activeCount}</p>
            <p className="text-sm text-muted-foreground">Ativos</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-semibold text-blue-600">{constructionCount}</p>
            <p className="text-sm text-muted-foreground">Em construção</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-semibold text-gray-600">{inactiveCount}</p>
            <p className="text-sm text-muted-foreground">Inativos</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
