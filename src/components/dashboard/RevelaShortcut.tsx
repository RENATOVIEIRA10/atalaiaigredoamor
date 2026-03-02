import { BookOpen, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';

const REVELA_URL = 'https://rrevela.lovable.app';

export function RevelaShortcut() {
  const handleOpen = () => {
    window.open(REVELA_URL, '_blank', 'noopener,noreferrer');
  };

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handleOpen}
      className="gap-2 border-primary/20 hover:border-primary/40 hover:bg-primary/5"
    >
      <BookOpen className="h-4 w-4 text-primary" />
      <span className="font-medium">Revela</span>
      <span className="text-muted-foreground text-xs hidden sm:inline">Estudo bíblico</span>
      <ExternalLink className="h-3 w-3 text-muted-foreground" />
    </Button>
  );
}
