'use client';

import type { CmsBlockDefinition, CmsContent, CmsSiteConfig } from '../../lib/cms/core.ts';
import { CmsContentEditor } from '../cms/CmsContentEditor';
import { SlaquaticsCmsEditorPreview } from './SlaquaticsCmsPublicRenderer';

type CmsEditorPage = {
  slug: string;
  title: string;
  content: CmsContent;
};

type SlaquaticsCmsContentEditorProps = {
  pages: CmsEditorPage[];
  blocks: CmsBlockDefinition[];
  siteConfig: CmsSiteConfig;
};

export function SlaquaticsCmsContentEditor(props: SlaquaticsCmsContentEditorProps) {
  return (
    <CmsContentEditor
      {...props}
      renderPreview={({ content, selectedBlockId, onSelectBlock }) => (
        <SlaquaticsCmsEditorPreview
          content={content}
          selectedBlockId={selectedBlockId}
          onSelectBlock={onSelectBlock}
        />
      )}
    />
  );
}
