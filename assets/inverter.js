// Inverter reference data and lookup UI.
// Extracted from index.html so inverter.html owns this feature.
// Every entry traces to a cited manual; nothing here is generated.
(function (global) {
  'use strict';

  // ---------------------------------------------------------------
  // ERROR CODE LOOKUP
  //
  // Every entry here traces to a specific, cited manual — nothing is
  // generated or guessed. Growatt/Sunsynk/Felicity are marked as not
  // yet researched rather than filled with unverified guesses.
  //
  // IMPORTANT: code numbers are NOT stable across firmware versions
  // and regional variants of "the same" model — confirmed directly
  // by comparing Deye's own AU vs EU manuals. Always cross-check
  // against the actual unit's label/manual before acting on a code.
  // ---------------------------------------------------------------
  const INVERTER_DATA = {
    deye: {
      models: [
        {
          id: 'sg04lp3',
          name: 'SUN-5/6/8/12K-SG04LP3-EU',
          category: 'Hybrid Inverter',
          specsSource: null,
          specs: [],
          faultSource: 'Deye SUN-5/6/8/12K-SG04LP3-EU hybrid inverter manual',
          faultWarning: 'Code numbers shift between firmware and regional variants of this same hardware (confirmed: AU and EU manuals number several faults differently, and Sunsynk-rebadged units differ again). Confirm against your own unit\u2019s manual before acting.',
          faultCodes: [
            { code: 'F01', meaning: 'DC input polarity reversed', action: 'Check PV wiring polarity before reconnecting.' },
            { code: 'F07', meaning: 'DC start-up failure', action: 'Confirm PV voltage is within range, then retry startup.' },
            { code: 'F13', meaning: 'Working mode changed', action: 'Informational — confirm the new mode is the intended one.' },
            { code: 'F14', meaning: 'DC-side overcurrent fault', action: 'Check PV and battery connections for faults.' },
            { code: 'F15', meaning: 'AC overcurrent fault (software-detected)', action: 'Check connected load is within rated limits.' },
            { code: 'F16', meaning: 'AC leakage current fault', action: 'Check grounding and PV cable insulation.' },
            { code: 'F20', meaning: 'DC-side overcurrent at startup', action: 'Reduce connected load, then power-cycle the DC/AC switches.' },
            { code: 'F21', meaning: 'High-voltage DC overcurrent / emergency stop', action: 'Power down and have a technician inspect before restarting.' },
            { code: 'F22', meaning: 'GFCI overcurrent fault', action: 'Check for ground faults in PV wiring.' },
            { code: 'F23', meaning: 'Transient overcurrent', action: 'Often self-clears; recheck if it repeats frequently.' },
            { code: 'F24', meaning: 'DC insulation failure', action: 'Check PV array insulation resistance to ground.' },
            { code: 'F26', meaning: 'DC busbar voltage imbalance', action: 'Internal fault — contact support if it recurs.' },
            { code: 'F31', meaning: 'AC slave contactor fault', action: 'Often clears itself after a restart or ~30 min; recheck AC breaker wiring if persistent.' },
            { code: 'F34', meaning: 'AC overcurrent fault', action: 'Check connected load and grid connection.' },
            { code: 'F41', meaning: 'Parallel system stop', action: 'Relevant only in multi-unit parallel setups — check CAN bus wiring between units.' },
            { code: 'F46', meaning: 'Battery fault', action: 'Check battery communication cable and BMS status.' },
            { code: 'F48', meaning: 'AC frequency too low', action: 'Check grid frequency stability at the site.' },
          ],
          warnSource: null,
          warnWarning: null,
          warnCodes: [],
          settingsSource: null,
          settingsWarning: null,
          settingsCodes: [],
        },
      ],
    },
    growatt: { models: [] },
    sunsynk: { models: [] },
    // Brands Geonergy installs whose manuals have not been sourced yet.
    // They appear as tabs so customers can see they are covered, and the
    // UI says plainly that nothing is listed rather than inventing codes.
    must: { models: [] },
    sako: { models: [] },
    haisic: { models: [] },
    itel: { models: [] },
    firman: { models: [] },
    felicity: {
      models: [
        {
          id: 'ivem3024-5048',
          name: 'IVEM3024 / IVEM5048',
          category: 'Off-Grid Inverter',
          specsSource: 'Felicity IVEM3024-IVEM5048 User Guide, Specifications pages (customer-provided)',
          specs: [
            {
              group: 'Line Mode Specifications',
              rows: [
                { label: 'Rated Output Power', value: '3000VA/3000W (IVEM3024), 5000VA/5000W (IVEM5048)' },
                { label: 'Nominal DC Input Voltage', value: '24V (IVEM3024), 48V (IVEM5048)' },
                { label: 'Input Voltage Waveform', value: 'Sinusoidal (utility or generator)' },
                { label: 'Nominal Input Voltage', value: '230Vac' },
                { label: 'Low Line Voltage Disconnect', value: '170Vac±7V (UPS); 90Vac±7V (Appliances)' },
                { label: 'Low Loss Voltage Re-connect', value: '180Vac±7V (UPS); 100Vac±7V (Appliances)' },
                { label: 'High Line Voltage Disconnect', value: '280Vac±7V' },
                { label: 'High Line Voltage Re-connect', value: '270Vac±7V' },
                { label: 'Max AC Input Voltage', value: '280Vac' },
                { label: 'Nominal Input Frequency', value: '50Hz / 60Hz (Auto detection)' },
                { label: 'Low Line Frequency Disconnect', value: '40±1Hz' },
                { label: 'Low Line Frequency Re-connect', value: '42±1Hz' },
                { label: 'High Line Frequency Disconnect', value: '65±1Hz' },
                { label: 'High Line Frequency Re-connect', value: '63±1Hz' },
                { label: 'Output Voltage Waveform', value: 'Same as input waveform' },
                { label: 'Output Short Circuit Protection', value: 'Line mode: Circuit Breaker; Battery mode: Electronic Circuits' },
                { label: 'Efficiency (Line Mode)', value: '>95% (rated R load, battery fully charged)' },
                { label: 'Transfer Time (Single unit)', value: '10ms typical (UPS); 20ms typical (Appliances)' },
                { label: 'Transfer Time (Parallel)', value: '50ms typical' },
                { label: 'Pass Through Without Battery', value: 'Yes' },
                { label: 'Max. Bypass Overload Current', value: '30A (IVEM3024), 40A (IVEM5048)' },
                { label: 'Max. Inverter/Rectifier Current', value: '15A/3000W (IVEM3024), 30A/5000W (IVEM5048)' },
              ],
            },
            {
              group: 'Utility Charge Mode Specifications',
              rows: [
                { label: 'Nominal Input Voltage', value: '230Vac' },
                { label: 'Input Voltage Range', value: '90–280Vac' },
                { label: 'Nominal Output Voltage', value: 'Dependent on battery type' },
                { label: 'Max. Charge Current', value: '100A' },
                { label: 'Charge Current Regulation', value: '10–100A (adjustable in 1A steps)' },
                { label: 'Over Charge Protection', value: 'Yes' },
              ],
            },
            {
              group: 'Solar Charging & Grid Charging',
              rows: [
                { label: 'Max. PV Open Circuit Voltage', value: '500V' },
                { label: 'PV Voltage Working Range', value: '120–500V' },
                { label: 'Max. Input Power', value: '4000W (IVEM3024), 6000W (IVEM5048)' },
                { label: 'Max. Solar Charging Current', value: '100A' },
                { label: 'Max. Charging Current (PV+Grid)', value: '100A' },
                { label: 'Max. Input Current', value: '15A (IVEM3024), 20A (IVEM5048)' },
                { label: 'Min. Startup Voltage', value: '125V' },
              ],
            },
            {
              group: 'Inverter Mode Specifications',
              rows: [
                { label: 'Output Voltage Waveform', value: 'Pure sine wave' },
                { label: 'Nominal Output Voltage', value: '230Vac ±5%' },
                { label: 'Nominal Output Frequency', value: '50±0.3Hz / 60±0.3Hz (adjustable)' },
                { label: 'Parallel Capability', value: 'No (IVEM3024), Yes up to 12 units (IVEM5048)' },
                { label: 'Peak Efficiency', value: '93%' },
                { label: 'Over-Load Protection (SMPS load)', value: '5s @ ≥150% load; 10s @ 105–150% load' },
                { label: 'Surge Rating', value: '2× rated power for 5s' },
                { label: 'Capable of Starting Electric', value: 'Yes' },
                { label: 'Output Short Circuit Protection', value: 'Yes' },
                { label: 'Cold Start Voltage', value: '23V (IVEM3024), 46V (IVEM5048)' },
                { label: 'Low Battery Alarm (<50% / ≥50% load)', value: '22.5V / 22.0V (IVEM3024), 45.0V / 44.0V (IVEM5048)' },
                { label: 'Low Battery Alarm Recovery (<50% / ≥50%)', value: '23.5V / 23.0V (IVEM3024), 47.0V / 46.0V (IVEM5048)' },
                { label: 'Low DC Input Shut-down (<50% / ≥50%)', value: '21.5V / 21.0V (IVEM3024), 43.0V / 42.0V (IVEM5048)' },
                { label: 'High DC Input Alarm & Fault', value: '31V±0.4V (IVEM3024), 62V±0.4V (IVEM5048)' },
                { label: 'High DC Input Recovery', value: '30V±0.4V (IVEM3024), 60V±0.4V (IVEM5048)' },
              ],
            },
            {
              group: 'General Specifications',
              rows: [
                { label: 'Operating Temperature', value: '0°C ~ 55°C' },
                { label: 'Storage Temperature Range', value: '-15°C ~ 60°C' },
                { label: 'Net Weight', value: '10.8KG (IVEM3024), 13.2KG (IVEM5048)' },
                { label: 'Product Size (D×W×H)', value: '395×295×129mm (IVEM3024), 415×320×129mm (IVEM5048)' },
                { label: 'Package Dimension (D×W×H)', value: '472×372×202mm (IVEM3024), 494×399×202mm (IVEM5048)' },
              ],
            },
          ],
          faultSource: null,
          faultWarning: null,
          faultCodes: [],
          warnSource: null,
          warnWarning: null,
          warnCodes: [],
          settingsSource: 'Felicity IVEM3024-IVEM5048 User Guide (customer-provided)',
          settingsWarning: null,
          settingsCodes: [
            { code: 'Program 28 = SIG', meaning: 'Single unit, standalone output (default).' },
            { code: 'Program 28 = PAL', meaning: 'Parallel, single-phase — requires 3–12 units, all set to PAL.' },
            { code: 'Program 28 = 3P1', meaning: 'Parallel, three-phase — this unit feeds L1.' },
            { code: 'Program 28 = 3P2', meaning: 'Parallel, three-phase — this unit feeds L2.' },
            { code: 'Program 28 = 3P3', meaning: 'Parallel, three-phase — this unit feeds L3.' },
            { code: 'Charge Algorithm', meaning: 'Three-stage: Boost CC (constant current) \u2192 Boost CV (constant voltage) \u2192 Float (constant voltage).' },
            { code: 'Battery Type = AGM', meaning: 'Boost CC/CV 28.2V (IVEM3024) / 56.4V (IVEM5048), Float 54V.' },
            { code: 'Battery Type = Flooded', meaning: 'Boost CC/CV 29.2V (IVEM3024) / 58.4V (IVEM5048), Float 54V.' },
            { code: 'Battery Type = Self-defined / Lithium', meaning: 'Manually adjustable, up to 30V (IVEM3024) / 60V (IVEM5048).' },
          ],
        },
        {
          id: 'ivem4024ii-series',
          name: 'IVEM4024-II / 6048-II / 8048-II / 12048-II',
          category: 'Off-Grid Inverter',
          specsSource: 'Felicity IVEM Series (4~12KVA) Datasheet (customer-provided)',
          specs: [
            {
              group: 'General Specifications',
              rows: [
                { label: 'Rated Output Power', value: '4000VA (4024-II) / 6000VA (6048-II) / 8000VA (8048-II) / 12000VA (12048-II)' },
                { label: 'Nominal DC Input Voltage', value: '24V (4024-II), 48V (others)' },
                { label: 'Max Charge Current', value: '120A / 120A / 150A / 240A' },
                { label: 'PV Voltage Working Range', value: '60–500V (4024-II), 90–450V (others)' },
                { label: 'Parallel Capability', value: 'No (4024-II), Yes up to 12 (6048-II), Yes up to 6 (8048-II/12048-II)' },
                { label: 'Operating Temperature', value: '-10°C ~ 50°C' },
                { label: 'Net Weight', value: '10.4KG / 12.5KG / 23.7KG / 26.8KG' },
              ],
            },
          ],
          faultSource: 'Felicity IVEM4024-II User Guide (customer-provided, doc. 358-010644-02)',
          faultWarning: 'This manual\u2019s fault table runs 01\u201361 — only codes 34\u201361 were in the pages available to check, so lower-numbered codes aren\u2019t listed yet.',
          faultCodes: [
            { code: '34', meaning: 'DC/DC overcurrent detected by hardware', action: 'Restart the unit; if it recurs, return to repair center.' },
            { code: '35', meaning: 'Overvoltage on the internal DC bus', action: 'Can follow an AC or PV surge, or an internal fault. Restart the unit; if it recurs, return to repair center.' },
            { code: '40', meaning: 'CAN data loss (parallel comms)', action: 'Check communication cables are seated well and restart. Contact your installer if it persists.' },
            { code: '41', meaning: 'Host data loss (parallel comms)', action: 'Check communication cables are seated well and restart. Contact your installer if it persists.' },
            { code: '42', meaning: 'Synchronization data loss (parallel comms)', action: 'Check communication cables are seated well and restart. Contact your installer if it persists.' },
            { code: '43', meaning: 'Current feedback detected into the inverter', action: 'Restart; check L/N wiring isn\u2019t reversed; on parallel systems check sharing cables match phase groupings. Contact your installer if it persists.' },
            { code: '44', meaning: 'Firmware version mismatch across parallel units', action: 'Update all units to the same firmware version; verify via LCD. Contact your installer if it persists.' },
            { code: '45', meaning: 'Output current differs between parallel units', action: 'Check sharing cables are connected well and restart. Contact your installer if it persists.' },
            { code: '46', meaning: 'AC output mode setting differs across parallel units', action: 'Check Program 28 on each unit — single-phase units should share one of 3P1/3P2/3P3, three-phase should all be PAL. Contact your installer if it persists.' },
            { code: '47', meaning: 'Generator current sensor failed', action: 'Restart the unit; if it recurs, return to repair center.' },
            { code: '48', meaning: 'PV overcurrent detected by hardware', action: 'Restart the unit; if it recurs, return to repair center.' },
            { code: '60', meaning: 'SPS start failure', action: 'Restart the unit; if it recurs, return to repair center.' },
            { code: '61', meaning: 'PV-to-ground insulation test failed', action: 'Restart the unit; if it recurs, return to repair center.' },
          ],
          warnSource: null,
          warnWarning: 'This manual\u2019s own intro says it covers "warning code and fault code" as two separate tables — the warning-code page wasn\u2019t in the pages available to check yet. Send that page and it\u2019ll go in here.',
          warnCodes: [],
          settingsSource: 'Felicity IVEM4024-II User Guide (customer-provided)',
          settingsWarning: 'Shown for the 24V IVEM4024-II specifically — 48V models in the same series will use different absolute voltages.',
          settingsCodes: [
            { code: 'AGM', meaning: 'Boost (CC/CV) 28.2V, Float 27V.' },
            { code: 'Flooded', meaning: 'Boost (CC/CV) 29.2V, Float 27V.' },
            { code: 'Self-defined / Lithium', meaning: 'Manually adjustable, up to 30V.' },
          ],
        },
        {
          id: 'ivcm-2012-3224',
          name: 'IVCM2012P1G2 / IVCM3224P1G2',
          category: 'Off-Grid Inverter',
          note: 'Manual was uploaded, but the pages with specs, fault codes, or settings weren\u2019t in what was available to check yet.',
          specsSource: null,
          specs: [],
          faultSource: null,
          faultWarning: null,
          faultCodes: [],
          warnSource: null,
          warnWarning: null,
          warnCodes: [],
          settingsSource: null,
          settingsWarning: null,
          settingsCodes: [],
        },
        {
          id: 'fla48400tg2',
          name: 'FLA48400TG2',
          category: 'LiFePO4 Battery',
          specsSource: 'Felicity FLA48400TG2 User Manual (customer-provided)',
          specs: [
            {
              group: 'General Specifications',
              rows: [
                { label: 'Rated Voltage / Capacity', value: '51.2V / 20kWh' },
                { label: 'Working Temperature', value: '-20°C ~ +55°C' },
                { label: 'Charging Temperature Range', value: '0°C ~ +55°C' },
                { label: 'Discharging Temperature Range', value: '-20°C ~ +55°C' },
                { label: 'Storage Temperature', value: '0°C ~ +35°C' },
                { label: 'Max Elevation', value: '2000m' },
              ],
            },
          ],
          faultSource: 'Felicity FLA48400TG2 User Manual (customer-provided)',
          faultWarning: 'This is the battery\u2019s own BMS fault table — a separate system from the IVEM inverter codes. A "C" code shows on the battery/BMS display, not the inverter.',
          faultCodes: [
            { code: 'C01', meaning: 'Battery overvoltage', action: 'Restart the unit; if it recurs, return to repair center.' },
            { code: 'C02', meaning: 'Battery undervoltage', action: 'Restart the unit; if it recurs, return to repair center.' },
            { code: 'C03', meaning: 'Cell overvoltage', action: 'Restart the unit; if it recurs, return to repair center.' },
            { code: 'C04', meaning: 'Cell undervoltage', action: 'Restart the unit; if it recurs, return to repair center.' },
            { code: 'C05', meaning: 'Charge overcurrent', action: 'Restart the unit; if it recurs, return to repair center.' },
            { code: 'C06', meaning: 'Discharge overcurrent', action: 'Restart the unit; if it recurs, return to repair center.' },
            { code: 'C07', meaning: 'MOS overtemperature', action: 'Internal temperature exceeded the limit — check whether ambient temperature is too high.' },
            { code: 'C08', meaning: 'MOS undertemperature', action: 'Internal temperature is below the limit range — check whether ambient temperature is too low.' },
            { code: 'C09', meaning: 'Cell overtemperature', action: 'Restart the unit; if it recurs, return to repair center.' },
          ],
          warnSource: null,
          warnWarning: null,
          warnCodes: [],
          settingsSource: null,
          settingsWarning: null,
          settingsCodes: [],
        },
      ],
    },
  };

  let ecBrand = 'deye';
  let ecModelId = null;

  function ecModels() {
    return (INVERTER_DATA[ecBrand] && INVERTER_DATA[ecBrand].models) || [];
  }

  function ecCodeList(rows, q) {
    if (!rows || !rows.length) return '<div class="ec-empty">Not sourced yet for this model.</div>';
    const filtered = rows.filter(r => !q || r.code.toLowerCase().includes(q) || r.meaning.toLowerCase().includes(q));
    if (!filtered.length) return '<div class="ec-empty">No matching entries.</div>';
    return '<div class="ec-list">' + filtered.map(r => `
      <div class="ec-item">
        <div class="ec-item-head"><span class="ec-code">${r.code}</span><span class="ec-meaning">${r.meaning}</span></div>
        ${r.action ? `<div class="ec-action">${r.action}</div>` : ''}
      </div>
    `).join('') + '</div>';
  }

  function ecSpecList(groups) {
    if (!groups || !groups.length) return '<div class="ec-empty">No specifications sourced yet for this model.</div>';
    return groups.map(g => `
      <div class="ec-spec-group">
        <div class="ec-spec-group-label">${g.group}</div>
        <div class="ec-spec-list">
          ${g.rows.map(r => `<div class="ec-spec-row"><span class="ec-spec-label">${r.label}</span><span class="ec-spec-value">${r.value}</span></div>`).join('')}
        </div>
      </div>
    `).join('');
  }

  function ecSubsection(title, source, warning, bodyHtml) {
    return `
      <div class="ec-subsection">
        <div class="ec-subsection-title">${title}</div>
        ${source ? `<div class="ec-source">Sourced from: ${source}</div>` : ''}
        ${warning ? `<div class="ec-warning">\u26A0 ${warning}</div>` : ''}
        ${bodyHtml}
      </div>
    `;
  }

  function renderModelTabs() {
    const models = ecModels();
    const tabsEl = document.getElementById('ec-model-tabs');
    if (!models.length) { tabsEl.innerHTML = ''; return; }
    if (!ecModelId || !models.find(m => m.id === ecModelId)) ecModelId = models[0].id;
    tabsEl.innerHTML = models.map(m =>
      `<button type="button" class="ec-model-tab${m.id === ecModelId ? ' active' : ''}" data-model="${m.id}">${m.name}</button>`
    ).join('');
  }

  function renderModelView() {
    const models = ecModels();
    const viewEl = document.getElementById('ec-model-view');
    if (!models.length) {
      viewEl.innerHTML = '<div class="ec-empty">Not researched yet for this brand — nothing added until it\u2019s sourced from a real manual. Check back soon.</div>';
      return;
    }
    const model = models.find(m => m.id === ecModelId) || models[0];
    const q = (document.getElementById('ec-search-input').value || '').trim().toLowerCase();

    let html = `<div class="ec-model-category">${model.category}</div>`;
    if (model.note) html += `<div class="ec-warning">\u26A0 ${model.note}</div>`;

    html += `
      <div class="ec-collapsible">
        <button type="button" class="ec-collapse-toggle" data-collapse="specs">
          <span>Specifications (optional)</span><span class="ec-collapse-icon">+</span>
        </button>
        <div class="ec-collapse-body collapsed" data-collapse-body="specs">
          ${model.specsSource ? `<div class="ec-source">Sourced from: ${model.specsSource}</div>` : ''}
          ${ecSpecList(model.specs)}
        </div>
      </div>
    `;

    html += ecSubsection('Fault Codes', model.faultSource, model.faultWarning, ecCodeList(model.faultCodes, q));
    html += ecSubsection('Warning Codes', model.warnSource, model.warnWarning, ecCodeList(model.warnCodes, q));
    html += ecSubsection('Settings &amp; Programs', model.settingsSource, model.settingsWarning, ecCodeList(model.settingsCodes, q));

    viewEl.innerHTML = html;
  }

  function initErrorCodes() {
    document.getElementById('ec-brand-tabs').addEventListener('click', (e) => {
      const btn = e.target.closest('.ec-tab');
      if (!btn) return;
      ecBrand = btn.dataset.brand;
      ecModelId = null;
      document.querySelectorAll('.ec-tab').forEach(b => b.classList.toggle('active', b === btn));
      document.getElementById('ec-search-input').value = '';
      renderModelTabs();
      renderModelView();
    });

    document.getElementById('ec-model-tabs').addEventListener('click', (e) => {
      const btn = e.target.closest('.ec-model-tab');
      if (!btn) return;
      ecModelId = btn.dataset.model;
      document.getElementById('ec-search-input').value = '';
      renderModelTabs();
      renderModelView();
    });

    document.getElementById('ec-model-view').addEventListener('click', (e) => {
      const btn = e.target.closest('.ec-collapse-toggle');
      if (!btn) return;
      const body = document.querySelector(`[data-collapse-body="${btn.dataset.collapse}"]`);
      body.classList.toggle('collapsed');
      btn.querySelector('.ec-collapse-icon').textContent = body.classList.contains('collapsed') ? '+' : '\u2212';
    });

    document.getElementById('ec-search-input').addEventListener('input', renderModelView);

    renderModelTabs();
    renderModelView();
  }

  global.initErrorCodes = initErrorCodes;
})(window);
