import { loadSlaquaticsCmsContent } from '../../lib/site-cms/slaquatics';
import { SlaquaticsCmsPublicRenderer } from './SlaquaticsCmsPublicRenderer';

type BlockFilter = {
  includeIds?: string[];
  excludeIds?: string[];
  includeTypes?: string[];
  excludeTypes?: string[];
};

type SlaquaticsCmsPublicPageSectionProps = BlockFilter & {
  slug: string;
};

export async function SlaquaticsCmsPublicPageSection({ slug, ...filter }: SlaquaticsCmsPublicPageSectionProps) {
  return <SlaquaticsCmsPublicRenderer content={await loadSlaquaticsCmsContent(slug)} {...filter} />;
}
