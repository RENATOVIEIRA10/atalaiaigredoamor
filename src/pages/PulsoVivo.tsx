/**
 * PulsoVivo – "Living Pulse" page: the church visualized as a living organism.
 * Constellation/neural-map visualization with progressive zoom and health-based pulsing.
 */

import { useState, useCallback } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { usePulsoVivo, PulsoVivoNode } from '@/hooks/usePulsoVivo';
import { ConstellationCanvas } from '@/components/pulso-vivo/ConstellationCanvas';
import { NodeDetailSheet } from '@/components/pulso-vivo/NodeDetailSheet';
import { ZoomControls } from '@/components/pulso-vivo/ZoomControls';
import { SkeletonBreathe } from '@/components/ui/animations';
import { Orbit } from 'lucide-react';

export default function PulsoVivo() {
  const { nodes, isLoading } = usePulsoVivo();
  const [zoomLevel, setZoomLevel] = useState(2);
  const [selectedNode, setSelectedNode] = useState<PulsoVivoNode | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);

  const handleNodeClick = useCallback((node: PulsoVivoNode) => {
    setSelectedNode(node);
    setSheetOpen(true);
  }, []);

  return (
    <AppLayout title="Pulso Vivo">
      <div className="relative w-full h-[calc(100vh-4rem)] bg-background overflow-hidden rounded-2xl border border-border/20">
        {/* Ambient background */}
        <div className="absolute inset-0 pointer-events-none" style={{
          background: `
            radial-gradient(ellipse 60% 40% at 50% 45%, hsl(220 65% 55% / 0.04) 0%, transparent 70%),
            radial-gradient(ellipse 30% 50% at 25% 60%, hsl(155 55% 42% / 0.03) 0%, transparent 60%),
            radial-gradient(ellipse 30% 50% at 75% 40%, hsl(38 85% 52% / 0.02) 0%, transparent 60%)
          `
        }} />

        {/* Title overlay */}
        <div className="absolute top-4 left-4 z-10 flex items-center gap-3">
          <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-primary/10 border border-primary/20">
            <Orbit className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h1 className="font-display text-lg font-bold text-foreground tracking-tight">Pulso Vivo</h1>
            <p className="text-[11px] text-muted-foreground">A igreja como organismo vivo</p>
          </div>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center space-y-4">
              <SkeletonBreathe className="w-48 h-48 rounded-full mx-auto" />
              <p className="text-sm text-muted-foreground animate-pulse">Carregando o pulso da igreja…</p>
            </div>
          </div>
        ) : (
          <ConstellationCanvas
            nodes={nodes}
            onNodeClick={handleNodeClick}
            zoomLevel={zoomLevel}
            focusNodeId={selectedNode?.id ?? null}
          />
        )}

        {/* Zoom controls */}
        {!isLoading && (
          <ZoomControls zoomLevel={zoomLevel} onZoomChange={setZoomLevel} />
        )}

        {/* Node summary bar */}
        {!isLoading && (
          <div className="absolute bottom-4 right-4 flex items-center gap-3 text-xs bg-card/80 backdrop-blur-sm rounded-xl px-4 py-2 border border-border/30 text-muted-foreground">
            <span>
              <strong className="text-foreground">{nodes.filter(n => n.type === 'celula').length}</strong> células
            </span>
            <span className="w-px h-3 bg-border" />
            <span>
              <strong className="text-foreground">{nodes.filter(n => n.type === 'coordenacao').length}</strong> coordenações
            </span>
            <span className="w-px h-3 bg-border" />
            <span>
              <strong className="text-foreground">{nodes.filter(n => n.type === 'rede').length}</strong> redes
            </span>
          </div>
        )}

        <NodeDetailSheet
          node={selectedNode}
          open={sheetOpen}
          onOpenChange={setSheetOpen}
        />
      </div>
    </AppLayout>
  );
}
