import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Cake, PartyPopper, Bell, Crown } from 'lucide-react';
import { useCellLeaderBirthdays, BirthdayLeader } from '@/hooks/useBirthdays';
import { useDemoScope } from '@/hooks/useDemoScope';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface LeaderBirthdayAlertProps {
  coordenacaoId?: string;
  redeId?: string;
}

export function LeaderBirthdayAlert({ coordenacaoId, redeId }: LeaderBirthdayAlertProps) {
  const { campoId } = useDemoScope();
  const { data: birthdays, isLoading } = useCellLeaderBirthdays(coordenacaoId, redeId, campoId);
  
  if (isLoading || !birthdays || birthdays.length === 0) {
    return null;
  }
  
  const todayBirthdays = birthdays.filter(b => b.is_today);
  const tomorrowBirthdays = birthdays.filter(b => b.is_tomorrow);
  
  return (
    <Card className="border-amber-200 dark:border-amber-800 bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-950/20 dark:to-orange-950/20">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-amber-600 dark:text-amber-400">
          <Crown className="h-5 w-5" />
          Aniversários de Líderes
          <Bell className="h-4 w-4 ml-auto animate-bounce" />
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {todayBirthdays.length > 0 && (
          <div>
            <h4 className="text-sm font-semibold text-amber-600 dark:text-amber-400 mb-2 flex items-center gap-1">
              <Cake className="h-4 w-4" />
              Hoje! 🎉
            </h4>
            <div className="space-y-2">
              {todayBirthdays.map((birthday) => (
                <LeaderBirthdayCard key={birthday.id} birthday={birthday} highlight />
              ))}
            </div>
          </div>
        )}
        
        {tomorrowBirthdays.length > 0 && (
          <div>
            <h4 className="text-sm font-semibold text-orange-600 dark:text-orange-400 mb-2 flex items-center gap-1">
              <Bell className="h-4 w-4" />
              Amanhã
            </h4>
            <div className="space-y-2">
              {tomorrowBirthdays.map((birthday) => (
                <LeaderBirthdayCard key={birthday.id} birthday={birthday} />
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function LeaderBirthdayCard({ birthday, highlight = false }: { birthday: BirthdayLeader; highlight?: boolean }) {
  const birthDate = parseISO(birthday.birth_date);
  const age = new Date().getFullYear() - birthDate.getFullYear();
  
  return (
    <div className={`flex items-center gap-3 p-3 rounded-lg ${
      highlight 
        ? 'bg-amber-100 dark:bg-amber-900/30 border border-amber-200 dark:border-amber-800' 
        : 'bg-white/50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700'
    }`}>
      <Avatar className="h-10 w-10 ring-2 ring-amber-300 dark:ring-amber-700">
        <AvatarImage src={birthday.avatar_url || undefined} />
        <AvatarFallback className="bg-amber-200 text-amber-700">
          {birthday.name.charAt(0).toUpperCase()}
        </AvatarFallback>
      </Avatar>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p className="font-medium truncate">{birthday.name}</p>
          <Crown className="h-3 w-3 text-amber-500" />
        </div>
        <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
          <Badge variant="outline" className="text-xs">
            {birthday.celula_name}
          </Badge>
          <Badge variant="secondary" className="text-xs">
            {birthday.coordenacao_name}
          </Badge>
          <span>•</span>
          <span>{format(birthDate, "dd 'de' MMMM", { locale: ptBR })}</span>
          {age > 0 && (
            <>
              <span>•</span>
              <span className="font-medium">{age} anos</span>
            </>
          )}
        </div>
      </div>
      {highlight && (
        <span className="text-2xl">🎂</span>
      )}
    </div>
  );
}
