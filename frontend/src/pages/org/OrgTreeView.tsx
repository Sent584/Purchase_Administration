import { useState } from 'react';
import clsx from 'clsx';
import { Icon } from '../../components/ui/Icon';
import type { NodeKind, TreeNode } from './orgTree';

const kindIcon: Record<NodeKind, string> = {
  group: 'building',
  institution: 'building',
  campus: 'mapPin',
  unit: 'grid',
};

function TreeRow({
  node,
  depth,
  selected,
  onSelect,
}: {
  node: TreeNode;
  depth: number;
  selected: { kind: NodeKind; id: string } | null;
  onSelect: (kind: NodeKind, id: string) => void;
}) {
  const [open, setOpen] = useState(depth < 2);
  const isSelected = selected?.kind === node.kind && selected.id === node.id;
  const hasChildren = node.children.length > 0;

  return (
    <div>
      <button
        onClick={() => {
          onSelect(node.kind, node.id);
          if (hasChildren) setOpen((v) => !v);
        }}
        style={{ paddingLeft: `${depth * 16 + 12}px` }}
        className={clsx(
          'flex w-full items-center gap-2 rounded-lg py-1.5 pr-2 text-left text-sm transition-colors',
          isSelected ? 'bg-crimson-50 text-crimson-700 font-medium' : 'text-ink-600 hover:bg-ink-50',
        )}
      >
        {hasChildren ? (
          <Icon name="chevronDown" className={clsx('h-3.5 w-3.5 shrink-0 transition-transform', !open && '-rotate-90')} />
        ) : (
          <span className="w-3.5" />
        )}
        <Icon name={kindIcon[node.kind] as never} className="h-4 w-4 shrink-0 text-ink-400" />
        <span className="truncate">{node.label}</span>
      </button>
      {hasChildren && open && (
        <div>
          {node.children.map((child) => (
            <TreeRow key={`${child.kind}-${child.id}`} node={child} depth={depth + 1} selected={selected} onSelect={onSelect} />
          ))}
        </div>
      )}
    </div>
  );
}

export function OrgTreeView({
  nodes,
  selected,
  onSelect,
}: {
  nodes: TreeNode[];
  selected: { kind: NodeKind; id: string } | null;
  onSelect: (kind: NodeKind, id: string) => void;
}) {
  return (
    <div className="flex flex-col gap-0.5 py-2">
      {nodes.map((node) => (
        <TreeRow key={`${node.kind}-${node.id}`} node={node} depth={0} selected={selected} onSelect={onSelect} />
      ))}
    </div>
  );
}
