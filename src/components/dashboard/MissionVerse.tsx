import { BookOpen } from 'lucide-react';

interface ScriptureVerse {
  text: string;
  reference: string;
}

const versesByRole: Record<string, ScriptureVerse> = {
  pastor: {
    text: 'Apascenta as minhas ovelhas.',
    reference: 'João 21:17',
  },
  rede_leader: {
    text: 'Não havendo visão, o povo perece.',
    reference: 'Provérbios 29:18',
  },
  coordenador: {
    text: 'Mas faça-se tudo com decência e ordem.',
    reference: '1 Coríntios 14:40',
  },
  supervisor: {
    text: 'Olhai por vós e por todo o rebanho sobre o qual o Espírito Santo vos constituiu bispos.',
    reference: 'Atos 20:28',
  },
  celula_leader: {
    text: 'Porque onde estiverem dois ou três reunidos em meu nome, ali estou no meio deles.',
    reference: 'Mateus 18:20',
  },
  admin: {
    text: 'Tudo o que fizerem, façam de todo o coração, como para o Senhor.',
    reference: 'Colossenses 3:23',
  },
};

interface MissionVerseProps {
  role: keyof typeof versesByRole;
}

export function MissionVerse({ role }: MissionVerseProps) {
  const verse = versesByRole[role];
  if (!verse) return null;

  return (
    <div className="flex items-start gap-3 px-4 py-3 rounded-xl border border-primary/10 bg-primary/5">
      <BookOpen className="h-4 w-4 text-primary mt-0.5 shrink-0" />
      <div className="min-w-0">
        <p className="text-sm italic text-foreground/80 leading-relaxed">
          "{verse.text}"
        </p>
        <p className="text-xs text-muted-foreground mt-1 font-medium">
          📖 {verse.reference}
        </p>
      </div>
    </div>
  );
}
