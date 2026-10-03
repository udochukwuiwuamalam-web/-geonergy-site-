/* Geonergy AI assistant.
 *
 * WHAT THIS IS, PLAINLY: the site is static - no server, no secrets. A real
 * hosted language model needs an API key, and a key in a page like this is
 * readable by anyone who views source and billable by anyone who copies it.
 * So the assistant answers from a knowledge base that ships with the site:
 * house guidance written for Nigerian installations, the product catalogue,
 * and the fault / warning / program tables transcribed from the manufacturers'
 * own manuals. Every answer cites where it came from.
 *
 * ASSISTANT_ENDPOINT is the seam for the other half. Point it at a small
 * server that holds the model key, and anything the local engine cannot answer
 * confidently is forwarded there; its reply renders in the same panel with its
 * sources. Until that exists the assistant says it does not know and offers
 * WhatsApp, which is better than guessing at someone's electrical system.
 *
 * The inverter code database is ~96KB and only loads when a question actually
 * needs it - the pages have to stay light on Nigerian mobile data.
 */
(function (global) {
  'use strict';

  // Placeholder until Geonergy's real line is in. Same number as store.html
  // and inverter.html - change all three together.
  const WHATSAPP_NUMBER = '2348000000000';

  // Empty = local knowledge only. See the note at the top of this file.
  const ASSISTANT_ENDPOINT = '';

  // WEB LOOKUP. The page cannot run a search engine - those need a key and a
  // server - but it can read public APIs that allow browser requests and need
  // no key at all. Wikipedia is the one worth having: open licence, no key,
  // cross-origin allowed, and a named article to link so the customer can see
  // exactly where the words came from. It is used only when Geonergy's own
  // guidance has nothing, and never for a question about somebody's own
  // wiring, settings or safety - see WEB_NEVER below. Set to false to switch
  // the whole thing off.
  const WEB_LOOKUP = true;
  const WEB_TIMEOUT = 6000;
  const WIKI_SEARCH = 'https://en.wikipedia.org/w/rest.php/v1/search/page?limit=3&q=';
  const WIKI_PAGE = 'https://en.wikipedia.org/api/rest_v1/page/summary/';
  const DDG_API = 'https://api.duckduckgo.com/?no_html=1&skip_disambig=1&format=json&t=geonergy&q=';
  // Electrical Engineering Stack Exchange. Titles and links only, never the
  // answer text: a forum post is somebody's opinion, and this site will not
  // put one in a customer's hands as though it were guidance.
  const SE_API = 'https://api.stackexchange.com/2.3/search/advanced?order=desc&sort=relevance' +
    '&pagesize=4&answers=1&site=electronics&q=';

  // The web lookup stays inside this site's subject. Without this gate,
  // "what is the capital of Ghana" gets searched as "capital ghana solar"
  // and comes back with a solar-industry article, which is a strange way to
  // be wrong. Off-topic questions get an honest "I do not know" instead.
  const WEB_TOPIC = /solar|panel|photovoltaic|\bpv\b|inverter|battery|batteries|lithium|lead.acid|tubular|charge|charging|mppt|pwm|watt|kw|kva|kwh|volt|amp|current|energy|power|electric|grid|nepa|disco|generator|diesel|fuel|sun|sunlight|irradiat|off.grid|hybrid|ups|load|backup|renewab/;

  // Questions an encyclopedia must not answer on this site. A general article
  // does not know your battery class, your cable runs or your local code, and
  // a confident generic answer about live DC is how somebody gets hurt.
  const WEB_NEVER = /fault|error|\berr\b|code|warning|alarm|program|setting|wire|wiring|connect|terminal|shock|electrocut|fire|burn|volt|amp\b|breaker|fuse|earth|ground|install|mount|repair|fix my|my inverter|my battery|my panel|my system/;

  const HOUSE = 'Geonergy house guidance';

  // ---------------------------------------------------------------
  // KNOWLEDGE BASE
  // Written for a customer, not an engineer. `k` is the words that should
  // pull an entry up; `a` is the answer, in simple HTML.
  // ---------------------------------------------------------------
  const KB = [
    { id: 'system', k: 'what is solar system how does work components parts explain',
      a: '<p>A solar system here is four parts working together:</p><ul><li><strong>Panels</strong> on the roof turn sunlight into DC electricity.</li><li>A <strong>charge controller</strong> (usually built into the inverter) feeds that into the battery safely.</li><li>The <strong>battery</strong> stores it so you have power at night and when the light goes.</li><li>The <strong>inverter</strong> turns DC into the 230V AC your sockets use.</li></ul><p>Size is set by two separate things: the <em>inverter</em> decides how much you can run at once, the <em>battery</em> decides how long for.</p>' },

    { id: 'sizing-inverter', k: 'inverter size sizing kva kw how big what size rating choose',
      a: '<p>Add up the wattage of everything you want running <em>at the same time</em>, then add about 25% headroom. Divide by 0.8 to get kVA.</p><p>So 2,400W of load is roughly 3,000W with headroom, which is about 3.75 kVA - you would buy a 4.2 kVA.</p><p>Watch the <strong>surge</strong> separately. Fridges, freezers, pumps and air conditioners draw three to four times their running watts for a second or two when the motor kicks in. An inverter that handles the running load but not the surge will trip on overload.</p><p>Tap <strong>Build a quote</strong> below and I will do the arithmetic with you.</p>' },

    { id: 'sizing-battery', k: 'battery size sizing kwh backup hours how long last capacity',
      a: '<p>Battery is about <em>duration</em>. Multiply your running load by the hours you want, then allow for depth of discharge.</p><p>Lithium (LiFePO4) gives you about 90% of its rated kWh. Tubular or lead-acid gives about 50% if you want it to last - drain it further and you shorten its life badly.</p><p>Example: 800W of load for 8 hours is 6.4 kWh of energy. On lithium that is roughly a 7 kWh battery; on tubular you would need about 13 kWh of nameplate to get the same run time.</p>' },

    { id: 'battery-type', k: 'lithium tubular lead acid gel agm which better battery type compare',
      a: '<p><strong>Lithium (LiFePO4)</strong> - 6,000+ cycles, usable to 90%, no watering, lighter, and it takes a fast charge. Costs more up front and is almost always cheaper per year.</p><p><strong>Tubular / lead-acid</strong> - cheaper to buy, about 1,000-1,500 cycles, usable to 50%, needs ventilation and (on flooded types) topping up with distilled water.</p><p>For a home that cycles the battery every single day, lithium usually wins on total cost. For a standby system that rarely discharges, tubular can make sense.</p>' },

    { id: 'ac', k: 'air conditioner ac run cool aircon 1hp 1.5hp split',
      a: '<p>Yes, with the right size. A 1HP inverter-type AC draws roughly 900W running and about 2,700W on start; a 1.5HP is roughly 1,300W and 3,900W.</p><p>Two practical rules:</p><ul><li>Buy an <strong>inverter-type</strong> AC, not a conventional one. It ramps instead of slamming the compressor on, so the surge is gentler and it uses far less energy.</li><li>Run it while the sun is up if you can. Cooling at midday off solar is cheap; cooling at 2am comes straight out of the battery.</li></ul><p>A single 1HP AC on top of normal house load wants 3.5 kVA at the very least, and 4.2 kVA is the safer buy - add a second AC or a 1.5HP and you are at 5 kVA and above.</p>' },

    { id: 'panels', k: 'panels how many solar panel number watt array size roof',
      a: '<p>Panels are sized by the energy you need per day, not by the inverter. In most of Nigeria a panel produces roughly 4 to 4.5 kWh per installed kW per day across the year.</p><p>So if you use 6 kWh a day, you want about 1.5 kW of panel as a bare minimum, and more like 2 to 2.5 kW to cover the rainy season and keep the battery topped up. That is four or five 500W panels.</p><p>Check two limits on the inverter before buying: maximum PV input power, and maximum open-circuit voltage. Exceeding the voltage limit damages the MPPT.</p>' },

    { id: 'orientation', k: 'direction face panel tilt angle orientation south north roof position',
      a: '<p>Nigeria sits just north of the equator, so panels should face <strong>south</strong>, tilted roughly 10 to 15 degrees.</p><p>Do not lay them completely flat even where the roof is flat - a little tilt lets rain run dust off instead of leaving it to cake on.</p><p>Shade matters more than angle. One branch or a water tank across a corner of a panel can drag down the whole string, so keep the array clear of shadow between about 9am and 4pm.</p>' },

    { id: 'harmattan', k: 'harmattan dust dirty clean cleaning wash panels output drop',
      a: '<p>Harmattan dust can cut output noticeably - a heavy film costs you real power, and it builds up over weeks without rain.</p><p>Rinse with clean water and a soft brush or cloth, early morning or evening while the glass is cool. Never throw cold water on hot glass, and never use detergent or anything abrasive.</p><p>Through harmattan, once a fortnight is reasonable. In the rains, the rain usually does it for you.</p>' },

    { id: 'rainy', k: 'rain rainy season cloud wet weather output less performance',
      a: '<p>Output drops in the rains - a heavily overcast day can produce a fraction of a clear one, and several such days in a row will pull the battery down.</p><p>Two things help: size the panel array with headroom rather than exactly to your daily need, and keep grid or generator charging configured so the battery can be topped up when the sun does not deliver.</p>' },

    { id: 'types', k: 'hybrid off grid tie difference type inverter which grid',
      a: '<p><strong>Off-grid</strong> - battery and solar only. Grid or generator can charge the battery but never feeds your loads directly.</p><p><strong>Hybrid</strong> - the common choice here. Solar, battery and grid all work together, and you set the priority: solar first, grid first, or battery first.</p><p><strong>Grid-tie</strong> - no battery, feeds the grid. Little use in Nigeria, because when the grid goes down a grid-tie inverter shuts off too.</p>' },

    { id: 'mppt', k: 'mppt pwm difference charge controller which better',
      a: '<p><strong>MPPT</strong> tracks the panel’s maximum power point and converts the surplus voltage into extra charging current. <strong>PWM</strong> simply connects the panel to the battery and throws the difference away.</p><p>MPPT typically harvests 20-30% more from the same panels, and it lets you wire panels in series at higher voltage, which means thinner cable over a long run. Every system Geonergy sizes for a home uses MPPT.</p>' },

    { id: 'voltage', k: '12v 24v 48v system voltage battery bank which class',
      a: '<p>The battery voltage class follows the size of the system: 12V for small units, 24V in the middle, 48V for anything substantial.</p><p>Higher voltage means less current for the same power, which means thinner cable, smaller losses and less heat. That is why the bigger inverters are all 48V.</p><p>It matters for settings too: a cut-off of 21V is correct on a 24V machine and meaningless on a 12V one. Always set voltages from the manual for <em>your</em> battery class - the Inverter page carries the real tables.</p>' },

    { id: 'beep', k: 'beeping beep alarm buzzer noise sound why making',
      a: '<p>A beeping inverter is telling you something specific, and the code on the screen says what. The common ones:</p><ul><li><strong>Mains lost</strong> - a few beeps when the grid drops. Normal.</li><li><strong>Low battery</strong> - continuous or repeated. Reduce load; it will shut down to protect the battery.</li><li><strong>Overload</strong> - you have asked for more than it can give. Switch something off.</li><li><strong>Over temperature</strong> - check the fans and that nothing blocks the vents.</li></ul><p>Tell me the brand and the number on the screen and I will look up exactly what it means.</p>' },

    { id: 'backup-short', k: 'battery not lasting short backup drain fast quickly runs down weak',
      a: '<p>Usually one of five things:</p><ul><li><strong>More load than you think.</strong> A freezer, a pressing iron or an AC will empty a small battery quickly. Check what is actually on.</li><li><strong>Panels not charging.</strong> If the battery never reaches full, every night starts from behind.</li><li><strong>Cut-off set wrong.</strong> Too low and you damage the battery; too high and you lose usable capacity.</li><li><strong>Battery ageing.</strong> Lead-acid loses capacity steadily; a 3-5 year old tubular bank may be near the end.</li><li><strong>A bad cell or loose terminal.</strong> Warm or corroded terminals are a warning sign - have it checked.</li></ul>' },

    { id: 'not-charging', k: 'not charging panels no solar charge pv zero not working current',
      a: '<p>Work through it in this order:</p><ul><li><strong>Is the PV breaker or isolator on?</strong> Start with the obvious.</li><li><strong>Does the screen show PV voltage?</strong> No voltage points at wiring, the isolator, or a panel fault. Voltage but no current points at settings or the controller.</li><li><strong>Is the battery already full?</strong> A full battery means the controller stops charging. That is correct behaviour.</li><li><strong>Is charger priority set to utility?</strong> Some units then ignore solar while mains is present.</li><li><strong>Shade, or a dirty array.</strong></li></ul><p>Anything past this is DC work at dangerous voltage - call Geonergy rather than opening the array yourself.</p>' },

    { id: 'generator', k: 'generator gen mode connect run charge genset',
      a: '<p>Most hybrid inverters take a generator on the AC input, but set the input mode to <strong>GEN</strong> (or widen the input range) first. A generator’s waveform and frequency wander more than the grid, and in the narrow "UPS" input range the inverter will keep rejecting it.</p><p>Size the generator to the charging load plus whatever is passing through, and let it settle for a few seconds before it takes the load.</p>' },

    { id: 'install-where', k: 'where install mount location place inverter wall room ventilation',
      a: '<p>Indoors, on a solid wall, out of the rain and out of direct sun. Leave clear space above, below and either side - these units cool themselves by moving air, and a cupboard with no airflow will have you reading an over-temperature fault.</p><p>Keep it away from the kitchen and from dusty workshops, mount it at eye level so the screen can be read, and keep flooded lead-acid batteries in a separate ventilated space - they give off hydrogen when charging.</p>' },

    { id: 'earthing', k: 'earth earthing ground grounding rod safety bonding',
      a: '<p>Earthing is not optional. The inverter chassis, the panel frames and the mounting rail must all be bonded to a proper earth electrode.</p><p>It is what protects you from a fault becoming a shock, and it is also the first thing to suspect when an inverter reports a ground-fault or leakage code. This is licensed-electrician work - have Geonergy do it or inspect it.</p>' },

    { id: 'maintenance', k: 'maintenance maintain servicing service clean check routine care upkeep after system',
      a: '<p>Little and often:</p><ul><li><strong>Monthly</strong> - look at the screen. Note the battery voltage at the same time each day and you will spot a problem developing.</li><li><strong>Quarterly, or fortnightly in harmattan</strong> - rinse the panels.</li><li><strong>Quarterly</strong> - check terminals are tight and clean, and that vents and fans are clear.</li><li><strong>Flooded batteries</strong> - check electrolyte and top up with distilled water only.</li><li><strong>Yearly</strong> - have the whole system inspected properly.</li></ul>' },

    { id: 'lifespan', k: 'how long last lifespan years life expectancy durable warranty',
      a: '<p>Broadly, with decent equipment and installation:</p><ul><li><strong>Panels</strong> - 25 years, losing a little output each year.</li><li><strong>Lithium battery</strong> - 8 to 10 years, or 6,000+ cycles.</li><li><strong>Tubular battery</strong> - 3 to 5 years in daily cycling.</li><li><strong>Inverter</strong> - 8 to 12 years; fans are the usual first replacement.</li></ul><p>For the warranty on a specific unit Geonergy supplied, message us and we will check it against your invoice.</p>' },

    { id: 'pump', k: 'borehole pump water 1hp 2hp submersible run',
      a: '<p>Yes, but size for the <em>start</em>, not the run. A 1HP pump draws around 750W running and can pull three times that for a moment as it starts; a 1.5HP submersible more again.</p><p>Run the pump in daylight, fill a tank, and draw from the tank the rest of the day. That way the surge lands on solar rather than the battery, and you are storing water instead of storing electricity - much cheaper.</p>' },

    { id: 'fridge', k: 'fridge freezer refrigerator cold room chest run',
      a: '<p>Fridges and freezers are well suited to solar because they cycle - a medium fridge might average 150W running with a surge of about 600W, a chest freezer 200W and about 800W.</p><p>Size for the surge, and remember they run all night. A freezer alone is around 2-3 kWh a day, which is a real share of a small battery.</p>' },

    { id: 'business', k: 'shop office business clinic commercial factory church school',
      a: '<p>Business systems get sized from a load audit rather than a rule of thumb, because the answer turns on duty cycle - how many hours the freezers, tills, lights and air conditioners actually run.</p><p>Geonergy sizes these individually. Build a rough load list in the quote tool below and send it over on WhatsApp, and we will come back with a proper design.</p>' },

    { id: 'sell-back', k: 'sell back grid net metering export electricity nepa disco earn regulation policy nigeria nigerian rule allowed',
      a: '<p>Selling power back to the disco is not generally available to residential customers in Nigeria, so systems here are built to <em>use</em> what they generate rather than export it.</p><p>That is why storage matters so much: surplus midday solar goes into the battery for the evening instead of being exported.</p>' },

    { id: 'cost', k: 'price cost how much money expensive quote budget naira',
      a: '<p>Prices are not published on the site because a system is quoted per site, not off a shelf. What moves the number:</p><ul><li>Inverter size, which comes from what you run at once.</li><li>Battery capacity and chemistry - usually the biggest single line.</li><li>Number of panels, and the mounting your roof needs.</li><li>Cable runs, protection, earthing, and the installation itself.</li></ul><p>Build a load list below and send it on WhatsApp - that is what turns into a formal PDF quote.</p>' },

    { id: 'safety', k: 'safety danger shock dangerous diy myself risk fire',
      a: '<p>Two things are genuinely dangerous and are not DIY work:</p><ul><li><strong>The DC side.</strong> A panel string can sit at hundreds of volts DC in full sun and cannot simply be switched off - it is live whenever light falls on it. DC arcs do not self-extinguish the way AC does.</li><li><strong>Batteries.</strong> A lithium bank can deliver enormous current into a short. A dropped spanner across the terminals is a serious burn or a fire.</li></ul><p>Reading the screen, cleaning panels and changing settings from the manual are fine. Opening the DC side is not.</p>' }
  ];

  // Typical Nigerian household figures. Running watts, then the surge the
  // motor pulls at start - the surge is what sizes the inverter, not the run.
  const LOADS = [
    ['LED bulb', 10, 10], ['Ceiling fan', 75, 150], ['Standing fan', 60, 120],
    ['TV and decoder', 130, 130], ['Laptop', 65, 65], ['Phone charging', 15, 15],
    ['Wi-Fi router', 15, 15], ['Fridge', 150, 600], ['Chest freezer', 200, 800],
    ['Microwave', 1200, 1200], ['Electric kettle', 2000, 2000],
    ['Pressing iron', 1200, 1200], ['Washing machine', 500, 1500],
    ['Water pump (1HP)', 750, 2250], ['Air conditioner (1HP)', 900, 2700],
    ['Air conditioner (1.5HP)', 1300, 3900], ['Desktop or POS', 200, 300],
    ['Security lights', 50, 50], ['Blender', 400, 800]
  ];

  const STOP = new Set(('a an and are as at be by can do does for from has have how i in is it my of on or ' +
    'that the to use used what when where which why will with you your me mine about please tell ' +
    'should would could there here them they this these those than then also just like know').split(' '));

  const $ = (sel, root) => (root || document).querySelector(sel);
  const el = (tag, cls, html) => {
    const n = document.createElement(tag);
    if (cls) n.className = cls;
    if (html != null) n.innerHTML = html;
    return n;
  };
  const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c =>
    ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

  // Crude singular form, enough to stop "panels" and "regulations" missing
  // keys written in the singular. Not a stemmer and does not need to be.
  const stem = w => (w.length > 3 && w.slice(-1) === 's' && w.slice(-2) !== 'ss' ? w.slice(0, -1) : w);

  function words(s) {
    return String(s).toLowerCase().replace(/[^a-z0-9.\s-]/g, ' ')
      .split(/\s+/).filter(w => w.length > 1 && !STOP.has(w)).map(stem);
  }

  // Geonergy's own mark - the sun over the horizon, traced from the wordmark
  // in assets/logo-dark.png. The rays are thinner than the dome and the
  // horizon sits in front of it, as in the logo. Drawn rather than loaded as
  // an image so it inherits colour from the button and stays crisp at any
  // size. No text: the symbol IS the brand, and a nav bar has no room for
  // words nobody needs.
  const MARK =
    '<svg viewBox="0 0 24 13" fill="none" stroke="currentColor" stroke-linecap="round" ' +
    'stroke-linejoin="round" aria-hidden="true" focusable="false">' +
    '<path class="gm-rays" stroke-width="0.7" d="M19.29 9.02L21.85 8.56M18.65 7.06L20.99 5.92' +
    'M17.5 5.35L19.43 3.61M15.92 4.02L17.3 1.82M14.04 3.19L14.76.69M12 2.9L12 .3' +
    'M9.96 3.19L9.24.69M8.08 4.02L6.7 1.82M6.5 5.35L4.57 3.61M5.35 7.06L3.01 5.92' +
    'M4.71 9.02L2.15 8.56"/>' +
    '<path class="gm-sun" stroke-width="1.8" d="M6.4 10.3a5.6 5.6 0 0 1 11.2 0"/>' +
    '<path class="gm-line" stroke-width="1.15" d="M.7 12.4c3.6-.2 6.5-2.3 11.3-2.3s7.7 2.1 11.3 2.3"/>' +
    '</svg>';

  const ICON = {
    spark: '<path d="M12 2.5 14 9l6.5 2-6.5 2-2 6.5-2-6.5L3.5 11 10 9z"/><path d="M19 3.5v3M17.5 5h3"/>',
    close: '<path d="M6 6l12 12M18 6L6 18"/>',
    sound: '<path d="M4 9.5v5h3.5l4.5 4v-13l-4.5 4z"/><path d="M16 9a4 4 0 0 1 0 6M18.5 6.5a7.5 7.5 0 0 1 0 11"/>',
    mute: '<path d="M4 9.5v5h3.5l4.5 4v-13l-4.5 4z"/><path d="M16.5 9.5l5 5M21.5 9.5l-5 5"/>',
    mic: '<rect x="9" y="2.5" width="6" height="11" rx="3"/><path d="M5.5 11a6.5 6.5 0 0 0 13 0M12 17.5V21M8.5 21h7"/>',
    send: '<path d="M21 3 3 10.5l7.5 3L13.5 21z"/><path d="M21 3 10.5 13.5"/>',
    book: '<path d="M4 4.5h6a2.5 2.5 0 0 1 2 2.5v12a2 2 0 0 0-2-1.5H4zM20 4.5h-6a2.5 2.5 0 0 0-2 2.5v12a2 2 0 0 1 2-1.5h6z"/>',
    wa: '<path d="M3.5 20.5l1.3-4.6A8.2 8.2 0 1 1 8.4 19z"/><path d="M8.8 8.6c.3-.2.7-.2.9.1l.9 1.3c.2.3.1.6-.1.8l-.5.5c.5 1 1.3 1.8 2.3 2.3l.5-.5c.2-.2.5-.3.8-.1l1.3.9c.3.2.4.6.1.9-.8.9-2 1-3.4.3-1.6-.8-2.9-2.1-3.5-3.5-.6-1.4-.4-2.4.7-3z"/>'
  };
  const svg = (paths, cls) =>
    '<svg ' + (cls ? 'class="' + cls + '" ' : '') + 'viewBox="0 0 24 24" fill="none" stroke="currentColor" ' +
    'stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + paths + '</svg>';

  // ---------------------------------------------------------------
  // OUTSIDE READING
  // Links, not claims. A page with no server behind it cannot search the
  // web, so rather than pretending to, the assistant points at the primary
  // source and says plainly that it is sending you there to read it.
  // ---------------------------------------------------------------
  const REFERENCES = [
    { k: 'regulation regulator nerc law legal licence license tariff disco band grid policy',
      title: 'Nigerian Electricity Regulatory Commission (NERC)', url: 'https://nerc.gov.ng/' },
    { k: 'standard standards certification quality son fake counterfeit genuine approval',
      title: 'Standards Organisation of Nigeria (SON)', url: 'https://son.gov.ng/' },
    { k: 'irradiance irradiation sunshine sun hours resource map data location kwh potential',
      title: 'Global Solar Atlas - irradiation data by location', url: 'https://globalsolaratlas.info/' },
    { k: 'estimate estimated yield production model calculate output annual monthly pvwatts simulation',
      title: 'NREL PVWatts - independent production estimator', url: 'https://pvwatts.nrel.gov/' },
    { k: 'deye sun sg04lp3 manual datasheet firmware download',
      title: 'Deye - manufacturer documentation', url: 'https://www.deyeinverter.com/' },
    { k: 'felicity ivem ivpm ivps manual datasheet download',
      title: 'Felicity Solar - manufacturer documentation', url: 'https://www.felicitysolar.com/' },
    { k: 'growatt manual datasheet download',
      title: 'Growatt - manufacturer documentation', url: 'https://www.growatt.com/' },
    { k: 'sunsynk manual datasheet download',
      title: 'Sunsynk - manufacturer documentation', url: 'https://www.sunsynk.com/' },
    { k: 'srne hesp manual datasheet download',
      title: 'SRNE - manufacturer documentation', url: 'https://www.srnesolar.com/' }
  ];

  // Brand words a customer might type, including model names that identify
  // the brand on their own. Order matters: first match wins.
  const BRANDS = [
    [/\bdeye\b|sg04lp3/, 'deye', 'Deye'],
    [/\bmust\b|pv1800|pv3000/, 'must', 'MUST'],
    [/\bhaisic\b|pv ?9000|pv ?1000|pv ?5000|ct6ku/, 'haisic', 'Haisic'],
    [/\bfelicity\b|\bivem\b|\bivpm\b|\bivps\b|ivcm/, 'felicity', 'Felicity'],
    [/\bgrowatt\b/, 'growatt', 'Growatt'],
    [/\bsunsynk\b/, 'sunsynk', 'Sunsynk'],
    [/\bitel\b/, 'itel', 'itel'],
    [/\bsrne\b|\bhesp\b/, 'srne', 'SRNE']
  ];
  const BRAND_LABEL = {
    deye: 'Deye', growatt: 'Growatt', sunsynk: 'Sunsynk', must: 'MUST',
    haisic: 'Haisic', itel: 'itel', srne: 'SRNE', felicity: 'Felicity'
  };

  // kind, the array on the model, its source line, its caveat
  const CODE_LISTS = [
    ['fault', 'faultCodes', 'faultSource', 'faultWarning', 'Fault code'],
    ['warn', 'warnCodes', 'warnSource', 'warnWarning', 'Warning code'],
    ['program', 'settingsCodes', 'settingsSource', 'settingsWarning', 'Program']
  ];

  // Sizes actually sold here, in kVA. A quote rounds up to one of these.
  const LADDER = [0.7, 1, 1.5, 2.5, 3.5, 4.2, 5, 6, 7.5, 10, 12, 15, 20];

  // ---------------------------------------------------------------
  // LAZY DATA
  // The code tables are ~96KB and the catalogue is another request. Neither
  // loads until a question actually needs it.
  // ---------------------------------------------------------------
  let invPromise = null, prodPromise = null;

  function loadScript(src) {
    return new Promise((resolve, reject) => {
      const s = document.createElement('script');
      s.src = src;
      s.onload = resolve;
      s.onerror = () => reject(new Error('load ' + src));
      document.head.appendChild(s);
    });
  }

  function inverterData() {
    if (global.GeonergyInverterData) return Promise.resolve(global.GeonergyInverterData);
    if (!invPromise) {
      invPromise = loadScript('assets/inverter.js')
        .then(() => global.GeonergyInverterData || null)
        .catch(() => null);
    }
    return invPromise;
  }

  function products() {
    // The store page has already loaded this; reuse it rather than spending
    // a second request on a phone.
    if (global.__GEONERGY_PRODUCTS__ && global.__GEONERGY_PRODUCTS__.length) {
      return Promise.resolve(global.__GEONERGY_PRODUCTS__);
    }
    if (global.__PREVIEW_CATALOGUE__) {
      const c = global.__PREVIEW_CATALOGUE__;
      return Promise.resolve(c.products || c);
    }
    if (!prodPromise) {
      prodPromise = fetch('assets/products.json')
        .then(r => (r.ok ? r.json() : null))
        .then(j => {
          const list = (j && j.products) || null;
          if (list) global.__GEONERGY_PRODUCTS__ = list;
          return list;
        })
        .catch(() => null);
    }
    return prodPromise;
  }

  // ---------------------------------------------------------------
  // RETRIEVAL
  // ---------------------------------------------------------------
  // Returns the weight of the match and how many distinct words of the
  // question earned it. Both matter: one word hitting one entry hard is how
  // "my mining rig in the rain forest" ends up answered with rainy-season
  // advice, which is worse than saying I do not know.
  function score(qw, keys) {
    const kw = keys.split(' ').map(stem);
    let s = 0, hits = 0;
    qw.forEach(w => {
      let got = 0;
      kw.forEach(t => {
        if (t === w) got += 3;
        else if (t.length > 3 && w.length > 3 && (t.indexOf(w) === 0 || w.indexOf(t) === 0)) got += 2;
      });
      if (got) { hits++; s += got; }
    });
    return { s: s, hits: hits, cover: qw.length ? hits / qw.length : 0 };
  }

  // Two ways to be sure enough to answer: a broad match across the question,
  // or a short question where every word of it landed ("what is MPPT").
  const confident = m => (m.s >= 5 && (m.hits >= 2 || m.cover >= 0.4)) || (m.s >= 3 && m.cover >= 0.99);

  function bestKB(qw) {
    let top = null, best = { s: 0, hits: 0, cover: 0 };
    KB.forEach(e => {
      const m = score(qw, e.k);
      if (m.s > best.s) { best = m; top = e; }
    });
    return { entry: top, match: best };
  }

  function refsFor(qw) {
    return REFERENCES
      .map(r => ({ r: r, s: score(qw, r.k).s }))
      .filter(x => x.s >= 3)
      .sort((a, b) => b.s - a.s)
      .slice(0, 3)
      .map(x => x.r);
  }

  const codeNum = c => parseInt(String(c).replace(/[^0-9]/g, ''), 10);
  // Some manuals file a run of codes on one line - Felicity print the BMS
  // alarms as "54~65" rather than twelve rows. Somebody reading 58 off the
  // screen still has to land on it, so a code written as a range matches any
  // number inside it.
  function codeHit(code, num) {
    const r = String(code).match(/^\s*(\d+)\s*[~\u2013-]\s*(\d+)\s*$/);
    if (r) {
      const lo = parseInt(r[1], 10), hi = parseInt(r[2], 10);
      return num >= lo && num <= hi;
    }
    return codeNum(code) === num;
  }

  function codeQuery(t) {
    if (!/(code|fault|error|err|warning|warn|alarm|program|setting|showing|display|screen|flash)/.test(t)) return null;
    const kind = /program|setting|menu/.test(t) ? 'program'
      : (/warn|alarm/.test(t) ? 'warn'
        : (/fault|error|\berr\b|\bf ?\d/.test(t) ? 'fault' : 'any'));
    let brand = null, brandName = null;
    for (let i = 0; i < BRANDS.length; i++) {
      if (BRANDS[i][0].test(t)) { brand = BRANDS[i][1]; brandName = BRANDS[i][2]; break; }
    }
    const m = t.match(/\b(?:f|e|err|error|fault|warning|warn|alarm|code|program|setting|no\.?)\s*[-:#. ]?\s*(\d{1,3})\b/)
      || t.match(/\b(\d{1,3})\b/);
    if (!m) return null;
    return { kind: kind, brand: brand, brandName: brandName, num: parseInt(m[1], 10) };
  }

  function lookupCode(cq) {
    return inverterData().then(data => {
      if (!data) return null;
      const scope = cq.brand
        ? (data[cq.brand] ? [[cq.brand, cq.brandName || BRAND_LABEL[cq.brand], data[cq.brand]]] : [])
        : Object.keys(data).map(k => [k, BRAND_LABEL[k] || k, data[k]]);
      // What somebody calls the code is not what the manual filed it under.
      // SRNE print one table headed "Fault code" and mark inside it which rows
      // stop the output, so a customer reading 58 off the screen says "error
      // 58" for something this page lists as a warning. Haisic and MUST have
      // the same trap the other way round. So: honour the word they used
      // first, and if that finds nothing, look across all three lists rather
      // than telling them the number does not exist.
      function gather(kind) {
        const found = [];
        scope.forEach(row => {
          (row[2].models || []).forEach(m => {
            CODE_LISTS.forEach(L => {
              if (kind !== 'any' && kind !== L[0]) return;
              (m[L[1]] || []).forEach(c => {
                if (codeHit(c.code, cq.num)) {
                  found.push({ brand: row[1], model: m.name, label: L[4], entry: c, source: m[L[2]], caveat: m[L[3]] });
                }
              });
            });
          });
        });
        return found;
      }
      let hits = gather(cq.kind);
      if (!hits.length && cq.kind !== 'any') hits = gather('any');
      if (!hits.length) {
        if (cq.brand && !(data[cq.brand] && (data[cq.brand].models || []).length)) {
          return {
            html: '<p>I do not have ' + esc(cq.brandName || BRAND_LABEL[cq.brand]) + '’s code tables yet. Everything on the Inverter page is transcribed from a manual Geonergy holds, and I will not invent numbers for an electrical system.</p>' +
              '<p>Send a photo of the screen and the model label on WhatsApp and we will read it for you.</p>',
            source: { text: 'Geonergy inverter code database', href: 'inverter.html', label: 'the Inverter page' },
            chips: ['Why is my inverter beeping?', 'Build a quote']
          };
        }
        return null;
      }
      // One row per distinct wording, not per model: Haisic number their
      // faults the same across the range, and printing the identical
      // paragraph three times buries the answer.
      const groups = [];
      hits.forEach(x => {
        const key = x.brand + '|' + x.label + '|' + x.entry.code + '|' + x.entry.meaning + '|' + (x.entry.action || '');
        let g = null;
        for (let i = 0; i < groups.length; i++) if (groups[i].key === key) g = groups[i];
        if (!g) { g = { key: key, brand: x.brand, label: x.label, entry: x.entry, source: x.source, models: [] }; groups.push(g); }
        if (g.models.indexOf(x.model) < 0) g.models.push(x.model);
      });
      const shown = groups.slice(0, 4);
      let h = '<p>';
      if (cq.brand) h += 'On ' + esc(shown[0].brand) + ':</p>';
      else h += 'I found that number on more than one make, so check the badge on your unit - the same digits mean different things across manufacturers.</p>';
      shown.forEach(g => {
        h += '<p><strong>' + esc(g.label) + ' ' + esc(g.entry.code) + '</strong>' +
          (cq.brand ? '' : ' &middot; ' + esc(g.brand)) + ' &middot; <em>' + esc(g.models.join(', ')) + '</em><br>' +
          esc(g.entry.meaning) + (g.entry.action ? '<br>' + esc(g.entry.action) : '') + '</p>';
      });
      if (groups.length > shown.length) {
        h += '<p>' + (groups.length - shown.length) + ' more reading of that number elsewhere in the range - the Inverter page lists them all.</p>';
      }
      // Caveats belong to a manual, not to a code. Attribute them when the
      // answer spans two battery-voltage classes, because the caveat is
      // usually about exactly that.
      const notes = [];
      hits.forEach(x => {
        if (!x.caveat) return;
        let n = null;
        for (let i = 0; i < notes.length; i++) if (notes[i].text === x.caveat) n = notes[i];
        if (!n) { n = { text: x.caveat, models: [] }; notes.push(n); }
        if (n.models.indexOf(x.model) < 0) n.models.push(x.model);
      });
      if (notes.length === 1) {
        h += '<p><strong>Before you act:</strong> ' + esc(notes[0].text) + '</p>';
      } else if (notes.length > 1) {
        h += '<p><strong>Before you act:</strong></p><ul>' +
          notes.map(n => '<li><em>' + esc(n.models.join(', ')) + '</em> - ' + esc(n.text) + '</li>').join('') + '</ul>';
      }
      // Cite every manual the answer drew on. One source line under an answer
      // that spans two brands would be a false citation for the other.
      const srcs = [];
      shown.forEach(g => { if (g.source && srcs.indexOf(g.source) < 0) srcs.push(g.source); });
      const out = { html: h, chips: ['What should I check first?', 'Contact Geonergy'] };
      if (srcs.length > 1) {
        out.sources = srcs.map(t => ({ title: t })).concat([{ title: 'full tables on the Inverter page', url: 'inverter.html' }]);
      } else {
        out.source = { text: srcs[0] || 'manufacturer manual', href: 'inverter.html', label: 'full tables on the Inverter page' };
      }
      return out;
    });
  }

  function productAnswer(q, qw) {
    return products().then(list => {
      if (!list || !list.length) return null;
      const num = (q.match(/(\d+(?:\.\d+)?)\s*(?:kva|kv|kw)\b/) || [])[1];
      let pick = list.slice();
      if (num) {
        const want = parseFloat(num);
        pick.sort((a, b) => Math.abs(a.kva - want) - Math.abs(b.kva - want));
        pick = pick.slice(0, 3);
      } else {
        pick = pick.slice(0, 5);
      }
      let h = num
        ? '<p>Closest to ' + esc(num) + ' kVA in the store right now:</p><ul>'
        : '<p>A sample of what Geonergy stocks - the store has the full list with photos and specifications:</p><ul>';
      pick.forEach(p => {
        h += '<li><strong>' + esc(p.name) + '</strong> &middot; ' + esc(String(p.kva)) + ' kVA' +
          (p.tagline ? '<br>' + esc(p.tagline) : '') + '</li>';
      });
      h += '</ul><p>Prices are not published on the site - a system is quoted per site. Build a load list below and send it over and we will come back with a formal quote.</p>';
      return {
        html: h,
        source: { text: 'Geonergy product catalogue', href: 'store.html', label: 'the Store' },
        chips: ['Build a quote', 'What size do I need?']
      };
    });
  }

  // ---------------------------------------------------------------
  // COMPARISONS
  // "X vs Y" is the question people actually arrive with. Each table below
  // compares like with like on the same rows, so the two columns line up
  // and the difference is readable rather than two paragraphs to hold in
  // your head. Figures are the same ones the rest of this file quotes.
  // ---------------------------------------------------------------
  const BATTERIES = {
    lithium: {
      name: 'Lithium (LiFePO4)', k: 'lithium lifepo4 lfp li-ion ion',
      rows: {
        'Cycle life': '6,000+ cycles, 8 to 10 years in daily use',
        'Usable capacity': 'About 90% of the rated kWh',
        'Charging': 'Takes a fast charge - fills in the hours of good sun',
        'Maintenance': 'None. Sealed, no watering',
        'Weight and space': 'Roughly a third the weight for the same usable kWh',
        'Heat': 'Tolerates Nigerian ambient well; BMS protects it',
        'Up-front cost': 'Highest',
        'Cost per year': 'Usually the lowest, because it lasts and you use more of it'
      }
    },
    tubular: {
      name: 'Tubular lead-acid', k: 'tubular lead acid wet flooded battery',
      rows: {
        'Cycle life': '1,000 to 1,500 cycles, 3 to 5 years in daily use',
        'Usable capacity': 'About 50% if you want it to reach that life',
        'Charging': 'Slower, and it needs to reach full regularly or it sulphates',
        'Maintenance': 'Top up with distilled water; keep terminals clean',
        'Weight and space': 'Heavy, and needs a ventilated space - it gases when charging',
        'Heat': 'Heat shortens its life noticeably',
        'Up-front cost': 'Lower',
        'Cost per year': 'Often higher once you count replacing it'
      }
    },
    gel: {
      name: 'Gel / AGM (sealed lead-acid)', k: 'gel agm sealed vrla',
      rows: {
        'Cycle life': '500 to 1,200 cycles depending on how deep you go',
        'Usable capacity': 'About 50%, same as tubular',
        'Charging': 'Fussy about charge voltage - set it from the manual or you cook it',
        'Maintenance': 'Sealed, no watering',
        'Weight and space': 'Heavy, but no watering and less gassing',
        'Heat': 'Heat sensitive',
        'Up-front cost': 'Between tubular and lithium',
        'Cost per year': 'Middling - the convenience costs you cycles'
      }
    },
    verdict: 'For a home that cycles the battery every single day, lithium almost always wins on cost per year even though it costs more on the day. Tubular still makes sense for a standby system that rarely discharges, or where the up-front figure is the binding constraint. Gel sits in between and is mostly chosen when the battery has to live somewhere unventilated.'
  };

  const INV_TYPES = {
    hybrid: {
      name: 'Hybrid', k: 'hybrid',
      rows: {
        'Battery': 'Yes - solar, battery and grid all work together',
        'When the grid fails': 'Keeps running off battery and solar',
        'Solar use': 'Charges the battery and carries the load at the same time',
        'You control': 'Priority - solar first, grid first or battery first',
        'Generator': 'Usually accepted on the AC input, in GEN mode',
        'Fits': 'Most Nigerian homes and businesses'
      }
    },
    'off-grid': {
      name: 'Off-grid', k: 'off grid offgrid standalone',
      rows: {
        'Battery': 'Yes - required. Everything runs through it',
        'When the grid fails': 'No difference; it was never carrying your load',
        'Solar use': 'Charges the battery; loads are fed from the battery',
        'You control': 'Charge source - solar only, or solar plus mains',
        'Generator': 'Can charge the battery, cannot feed loads directly',
        'Fits': 'Sites with no grid at all, or where the grid is barely there'
      }
    },
    'grid-tie': {
      name: 'Grid-tie', k: 'grid tie gridtie on-grid ongrid net',
      rows: {
        'Battery': 'None',
        'When the grid fails': 'Shuts down - by design, to protect line workers',
        'Solar use': 'Feeds your load and exports the surplus',
        'You control': 'Very little; it follows the grid',
        'Generator': 'Not applicable',
        'Fits': 'Places that pay you for export. Little use in Nigeria'
      }
    },
    verdict: 'In Nigeria the question is almost always hybrid versus off-grid, and hybrid wins wherever there is any grid at all, because mains can top the battery up on a run of dull days. Grid-tie is the one to rule out: when NEPA goes, so does a grid-tie inverter, which is the opposite of what you bought solar for.'
  };

  const CONTROLLERS = {
    mppt: {
      name: 'MPPT', k: 'mppt maximum power point tracking',
      rows: {
        'How it works': 'Tracks the panel’s best operating point and converts surplus voltage into charging current',
        'Typical harvest': '20 to 30% more from the same panels',
        'Panel wiring': 'Series strings at high voltage are fine',
        'Cable': 'Thinner cable over a long run, because current is lower',
        'Cost': 'Higher',
        'Use it': 'Everything Geonergy sizes for a home'
      }
    },
    pwm: {
      name: 'PWM', k: 'pwm pulse width',
      rows: {
        'How it works': 'Connects the panel to the battery and throws the voltage difference away',
        'Typical harvest': 'Baseline - you lose the surplus',
        'Panel wiring': 'Panel voltage must match the battery class',
        'Cable': 'Thicker cable, because current is higher',
        'Cost': 'Lower',
        'Use it': 'Small, cheap, short-run systems only'
      }
    },
    verdict: 'On anything above a couple of panels the extra harvest pays for the controller quickly, which is why every system here uses MPPT.'
  };

  const VOLTAGES = {
    '12v': { name: '12 V', k: '12v 12 volt twelve',
      rows: { 'Typical size': 'Up to about 1.5 kVA', 'Current for the same power': 'Highest - four times a 48 V system',
        'Cable': 'Thickest, and short runs only', 'Losses and heat': 'Highest', 'Expansion': 'Limited' } },
    '24v': { name: '24 V', k: '24v 24 volt twenty-four',
      rows: { 'Typical size': 'About 2 to 5 kVA', 'Current for the same power': 'Half of 12 V',
        'Cable': 'Moderate', 'Losses and heat': 'Moderate', 'Expansion': 'Reasonable' } },
    '48v': { name: '48 V', k: '48v 48 volt forty-eight',
      rows: { 'Typical size': '5 kVA and up', 'Current for the same power': 'Lowest - a quarter of 12 V',
        'Cable': 'Thinnest for the same power', 'Losses and heat': 'Lowest', 'Expansion': 'Best - most stackable batteries are 48 V' } },
    verdict: 'The voltage class follows the size of the system rather than being a choice you make on its own. It matters for settings too: a 21 V cut-off is right on a 24 V machine and meaningless on a 12 V one, so always take voltages from the manual for your own battery class.'
  };

  const TABLES = [BATTERIES, INV_TYPES, CONTROLLERS, VOLTAGES];

  // The whole brand list the site shows, not only the ones with code tables.
  // Brands the site knows about at all - the store, the logo band or the
  // manuals on file. Not the same list as the code tables: Cworth has a
  // product in the store but no manual, and a comparison can still say so.
  const BRAND_NAMES = ['Deye', 'Growatt', 'Sunsynk', 'Felicity', 'MUST', 'Haisic', 'itel', 'SRNE', 'Cworth', 'JinkoSolar'];

  function splitVersus(t) {
    const m = t.match(/^(?:what(?:’s|s)? (?:is )?the )?(?:difference between |compare |which is better,? )?(.+?)\s+(?:vs\.?|versus|or|against|compared to|compared with|and)\s+(.+?)[?.!]*$/);
    if (!m) return null;
    const strip = x => x.replace(/^(the |a |an )/, '')
      .replace(/\b(battery|batteries|inverter|inverters|inverter type|system|systems|panel|panels|which|better|best|good)\b$/,'')
      .trim();
    const a = strip(m[1]), b = strip(m[2]);
    if (!a || !b || a === b) return null;
    return [a, b];
  }

  function fromTable(term) {
    for (let i = 0; i < TABLES.length; i++) {
      const tb = TABLES[i];
      const keys = Object.keys(tb).filter(k => k !== 'verdict');
      for (let j = 0; j < keys.length; j++) {
        const opt = tb[keys[j]];
        const m = score(words(term), opt.k);
        if (m.s >= 3) return { kind: 'table', table: tb, opt: opt };
      }
    }
    return null;
  }

  function fromBrand(term) {
    const w = term.toLowerCase().replace(/[^a-z0-9 ]/g, ' ').trim();
    for (let i = 0; i < BRAND_NAMES.length; i++) {
      const n = BRAND_NAMES[i].toLowerCase();
      if (w === n || new RegExp('\\b' + n + '\\b').test(w)) return { kind: 'brand', name: BRAND_NAMES[i] };
    }
    return null;
  }

  // Product matching gets its own tokeniser rather than reusing the KB one:
  // the size IS the name here ("Haisic 1.5" and "Haisic 4.2" are different
  // machines), and the general matcher drops single digits as noise.
  function fromProduct(term, list) {
    if (!list) return null;
    const toks = term.toLowerCase().split(/[^a-z0-9.]+/).filter(Boolean);
    let top = null, best = 0;
    list.forEach(p => {
      const names = p.name.toLowerCase().split(/[^a-z0-9.]+/).filter(Boolean);
      let s = 0;
      toks.forEach(w => { if (names.indexOf(w) >= 0) s += /^[0-9]/.test(w) ? 4 : 3; });
      if (toks.indexOf(String(p.kva)) >= 0) s += 4;
      if (s > best) { best = s; top = p; }
    });
    // 6 means at least a name word plus a number, or two name words - one
    // brand word alone must not resolve to whichever model is listed first.
    return best >= 6 ? { kind: 'product', product: top } : null;
  }

  function cmpTable(title, cols, rows, verdict) {
    let h = '<div class="ai-cmp"><div class="ai-cmp-head"><span>' + esc(cols[0]) + '</span><span>' + esc(cols[1]) + '</span></div>';
    rows.forEach(r => {
      h += '<div class="ai-cmp-row"><div class="ai-cmp-key">' + esc(r[0]) + '</div>' +
        '<div class="ai-cmp-vals"><span>' + esc(r[1]) + '</span><span>' + esc(r[2]) + '</span></div></div>';
    });
    h += '</div>';
    if (verdict) h += '<p><strong>Which one:</strong> ' + esc(verdict) + '</p>';
    return (title ? '<p>' + esc(title) + '</p>' : '') + h;
  }

  function compareTables(a, b) {
    if (a.table !== b.table || a.opt === b.opt) return null;
    const keys = Object.keys(a.opt.rows);
    const rows = keys.map(k => [k, a.opt.rows[k], b.opt.rows[k] || '—']);
    return {
      html: cmpTable(null, [a.opt.name, b.opt.name], rows, a.table.verdict),
      source: { text: HOUSE },
      chips: ['Build a quote', 'What size do I need?']
    };
  }

  // Spec rows worth putting side by side first, when both products carry them.
  const SPEC_ORDER = ['Rated output', 'Continuous output', 'Rated energy', 'Inverter capacity', 'Waveform',
    'Surge capacity', 'Surge power', 'Peak power', 'System voltage', 'Battery', 'Battery capacity',
    'Battery chemistry', 'Usable energy', 'Battery lifespan', 'Panels included', 'Solar input',
    'Expandable', 'Expandable to', 'Warranty'];

  function compareProducts(a, b) {
    const pa = a.product, pb = b.product;
    const rows = [['Size', pa.kva + ' kVA', pb.kva + ' kVA']];
    const sa = pa.specs || {}, sb = pb.specs || {};
    const both = Object.keys(sa).filter(k => sb[k] != null);
    const ordered = SPEC_ORDER.filter(k => both.indexOf(k) >= 0)
      .concat(both.filter(k => SPEC_ORDER.indexOf(k) < 0));
    ordered.slice(0, 8).forEach(k => rows.push([k, String(sa[k]), String(sb[k])]));
    const bigger = pa.kva === pb.kva ? null : (pa.kva > pb.kva ? pa : pb);
    const smaller = bigger === pa ? pb : pa;
    const verdict = bigger
      ? 'The ' + bigger.name + ' runs more at once and for longer; the ' + smaller.name +
        ' is the right buy if your load genuinely fits inside it, because paying for capacity you never draw is money sitting on the wall. Build a load list below and the arithmetic will tell you which side of that line you are on.'
      : 'Same size class, so the choice comes down to the battery, the panels and what is in the box rather than the inverter rating. Send your load list over and we will say which suits your site.';
    return {
      html: cmpTable('Side by side:', [pa.name, pb.name], rows, verdict),
      source: { text: 'Geonergy product catalogue', href: 'store.html', label: 'both are on the Store page' },
      chips: ['Build a quote', 'What size do I need?']
    };
  }

  function brandFacts(name, data, list) {
    const key = name.toLowerCase();
    const models = (data && data[key] && data[key].models) || [];
    const withCodes = models.filter(m => (m.faultCodes || []).length || (m.warnCodes || []).length);
    const withPrograms = models.filter(m => (m.settingsCodes || []).length);
    const stocked = (list || []).filter(p => new RegExp('\\b' + key + '\\b', 'i').test(p.name));
    const cats = [];
    models.forEach(m => { if (m.category && cats.indexOf(m.category) < 0) cats.push(m.category); });
    return {
      'In the Geonergy store': stocked.length
        ? stocked.map(p => p.name + ' (' + p.kva + ' kVA)').join(', ')
        : 'Nothing listed right now - ask us what is in',
      'Types Geonergy documents': cats.length ? cats.join(', ') : 'Not recorded here yet',
      'Manuals on file': models.length ? models.map(m => m.name).join(', ') : 'None yet',
      'Fault and warning codes here': withCodes.length ? withCodes.length + ' model' + (withCodes.length > 1 ? 's' : '') : 'Not yet',
      'Programming tables here': withPrograms.length ? withPrograms.length + ' model' + (withPrograms.length > 1 ? 's' : '') : 'Not yet'
    };
  }

  function compareBrands(a, b) {
    return Promise.all([inverterData(), products()]).then(res => {
      const fa = brandFacts(a.name, res[0], res[1]);
      const fb = brandFacts(b.name, res[0], res[1]);
      const rows = Object.keys(fa).map(k => [k, fa[k], fb[k]]);
      const verdict = 'Geonergy will not tell you one badge beats another, because the honest answer is that a well-sized ' +
        a.name + ' beats a badly sized ' + b.name + ' and the other way round. What actually decides whether you are happy in ' +
        'three years is sizing, installation quality, whether parts and support exist near you, and the warranty you can ' +
        'hold somebody to. Tell us what you run and we will recommend a specific unit and say why.';
      return {
        html: '<p>Here is what this site actually holds on each - facts, not a verdict:</p>' +
          cmpTable(null, [a.name, b.name], rows, verdict),
        sources: [{ title: 'Geonergy catalogue and the manuals on file' }, { title: 'the Inverter page', url: 'inverter.html' }],
        ask: true,
        chips: ['Build a quote', 'What size do I need?']
      };
    });
  }

  function mixed(a, b) {
    const label = x => x.kind === 'brand' ? x.name : (x.kind === 'product' ? x.product.name : x.opt.name);
    return {
      html: '<p>Those two are not the same kind of thing - ' + esc(label(a)) + ' and ' + esc(label(b)) +
        ' are not measured on the same rows, so a straight table would be misleading.</p>' +
        '<p>Ask me either a like-for-like comparison - two batteries, two systems, two brands - or tell me what you want to run and I will size it.</p>',
      chips: ['Lithium vs tubular', 'Hybrid vs off-grid', 'Build a quote']
    };
  }

  // "Deye 6 kVA Hybrid vs Felicity 8 kVA Hybrid" contains the word hybrid
  // twice, so a plain keyword match would compare inverter types and answer
  // a question nobody asked. A model number means they mean the machine.
  // A bare voltage ("48v") is not a model number.
  const looksLikeModel = t => /\d/.test(t) && !/^\d+\s*v(olts?)?$/.test(t.trim());

  function comparison(t) {
    const pair = splitVersus(t);
    if (!pair) return Promise.resolve(null);
    const named = looksLikeModel(pair[0]) || looksLikeModel(pair[1]);
    const tA = fromTable(pair[0]), tB = fromTable(pair[1]);
    if (!named && tA && tB && tA.opt !== tB.opt) {
      return Promise.resolve(compareTables(tA, tB) || mixed(tA, tB));
    }
    const bA = fromBrand(pair[0]), bB = fromBrand(pair[1]);
    if (!named && bA && bB) return compareBrands(bA, bB);
    return products().then(list => {
      const pA = fromProduct(pair[0], list) || bA || tA;
      const pB = fromProduct(pair[1], list) || bB || tB;
      if (!pA || !pB) return null;
      if (pA.kind === 'product' && pB.kind === 'product') {
        return pA.product === pB.product ? null : compareProducts(pA, pB);
      }
      if (pA.kind === 'brand' && pB.kind === 'brand') return compareBrands(pA, pB);
      if (pA.kind === 'table' && pB.kind === 'table') return compareTables(pA, pB) || mixed(pA, pB);
      return mixed(pA, pB);
    });
  }

  // ---------------------------------------------------------------
  // WEB LOOKUP
  // ---------------------------------------------------------------
  function fetchJSON(url) {
    // AbortController so a slow network does not leave the panel thinking
    // forever on a phone with one bar.
    let ctl = null, timer = null;
    try {
      ctl = new AbortController();
      timer = setTimeout(() => ctl.abort(), WEB_TIMEOUT);
    } catch (e) { ctl = null; }
    return fetch(url, { headers: { Accept: 'application/json' }, signal: ctl ? ctl.signal : undefined })
      .then(r => (r.ok ? r.json() : null))
      .catch(() => null)
      .then(j => { if (timer) clearTimeout(timer); return j; });
  }

  // What to actually search for. The question as typed is a bad query - "so
  // what exactly is an mppt charge controller then" searches badly. Keep the
  // content words, and keep "solar" in the mix so a generic word lands on the
  // energy article rather than something else entirely.
  function webQuery(qw) {
    const terms = qw.filter(w => w.length > 2).slice(0, 6);
    if (!terms.length) return null;
    const solarish = /solar|inverter|battery|panel|photovoltaic|charge|watt|volt|energy|grid/.test(terms.join(' '));
    return (solarish ? terms : terms.concat(['solar'])).join(' ');
  }

  // Handful of entities the JSON APIs hand back in titles.
  const unent = t => String(t || '')
    .replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&apos;/g, "'")
    .replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&');

  // ---------------------------------------------------------------
  // THE SOURCES
  // Each one is tried on its own and any that fails - blocked, offline,
  // rate-limited, or simply not answering - drops out without taking the
  // others with it. That matters because a browser can only read a site
  // that allows cross-origin requests, and which sites do that is not
  // something this file can promise on anyone else's behalf.
  //
  // Prose is taken from the first source in this order that returns any.
  // Everything else contributes links.
  // ---------------------------------------------------------------
  const WEB_SOURCES = [
    {
      id: 'wikipedia',
      // Two calls: find the article, then read its summary.
      run: q => fetchJSON(WIKI_SEARCH + encodeURIComponent(q)).then(res => {
        const pages = (res && res.pages) || [];
        if (!pages.length) return null;
        return fetchJSON(WIKI_PAGE + encodeURIComponent(pages[0].key)).then(sum => {
          const text = sum && sum.extract;
          if (!text || text.length < 80) return null;
          return {
            prose: text,
            title: 'Wikipedia: ' + (sum.title || pages[0].title),
            url: (sum.content_urls && sum.content_urls.desktop && sum.content_urls.desktop.page) ||
              'https://en.wikipedia.org/wiki/' + encodeURIComponent(pages[0].key),
            links: pages.slice(1, 3).map(p => ({
              title: 'Wikipedia: ' + p.title,
              url: 'https://en.wikipedia.org/wiki/' + encodeURIComponent(p.key)
            }))
          };
        });
      })
    },
    {
      id: 'duckduckgo',
      // Its instant answers are drawn from whichever site DuckDuckGo judged
      // authoritative, so this is the one that reaches past Wikipedia. It
      // names that site, and so do we.
      run: q => fetchJSON(DDG_API + encodeURIComponent(q)).then(j => {
        if (!j) return null;
        const text = j.AbstractText || '';
        const links = (j.RelatedTopics || [])
          .filter(t => t && t.FirstURL && t.Text)
          .slice(0, 3)
          .map(t => ({ title: unent(t.Text).split(' - ')[0], url: t.FirstURL }));
        if (!text || text.length < 80) return links.length ? { links: links } : null;
        return {
          prose: text,
          title: (j.AbstractSource || 'DuckDuckGo') + (j.Heading ? ': ' + j.Heading : ''),
          url: j.AbstractURL || null,
          links: links
        };
      })
    },
    {
      id: 'stackexchange',
      run: q => fetchJSON(SE_API + encodeURIComponent(q)).then(j => {
        const items = (j && j.items) || [];
        const links = items
          .filter(it => it.is_answered && it.link && it.title)
          .slice(0, 3)
          .map(it => ({ title: unent(it.title), url: it.link, note: 'Electrical Engineering Stack Exchange' }));
        return links.length ? { links: links } : null;
      })
    }
  ];

  // Always available, because they need no API at all: if every source above
  // is unreachable, these still put the customer in front of the search.
  function searchLinks(q) {
    const e = encodeURIComponent(q);
    return [
      { title: 'Search Wikipedia for this', url: 'https://en.wikipedia.org/w/index.php?search=' + e },
      { title: 'Search the web for this', url: 'https://duckduckgo.com/?q=' + e },
      { title: 'Search Electrical Engineering Stack Exchange', url: 'https://electronics.stackexchange.com/search?q=' + e }
    ];
  }

  function webLookup(q, qw) {
    if (!WEB_LOOKUP || !global.fetch) return Promise.resolve(null);
    const lower = q.toLowerCase();
    if (WEB_NEVER.test(lower) || !WEB_TOPIC.test(lower)) return Promise.resolve(null);
    const query = webQuery(qw);
    if (!query) return Promise.resolve(null);

    // All at once. One slow or dead source must not hold up the rest, and
    // each already carries its own timeout.
    return Promise.all(WEB_SOURCES.map(src =>
      Promise.resolve().then(src.run.bind(null, query)).catch(() => null)
    )).then(results => {
      let prose = null;
      const links = [];
      results.forEach(r => {
        if (!r) return;
        if (!prose && r.prose) prose = r;
        (r.links || []).forEach(l => {
          if (links.length < 4 && !links.some(x => x.url === l.url)) links.push(l);
        });
      });
      if (!prose && !links.length) return null;

      let h = '<p>Geonergy’s own guidance does not cover that, so I went and looked it up. ' +
        'This is general background from the web, not Geonergy’s advice about your system:</p>';
      if (prose) {
        const text = prose.prose.length > 700
          ? prose.prose.slice(0, 700).replace(/\s+\S*$/, '') + '…'
          : prose.prose;
        h += '<p>' + esc(text) + '</p>';
      } else {
        h += '<p>I could not get a plain answer out of it, but these look like the right places to read:</p>';
      }
      if (links.length) {
        h += '<p><strong>Also worth reading</strong></p><ul>' +
          links.map(l => '<li><a href="' + esc(l.url) + '" target="_blank" rel="noopener noreferrer">' +
            esc(l.title) + '</a>' + (l.note ? ' <em>' + esc(l.note) + '</em>' : '') + '</li>').join('') +
          '</ul>';
      }
      h += '<p>If it touches what you actually run, message us - a general article does not know your ' +
        'battery class, your roof or your cable runs.</p>';

      const sources = [];
      if (prose) sources.push({ title: prose.title, url: prose.url || undefined });
      sources.push(searchLinks(query)[1]);
      return { html: h, sources: sources, ask: true, chips: ['Build a quote', 'What size do I need?'] };
    });
  }

  // ---------------------------------------------------------------
  // ROUTING
  // ---------------------------------------------------------------
  function localAnswer(q, qw) {
    const hit = bestKB(qw);
    if (hit.entry && confident(hit.match)) {
      return {
        html: hit.entry.a,
        source: { text: HOUSE },
        chips: followUps(hit.entry.id)
      };
    }
    return null;
  }

  function followUps(id) {
    const map = {
      'sizing-inverter': ['Build a quote', 'How many panels?'],
      'sizing-battery': ['Lithium vs tubular', 'Build a quote'],
      'battery-type': ['Lithium vs tubular', 'How long do batteries last?'],
      types: ['Hybrid vs off-grid', 'Build a quote'],
      mppt: ['MPPT vs PWM'],
      voltage: ['24V vs 48V'],
      beep: ['My inverter shows fault 01', 'Contact Geonergy'],
      'backup-short': ['Why are my panels not charging?'],
      'not-charging': ['Contact Geonergy'],
      cost: ['Build a quote'],
      ac: ['What size inverter for an AC?', 'Build a quote']
    };
    return map[id] || ['Build a quote', 'What size do I need?'];
  }

  function remoteAnswer(q) {
    if (!ASSISTANT_ENDPOINT) return Promise.resolve(null);
    return fetch(ASSISTANT_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ question: q, context: 'Geonergy solar, Nigeria' })
    })
      .then(r => (r.ok ? r.json() : null))
      .then(j => {
        if (!j || !j.answer) return null;
        return {
          html: '<p>' + esc(j.answer).replace(/\n{2,}/g, '</p><p>').replace(/\n/g, '<br>') + '</p>',
          sources: Array.isArray(j.sources) ? j.sources.slice(0, 4) : null,
          chips: ['Build a quote', 'Contact Geonergy']
        };
      })
      .catch(() => null);
  }

  function unknown(qw) {
    const refs = refsFor(qw);
    let h = '<p>I do not have a reliable answer to that one, and guessing about somebody’s electrical system is not worth it.</p>' +
      '<p>Geonergy will answer it properly on WhatsApp - describe your setup and someone who installs these every week will reply.</p>';
    const out = refs.concat(qw.length ? searchLinks(qw.join(' ')) : []);
    if (out.length) {
      h += '<p>If you would rather go and look yourself:</p><ul>' +
        out.map(r => '<li><a href="' + esc(r.url) + '" target="_blank" rel="noopener noreferrer">' + esc(r.title) + '</a></li>').join('') +
        '</ul>';
    }
    return { html: h, ask: true, chips: ['Build a quote', 'What size do I need?'] };
  }

  // Local first, then a hosted model if one is configured, then the open web,
  // then WhatsApp. Never the other way round: the manuals and the house
  // guidance are better than an encyclopedia on every question they cover.
  function beyondLocal(q, qw) {
    return remoteAnswer(q)
      .then(x => x || webLookup(q, qw))
      .then(x => x || unknown(qw));
  }

  function route(q) {
    const t = q.toLowerCase();
    const qw = words(q);
    if (/\bquote\b|quotation|load list|build.*load|size (?:my|me)\b|work out my/.test(t)) {
      return Promise.resolve({ quote: true });
    }
    if (/whatsapp|contact|call you|reach you|speak to (?:someone|a human)|talk to/.test(t)) {
      return Promise.resolve({
        html: '<p>Tap below and it opens WhatsApp with Geonergy. Say what you are running and roughly where you are, and you will get a real answer rather than a brochure.</p>',
        ask: true, chips: ['Build a quote']
      });
    }
    // A comparison is checked before the code lookup: "deye vs growatt" is
    // full of brand words and no code at all.
    return comparison(t).then(cmp => {
      if (cmp) return cmp;
      const cq = codeQuery(t);
      return (cq ? lookupCode(cq) : Promise.resolve(null)).then(r => {
        if (r) return r;
        if (/product|catalogue|catalog|what do you sell|in stock|available|which.*(?:buy|stock)|do(?:es)? (?:you|geonergy|they) (?:have|stock|sell)|got a\b/.test(t)) {
          return productAnswer(t, qw).then(p => p || localAnswer(q, qw) || beyondLocal(q, qw));
        }
        const local = localAnswer(q, qw);
        if (local) return local;
        return beyondLocal(q, qw);
      });
    });
  }

  // ---------------------------------------------------------------
  // QUOTE BUILDER
  // Loads, then sizes, then WhatsApp. No prices anywhere - the site does not
  // carry them, and a real quote is per site.
  // ---------------------------------------------------------------
  const qty = LOADS.map(() => 0);
  let hours = 6;

  function sizeUp(run, surge) {
    // Continuous need with 25% headroom, at 0.8 power factor. Surge is a
    // separate test, and the one people forget: allow only 1.5x the rating
    // for the moment a motor starts. Machines claim two or three times that,
    // but they claim it cold, at sea level, on a full battery - and an
    // inverter that carries the running load yet trips every time the
    // compressor kicks in is the complaint we actually get.
    const byRun = (run * 1.25) / 0.8;
    const bySurge = surge / 0.8 / 1.5;
    const need = Math.max(byRun, bySurge) / 1000;
    for (let i = 0; i < LADDER.length; i++) if (LADDER[i] >= need) return { kva: LADDER[i], need: need };
    return { kva: LADDER[LADDER.length - 1], need: need, over: true };
  }

  function quoteTotals() {
    let run = 0, surge = 0, peakOne = 0;
    LOADS.forEach((l, i) => {
      if (!qty[i]) return;
      run += l[1] * qty[i];
      peakOne = Math.max(peakOne, l[2] - l[1]);
    });
    // Everything running, plus the single largest start on top of it - two
    // motors starting at the same instant is rare, sizing for all of them is
    // how you end up selling somebody twice the inverter they need.
    surge = run + peakOne;
    const s = sizeUp(run, surge);
    const kwh = (run * hours) / 1000;
    return { run: run, surge: surge, kva: s.kva, need: s.need, over: s.over, kwh: kwh, lith: kwh / 0.9, tub: kwh / 0.5 };
  }

  function quoteText() {
    const t = quoteTotals();
    const lines = ['Hello Geonergy, I would like a formal quote.', '', 'What I want to run:'];
    LOADS.forEach((l, i) => { if (qty[i]) lines.push('- ' + qty[i] + ' x ' + l[0] + ' (' + l[1] + 'W each)'); });
    lines.push('', 'Running load: ' + Math.round(t.run) + 'W',
      'Allowing for start-up: about ' + Math.round(t.surge) + 'W',
      'Backup wanted: ' + hours + ' hours',
      'Suggested inverter: ' + t.kva + ' kVA',
      'Suggested battery: about ' + t.lith.toFixed(1) + ' kWh lithium',
      '', 'Please send me a PDF quote. My location: ');
    return lines.join('\n');
  }

  const waLink = text => 'https://wa.me/' + WHATSAPP_NUMBER + '?text=' + encodeURIComponent(text);

  function quoteNode() {
    const wrap = el('div', 'ai-quote');
    wrap.innerHTML = '<h4>What do you want to run?</h4><div class="ai-loads"></div>' +
      '<div class="ai-load ai-hours"><span>Backup wanted</span><em>hours</em>' +
      '<span class="ai-stepper"><button type="button" data-h="-1" aria-label="Fewer hours">−</button>' +
      '<output>' + hours + '</output>' +
      '<button type="button" data-h="1" aria-label="More hours">+</button></span></div>' +
      '<div class="ai-sum"></div>';
    const rows = $('.ai-loads', wrap);
    LOADS.forEach((l, i) => {
      const r = el('div', 'ai-load');
      r.innerHTML = '<span>' + esc(l[0]) + '</span><em>' + l[1] + ' W</em>' +
        '<span class="ai-stepper"><button type="button" data-i="' + i + '" data-d="-1" aria-label="One fewer ' + esc(l[0]) + '">−</button>' +
        '<output>' + qty[i] + '</output>' +
        '<button type="button" data-i="' + i + '" data-d="1" aria-label="One more ' + esc(l[0]) + '">+</button></span>';
      rows.appendChild(r);
    });

    function paint() {
      const t = quoteTotals();
      const any = qty.some(n => n > 0);
      const sum = $('.ai-sum', wrap);
      if (!any) {
        sum.innerHTML = '<p class="ai-note">Add what you run and I will size it as we go.</p>';
        return;
      }
      sum.innerHTML =
        '<div class="ai-total"><span>Running load</span><strong>' + Math.round(t.run) + ' W</strong></div>' +
        '<div class="ai-total"><span>With the largest start-up</span><strong>' + Math.round(t.surge) + ' W</strong></div>' +
        '<div class="ai-total"><span>Inverter</span><strong>' + t.kva + ' kVA</strong></div>' +
        '<div class="ai-total"><span>Battery for ' + hours + ' h</span><strong>' + t.lith.toFixed(1) + ' kWh</strong></div>' +
        '<p class="ai-note">' + (t.over
          ? 'That is past a single ' + LADDER[LADDER.length - 1] + ' kVA unit - it wants inverters in parallel, which Geonergy designs rather than sizes off a list. '
          : '') +
        'Battery figure is lithium at 90% usable; on tubular you would need about ' + t.tub.toFixed(1) + ' kWh of nameplate to get the same hours. ' +
        'This is a starting point for a conversation, not a design - the real number depends on your roof, your cable runs and how hard you cycle it.</p>' +
        '<a class="ai-cta" href="' + esc(waLink(quoteText())) + '" target="_blank" rel="noopener noreferrer">' +
        svg(ICON.wa) + 'Send this to Geonergy for a PDF quote</a>';
    }

    wrap.addEventListener('click', e => {
      const b = e.target.closest('button');
      if (!b) return;
      if (b.dataset.h) {
        hours = Math.min(24, Math.max(1, hours + parseInt(b.dataset.h, 10)));
        b.parentNode.querySelector('output').textContent = hours;
      } else if (b.dataset.i) {
        const i = parseInt(b.dataset.i, 10);
        qty[i] = Math.max(0, qty[i] + parseInt(b.dataset.d, 10));
        b.parentNode.querySelector('output').textContent = qty[i];
      } else {
        return;
      }
      paint();
      log.scrollTop = log.scrollHeight;
    });
    paint();
    return wrap;
  }

  // ---------------------------------------------------------------
  // PANEL
  // ---------------------------------------------------------------
  let launcher, scrim, panel, log, input, sendBtn, micBtn, speakBtn;
  let built = false, speakOn = false, recog = null, listening = false;

  const GREET = 'Ask me about solar, inverters, batteries, installation or a fault on your screen. ' +
    'I answer from Geonergy’s own guidance and from the manufacturers’ manuals, and I say where each answer came from.';

  function addYou(text) {
    const n = el('div', 'ai-msg you', esc(text));
    log.appendChild(n);
    log.scrollTop = log.scrollHeight;
    return n;
  }

  function addTyping() {
    const n = el('div', 'ai-msg ai', '<span class="ai-typing" role="status" aria-label="Thinking"><i></i><i></i><i></i></span>');
    log.appendChild(n);
    log.scrollTop = log.scrollHeight;
    return n;
  }

  function sourceLine(res) {
    if (res.sources && res.sources.length) {
      return '<div class="ai-src">' + svg(ICON.book) + '<span>Sources: ' +
        res.sources.map(s => s.url
          ? '<a href="' + esc(s.url) + '"' + (/^https?:/.test(s.url) ? ' target="_blank" rel="noopener noreferrer"' : '') +
            '>' + esc(s.title || s.url) + '</a>'
          : esc(s.title || '')).join(', ') + '</span></div>';
    }
    if (!res.source) return '';
    const s = res.source;
    return '<div class="ai-src">' + svg(ICON.book) + '<span>' + esc(s.text) +
      (s.href ? ' &middot; <a href="' + esc(s.href) + '">' + esc(s.label || 'read it here') + '</a>' : '') +
      '</span></div>';
  }

  function addAI(res) {
    const n = el('div', 'ai-msg ai');
    if (res.html) n.innerHTML = res.html;
    if (res.quote) {
      n.appendChild(el('p', null, 'Add what you want to run at the same time. I will size the inverter for the start-up as well as the running watts, then you can send the list straight to Geonergy.'));
      n.appendChild(quoteNode());
    }
    n.insertAdjacentHTML('beforeend', sourceLine(res));
    if (res.ask) {
      n.insertAdjacentHTML('beforeend',
        '<a class="ai-cta" href="' + esc(waLink('Hello Geonergy, I have a question about a solar system.')) +
        '" target="_blank" rel="noopener noreferrer">' + svg(ICON.wa) + 'Message Geonergy on WhatsApp</a>');
    }
    if (res.chips && res.chips.length) {
      const c = el('div', 'ai-chips');
      res.chips.forEach(t => {
        const b = el('button', 'ai-chip', esc(t));
        b.type = 'button';
        b.addEventListener('click', () => { c.remove(); ask(t); });
        c.appendChild(b);
      });
      n.appendChild(c);
    }
    log.appendChild(n);
    log.scrollTop = log.scrollHeight;
    if (speakOn) speak(n);
    return n;
  }

  function ask(q) {
    q = String(q || '').trim();
    if (!q) return;
    addYou(q);
    const t = addTyping();
    // A beat before the answer: instant replies to a typed question read as
    // canned, and the panel is doing real work behind this.
    const started = Date.now();
    route(q).catch(() => unknown(words(q))).then(res => {
      const wait = Math.max(0, 320 - (Date.now() - started));
      setTimeout(() => { t.remove(); addAI(res || unknown(words(q))); }, wait);
    });
  }

  // ---- voice out
  function speak(node) {
    if (!global.speechSynthesis) return;
    const clone = node.cloneNode(true);
    Array.prototype.forEach.call(clone.querySelectorAll('.ai-chips, .ai-quote, .ai-cta, svg'), x => x.remove());
    const text = (clone.textContent || '').replace(/\s+/g, ' ').trim();
    if (!text) return;
    try {
      global.speechSynthesis.cancel();
      const u = new global.SpeechSynthesisUtterance(text);
      u.rate = 1;
      u.lang = 'en-GB';
      global.speechSynthesis.speak(u);
    } catch (e) { /* no voice on this device - silence is fine */ }
  }

  function toggleSpeak() {
    speakOn = !speakOn;
    speakBtn.classList.toggle('on', speakOn);
    speakBtn.innerHTML = svg(speakOn ? ICON.sound : ICON.mute);
    speakBtn.setAttribute('aria-pressed', speakOn ? 'true' : 'false');
    speakBtn.title = speakOn ? 'Reading answers aloud' : 'Read answers aloud';
    if (!speakOn && global.speechSynthesis) global.speechSynthesis.cancel();
    else if (speakOn) {
      const last = log.querySelector('.ai-msg.ai:last-child');
      if (last) speak(last);
    }
  }

  // ---- voice in
  function initMic() {
    const SR = global.SpeechRecognition || global.webkitSpeechRecognition;
    if (!SR) { micBtn.hidden = true; return; }
    recog = new SR();
    recog.continuous = false;
    recog.interimResults = true;
    try { recog.lang = 'en-NG'; } catch (e) { recog.lang = 'en-GB'; }
    let finalText = '';
    recog.onstart = () => {
      listening = true;
      finalText = '';
      micBtn.classList.add('live');
      micBtn.setAttribute('aria-label', 'Stop listening');
    };
    recog.onresult = e => {
      let interim = '';
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const r = e.results[i];
        if (r.isFinal) finalText += r[0].transcript;
        else interim += r[0].transcript;
      }
      input.value = (finalText + interim).trim();
      resize();
    };
    recog.onerror = e => {
      listening = false;
      micBtn.classList.remove('live');
      if (e && (e.error === 'not-allowed' || e.error === 'service-not-allowed')) {
        addAI({ html: '<p>The microphone is blocked for this site. Allow it in your browser settings, or just type - it works the same.</p>' });
      }
    };
    recog.onend = () => {
      listening = false;
      micBtn.classList.remove('live');
      micBtn.setAttribute('aria-label', 'Ask by voice');
      const said = input.value.trim();
      if (said) { input.value = ''; resize(); ask(said); }
    };
    micBtn.addEventListener('click', () => {
      if (listening) { recog.stop(); return; }
      try { recog.start(); } catch (e) { /* already starting */ }
    });
  }

  function resize() {
    input.style.height = 'auto';
    input.style.height = Math.min(110, input.scrollHeight) + 'px';
  }

  function build() {
    if (built) return;
    built = true;

    scrim = el('div', 'ai-scrim');
    scrim.addEventListener('click', close);

    panel = el('aside', 'ai-panel');
    panel.setAttribute('role', 'dialog');
    panel.setAttribute('aria-modal', 'true');
    panel.setAttribute('aria-label', 'Geonergy AI assistant');
    panel.hidden = true;
    panel.innerHTML =
      '<div class="ai-head">' +
        '<span class="ai-head-mark">' + MARK + '</span>' +
        '<span class="ai-head-text"><span class="ai-head-title">Geonergy AI</span>' +
        '<span class="ai-head-sub">Solar, inverters and batteries</span></span>' +
        '<button type="button" class="ai-icon-btn" data-speak aria-pressed="false" title="Read answers aloud">' + svg(ICON.mute) + '</button>' +
        '<button type="button" class="ai-icon-btn" data-close aria-label="Close assistant">' + svg(ICON.close) + '</button>' +
      '</div>' +
      '<div class="ai-log" role="log" aria-live="polite" aria-label="Conversation"></div>' +
      '<form class="ai-foot">' +
        '<div class="ai-row">' +
          '<label class="ai-sr" for="ai-input" hidden>Your question</label>' +
          '<textarea class="ai-input" id="ai-input" rows="1" placeholder="Ask about solar, or a fault code…"></textarea>' +
          '<button type="button" class="ai-mic" aria-label="Ask by voice">' + svg(ICON.mic) + '</button>' +
          '<button type="submit" class="ai-send" aria-label="Send">' + svg(ICON.send) + '</button>' +
        '</div>' +
        '<p class="ai-note">General guidance, not an electrical inspection. Anything on the DC side or inside the unit is work for Geonergy.</p>' +
      '</form>';

    document.body.appendChild(scrim);
    document.body.appendChild(panel);

    log = $('.ai-log', panel);
    input = $('.ai-input', panel);
    sendBtn = $('.ai-send', panel);
    micBtn = $('.ai-mic', panel);
    speakBtn = $('[data-speak]', panel);

    $('[data-close]', panel).addEventListener('click', close);
    speakBtn.addEventListener('click', toggleSpeak);
    if (!global.speechSynthesis) speakBtn.hidden = true;

    $('.ai-foot', panel).addEventListener('submit', e => {
      e.preventDefault();
      const v = input.value.trim();
      if (!v) return;
      input.value = '';
      resize();
      ask(v);
    });
    input.addEventListener('input', resize);
    input.addEventListener('keydown', e => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        sendBtn.click();
      }
    });
    initMic();

    addAI({
      html: '<p>' + GREET + '</p>',
      chips: ['What size inverter do I need?', 'Build a quote', 'Lithium vs tubular', 'Hybrid vs off-grid', 'Why is my inverter beeping?']
    });
  }

  function open() {
    build();
    if (dropHint) dropHint();
    if (launcher) { launcher.classList.remove('is-intro'); launcher.classList.add('is-open'); }
    // Replay the sunrise on the panel's own mark each time it opens. This one
    // is user-initiated, so it cannot nag.
    const mark = $('.ai-head-mark', panel);
    if (mark) { mark.classList.remove('is-rising'); void mark.offsetWidth; mark.classList.add('is-rising'); }
    panel.hidden = false;
    // Next frame, so the transform has a start state to animate from.
    requestAnimationFrame(() => {
      scrim.classList.add('open');
      panel.classList.add('open');
      input.focus();
    });
    document.addEventListener('keydown', onKey);
  }

  function close() {
    if (!built) return;
    if (launcher) launcher.classList.remove('is-open');
    scrim.classList.remove('open');
    panel.classList.remove('open');
    document.removeEventListener('keydown', onKey);
    if (global.speechSynthesis) global.speechSynthesis.cancel();
    if (listening && recog) recog.stop();
    setTimeout(() => { if (!panel.classList.contains('open')) panel.hidden = true; }, 300);
    launcher.focus();
  }

  function onKey(e) { if (e.key === 'Escape') close(); }

  // The button carries no label, so the first time somebody lands on the site
  // it introduces itself: the sun comes up behind the horizon and the ring
  // pulses twice. Once per browser, not once per page - four pages of sunrise
  // would be a nuisance, and a control that keeps waving at you reads as an
  // advert rather than a tool. Storage can throw in a private window or be
  // cleared, and if it does the worst case is somebody sees the sunrise
  // again, so the whole thing is best-effort.
  const SEEN_KEY = 'geonergy.ai.seen';

  let dropHint = null;

  function introduce(btn) {
    let seen = false;
    try { seen = localStorage.getItem(SEEN_KEY) === '1'; } catch (e) { seen = false; }
    if (seen) return;
    try { localStorage.setItem(SEEN_KEY, '1'); } catch (e) { /* nothing to do */ }
    const calm = !!(global.matchMedia && global.matchMedia('(prefers-reduced-motion: reduce)').matches);
    // A beat after the page settles, so it is not lost in the page load.
    setTimeout(() => {
      // The sunrise is decoration and goes when motion is unwelcome. The hint
      // is information - somebody who cannot see the animation needs the words
      // more, not less - so it stays, just without the movement.
      if (!calm) {
        btn.classList.add('is-intro');
        setTimeout(() => btn.classList.remove('is-intro'), 3200);
      }
      hint(btn, calm);
    }, calm ? 500 : 1500);
  }

  // One line, once, beside the button: the only thing that tells a first-time
  // visitor on a phone what the mark is for, since there is no hover there to
  // show the tooltip. It leaves on its own, on the first touch anywhere, on a
  // scroll, or when the panel opens - whichever comes first. Tapping it opens
  // the panel, because it sits inside the button and the click carries.
  function hint(btn, calm) {
    const bubble = el('span', 'ai-hint' + (calm ? ' is-calm' : ''), 'Ask me anything about solar');
    bubble.setAttribute('aria-hidden', 'true');
    btn.appendChild(bubble);
    let gone = false;
    const drop = () => {
      if (gone) return;
      gone = true;
      dropHint = null;
      bubble.classList.remove('show');
      document.removeEventListener('pointerdown', drop, true);
      document.removeEventListener('keydown', drop, true);
      global.removeEventListener('scroll', drop);
      setTimeout(() => { if (bubble.parentNode) bubble.remove(); }, 400);
    };
    dropHint = drop;
    requestAnimationFrame(() => bubble.classList.add('show'));
    setTimeout(drop, calm ? 10000 : 7000);
    document.addEventListener('pointerdown', drop, true);
    document.addEventListener('keydown', drop, true);
    global.addEventListener('scroll', drop, { passive: true });
  }

  // Every page carries the same header, and .nav-right is the cluster that
  // never collapses into the phone menu - so the assistant is reachable at
  // any width without a second floating thing fighting the dock for the
  // corner. If a page ever ships without that header, fall back to floating
  // rather than losing the button entirely.
  function mount() {
    if (document.querySelector('.ai-launch')) return;
    launcher = el('button', 'ai-launch', MARK + '<span class="ai-dot" aria-hidden="true"></span>');
    launcher.type = 'button';
    launcher.setAttribute('aria-label', 'Ask Geonergy AI');
    launcher.setAttribute('title', 'Ask Geonergy AI');
    launcher.setAttribute('aria-haspopup', 'dialog');
    launcher.addEventListener('click', open);
    introduce(launcher);
    // Floats in the bottom-left corner, clear of the dock in the middle.
    // The header cluster is where it lived before; down here it is reachable
    // by thumb on a phone and it stops competing with "Get in Touch".
    launcher.classList.add('ai-launch--float');
    document.body.appendChild(launcher);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', mount);
  else mount();

  global.GeonergyAI = {
    KB: KB, LOADS: LOADS, WHATSAPP_NUMBER: WHATSAPP_NUMBER,
    open: open, close: close, ask: q => { open(); ask(q); },
    route: route, sizeUp: sizeUp
  };

})(typeof window !== 'undefined' ? window : globalThis);
