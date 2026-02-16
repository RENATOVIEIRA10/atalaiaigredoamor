import { BookOpen } from 'lucide-react';

interface ScriptureVerse {
  text: string;
  reference: string;
}

const versesByRole: Record<string, ScriptureVerse> = {
  pastor: {
    text: 'Cuidem de todo o rebanho sobre o qual o Espírito Santo os colocou.',
    reference: 'Atos 20:28',
  },
  rede_leader: {
    text: 'Onde não há visão, o povo perece.',
    reference: 'Provérbios 29:18',
  },
  coordenador: {
    text: 'Os planos bem elaborados levam à fartura.',
    reference: 'Provérbios 21:5',
  },
  supervisor: {
    text: 'Vigiai, permanecei firmes na fé.',
    reference: '1 Coríntios 16:13',
  },
  celula_leader: {
    text: 'Apascentem o rebanho de Deus que está aos seus cuidados.',
    reference: '1 Pedro 5:2',
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
    <div
      className="flex items-start gap-3 px-4 py-3.5 rounded-xl border border-primary/15 bg-primary/5"
      style={{
        boxShadow: 'inset 0 1px 0 0 hsl(var(--primary) / 0.06)',
      }}
    >
      <BookOpen className="h-4 w-4 text-primary mt-0.5 shrink-0" />
      <div className="min-w-0">
        <p
          className="text-sm italic text-foreground/80 leading-relaxed"
          style={{ fontFamily: "'DM Serif Display', serif" }}
        >
          "{verse.text}"
        </p>
        <p className="text-xs text-muted-foreground mt-1 font-medium"
          style={{ fontFamily: "'Inter', sans-serif" }}
        >
          {verse.reference}
        </p>
      </div>
    </div>
  );
}
