import { useState } from "react";
import { Button } from "../../ui/button";
import { Textarea } from "../../ui/textarea";
import { Card, CardContent } from "../../ui/card";
import { Avatar, AvatarFallback } from "../../ui/avatar";
import { MessageSquare, Plus } from "lucide-react";

export function NotesTab() {
  const [newNote, setNewNote] = useState("");

  const notes = [
    {
      id: 1,
      text: "Funcionário demonstrou excelente desempenho na soldagem de tubulações de alta pressão. Recomendado para projetos futuros de complexidade similar.",
      author: "Maria Santos",
      authorInitials: "MS",
      date: "15/03/2023",
      time: "14:30"
    },
    {
      id: 2,
      text: "Concluiu treinamento de segurança avançado com nota máxima. Apto para trabalhos em espaços confinados.",
      author: "Carlos Oliveira",
      authorInitials: "CO",
      date: "02/03/2023",
      time: "09:15"
    },
    {
      id: 3,
      text: "Solicitou transferência para turno noturno por motivos pessoais. Avaliar disponibilidade de vagas.",
      author: "Ana Rodrigues",
      authorInitials: "AR",
      date: "28/02/2023",
      time: "16:45"
    },
    {
      id: 4,
      text: "Certificação AWS renovada com sucesso. Válida até maio de 2025.",
      author: "João Silva",
      authorInitials: "JS",
      date: "20/02/2023",
      time: "11:20"
    }
  ];

  const handleAddNote = () => {
    if (newNote.trim()) {
      // Aqui seria adicionada a lógica para adicionar a nota
      console.log("Nova nota:", newNote);
      setNewNote("");
    }
  };

  return (
    <div className="space-y-6">
      {/* Add Note */}
      <Card>
        <CardContent className="p-6">
          <div className="space-y-4">
            <div className="flex items-center gap-2 mb-4">
              <MessageSquare className="h-5 w-5 text-charcoal" />
              <h3 className="font-semibold text-charcoal">Adicionar observação</h3>
            </div>
            
            <Textarea
              placeholder="Digite sua observação sobre o funcionário..."
              value={newNote}
              onChange={(e) => setNewNote(e.target.value)}
              className="min-h-24 border-border-color focus:border-charcoal"
            />
            
            <div className="flex justify-end">
              <Button 
                onClick={handleAddNote}
                disabled={!newNote.trim()}
                className="bg-charcoal hover:bg-charcoal/90 text-white"
              >
                <Plus className="h-4 w-4 mr-2" />
                Adicionar nota
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Notes List */}
      <div className="space-y-4">
        <h3 className="font-semibold text-charcoal">Observações anteriores</h3>
        
        {notes.map((note) => (
          <Card key={note.id}>
            <CardContent className="p-4">
              <div className="flex gap-3">
                <Avatar className="h-8 w-8">
                  <AvatarFallback className="bg-charcoal text-white text-xs">
                    {note.authorInitials}
                  </AvatarFallback>
                </Avatar>
                
                <div className="flex-1 space-y-2">
                  <div className="flex items-center justify-between">
                    <p className="font-medium text-charcoal text-sm">{note.author}</p>
                    <p className="text-xs text-muted-foreground">
                      {note.date} às {note.time}
                    </p>
                  </div>
                  
                  <p className="text-sm text-foreground leading-relaxed">
                    {note.text}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="p-4 bg-accent/20 rounded-lg border border-border-color">
        <p className="text-sm text-muted-foreground">
          Cada nota entra na Movimentações automaticamente com data, hora e autor.
        </p>
      </div>
    </div>
  );
}