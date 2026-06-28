import Head from 'next/head';

export type JsonLdPrimitive = string | number | boolean | null;
export type JsonLdValue =
  | JsonLdPrimitive
  | { readonly [key: string]: JsonLdValue }
  | readonly JsonLdValue[];

type JsonLdStructuredDataProps = {
  readonly idPrefix: string;
  readonly items: readonly JsonLdValue[];
};

function serializeJsonLd(item: JsonLdValue) {
  return JSON.stringify(item).replace(/</g, '\\u003c');
}

export function JsonLdStructuredData({ idPrefix, items }: JsonLdStructuredDataProps) {
  if (items.length === 0) return null;

  return (
    <Head>
      {items.map((item, index) => (
        <script
          async
          id={`${idPrefix}-${index + 1}`}
          key={`${idPrefix}-${index + 1}`}
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: serializeJsonLd(item) }}
        />
      ))}
    </Head>
  );
}
