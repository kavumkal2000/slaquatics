import type { CmsContent } from '../../../lib/cms/core.ts';
import { loadSlaquaticsCmsContent } from '../../../lib/site-cms/slaquatics.ts';

type BookingOption = {
  value: string | number;
  label: string;
  subLabel?: string;
  selected?: boolean;
};

type BookingSection = {
  label: string;
  groupId: string;
  dataKey: 'craft' | 'hours' | 'drone';
  addon?: boolean;
  dividerBefore?: boolean;
  options: BookingOption[];
};

type DepositItem = {
  label: string;
  value: string;
};

type BookingTab = {
  id: 'jetski' | 'boat' | 'bundle';
  label: string;
  active?: boolean;
  sections: BookingSection[];
  result: {
    priceId: string;
    initialPrice: string;
    descId: string;
    initialDesc: string;
    depositItems: DepositItem[];
    includesLabel: string;
    includes: string[];
    bookButtonId: string;
    bookHref: string;
    bookLabel: string;
    note: string;
    noteId?: string;
  };
};

type BookingCalculatorContent = {
  eyebrow: string;
  heading: string;
  copy: string;
  pricingSource: string;
  tabs: BookingTab[];
};

const FALLBACK_BOOKING_CALCULATOR: BookingCalculatorContent = {
  eyebrow: 'Book Your Rental',
  heading: 'Choose The Package First',
  copy: 'Choose your rental, compare the hourly value, and continue into the booking flow for the date, contact + waiver, and $55 checkout.',
  pricingSource: 'code-owned',
  tabs: [
    {
      id: 'jetski',
      label: 'Jet Ski Rental',
      active: true,
      sections: [
        {
          label: '1 · Number of jet skis needed',
          groupId: 'js-craft-opts',
          dataKey: 'craft',
          options: [
            { value: 'jetski2', label: '2 Yamaha Jet Skis', subLabel: 'Best for a smaller crew', selected: true },
            { value: 'jetski3', label: '3 Yamaha Jet Skis', subLabel: 'Extra room for a bigger group' },
            { value: 'jetski4', label: '4 Yamaha Jet Skis', subLabel: 'Largest Yamaha setup' }
          ]
        },
        {
          label: '2 · Choose your duration',
          groupId: 'js-dur-opts',
          dataKey: 'hours',
          dividerBefore: true,
          options: [
            { value: 2, label: '2 Hours', subLabel: '$79/hr per ski', selected: true },
            { value: 3, label: '3 Hours', subLabel: '$79/hr per ski' },
            { value: 4, label: '4 Hours', subLabel: 'Most Popular · $74/hr per ski' },
            { value: 6, label: '6 Hours', subLabel: 'Best Value · $63/hr per ski' },
            { value: 8, label: 'Full Day (8 Hours)', subLabel: '$59/hr per ski' }
          ]
        },
        {
          label: '3 · Add Aerial Drone Coverage',
          groupId: 'js-drone-opts',
          dataKey: 'drone',
          addon: true,
          options: [
            { value: 'no', label: 'No drone coverage', selected: true },
            { value: 'yes', label: 'Add drone highlight video', subLabel: '+$50' }
          ]
        }
      ],
      result: {
        priceId: 'js-price',
        initialPrice: '$315',
        descId: 'js-desc',
        initialDesc: '2 Yamaha Jet Skis · 2hrs · $79/hr per ski',
        depositItems: [
          { label: 'Deposit credit', value: '$50' },
          { label: 'Due today', value: '$55' }
        ],
        includesLabel: 'Everything included',
        includes: ['Life Jackets', 'Full Tank of Gas', 'Fast & Easy Booking', 'Cooler', 'Safety Briefing'],
        bookButtonId: 'js-book-btn',
        bookHref: './jetski-booking/?type=jetski&craft=jetski2&hours=2&total=300',
        bookLabel: 'Continue to Calendar & Contact + Waiver →',
        noteId: 'js-savings-note',
        note: 'Base rate is $79/hr per ski. $55 due today at checkout.'
      }
    },
    {
      id: 'boat',
      label: 'Boat Rental',
      sections: [
        {
          label: 'Choose your duration',
          groupId: 'bt-dur-opts',
          dataKey: 'hours',
          options: [
            { value: 2, label: '2 Hours' },
            { value: 3, label: '3 Hours' },
            { value: 4, label: '4 Hours', subLabel: 'Most Popular', selected: true },
            { value: 6, label: '6 Hours' },
            { value: 8, label: 'Full Day (8 Hours)', subLabel: 'Best Value' }
          ]
        },
        {
          label: '2 · Add Aerial Drone Coverage',
          groupId: 'bt-drone-opts',
          dataKey: 'drone',
          addon: true,
          options: [
            { value: 'no', label: 'No drone coverage', selected: true },
            { value: 'yes', label: 'Add drone highlight video', subLabel: '+$50' }
          ]
        }
      ],
      result: {
        priceId: 'bt-price',
        initialPrice: '$640',
        descId: 'bt-desc',
        initialDesc: 'Boat Rental · 4 Hours · Up to 14 guests',
        depositItems: [
          { label: 'Due today', value: '$55' },
          { label: 'Captain', value: 'Included' }
        ],
        includesLabel: 'Everything included',
        includes: ['Captain', 'Life Jackets', 'Full Tank', 'Fast & Easy Booking', 'Cooler', 'Up to 14 Guests'],
        bookButtonId: 'bt-book-btn',
        bookHref: './jetski-booking/?type=boat&craft=partyboat&hours=4&total=640',
        bookLabel: 'Continue to Calendar & Contact + Waiver →',
        note: 'Easy hourly pricing with the captain included. $55 due today at checkout.'
      }
    },
    {
      id: 'bundle',
      label: 'Bundle',
      sections: [
        {
          label: '1 · Choose your bundle size',
          groupId: 'bd-craft-opts',
          dataKey: 'craft',
          options: [
            { value: 'bundle2', label: '2 Jet Skis + Boat', subLabel: 'Best for a mixed group', selected: true },
            { value: 'bundle3', label: '3 Jet Skis + Boat', subLabel: 'Extra room for more riders' },
            { value: 'bundle4', label: '4 Jet Skis + Boat', subLabel: 'Full lake-day setup' }
          ]
        },
        {
          label: '2 · Choose your duration',
          groupId: 'bd-dur-opts',
          dataKey: 'hours',
          dividerBefore: true,
          options: [
            { value: 2, label: '2 Hours', selected: true },
            { value: 3, label: '3 Hours' },
            { value: 4, label: '4 Hours', subLabel: 'Most Popular' },
            { value: 6, label: '6 Hours', subLabel: 'Best Value' },
            { value: 8, label: 'Full Day (8 Hours)' }
          ]
        },
        {
          label: '3 · Add Aerial Drone Coverage',
          groupId: 'bd-drone-opts',
          dataKey: 'drone',
          addon: true,
          options: [
            { value: 'no', label: 'No drone coverage', selected: true },
            { value: 'yes', label: 'Add drone highlight video', subLabel: '+$50' }
          ]
        }
      ],
      result: {
        priceId: 'bd-price',
        initialPrice: '$540',
        descId: 'bd-desc',
        initialDesc: '2 Jet Skis + Boat · 2hrs',
        depositItems: [
          { label: 'Deposit credit', value: '$50' },
          { label: 'Due today', value: '$55' }
        ],
        includesLabel: 'Everything included',
        includes: ['Yamaha Jet Skis', 'Boat + Captain', 'Life Jackets', 'Full Tank', 'Fast & Easy Booking', 'Cooler'],
        bookButtonId: 'bd-book-btn',
        bookHref: './jetski-booking/?type=bundle&craft=bundle2&hours=2&total=540',
        bookLabel: 'Continue to Calendar & Contact + Waiver →',
        note: "Found a lower price? We'll match it. $55 due today at checkout."
      }
    }
  ]
};

export async function HomeBookingCalculator() {
  const cmsContent = await loadSlaquaticsCmsContent('home');
  const content = bookingCalculatorFromCms(cmsContent) || FALLBACK_BOOKING_CALCULATOR;

  return (
    <section id="booking" className="calc-section" data-cms-source="home-booking-packages" data-pricing-source={content.pricingSource}>
      <div className="section-inner">
        <div className="section-tag">{content.eyebrow}</div>
        <h2>{content.heading}</h2>
        <p className="section-sub" style={{ marginBottom: '2rem' }}>{content.copy}</p>
        <div className="calc-wrap">
          <div className="calc-tabs">
            {content.tabs.map((tab) => (
              <button className={`calc-tab-btn${tab.active ? ' active' : ''}`} id={`tab-${tab.id}`} key={tab.id}>
                {tab.label}
              </button>
            ))}
          </div>
          {content.tabs.map((tab) => (
            <div className={`calc-panel${tab.active ? ' active' : ''}`} id={`panel-${tab.id}`} key={tab.id}>
              <div>
                {tab.sections.map((section) => <BookingSectionView section={section} key={section.groupId} />)}
              </div>
              <BookingResultView result={tab.result} />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function BookingSectionView({ section }: { section: BookingSection }) {
  const content = (
    <>
      <div className={section.addon ? 'calc-addon-label' : 'calc-col-label'}>{section.label}</div>
      <div className="calc-select-group" id={section.groupId}>
        {section.options.map((option) => (
          <div
            className={`calc-option${option.selected ? ' selected' : ''}`}
            data-craft={section.dataKey === 'craft' ? option.value : undefined}
            data-hours={section.dataKey === 'hours' ? option.value : undefined}
            data-drone={section.dataKey === 'drone' ? option.value : undefined}
            key={String(option.value)}
          >
            <div>
              <div className="calc-option-name">{option.label}</div>
              {option.subLabel ? <div className="calc-option-sub">{option.subLabel}</div> : null}
            </div>
            <div className="calc-check" />
          </div>
        ))}
      </div>
    </>
  );
  return (
    <>
      {section.dividerBefore ? <hr className="calc-divider" /> : null}
      {section.addon ? <div className="calc-addon-box">{content}</div> : content}
    </>
  );
}

function BookingResultView({ result }: { result: BookingTab['result'] }) {
  return (
    <div>
      <div className="calc-result-box">
        <div className="calc-result-label">Your Total</div>
        <div className="calc-result-price" id={result.priceId}>{result.initialPrice}</div>
        <div className="calc-result-desc" id={result.descId}>{result.initialDesc}</div>
        <div className="calc-deposit-row">
          {result.depositItems.map((item) => (
            <div className="calc-deposit-item" key={item.label}>
              <div className="dl">{item.label}</div>
              <div className="dv" style={{ color: 'var(--gold)' }}>{item.value}</div>
            </div>
          ))}
        </div>
      </div>
      <div className="calc-includes">
        <div className="calc-includes-label">{result.includesLabel}</div>
        <div className="calc-include-list">
          {result.includes.map((item) => <span className="calc-include-item" key={item}>{item}</span>)}
        </div>
      </div>
      <a href={result.bookHref} className="calc-book-btn" id={result.bookButtonId}>{result.bookLabel}</a>
      <p className="price-match" id={result.noteId}>{result.note}</p>
    </div>
  );
}

function bookingCalculatorFromCms(content: CmsContent | null): BookingCalculatorContent | null {
  const block = content?.blocks.find((item) => item.id === 'home-booking-packages' && item.type === 'booking-package-selector');
  if (!block) return null;
  const props = block.props as Record<string, unknown>;
  const tabs = toBookingTabs(props.tabs);
  if (!tabs.length) return null;
  return {
    eyebrow: text(props.eyebrow, FALLBACK_BOOKING_CALCULATOR.eyebrow),
    heading: text(props.heading, FALLBACK_BOOKING_CALCULATOR.heading),
    copy: text(props.copy, FALLBACK_BOOKING_CALCULATOR.copy),
    pricingSource: text(props.pricingSource, 'code-owned'),
    tabs
  };
}

function toBookingTabs(value: unknown): BookingTab[] {
  if (!Array.isArray(value)) return [];
  const tabs = value
    .map((item) => toBookingTab(item))
    .filter((item): item is BookingTab => Boolean(item));
  return ensureOneActiveTab(tabs);
}

function toBookingTab(value: unknown): BookingTab | null {
  if (!record(value)) return null;
  const id = value.id === 'jetski' || value.id === 'boat' || value.id === 'bundle' ? value.id : null;
  if (!id) return null;
  const fallback = FALLBACK_BOOKING_CALCULATOR.tabs.find((tab) => tab.id === id);
  if (!fallback) return null;
  return {
    id,
    label: text(value.label, fallback.label),
    active: Boolean(value.active),
    sections: toSections(value.sections, fallback.sections),
    result: {
      priceId: fallback.result.priceId,
      initialPrice: fallback.result.initialPrice,
      descId: fallback.result.descId,
      initialDesc: fallback.result.initialDesc,
      depositItems: fallback.result.depositItems,
      includesLabel: text(value.includesLabel, fallback.result.includesLabel),
      includes: toStringList(value.includes, fallback.result.includes),
      bookButtonId: fallback.result.bookButtonId,
      bookHref: fallback.result.bookHref,
      bookLabel: text(value.submitLabel, fallback.result.bookLabel),
      note: text(value.note, fallback.result.note),
      noteId: fallback.result.noteId
    }
  };
}

function toSections(value: unknown, fallback: BookingSection[]): BookingSection[] {
  if (!Array.isArray(value)) return fallback;
  const sections = value
    .map((item) => {
      if (!record(item)) return null;
      const fallbackSection = fallback.find((section) => section.groupId === item.groupId);
      if (!fallbackSection) return null;
      return {
        ...fallbackSection,
        label: text(item.label, fallbackSection.label),
        options: toOptions(item.options, fallbackSection.options)
      };
    })
    .filter((item): item is BookingSection => Boolean(item));
  return sections.length ? sections : fallback;
}

function toOptions(value: unknown, fallback: BookingOption[]): BookingOption[] {
  if (!Array.isArray(value)) return fallback;
  const options: BookingOption[] = [];
  for (const item of value) {
    if (!record(item)) continue;
    const fallbackOption = fallback.find((option) => String(option.value) === String(item.value));
    if (!fallbackOption) continue;
    options.push({
      ...fallbackOption,
      label: text(item.label, fallbackOption.label),
      subLabel: text(item.subLabel, fallbackOption.subLabel || ''),
      selected: Boolean(item.selected)
    });
  }
  return options.length ? ensureOneSelectedOption(options) : fallback;
}

function toStringList(value: unknown, fallback: string[]): string[] {
  if (!Array.isArray(value)) return fallback;
  const items = value.map((item) => text(item, '')).filter(Boolean);
  return items.length ? items : fallback;
}

function ensureOneActiveTab(tabs: BookingTab[]): BookingTab[] {
  if (tabs.some((tab) => tab.active)) return tabs;
  return tabs.map((tab, index) => ({ ...tab, active: index === 0 }));
}

function ensureOneSelectedOption(options: BookingOption[]): BookingOption[] {
  if (options.some((option) => option.selected)) return options;
  return options.map((option, index) => ({ ...option, selected: index === 0 }));
}

function record(value: unknown): value is Record<string, unknown> {
  return Boolean(value && typeof value === 'object' && !Array.isArray(value));
}

function text(value: unknown, fallback: string): string {
  return typeof value === 'string' && value.trim() ? value : fallback;
}
