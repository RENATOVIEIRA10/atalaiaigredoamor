import { useState } from 'react';
import { Loader2, GitBranch, Search, FileDown } from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';
import { PageHeader } from '@/components/ui/page-header';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useOrganograma } from '@/hooks/useOrganograma';
import { PastorCard } from '@/components/organograma/PastorCard';
import { RedeCard } from '@/components/organograma/RedeCard';
import { CoordenacaoCard } from '@/components/organograma/CoordenacaoCard';
import { ConnectorLine } from '@/components/organograma/ConnectorLine';
import { exportOrganogramaPdf } from '@/utils/exportOrganogramaPdf';
import { toast } from 'sonner';

export default function Organograma() {
  const { tree, isLoading } = useOrganograma();
  const [search, setSearch] = useState('');
  const [exporting, setExporting] = useState(false);

  const pastorNode = tree[0];
  const redeNodes = pastorNode?.children || [];

  const handleExportPdf = async () => {
    setExporting(true);
    try {
      await exportOrganogramaPdf('organograma-content');
      toast.success('PDF exportado com sucesso!');
    } catch (err) {
      toast.error('Erro ao exportar PDF');
    } finally {
      setExporting(false);
    }
  };

  return (
    <AppLayout>
      <div className="space-y-6">
        <PageHeader
          title="Organograma"
          subtitle="Estrutura hierárquica da rede"
          icon={GitBranch}
        />

        <div className="flex flex-col sm:flex-row gap-3">
          <Card className="flex-1">
            <CardContent className="p-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar por nome..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-10 bg-background h-10"
                />
              </div>
            </CardContent>
          </Card>
          <Button
            variant="outline"
            onClick={handleExportPdf}
            disabled={exporting || isLoading}
            className="gap-2 shrink-0"
          >
            {exporting ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileDown className="h-4 w-4" />}
            Exportar PDF
          </Button>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : tree.length === 0 ? (
          <div className="text-center py-16 text-muted-foreground">
            Nenhuma rede cadastrada.
          </div>
        ) : (
          <div id="organograma-content" className="space-y-0 pb-8">
            {/* Camada 1 - Pastores */}
            {pastorNode && <PastorCard node={pastorNode} />}

            <ConnectorLine />

            {/* Camada 2 - Redes */}
            {redeNodes.map(rede => (
              <div key={rede.id} className="space-y-0">
                <RedeCard node={rede} />

                <ConnectorLine />

                {/* Camada 3 - Coordenações */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {rede.children.map(coord => (
                    <CoordenacaoCard key={coord.id} node={coord} searchQuery={search} />
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </AppLayout>
  );
}
