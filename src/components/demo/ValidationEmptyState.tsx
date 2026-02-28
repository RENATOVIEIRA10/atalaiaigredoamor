import { AlertCircle } from 'lucide-react';

interface ValidationEmptyStateProps {
  campusName?: string;
  context?: string;
}

/**
 * Shows an honest empty state when a campus has no data in validation mode.
 */
export function ValidationEmptyState({ campusName, context }: ValidationEmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-12 px-6 text-center">
      <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center mb-4">
        <AlertCircle className="h-6 w-6 text-muted-foreground" />
      </div>
      <h3 className="text-sm font-semibold text-foreground mb-1">
        Sem dados {context ? `de ${context}` : ''} neste campus
      </h3>
      <p className="text-xs text-muted-foreground max-w-sm">
        {campusName
          ? `O campus "${campusName}" ainda não possui dados reais ou simulados.`
          : 'Este campus ainda não possui dados reais ou simulados.'}
        {' '}Execute um Seed Run neste campus para visualizar números.
      </p>
    </div>
  );
}
