/**
 * ConstellationCanvas – SVG-based constellation visualization of the church as a living organism.
 * Renders nodes as pulsing orbs connected by luminous lines.
 */

import { useMemo, useState, useCallback, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { PulsoVivoNode, NodeHealth } from '@/hooks/usePulsoVivo';

interface Props {
  nodes: PulsoVivoNode[];
  onNodeClick: (node: PulsoVivoNode) => void;
  zoomLevel: number;
  focusNodeId: string | null;
}

interface LayoutNode extends PulsoVivoNode {
  x: number;
  y: number;
  radius: number;
}

const HEALTH_COLORS: Record<NodeHealth, { fill: string; glow: string; pulse: string }> = {
  saudavel: {
    fill: 'hsl(155, 55%, 42%)',
    glow: 'hsl(155, 55%, 42%)',
    pulse: 'hsl(155, 55%, 52%)',
  },
  acompanhamento: {
    fill: 'hsl(38, 85%, 52%)',
    glow: 'hsl(38, 85%, 52%)',
    pulse: 'hsl(38, 85%, 62%)',
  },
  critica: {
    fill: 'hsl(0, 62%, 50%)',
    glow: 'hsl(0, 62%, 50%)',
    pulse: 'hsl(0, 62%, 60%)',
  },
  sem_avaliacao: {
    fill: 'hsl(218, 14%, 38%)',
    glow: 'hsl(218, 14%, 38%)',
    pulse: 'hsl(218, 14%, 48%)',
  },
};

const TYPE_RADIUS: Record<string, number> = {
  pastor: 40,
  rede: 30,
  coordenacao: 22,
  supervisor: 16,
  celula: 10,
};

function layoutNodes(nodes: PulsoVivoNode[], width: number, height: number, focusNodeId: string | null): LayoutNode[] {
  if (!nodes.length) return [];

  const cx = width / 2;
  const cy = height / 2;

  // Group by depth
  const byDepth = new Map<number, PulsoVivoNode[]>();
  nodes.forEach(n => {
    if (!byDepth.has(n.depth)) byDepth.set(n.depth, []);
    byDepth.get(n.depth)!.push(n);
  });

  const result: LayoutNode[] = [];
  const maxDepth = Math.max(...Array.from(byDepth.keys()));
  const maxRadius = Math.min(width, height) * 0.42;

  byDepth.forEach((depthNodes, depth) => {
    if (depth === 0) {
      // Center node
      depthNodes.forEach(n => {
        result.push({ ...n, x: cx, y: cy, radius: TYPE_RADIUS[n.type] || 20 });
      });
      return;
    }

    const ringRadius = (depth / maxDepth) * maxRadius;
    const angleStep = (2 * Math.PI) / depthNodes.length;
    const offsetAngle = -Math.PI / 2; // Start from top

    depthNodes.forEach((n, i) => {
      // Add slight jitter for organic feel
      const jitterR = (Math.random() - 0.5) * ringRadius * 0.08;
      const jitterA = (Math.random() - 0.5) * angleStep * 0.15;
      const angle = offsetAngle + i * angleStep + jitterA;
      const r = ringRadius + jitterR;

      result.push({
        ...n,
        x: cx + Math.cos(angle) * r,
        y: cy + Math.sin(angle) * r,
        radius: TYPE_RADIUS[n.type] || 10,
      });
    });
  });

  return result;
}

export function ConstellationCanvas({ nodes, onNodeClick, zoomLevel, focusNodeId }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ width: 900, height: 600 });
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const obs = new ResizeObserver(entries => {
      const { width, height } = entries[0].contentRect;
      setDimensions({ width, height });
    });
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  const layoutResult = useMemo(
    () => layoutNodes(nodes, dimensions.width, dimensions.height, focusNodeId),
    [nodes, dimensions, focusNodeId]
  );

  const nodeMap = useMemo(() => {
    const map = new Map<string, LayoutNode>();
    layoutResult.forEach(n => map.set(n.id, n));
    return map;
  }, [layoutResult]);

  // Build connections (parent → child)
  const connections = useMemo(() => {
    const lines: { from: LayoutNode; to: LayoutNode; opacity: number }[] = [];
    layoutResult.forEach(n => {
      if (n.parentId) {
        const parent = nodeMap.get(n.parentId);
        if (parent) {
          lines.push({ from: parent, to: n, opacity: 0.15 + (1 - n.depth / 5) * 0.15 });
        }
      }
    });
    return lines;
  }, [layoutResult, nodeMap]);

  // Filter by zoom level
  const visibleNodes = useMemo(() => {
    return layoutResult.filter(n => n.depth <= zoomLevel);
  }, [layoutResult, zoomLevel]);

  const visibleConnections = useMemo(() => {
    const visibleIds = new Set(visibleNodes.map(n => n.id));
    return connections.filter(c => visibleIds.has(c.from.id) && visibleIds.has(c.to.id));
  }, [connections, visibleNodes]);

  return (
    <div ref={containerRef} className="relative w-full h-full min-h-[500px] overflow-hidden">
      {/* Background radial glow */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: `radial-gradient(ellipse at 50% 50%, hsl(220 65% 55% / 0.06) 0%, transparent 70%)`,
        }}
      />

      <svg
        width={dimensions.width}
        height={dimensions.height}
        viewBox={`0 0 ${dimensions.width} ${dimensions.height}`}
        className="absolute inset-0"
      >
        <defs>
          {/* Glow filters for each health state */}
          {Object.entries(HEALTH_COLORS).map(([key, colors]) => (
            <filter key={key} id={`glow-${key}`} x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur stdDeviation="4" result="blur" />
              <feFlood floodColor={colors.glow} floodOpacity="0.6" result="color" />
              <feComposite in="color" in2="blur" operator="in" result="glow" />
              <feMerge>
                <feMergeNode in="glow" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          ))}

          {/* Stronger glow for hover */}
          <filter id="glow-hover" x="-100%" y="-100%" width="300%" height="300%">
            <feGaussianBlur stdDeviation="8" result="blur" />
            <feFlood floodColor="hsl(220, 65%, 55%)" floodOpacity="0.8" result="color" />
            <feComposite in="color" in2="blur" operator="in" result="glow" />
            <feMerge>
              <feMergeNode in="glow" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* Connection lines */}
        <g className="connections">
          {visibleConnections.map((c, i) => (
            <line
              key={i}
              x1={c.from.x}
              y1={c.from.y}
              x2={c.to.x}
              y2={c.to.y}
              stroke="hsl(220, 65%, 55%)"
              strokeOpacity={c.opacity}
              strokeWidth={0.8}
            />
          ))}
        </g>

        {/* Nodes */}
        <AnimatePresence>
          {visibleNodes.map(node => {
            const colors = HEALTH_COLORS[node.health];
            const isHovered = hoveredId === node.id;
            const scale = isHovered ? 1.25 : 1;

            return (
              <motion.g
                key={node.id}
                initial={{ opacity: 0, scale: 0 }}
                animate={{ opacity: 1, scale }}
                exit={{ opacity: 0, scale: 0 }}
                transition={{ type: 'spring', stiffness: 200, damping: 20, delay: node.depth * 0.05 }}
                style={{ originX: `${node.x}px`, originY: `${node.y}px` }}
                onMouseEnter={() => setHoveredId(node.id)}
                onMouseLeave={() => setHoveredId(null)}
                onClick={() => onNodeClick(node)}
                className="cursor-pointer"
              >
                {/* Pulse ring */}
                <circle
                  cx={node.x}
                  cy={node.y}
                  r={node.radius * 1.6}
                  fill="none"
                  stroke={colors.pulse}
                  strokeWidth={0.6}
                  opacity={0.3}
                >
                  <animate
                    attributeName="r"
                    values={`${node.radius * 1.2};${node.radius * 1.8};${node.radius * 1.2}`}
                    dur={node.health === 'saudavel' ? '2.5s' : node.health === 'acompanhamento' ? '4s' : '6s'}
                    repeatCount="indefinite"
                  />
                  <animate
                    attributeName="opacity"
                    values="0.3;0.08;0.3"
                    dur={node.health === 'saudavel' ? '2.5s' : node.health === 'acompanhamento' ? '4s' : '6s'}
                    repeatCount="indefinite"
                  />
                </circle>

                {/* Core orb */}
                <circle
                  cx={node.x}
                  cy={node.y}
                  r={node.radius}
                  fill={colors.fill}
                  fillOpacity={0.85}
                  filter={isHovered ? 'url(#glow-hover)' : `url(#glow-${node.health})`}
                />

                {/* Inner highlight */}
                <circle
                  cx={node.x - node.radius * 0.2}
                  cy={node.y - node.radius * 0.2}
                  r={node.radius * 0.35}
                  fill="white"
                  fillOpacity={0.15}
                />

                {/* Label (show for larger nodes or on hover) */}
                {(node.radius >= 20 || isHovered) && (
                  <text
                    x={node.x}
                    y={node.y + node.radius + 14}
                    textAnchor="middle"
                    fill="hsl(210, 25%, 93%)"
                    fontSize={node.type === 'pastor' ? 13 : 11}
                    fontFamily="Manrope, sans-serif"
                    fontWeight={600}
                    opacity={isHovered ? 1 : 0.7}
                  >
                    {node.name}
                  </text>
                )}
              </motion.g>
            );
          })}
        </AnimatePresence>
      </svg>

      {/* Floating legend */}
      <div className="absolute bottom-4 left-4 flex items-center gap-4 text-xs text-muted-foreground bg-card/80 backdrop-blur-sm rounded-xl px-4 py-2 border border-border/30">
        <span className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full" style={{ background: HEALTH_COLORS.saudavel.fill }} />
          Saudável
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full" style={{ background: HEALTH_COLORS.acompanhamento.fill }} />
          Atenção
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full" style={{ background: HEALTH_COLORS.critica.fill }} />
          Risco
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full" style={{ background: HEALTH_COLORS.sem_avaliacao.fill }} />
          Sem avaliação
        </span>
      </div>
    </div>
  );
}
