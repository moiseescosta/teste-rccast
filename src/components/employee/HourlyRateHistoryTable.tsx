import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { HourlyRateHistoryEntry } from "@/types/hourlyRateHistory";

interface HourlyRateHistoryTableProps {
  rows: HourlyRateHistoryEntry[];
  emptyMessage: string;
}

export function HourlyRateHistoryTable({ rows, emptyMessage }: HourlyRateHistoryTableProps) {
  if (rows.length === 0) {
    return (
      <p className="text-sm text-muted-foreground border border-border-color rounded-lg p-4 bg-muted/20">
        {emptyMessage}
      </p>
    );
  }

  return (
    <div className="border border-border-color rounded-lg overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow className="bg-muted/50 hover:bg-muted/50">
            <TableHead className="text-charcoal">Vigência a partir de</TableHead>
            <TableHead className="text-charcoal">Valor (US$/h)</TableHead>
            <TableHead className="text-charcoal text-right">Registrado em</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((row) => (
            <TableRow key={row.id} className="border-border-color">
              <TableCell className="text-charcoal">
                {row.effective_date
                  ? new Date(row.effective_date + "T12:00:00").toLocaleDateString("pt-BR")
                  : "—"}
              </TableCell>
              <TableCell className="text-charcoal font-medium">
                US$ {Number(row.hourly_rate).toFixed(2).replace(".", ",")}
              </TableCell>
              <TableCell className="text-muted-foreground text-sm text-right">
                {new Date(row.created_at).toLocaleString("pt-BR", {
                  dateStyle: "short",
                  timeStyle: "short",
                })}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
