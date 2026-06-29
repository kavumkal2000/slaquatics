import { legacyHtmlFor, type LegacyHtmlFile } from '../lib/legacy/html-source.ts';

type LegacyHtmlProps = {
  file: LegacyHtmlFile;
};

export default function LegacyHtml({ file }: LegacyHtmlProps) {
  return <div dangerouslySetInnerHTML={{ __html: legacyHtmlFor(file) }} />;
}
