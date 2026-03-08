import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { requestUnifiedAI } from '@/services/unifiedAI';

interface ReportData {
  celula_name: string;
  coordenacao_name: string;
  reports: {
    meeting_date: string;
    members_present: number;
    leaders_in_training: number;
    discipleships: number;
    visitors: number;
    children: number;
  }[];
}

interface InsightResponse {
  insight: string;
  type: 'growth_analysis' | 'executive_summary';
  period: string;
  generatedAt: string;
}

export function useAIInsights() {
  const [isLoading, setIsLoading] = useState(false);
  const [insight, setInsight] = useState<InsightResponse | null>(null);
  const { toast } = useToast();

  const generateInsight = async (
    type: 'growth_analysis' | 'executive_summary',
    data: ReportData[],
    period: string
  ) => {
    setIsLoading(true);
    setInsight(null);

    try {
      const content = await requestUnifiedAI({
        mode: 'dashboard',
        message: `Gerar ${type} para ${period}`,
        context: {
          insightType: type,
          period,
          reportData: data,
        },
      });

      const response: InsightResponse = {
        insight: content,
        type,
        period,
        generatedAt: new Date().toISOString(),
      };

      setInsight(response);
      return response;
    } catch (error) {
      console.error('Error generating insight:', error);
      
      let errorMessage = 'Erro ao gerar análise. Tente novamente.';
      if (error instanceof Error) {
        if (error.message.includes('429') || error.message.includes('limite')) {
          errorMessage = 'Limite de requisições excedido. Aguarde alguns minutos.';
        } else if (error.message.includes('402') || error.message.includes('créditos')) {
          errorMessage = 'Créditos de IA esgotados. Adicione créditos para continuar.';
        } else {
          errorMessage = error.message;
        }
      }

      toast({
        title: 'Erro',
        description: errorMessage,
        variant: 'destructive',
      });
      
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  const clearInsight = () => {
    setInsight(null);
  };

  return {
    isLoading,
    insight,
    generateInsight,
    clearInsight,
  };
}
