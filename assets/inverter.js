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
    cworth: { models: [] },
    haisic: {
      models: [
        {
          id: 'haisic-pv1000-1-2k',
          name: 'PV1000 - 1.2 kVA (12 V)',
          category: 'Off-Grid Inverter',
          specsSource: null,
          specs: [],
          faultSource: 'Haisic PV1000 1.2 kVA user manual, "Fault Reference Code" (customer-provided)',
          faultWarning: 'Fault 17 comes from the 6 kVA service manual; every other row is from the user manual’s own "Fault Reference Code" table. Both manuals carry the same numbering, and the 6 kVA service manual repeats it, so a code means the same thing across the Haisic range - the voltage figures inside a row follow the model’s battery voltage.',
          faultCodes: [
            { code: '1', meaning: 'Bus soft boost start failed', action: 'Turn fault mode. Triggered when bus voltage does not reach the set value for more than 30 seconds. Cannot restore on its own - power down and call your installer.' },
            { code: '2', meaning: 'Bus voltage high', action: 'Turn fault mode. The bus voltage is higher than the protection point. Cannot restore on its own.' },
            { code: '3', meaning: 'Bus voltage low', action: 'Turn fault mode. Bus voltage is below the under-voltage protection point. Cannot restore on its own.' },
            { code: '4', meaning: 'Battery over current', action: 'Turn fault mode. TZ interrupt triggered more than 2 times within 2ms. Cannot restore on its own.' },
            { code: '5', meaning: 'Over temperature', action: 'Turn fault mode. PFC temperature above the protection threshold, or a fan stuck for more than 5 minutes. Tries to restart six times; if it still fails it cannot restore. Check airflow and that the fans spin.' },
            { code: '6', meaning: 'Battery high voltage', action: 'Turn fault mode. Battery voltage is higher than the set value. Restores once the voltage drops below the set value.' },
            { code: '7', meaning: 'Bus soft start fault', action: 'Turn fault mode. The soft-start process has run past its time but the bus voltage has not reached the set value. Cannot restore on its own.' },
            { code: '8', meaning: 'Bus short circuit', action: 'Turn fault mode. Inverter on or PFC on with bus voltage below threshold. Cannot restore on its own.' },
            { code: '9', meaning: 'Inverter soft start fault', action: 'Turn fault mode. Bus voltage above the protection point, or the DC component is greater than 20V, or the inverter did not complete within 5 minutes. Cannot restore on its own.' },
            { code: '10', meaning: 'INV over voltage', action: 'Turn fault mode. The inverter output voltage is higher than the set value (276V). Cannot restore on its own.' },
            { code: '11', meaning: 'INV under voltage', action: 'Turn fault mode. In battery mode with no short circuit, the inverter voltage is lower than 160V. Cannot restore on its own.' },
            { code: '12', meaning: 'INV short circuit', action: 'Turn fault mode. In battery or standby mode the inverter voltage is low and the current is above the set value. Tries to restart six times; if it still fails it cannot restore. Unplug the loads before restarting.' },
            { code: '13', meaning: 'Negative power protection', action: 'Turn fault mode. In battery mode the load power is below the set value (negative power, such as -1200W). Cannot restore on its own.' },
            { code: '14', meaning: 'Over load', action: 'Turn fault mode. Overload beyond the limit in the specification. Tries to restart six times; if it still fails it cannot restore. Take some load off before restarting.' },
            { code: '15', meaning: 'Model fault', action: 'Turn fault mode. The unit cannot match any model in model-number detection. Cannot restore. Check whether the control board is assembled incorrectly or the program was burned incorrectly - installer work.' },
            { code: '16', meaning: 'No boot loader', action: 'Turn fault mode. Boot loader missing. Cannot restore in the field; the service manual has the recovery command. Installer or service centre.' },
            { code: '17', meaning: 'Program is being flashed', action: 'The software is being upgraded. Not a failure - it restores by itself once the upgrade finishes. (Documented in the 6 kVA service manual.)' },
            { code: '26', meaning: 'BMS fault', action: 'Turn fault mode. An error code arrived in the BMS message from the lithium battery. Clears when the BMS fault clears, or by turning the BMS communication function off (Program 38 on the 4.2 kVA, 44 on the 1.2 kVA). Check the battery BMS first - single-cell over-voltage and the like.' },
            { code: '28', meaning: 'NTC fault', action: 'Turn fault mode. NTC temperature sensor open circuit. Cannot restore. The service manual asks you to check the NTC plug seats properly on the power board, then power off and restart.' },
            { code: '29', meaning: 'Inverter over current', action: 'Turn fault mode. Instantaneous inverter current above the set value. Tries to restart six times; if it still fails it cannot restore.' },
          ],
          warnSource: 'Haisic PV1000 1.2 kVA user manual, "Alarm Reference Code" (customer-provided)',
          warnWarning: 'Haisic call these Alarm codes - the LCD shows ALA with the number, the red LED flashes and the unit keeps running. That is the difference from a Fault, which stops the inverter. Voltage figures quoted in the alarm table are the ones printed for this model’s battery voltage.',
          warnCodes: [
            { code: '50', meaning: 'Battery open', action: 'Alarm; the battery does not charge. Battery voltage is below the set point. Restores once the battery voltage recovers.' },
            { code: '51', meaning: 'Battery low voltage shutdown', action: 'Alarm; the unit shuts down on low battery or will not power on. Restores once the battery voltage recovers.' },
            { code: '52', meaning: 'Battery low voltage', action: 'Alarm only. Battery voltage is below the set point. Restores once the battery voltage recovers.' },
            { code: '53', meaning: 'Charger short circuit', action: 'Warning; the battery does not charge. Battery voltage is under 5V while charging current is over 4A. Cannot restore - stop and check the battery and its cabling.' },
            { code: '54', meaning: 'Low power discharge', action: 'Alarm. The battery is above the recovery voltage and the discharge time has passed the low-power discharge time set in the programs. Restores once the battery voltage recovers.' },
            { code: '55', meaning: 'Battery over charge', action: 'Alarm; the battery does not charge. Battery voltage is higher than the set value. Can restore.' },
            { code: '56', meaning: 'BMS disconnect', action: 'Alarm; locks to standby mode. No correct BMS response within 10 seconds. Restores when communication recovers. Check the battery communication cable.' },
            { code: '57', meaning: 'Over temperature', action: 'Alarm; the battery does not charge. PFC or INV temperature above the set value. Restores once the temperature drops. Check ventilation.' },
            { code: '58', meaning: 'Fan error', action: 'Alarm. Fan speed is below the set value; if one fan fails the other runs at full speed. Restores once the fan recovers.' },
            { code: '59', meaning: 'EEPROM error', action: 'Alarm. Numerical calibration error. Restores after correct calibration - service work.' },
            { code: '60', meaning: 'Overload', action: 'Alarm; the battery does not charge. Load above 102% for 200-220ms while not on mains priority. Restores once the load is back to normal.' },
            { code: '61', meaning: 'Abnormal generator waveform', action: 'Alarm; keeps running in battery mode. The generator waveform check failed. Can restore. Common with an unstable generator.' },
            { code: '62', meaning: 'PV Energy Weak', action: 'Alarm; turns off PV output and charging. With no battery connected, bus voltage fell below the set value. Restores after 10 minutes.' },
            { code: '63', meaning: 'Synchronization signal fail', action: 'Alarm; turns fault mode. In a parallel set, no synchronization signal restored within the set value. Restores when the signal recovers.' },
            { code: '68', meaning: 'SOC Under', action: 'Alarm; turns standby mode. Lithium battery SOC is below the value set in the Low SOC Shutdown program. Clears when SOC returns to that value + 5%, or by turning off low-SOC shutdown or BMS communication.' },
          ],
          settingsSource: 'Haisic PV1000 1.2 kVA user manual, LCD setting table (customer-provided)',
          settingsWarning: 'A 12 V machine. Every voltage below is a 12 V figure - do not copy them onto a 24 V or 48 V unit. Programs 27 and 28 are not printed in this manual, so they are not listed.',
          settingsCodes: [
            { code: '01', meaning: 'Output voltage - 230V default. Settable 208V, 220V, 230V, 240V.' },
            { code: '02', meaning: 'Output frequency - 50Hz default. Settable 50Hz or 60Hz.' },
            { code: '03', meaning: 'Output source priority - PGb solar first, GPb grid first (default), PbG, or mtP comprehensive (battery first while PV is present, grid first when it is not).' },
            { code: '04', meaning: 'Output mode - APP appliance (default), UPS (10ms typical transfer), or GEN (generator on the grid input port).' },
            { code: '05', meaning: 'Charger source priority - PNG PV and grid together (default), OPV only PV, or PVF PV-first.' },
            { code: '06', meaning: 'Grid charging current - 30A default, settable 2 to 60A.' },
            { code: '07', meaning: 'Maximum charging current - total for solar and grid. 60A default; options 2/10/20/30/40/50/60/70/80/90/100/110/120A.' },
            { code: '08', meaning: 'Menu Default - ON returns the display to the first page after a minute idle; OFF stays put.' },
            { code: '09', meaning: 'Auto restart when overload occurs - default ON.' },
            { code: '10', meaning: 'Auto restart when over temperature occurs - default ON.' },
            { code: '11', meaning: 'Main input cut warning - default ON; the buzzer sounds 3 seconds when mains or PV is lost.' },
            { code: '12', meaning: 'Energy-saving mode - default OFF. ON stops output in battery mode under 25W and resumes above 35W.' },
            { code: '13', meaning: 'Overload transfer to bypass - default OFF.' },
            { code: '14', meaning: 'Silent mode setting - default OFF. ON silences the buzzer in every situation.' },
            { code: '15', meaning: 'Battery return to mains voltage point - AGM/FLD default 11.5V, range 11-13V. Lithium, Lithium Iron or CUS default 11.9V, range 10-12.9V.' },
            { code: '16', meaning: 'Switching back to battery mode voltage point - AGM/FLD default 13V, range 12-14.5V. Lithium, Lithium Iron or CUS default 13.6V, range 11.5-15.5V.' },
            { code: '17', meaning: 'Battery type - AGM (default), Flooded, Lithium, User-Defined, or Lithium Iron (FEL).' },
            { code: '18', meaning: 'Battery low voltage point - default 11V. LIB/FEL/CUS default 11V, range 10.3-12.5V. Cannot be set on AGM or FLD.' },
            { code: '19', meaning: 'Battery shutdown voltage point - default 10.5V. LIB/FEL/CUS default 10.5V, range 10-12V. Cannot be set on AGM or FLD.' },
            { code: '20', meaning: 'Constant voltage (absorption) point - default 14.1V. LIB/FEL/CUS default 14.1V, range 12-15V. Must stay above the float point.' },
            { code: '21', meaning: 'Floating charge point - AGM/FLD 13.5V. LIB/FEL/CUS range 12.5-15.5V. Must stay below the constant-voltage point.' },
            { code: '22', meaning: 'Grid low voltage point - APP/GEN range 90-154V, default 154V. UPS range 170-200V, default 185V.' },
            { code: '23', meaning: 'Grid high voltage point - APP/GEN range 264-280V, default 264V. UPS fixed at 264V.' },
            { code: '24', meaning: 'Automatic screen shutdown - default OFF. ON turns the backlight off after 10 minutes with no button pressed.' },
            { code: '25', meaning: 'Inverter soft start - default OFF. ON ramps the output up from zero. Single-unit operation only.' },
            { code: '26', meaning: 'Reset factory setting - default OFF. Works in mains and standby, not in battery mode.' },
            { code: '29', meaning: 'Battery Disconnection Alarm - default OFF.' },
            { code: '30', meaning: 'Battery Equalization Mode - default OFF.' },
            { code: '31', meaning: 'Equalization voltage point - default 14.6V, range 12-15V.' },
            { code: '32', meaning: 'Equalization charging time - default 60 minutes, range 5-900, in 5-minute steps.' },
            { code: '33', meaning: 'Equalization delay time - default 120 minutes, range 5-900, in 5-minute steps.' },
            { code: '34', meaning: 'Equalization interval - default 30 days, range 1-90 days.' },
            { code: '35', meaning: 'Enable equalization immediately - default OFF.' },
            { code: '44', meaning: 'BMS Communication Function - default OFF. Pick the option matching the battery pack. Communication trouble raises alarm 56.' },
            { code: '46', meaning: 'Low SOC Shutdown - default 20, range 5-50. Shuts down and raises alarm 68 at that SOC; clears at +5%.' },
            { code: '47', meaning: 'High SOC to Battery - default 90, range 10-100.' },
            { code: '55', meaning: 'BMS ID setting - default auto (AtO), range 1-15. On auto the unit polls IDs upward and locks to the first that answers.' },
          ],
        },
        {
          id: 'haisic-pv5000-4-2k',
          name: 'PV5000 - 4.2 kVA (24 V)',
          category: 'Off-Grid Inverter',
          specsSource: null,
          specs: [],
          faultSource: 'Haisic PV5000 4.2 kVA user manual, "5. Fault Reference Code" (customer-provided)',
          faultWarning: 'Fault 17 comes from the 6 kVA service manual; every other row is from the user manual’s own "Fault Reference Code" table. Both manuals carry the same numbering, and the 6 kVA service manual repeats it, so a code means the same thing across the Haisic range - the voltage figures inside a row follow the model’s battery voltage.',
          faultCodes: [
            { code: '1', meaning: 'Bus soft boost start failed', action: 'Turn fault mode. Triggered when bus voltage does not reach the set value for more than 30 seconds. Cannot restore on its own - power down and call your installer.' },
            { code: '2', meaning: 'Bus voltage high', action: 'Turn fault mode. The bus voltage is higher than the protection point. Cannot restore on its own.' },
            { code: '3', meaning: 'Bus voltage low', action: 'Turn fault mode. Bus voltage is below the under-voltage protection point. Cannot restore on its own.' },
            { code: '4', meaning: 'Battery over current', action: 'Turn fault mode. TZ interrupt triggered more than 2 times within 2ms. Cannot restore on its own.' },
            { code: '5', meaning: 'Over temperature', action: 'Turn fault mode. PFC temperature above the protection threshold, or a fan stuck for more than 5 minutes. Tries to restart six times; if it still fails it cannot restore. Check airflow and that the fans spin.' },
            { code: '6', meaning: 'Battery high voltage', action: 'Turn fault mode. Battery voltage is higher than the set value. Restores once the voltage drops below the set value.' },
            { code: '7', meaning: 'Bus soft start fault', action: 'Turn fault mode. The soft-start process has run past its time but the bus voltage has not reached the set value. Cannot restore on its own.' },
            { code: '8', meaning: 'Bus short circuit', action: 'Turn fault mode. Inverter on or PFC on with bus voltage below threshold. Cannot restore on its own.' },
            { code: '9', meaning: 'Inverter soft start fault', action: 'Turn fault mode. Bus voltage above the protection point, or the DC component is greater than 20V, or the inverter did not complete within 5 minutes. Cannot restore on its own.' },
            { code: '10', meaning: 'INV over voltage', action: 'Turn fault mode. The inverter output voltage is higher than the set value (276V). Cannot restore on its own.' },
            { code: '11', meaning: 'INV under voltage', action: 'Turn fault mode. In battery mode with no short circuit, the inverter voltage is lower than 160V. Cannot restore on its own.' },
            { code: '12', meaning: 'INV short circuit', action: 'Turn fault mode. In battery or standby mode the inverter voltage is low and the current is above the set value. Tries to restart six times; if it still fails it cannot restore. Unplug the loads before restarting.' },
            { code: '13', meaning: 'Negative power protection', action: 'Turn fault mode. In battery mode the load power is below the set value (negative power, such as -1200W). Cannot restore on its own.' },
            { code: '14', meaning: 'Over load', action: 'Turn fault mode. Overload beyond the limit in the specification. Tries to restart six times; if it still fails it cannot restore. Take some load off before restarting.' },
            { code: '15', meaning: 'Model fault', action: 'Turn fault mode. The unit cannot match any model in model-number detection. Cannot restore. Check whether the control board is assembled incorrectly or the program was burned incorrectly - installer work.' },
            { code: '16', meaning: 'No boot loader', action: 'Turn fault mode. Boot loader missing. Cannot restore in the field; the service manual has the recovery command. Installer or service centre.' },
            { code: '17', meaning: 'Program is being flashed', action: 'The software is being upgraded. Not a failure - it restores by itself once the upgrade finishes. (Documented in the 6 kVA service manual.)' },
            { code: '26', meaning: 'BMS fault', action: 'Turn fault mode. An error code arrived in the BMS message from the lithium battery. Clears when the BMS fault clears, or by turning the BMS communication function off (Program 38 on the 4.2 kVA, 44 on the 1.2 kVA). Check the battery BMS first - single-cell over-voltage and the like.' },
            { code: '28', meaning: 'NTC fault', action: 'Turn fault mode. NTC temperature sensor open circuit. Cannot restore. The service manual asks you to check the NTC plug seats properly on the power board, then power off and restart.' },
            { code: '29', meaning: 'Inverter over current', action: 'Turn fault mode. Instantaneous inverter current above the set value. Tries to restart six times; if it still fails it cannot restore.' },
          ],
          warnSource: 'Haisic PV5000 4.2 kVA user manual, "6. Alarm Reference Code" (customer-provided)',
          warnWarning: 'Haisic call these Alarm codes - the LCD shows ALA with the number, the red LED flashes and the unit keeps running. That is the difference from a Fault, which stops the inverter. Voltage figures quoted in the alarm table are the ones printed for this model’s battery voltage.',
          warnCodes: [
            { code: '50', meaning: 'Battery open', action: 'Alarm; the battery does not charge. Battery voltage is below the set point. Restores once the battery voltage recovers.' },
            { code: '51', meaning: 'Battery low voltage shutdown', action: 'Alarm; the unit shuts down on low battery or will not power on. Restores once the battery voltage recovers.' },
            { code: '52', meaning: 'Battery low voltage', action: 'Alarm only. Battery voltage is below the set point. Restores once the battery voltage recovers.' },
            { code: '53', meaning: 'Charger short circuit', action: 'Warning; the battery does not charge. Battery voltage is under 5V while charging current is over 4A. Cannot restore - stop and check the battery and its cabling.' },
            { code: '54', meaning: 'Low power discharge', action: 'Alarm. The battery is above the recovery voltage and the discharge time has passed the low-power discharge time set in the programs. Restores once the battery voltage recovers.' },
            { code: '55', meaning: 'Battery over charge', action: 'Alarm; the battery does not charge. Battery voltage is higher than the set value. Can restore.' },
            { code: '56', meaning: 'BMS disconnect', action: 'Alarm; locks to standby mode. No correct BMS response within 10 seconds. Restores when communication recovers. Check the battery communication cable.' },
            { code: '57', meaning: 'Over temperature', action: 'Alarm; the battery does not charge. PFC or INV temperature above the set value. Restores once the temperature drops. Check ventilation.' },
            { code: '58', meaning: 'Fan error', action: 'Alarm. Fan speed is below the set value; if one fan fails the other runs at full speed. Restores once the fan recovers.' },
            { code: '59', meaning: 'EEPROM error', action: 'Alarm. Numerical calibration error. Restores after correct calibration - service work.' },
            { code: '60', meaning: 'Overload', action: 'Alarm; the battery does not charge. Load above 102% for 200-220ms while not on mains priority. Restores once the load is back to normal.' },
            { code: '61', meaning: 'Abnormal generator waveform', action: 'Alarm; keeps running in battery mode. The generator waveform check failed. Can restore. Common with an unstable generator.' },
            { code: '62', meaning: 'PV Energy Weak', action: 'Alarm; turns off PV output and charging. With no battery connected, bus voltage fell below the set value. Restores after 10 minutes.' },
            { code: '63', meaning: 'Synchronization signal fail', action: 'Alarm; turns fault mode. In a parallel set, no synchronization signal restored within the set value. Restores when the signal recovers.' },
            { code: '68', meaning: 'SOC Under', action: 'Alarm; turns standby mode. Lithium battery SOC is below the value set in the Low SOC Shutdown program. Clears when SOC returns to that value + 5%, or by turning off low-SOC shutdown or BMS communication.' },
          ],
          settingsSource: 'Haisic PV5000 4.2 kVA user manual, LCD setting table (customer-provided)',
          settingsWarning: 'A 24 V machine. Every voltage below is a 24 V figure. Note the numbering differs from the 1.2 kVA - equalization voltage is Program 30 here and 31 there - so read the number off the screen of the unit in front of you.',
          settingsCodes: [
            { code: '01', meaning: 'Output voltage - 230V default. Settable 208V, 220V, 230V, 240V.' },
            { code: '02', meaning: 'Output frequency - 50Hz default. Settable 50Hz or 60Hz.' },
            { code: '03', meaning: 'Output source priority - PV (solar first), Grd (grid first, the default), or PbG.' },
            { code: '04', meaning: 'Output mode - APP appliance (default), UPS (10ms typical transfer, for computers), or GEN (generator on the grid input port).' },
            { code: '05', meaning: 'Charger source priority - PNG PV and grid together (default), OPV only PV, GRD grid first, or PV PV-first.' },
            { code: '06', meaning: 'Grid charging current - 40A default, settable 2 to 100A.' },
            { code: '07', meaning: 'Maximum charging current - total for solar and grid. 60A default; options 2/10/20/30/40/50/60/70/80/90/100A.' },
            { code: '08', meaning: 'Menu Default - ON returns the display to the first page after a minute idle; OFF stays put.' },
            { code: '09', meaning: 'Auto restart when overload occurs - default ON.' },
            { code: '10', meaning: 'Auto restart when over temperature occurs - default ON.' },
            { code: '11', meaning: 'Main input cut warning - default ON; the buzzer sounds 3 seconds when mains or PV is lost. OFF silences it.' },
            { code: '12', meaning: 'Energy-saving mode - default OFF. ON stops output in battery mode under 25W and resumes above 35W.' },
            { code: '13', meaning: 'Overload transfer to bypass - default OFF. ON transfers to utility on overload in PBG priority.' },
            { code: '14', meaning: 'Silent mode setting - default OFF. ON silences the buzzer in every situation, alarms and faults included.' },
            { code: '15', meaning: 'Battery return to mains voltage point - AGM/FLD default 23V, range 22-26V. Lithium default 23.8V, range 20-25V. CUS range 22-26V.' },
            { code: '16', meaning: 'Switching back to battery mode voltage point - AGM/FLD default 26V, range 24-29V. Lithium default 27V, range 23-28.5V. CUS default 26V, range 24-29V.' },
            { code: '17', meaning: 'Battery type - AGM, Flooded, Lithium (default), or User-Defined (CUS).' },
            { code: '18', meaning: 'Battery low voltage point - default 22V; CUS range 21-27V. Lithium default 23.8V, range 20.6-25V. Cannot be set on AGM or FLD.' },
            { code: '19', meaning: 'Battery shutdown voltage point - default 21V; CUS range 20-24V. Lithium default 23V, range 20-24V. Cannot be set on AGM or FLD.' },
            { code: '20', meaning: 'Constant voltage (absorption) point - AGM 28.2V, FLD 29V, fixed. CUS range 24-29V. Lithium default 28.2V, range 25-29V. Must stay above the float point.' },
            { code: '21', meaning: 'Floating charge point - AGM/FLD 27V, fixed. CUS range 26.6-27.8V. Lithium default 27.6V, range 24-28V. Must stay below the constant-voltage point.' },
            { code: '22', meaning: 'Grid low voltage point - APP/GEN range 90-154V, default 154V. UPS range 170-200V, default 185V.' },
            { code: '23', meaning: 'Grid high voltage point - APP/GEN range 264-280V, default 264V. UPS fixed at 264V.' },
            { code: '24', meaning: 'Low power discharge time - default 8 hours, range 1-8. Past that time the shutdown point is raised to 22V to protect the battery.' },
            { code: '25', meaning: 'Inverter soft start - default OFF. ON ramps the output up from zero. Single-unit operation only.' },
            { code: '26', meaning: 'Reset factory setting - default OFF. ON restores defaults. Works in mains and standby, not in battery mode.' },
            { code: '27', meaning: 'Parallel operation mode - not applicable to this model.' },
            { code: '28', meaning: 'Battery Disconnection Alarm - default OFF. OFF suppresses the disconnect, low-voltage and under-voltage alarms when the battery is out.' },
            { code: '29', meaning: 'Battery Equalization Mode - default OFF.' },
            { code: '30', meaning: 'Equalization voltage point - default 29.2V, range 25-31.5V.' },
            { code: '31', meaning: 'Equalization charging time - default 60 minutes, range 5-900, in 5-minute steps.' },
            { code: '32', meaning: 'Equalization delay time - default 120 minutes, range 5-900, in 5-minute steps.' },
            { code: '33', meaning: 'Equalization interval - default 30 days, range 1-90 days.' },
            { code: '34', meaning: 'Enable equalization immediately - default OFF.' },
            { code: '35', meaning: 'Grid tie inverter - not applicable to this model.' },
            { code: '36', meaning: 'Battery dual output low voltage shutdown point - not applicable to this model.' },
            { code: '37', meaning: 'Battery dual output duration - not applicable to this model.' },
            { code: '38', meaning: 'BMS Communication Function - default OFF. Turn it on and pick the option matching the battery pack. Communication trouble raises alarm 56.' },
            { code: '39', meaning: 'Low SOC Shutdown - default 20, range 5-50. Shuts down and raises alarm 68 at that SOC; clears at +5%.' },
            { code: '40', meaning: 'High SOC to Battery - default 95, range 10-100. In PBG priority, switches to battery once SOC passes this.' },
          ],
        },
        {
          id: 'haisic-ct6ku-6k',
          name: 'CT6KU - 6 kVA (also sold as PV9000)',
          category: 'Off-Grid Inverter',
          note: 'Geonergy confirm the PV9000 is the same machine as the 6 kVA. The document supplied for it is a service manual for repair, so it carries fault and alarm conditions but no LCD setting table - the programs below are not listed for this model yet.',
          specsSource: null,
          specs: [],
          faultSource: 'Haisic 6 kVA (CT6KU) service manual, "2.3 Fault condition", cross-checked against the Haisic user manuals for the rows it does not spell out (customer-provided)',
          faultWarning: 'Fault 17 comes from the 6 kVA service manual; every other row is from the user manual’s own "Fault Reference Code" table. Both manuals carry the same numbering, and the 6 kVA service manual repeats it, so a code means the same thing across the Haisic range - the voltage figures inside a row follow the model’s battery voltage.',
          faultCodes: [
            { code: '1', meaning: 'Bus soft boost start failed', action: 'Turn fault mode. Triggered when bus voltage does not reach the set value for more than 30 seconds. Cannot restore on its own - power down and call your installer.' },
            { code: '2', meaning: 'Bus voltage high', action: 'Turn fault mode. The bus voltage is higher than the protection point. Cannot restore on its own.' },
            { code: '3', meaning: 'Bus voltage low', action: 'Turn fault mode. Bus voltage is below the under-voltage protection point. Cannot restore on its own.' },
            { code: '4', meaning: 'Battery over current', action: 'Turn fault mode. TZ interrupt triggered more than 2 times within 2ms. Cannot restore on its own.' },
            { code: '5', meaning: 'Over temperature', action: 'Turn fault mode. PFC temperature above the protection threshold, or a fan stuck for more than 5 minutes. Tries to restart six times; if it still fails it cannot restore. Check airflow and that the fans spin.' },
            { code: '6', meaning: 'Battery high voltage', action: 'Turn fault mode. Battery voltage is higher than the set value. Restores once the voltage drops below the set value.' },
            { code: '7', meaning: 'Bus soft start fault', action: 'Turn fault mode. The soft-start process has run past its time but the bus voltage has not reached the set value. Cannot restore on its own.' },
            { code: '8', meaning: 'Bus short circuit', action: 'Turn fault mode. Inverter on or PFC on with bus voltage below threshold. Cannot restore on its own.' },
            { code: '9', meaning: 'Inverter soft start fault', action: 'Turn fault mode. Bus voltage above the protection point, or the DC component is greater than 20V, or the inverter did not complete within 5 minutes. Cannot restore on its own.' },
            { code: '10', meaning: 'INV over voltage', action: 'Turn fault mode. The inverter output voltage is higher than the set value (276V). Cannot restore on its own.' },
            { code: '11', meaning: 'INV under voltage', action: 'Turn fault mode. In battery mode with no short circuit, the inverter voltage is lower than 160V. Cannot restore on its own.' },
            { code: '12', meaning: 'INV short circuit', action: 'Turn fault mode. In battery or standby mode the inverter voltage is low and the current is above the set value. Tries to restart six times; if it still fails it cannot restore. Unplug the loads before restarting.' },
            { code: '13', meaning: 'Negative power protection', action: 'Turn fault mode. In battery mode the load power is below the set value (negative power, such as -1200W). Cannot restore on its own.' },
            { code: '14', meaning: 'Over load', action: 'Turn fault mode. Overload beyond the limit in the specification. Tries to restart six times; if it still fails it cannot restore. Take some load off before restarting.' },
            { code: '15', meaning: 'Model fault', action: 'Turn fault mode. The unit cannot match any model in model-number detection. Cannot restore. Check whether the control board is assembled incorrectly or the program was burned incorrectly - installer work.' },
            { code: '16', meaning: 'No boot loader', action: 'Turn fault mode. Boot loader missing. Cannot restore in the field; the service manual has the recovery command. Installer or service centre.' },
            { code: '17', meaning: 'Program is being flashed', action: 'The software is being upgraded. Not a failure - it restores by itself once the upgrade finishes. (Documented in the 6 kVA service manual.)' },
            { code: '26', meaning: 'BMS fault', action: 'Turn fault mode. An error code arrived in the BMS message from the lithium battery. Clears when the BMS fault clears, or by turning the BMS communication function off (Program 38 on the 4.2 kVA, 44 on the 1.2 kVA). Check the battery BMS first - single-cell over-voltage and the like.' },
            { code: '28', meaning: 'NTC fault', action: 'Turn fault mode. NTC temperature sensor open circuit. Cannot restore. The service manual asks you to check the NTC plug seats properly on the power board, then power off and restart.' },
            { code: '29', meaning: 'Inverter over current', action: 'Turn fault mode. Instantaneous inverter current above the set value. Tries to restart six times; if it still fails it cannot restore.' },
          ],
          warnSource: 'Haisic 6 kVA (CT6KU) service manual, "2.4 Alarm conditions", cross-checked against the Haisic user manuals (customer-provided)',
          warnWarning: 'Haisic call these Alarm codes - the LCD shows ALA with the number, the red LED flashes and the unit keeps running. That is the difference from a Fault, which stops the inverter. Voltage figures quoted in the alarm table are the ones printed for this model’s battery voltage.',
          warnCodes: [
            { code: '50', meaning: 'Battery open', action: 'Alarm; the battery does not charge. Battery voltage is below the set point. Restores once the battery voltage recovers.' },
            { code: '51', meaning: 'Battery low voltage shutdown', action: 'Alarm; the unit shuts down on low battery or will not power on. Restores once the battery voltage recovers.' },
            { code: '52', meaning: 'Battery low voltage', action: 'Alarm only. Battery voltage is below the set point. Restores once the battery voltage recovers.' },
            { code: '53', meaning: 'Charger short circuit', action: 'Warning; the battery does not charge. Battery voltage is under 5V while charging current is over 4A. Cannot restore - stop and check the battery and its cabling.' },
            { code: '54', meaning: 'Low power discharge', action: 'Alarm. The battery is above the recovery voltage and the discharge time has passed the low-power discharge time set in the programs. Restores once the battery voltage recovers.' },
            { code: '55', meaning: 'Battery over charge', action: 'Alarm; the battery does not charge. Battery voltage is higher than the set value. Can restore.' },
            { code: '56', meaning: 'BMS disconnect', action: 'Alarm; locks to standby mode. No correct BMS response within 10 seconds. Restores when communication recovers. Check the battery communication cable.' },
            { code: '57', meaning: 'Over temperature', action: 'Alarm; the battery does not charge. PFC or INV temperature above the set value. Restores once the temperature drops. Check ventilation.' },
            { code: '58', meaning: 'Fan error', action: 'Alarm. Fan speed is below the set value; if one fan fails the other runs at full speed. Restores once the fan recovers.' },
            { code: '59', meaning: 'EEPROM error', action: 'Alarm. Numerical calibration error. Restores after correct calibration - service work.' },
            { code: '60', meaning: 'Overload', action: 'Alarm; the battery does not charge. Load above 102% for 200-220ms while not on mains priority. Restores once the load is back to normal.' },
            { code: '61', meaning: 'Abnormal generator waveform', action: 'Alarm; keeps running in battery mode. The generator waveform check failed. Can restore. Common with an unstable generator.' },
            { code: '62', meaning: 'PV Energy Weak', action: 'Alarm; turns off PV output and charging. With no battery connected, bus voltage fell below the set value. Restores after 10 minutes.' },
            { code: '63', meaning: 'Synchronization signal fail', action: 'Alarm; turns fault mode. In a parallel set, no synchronization signal restored within the set value. Restores when the signal recovers.' },
            { code: '68', meaning: 'SOC Under', action: 'Alarm; turns standby mode. Lithium battery SOC is below the value set in the Low SOC Shutdown program. Clears when SOC returns to that value + 5%, or by turning off low-SOC shutdown or BMS communication.' },
          ],
          settingsSource: null,
          settingsWarning: 'No LCD setting table was supplied for this model - the document Geonergy sent is the repair manual. Send the 6 kVA user manual and the programs go in here.',
          settingsCodes: [

          ],
        },
      ],
    },
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
          note: 'Nothing is filled in for this series yet. A manual was uploaded before, but not the pages carrying the specs, fault codes, warning codes or program list. Send those pages and they go in here. Until then, ring us with the code on the screen.',
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
          // Felicity publish an IVPS-IVPM series user guide (doc. 358-010148-00
          // on their download page) covering IVPM2512/2524/3524/3548/5024/5048/
          // 7548/10048. It has not been supplied, so nothing is entered here:
          // this is a placeholder so the series is findable, not a stub to fill
          // with guesses.
          id: 'ivpm-ivps-series',
          name: 'IVPM / IVPS Series',
          category: 'Off-Grid Inverter',
          note: 'Nothing is filled in for this series yet. Felicity publish a user guide for it; once Geonergy sends it, the specs, fault codes, warning codes and programs go in here. Until then, ring us with the code on the screen.',
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
