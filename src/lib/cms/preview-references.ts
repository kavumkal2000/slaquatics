import type { CmsBlock, CmsContent } from './core.ts';

const allowedPreviewReferenceTypes = new Set<CmsContent['contentType']>(['pattern', 'reusableSection', 'navigationMenu']);

type ReferenceIndex = Map<string, CmsContent>;

export function resolveCmsPreviewReferences(content: CmsContent, references: CmsContent[]): CmsContent {
  const index = buildReferenceIndex(references);
  return {
    ...content,
    blocks: resolveBlocks(content.blocks, index, new Set([content.slug, content.id]), 0)
  };
}

function buildReferenceIndex(references: CmsContent[]): ReferenceIndex {
  const index: ReferenceIndex = new Map();
  for (const reference of references) {
    if (!allowedPreviewReferenceTypes.has(reference.contentType)) continue;
    index.set(reference.slug, reference);
    index.set(reference.id, reference);
  }
  return index;
}

function resolveBlocks(blocks: CmsBlock[], references: ReferenceIndex, seen: Set<string>, depth: number): CmsBlock[] {
  if (depth > 4) return blocks;
  const resolved: CmsBlock[] = [];
  for (const block of blocks) {
    if (block.type === 'pattern-ref') {
      const reference = lookupReference(block.props?.patternId, references, seen);
      if (reference && (reference.contentType === 'pattern' || reference.contentType === 'reusableSection')) {
        const nested = resolveBlocks(reference.blocks, references, new Set([...seen, reference.slug, reference.id]), depth + 1);
        resolved.push(...nested.map((referencedBlock, index) => ({
          ...structuredClone(referencedBlock),
          id: `${block.id}-${referencedBlock.id}-${index}`
        })));
      }
      continue;
    }
    if (block.type === 'topbar' && typeof block.props?.menuId === 'string') {
      const reference = lookupReference(block.props.menuId, references, seen);
      const menuBlock = reference?.contentType === 'navigationMenu'
        ? reference.blocks.find((candidate) => candidate.type === 'navigation-menu')
        : undefined;
      if (menuBlock && Array.isArray(menuBlock.props?.menuItems)) {
        resolved.push({
          ...structuredClone(block),
          props: {
            ...block.props,
            links: structuredClone(menuBlock.props.menuItems)
          }
        });
        continue;
      }
    }
    resolved.push(block);
  }
  return resolved;
}

function lookupReference(reference: unknown, references: ReferenceIndex, seen: Set<string>): CmsContent | null {
  if (typeof reference !== 'string') return null;
  const key = reference.trim().replace(/^\/+|\/+$/g, '');
  if (!key || seen.has(key)) return null;
  return references.get(key) || null;
}
