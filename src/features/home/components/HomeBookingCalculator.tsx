'use client';

import { useState } from 'react';

type Tab = 'jetski' | 'boat' | 'bundle';
type JetCraft = 'jetski2' | 'jetski3' | 'jetski4';
type BundleCraft = 'bundle2' | 'bundle3' | 'bundle4';
type Addons = { drone: boolean; karaoke: boolean; tube: boolean };

const pricing = {
  jetski2: { 2: 315, 3: 475, 4: 590, 6: 760, 8: 945 },
  jetski3: { 2: 475, 3: 710, 4: 885, 6: 1135, 8: 1420 },
  jetski4: { 2: 630, 3: 945, 4: 1180, 6: 1515, 8: 1890 },
  bundle2: { 2: 570, 3: 855, 4: 1095, 6: 1515, 8: 1955 },
  bundle3: { 2: 725, 3: 1090, 4: 1390, 6: 1890, 8: 2430 },
  bundle4: { 2: 885, 3: 1325, 4: 1680, 6: 2270, 8: 2900 },
  partyboat: { 2: 320, 3: 480, 4: 640, 6: 960, 8: 1280 }
} as const;

const craftNames = {
  jetski2: '2 Yamaha Jet Skis',
  jetski3: '3 Yamaha Jet Skis',
  jetski4: '4 Yamaha Jet Skis',
  bundle2: '2 Jet Skis + Boat',
  bundle3: '3 Jet Skis + Boat',
  bundle4: '4 Jet Skis + Boat'
} as const;

function money(value: number) {
  return `$${value.toLocaleString()}`;
}

function durationLabel(hours: number) {
  return hours === 8 ? 'Full Day (8hrs)' : `${hours}hrs`;
}

function hourlyRateLabel(craft: JetCraft, hours: number, basePrice: number) {
  const skiCount = Number(craft.replace('jetski', ''));
  return `$${Math.round(basePrice / skiCount / hours)}/hr per ski`;
}

function savingsLabel(craft: JetCraft, hours: number, basePrice: number) {
  const skiCount = Number(craft.replace('jetski', ''));
  if (hours <= 2) return 'Base rate is $79/hr per ski. $55 due today at checkout.';
  const savings = Math.max(0, 75 * skiCount * hours - basePrice);
  return savings > 0
    ? `Save $${savings.toLocaleString()} total compared with the 2-hour rate. $55 due today at checkout.`
    : 'Base rate is $79/hr per ski. $55 due today at checkout.';
}

function addonLabels(addons: Addons) {
  return [
    addons.drone ? 'Drone added' : '',
    addons.karaoke ? 'Karaoke added' : '',
    addons.tube ? 'Tube added' : ''
  ].filter(Boolean);
}

function href(params: Record<string, string | number>) {
  const query = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => query.set(key, String(value)));
  return `./jetski-booking/?${query.toString()}`;
}

function optionClass(isActive: boolean) {
  return `calc-option${isActive ? ' selected' : ''}`;
}

function handleOptionKey(event: React.KeyboardEvent<HTMLDivElement>) {
  if (event.key !== ' ' && event.key !== 'Enter') return;
  event.preventDefault();
  event.currentTarget.click();
}

function ChoiceOption({
  isActive,
  onSelect,
  children,
  data
}: {
  isActive: boolean;
  onSelect: () => void;
  children: React.ReactNode;
  data?: Record<string, string | number>;
}) {
  return (
    <div className={optionClass(isActive)} onClick={onSelect} onKeyDown={handleOptionKey} role="button" tabIndex={0} {...data}>
      {children}
      <div className="calc-check" />
    </div>
  );
}

function AddonOption({
  addon,
  checked,
  onToggle,
  name,
  sub
}: {
  addon: keyof Addons;
  checked: boolean;
  onToggle: () => void;
  name: string;
  sub: string;
}) {
  return (
    <div
      className={`calc-option calc-addon-toggle${checked ? ' selected' : ''}`}
      role="checkbox"
      aria-checked={checked ? 'true' : 'false'}
      tabIndex={0}
      onClick={onToggle}
      onKeyDown={handleOptionKey}
    >
      <input className="calc-addon-input" type="checkbox" data-addon={addon} checked={checked} readOnly />
      <div><div className="calc-option-name">{name}</div><div className="calc-option-sub">{sub}</div></div>
      <div className="calc-check" />
    </div>
  );
}

export function HomeBookingCalculator() {
  const [tab, setTab] = useState<Tab>('jetski');
  const [jetCraft, setJetCraft] = useState<JetCraft>('jetski2');
  const [jetHours, setJetHours] = useState<keyof typeof pricing.jetski2>(2);
  const [boatHours, setBoatHours] = useState<keyof typeof pricing.partyboat>(4);
  const [bundleCraft, setBundleCraft] = useState<BundleCraft>('bundle2');
  const [bundleHours, setBundleHours] = useState<keyof typeof pricing.bundle2>(2);
  const [jetAddons, setJetAddons] = useState<Addons>({ drone: false, karaoke: false, tube: false });
  const [boatAddons, setBoatAddons] = useState<Addons>({ drone: false, karaoke: false, tube: false });
  const [bundleAddons, setBundleAddons] = useState<Addons>({ drone: false, karaoke: false, tube: false });

  const jetBase = pricing[jetCraft][jetHours];
  const jetTotal = jetBase + (jetAddons.drone ? 50 : 0);
  const jetLabels = addonLabels(jetAddons);
  const jetDesc = `${craftNames[jetCraft]} · ${durationLabel(jetHours)} · ${hourlyRateLabel(jetCraft, jetHours, jetBase)}${jetLabels.length ? ` · ${jetLabels.join(' · ')}` : ''}`;

  const boatBase = pricing.partyboat[boatHours];
  const boatTotal = boatBase + (boatAddons.drone ? 50 : 0) + (boatAddons.karaoke ? 50 : 0) + (boatAddons.tube ? 50 : 0);
  const boatDueToday = 55 + (boatAddons.karaoke ? 50 : 0) + (boatAddons.tube ? 50 : 0);
  const boatLabels = addonLabels(boatAddons);
  const boatDesc = `Boat Rental · ${boatHours === 8 ? 'Full Day (8hrs)' : `${boatHours}hr${boatHours > 1 ? 's' : ''}`} · Up to 14 guests${boatLabels.length ? ` · ${boatLabels.join(' · ')}` : ''}`;

  const bundleBase = pricing[bundleCraft][bundleHours];
  const bundleTotal = bundleBase + (bundleAddons.drone ? 50 : 0) + (bundleAddons.karaoke ? 50 : 0) + (bundleAddons.tube ? 50 : 0);
  const bundleDueToday = 55 + (bundleAddons.karaoke ? 50 : 0) + (bundleAddons.tube ? 50 : 0);
  const bundleLabels = addonLabels(bundleAddons);
  const bundleDesc = `${craftNames[bundleCraft]} · ${durationLabel(bundleHours)}${bundleLabels.length ? ` · ${bundleLabels.join(' · ')}` : ''}`;

  const toggleJetAddon = (addon: keyof Addons) => setJetAddons((current) => ({ ...current, [addon]: !current[addon] }));
  const toggleBoatAddon = (addon: keyof Addons) => setBoatAddons((current) => ({ ...current, [addon]: !current[addon] }));
  const toggleBundleAddon = (addon: keyof Addons) => setBundleAddons((current) => ({ ...current, [addon]: !current[addon] }));

  return (
    <section id="booking" className="calc-section">
      <div className="section-inner">
        <div className="section-tag">Book Your Rental</div>
        <h2>Choose The Package First</h2>
        <p className="section-sub" style={{ marginBottom: '2rem' }}>Choose your rental, compare the hourly value, and continue into the booking flow for the date, contact + waiver, and $55 checkout.</p>
        <div className="calc-wrap">
          <div className="calc-tabs">
            <button type="button" className={`calc-tab-btn${tab === 'jetski' ? ' active' : ''}`} id="tab-jetski" onClick={() => setTab('jetski')}>Jet Ski Rental</button>
            <button type="button" className={`calc-tab-btn${tab === 'boat' ? ' active' : ''}`} id="tab-boat" onClick={() => setTab('boat')}>Boat Rental</button>
            <button type="button" className={`calc-tab-btn${tab === 'bundle' ? ' active' : ''}`} id="tab-bundle" onClick={() => setTab('bundle')}>Bundle</button>
          </div>

          <div className={`calc-panel${tab === 'jetski' ? ' active' : ''}`} id="panel-jetski">
            <div>
              <div className="calc-col-label">1 · Number of jet skis needed</div>
              <div className="calc-select-group" id="js-craft-opts">
                <ChoiceOption isActive={jetCraft === 'jetski2'} onSelect={() => setJetCraft('jetski2')} data={{ 'data-craft': 'jetski2' }}><div><div className="calc-option-name">2 Yamaha Jet Skis</div><div className="calc-option-sub">Best for a smaller crew</div></div></ChoiceOption>
                <ChoiceOption isActive={jetCraft === 'jetski3'} onSelect={() => setJetCraft('jetski3')} data={{ 'data-craft': 'jetski3' }}><div><div className="calc-option-name">3 Yamaha Jet Skis</div><div className="calc-option-sub">Extra room for a bigger group</div></div></ChoiceOption>
                <ChoiceOption isActive={jetCraft === 'jetski4'} onSelect={() => setJetCraft('jetski4')} data={{ 'data-craft': 'jetski4' }}><div><div className="calc-option-name">4 Yamaha Jet Skis</div><div className="calc-option-sub">Largest Yamaha setup</div></div></ChoiceOption>
              </div>
              <hr className="calc-divider" />
              <div className="calc-col-label">2 · Choose your duration</div>
              <div className="calc-select-group" id="js-dur-opts">
                {[2, 3, 4, 6, 8].map((hours) => (
                  <ChoiceOption key={hours} isActive={jetHours === hours} onSelect={() => setJetHours(hours as keyof typeof pricing.jetski2)} data={{ 'data-hours': hours }}>
                    <div><div className="calc-option-name">{hours === 8 ? 'Full Day (8 Hours)' : `${hours} Hours`}</div><div className="calc-option-sub">{hours === 4 ? <><strong>Most Popular</strong> · $74/hr per ski</> : hours === 6 ? <><strong>Best Value</strong> · $63/hr per ski</> : hours === 8 ? '$59/hr per ski' : '$79/hr per ski'}</div></div>
                  </ChoiceOption>
                ))}
              </div>
              <div className="calc-addon-box">
                <div className="calc-addon-label">3 · Add-ons</div>
                <div className="calc-select-group calc-addon-group" id="js-addon-opts">
                  <AddonOption addon="drone" checked={jetAddons.drone} onToggle={() => toggleJetAddon('drone')} name="Aerial drone video" sub="+$50" />
                </div>
              </div>
            </div>
            <div>
              <div className="calc-result-box">
                <div className="calc-result-label">Your Total</div>
                <div className="calc-result-price" id="js-price">{money(jetTotal)}</div>
                <div className="calc-result-desc" id="js-desc">{jetDesc}</div>
                <div className="calc-deposit-row">
                  <div className="calc-deposit-item"><div className="dl">Deposit credit</div><div className="dv" style={{ color: 'var(--gold)' }}>$50</div></div>
                  <div className="calc-deposit-item"><div className="dl">Due today</div><div className="dv" style={{ color: 'var(--gold)' }}>$55</div></div>
                </div>
              </div>
              <div className="calc-includes"><div className="calc-includes-label">Everything included</div><div className="calc-include-list"><span className="calc-include-item">Life Jackets</span><span className="calc-include-item">Full Tank of Gas</span><span className="calc-include-item">Fast &amp; Easy Booking</span><span className="calc-include-item">Cooler</span><span className="calc-include-item">Safety Briefing</span></div></div>
              <a href={href({ type: 'jetski', craft: jetCraft, hours: jetHours, drone: jetAddons.drone ? 'yes' : 'no', total: jetTotal })} className="calc-book-btn" id="js-book-btn">Continue to Calendar &amp; Contact + Waiver →</a>
              <p className="price-match" id="js-savings-note">{savingsLabel(jetCraft, jetHours, jetBase)}</p>
            </div>
          </div>

          <div className={`calc-panel${tab === 'boat' ? ' active' : ''}`} id="panel-boat">
            <div>
              <div className="calc-col-label">Choose your duration</div>
              <div className="calc-select-group" id="bt-dur-opts">
                {[2, 3, 4, 6, 8].map((hours) => (
                  <ChoiceOption key={hours} isActive={boatHours === hours} onSelect={() => setBoatHours(hours as keyof typeof pricing.partyboat)} data={{ 'data-hours': hours }}>
                    <div><div className="calc-option-name">{hours === 8 ? 'Full Day (8 Hours)' : `${hours} Hours`}</div>{hours === 4 ? <div className="calc-option-sub"><strong>Most Popular</strong></div> : hours === 8 ? <div className="calc-option-sub"><strong>Best Value</strong></div> : null}</div>
                  </ChoiceOption>
                ))}
              </div>
              <div className="calc-addon-box">
                <div className="calc-addon-label">2 · Add-ons</div>
                <div className="calc-select-group calc-addon-group" id="bt-addon-opts">
                  <AddonOption addon="drone" checked={boatAddons.drone} onToggle={() => toggleBoatAddon('drone')} name="Aerial drone video" sub="+$50" />
                  <AddonOption addon="karaoke" checked={boatAddons.karaoke} onToggle={() => toggleBoatAddon('karaoke')} name="Karaoke setup" sub="+$50 · boat only" />
                  <AddonOption addon="tube" checked={boatAddons.tube} onToggle={() => toggleBoatAddon('tube')} name="Pool tube" sub="+$50 · boat only" />
                </div>
              </div>
            </div>
            <div>
              <div className="calc-result-box">
                <div className="calc-result-label">Your Total</div>
                <div className="calc-result-price" id="bt-price">{money(boatTotal)}</div>
                <div className="calc-result-desc" id="bt-desc">{boatDesc}</div>
                <div className="calc-deposit-row">
                  <div className="calc-deposit-item"><div className="dl">Due today</div><div className="dv" id="bt-due-today" style={{ color: 'var(--gold)' }}>{money(boatDueToday)}</div></div>
                  <div className="calc-deposit-item"><div className="dl">Captain</div><div className="dv" style={{ color: 'var(--gold)' }}>Included</div></div>
                </div>
              </div>
              <div className="calc-includes"><div className="calc-includes-label">Everything included</div><div className="calc-include-list"><span className="calc-include-item">Captain</span><span className="calc-include-item">Life Jackets</span><span className="calc-include-item">Full Tank</span><span className="calc-include-item">Fast &amp; Easy Booking</span><span className="calc-include-item">Cooler</span><span className="calc-include-item">Up to 14 Guests</span></div></div>
              <a href={href({ type: 'boat', craft: 'partyboat', hours: boatHours, drone: boatAddons.drone ? 'yes' : 'no', karaoke: boatAddons.karaoke ? 'yes' : 'no', tube: boatAddons.tube ? 'yes' : 'no', total: boatTotal })} className="calc-book-btn" id="bt-book-btn">Continue to Calendar &amp; Contact + Waiver →</a>
              <p className="price-match" id="bt-savings-note">Easy hourly pricing with the captain included. {money(boatDueToday)} due today at checkout.</p>
            </div>
          </div>

          <div className={`calc-panel${tab === 'bundle' ? ' active' : ''}`} id="panel-bundle">
            <div>
              <div className="calc-col-label">1 · Choose your bundle size</div>
              <div className="calc-select-group" id="bd-craft-opts">
                {(['bundle2', 'bundle3', 'bundle4'] as const).map((craft) => (
                  <ChoiceOption key={craft} isActive={bundleCraft === craft} onSelect={() => setBundleCraft(craft)} data={{ 'data-craft': craft }}>
                    <div><div className="calc-option-name">{craftNames[craft]}</div><div className="calc-option-sub">{craft === 'bundle2' ? 'Best for a mixed group' : craft === 'bundle3' ? 'Extra room for more riders' : 'Full lake-day setup'}</div></div>
                  </ChoiceOption>
                ))}
              </div>
              <hr className="calc-divider" />
              <div className="calc-col-label">2 · Choose your duration</div>
              <div className="calc-select-group" id="bd-dur-opts">
                {[2, 3, 4, 6, 8].map((hours) => (
                  <ChoiceOption key={hours} isActive={bundleHours === hours} onSelect={() => setBundleHours(hours as keyof typeof pricing.bundle2)} data={{ 'data-hours': hours }}>
                    <div><div className="calc-option-name">{hours === 8 ? 'Full Day (8 Hours)' : `${hours} Hours`}</div>{hours === 4 ? <div className="calc-option-sub"><strong>Most Popular</strong></div> : hours === 6 ? <div className="calc-option-sub"><strong>Best Value</strong></div> : null}</div>
                  </ChoiceOption>
                ))}
              </div>
              <div className="calc-addon-box">
                <div className="calc-addon-label">3 · Add-ons</div>
                <div className="calc-select-group calc-addon-group" id="bd-addon-opts">
                  <AddonOption addon="drone" checked={bundleAddons.drone} onToggle={() => toggleBundleAddon('drone')} name="Aerial drone video" sub="+$50" />
                  <AddonOption addon="karaoke" checked={bundleAddons.karaoke} onToggle={() => toggleBundleAddon('karaoke')} name="Karaoke setup" sub="+$50 · boat only" />
                  <AddonOption addon="tube" checked={bundleAddons.tube} onToggle={() => toggleBundleAddon('tube')} name="Pool tube" sub="+$50 · boat only" />
                </div>
              </div>
            </div>
            <div>
              <div className="calc-result-box">
                <div className="calc-result-label">Your Total</div>
                <div className="calc-result-price" id="bd-price">{money(bundleTotal)}</div>
                <div className="calc-result-desc" id="bd-desc">{bundleDesc}</div>
                <div className="calc-deposit-row">
                  <div className="calc-deposit-item"><div className="dl">Deposit credit</div><div className="dv" style={{ color: 'var(--gold)' }}>$50</div></div>
                  <div className="calc-deposit-item"><div className="dl">Due today</div><div className="dv" id="bd-due-today" style={{ color: 'var(--gold)' }}>{money(bundleDueToday)}</div></div>
                </div>
              </div>
              <div className="calc-includes"><div className="calc-includes-label">Everything included</div><div className="calc-include-list"><span className="calc-include-item">Yamaha Jet Skis</span><span className="calc-include-item">Boat + Captain</span><span className="calc-include-item">Life Jackets</span><span className="calc-include-item">Full Tank</span><span className="calc-include-item">Fast &amp; Easy Booking</span><span className="calc-include-item">Cooler</span></div></div>
              <a href={href({ type: 'bundle', craft: bundleCraft, hours: bundleHours, drone: bundleAddons.drone ? 'yes' : 'no', karaoke: bundleAddons.karaoke ? 'yes' : 'no', tube: bundleAddons.tube ? 'yes' : 'no', total: bundleTotal })} className="calc-book-btn" id="bd-book-btn">Continue to Calendar &amp; Contact + Waiver →</a>
              <p className="price-match" id="bd-savings-note">Found a lower price? <span>We'll match it.</span> {money(bundleDueToday)} due today at checkout.</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
