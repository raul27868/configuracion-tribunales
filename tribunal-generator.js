/* Generador provisional. No modifica Google Sheets ni persiste datos personales. */
(function (root) {
  "use strict";
  const DURATION = 60;
  const normalize = value => String(value ?? "").trim().replace(/\s+/g, " ").toLocaleLowerCase("es");
  const email = value => String(value ?? "").trim().toLowerCase();
  const shuffle = values => {
    const copy = [...values];
    for (let i = copy.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [copy[i], copy[j]] = [copy[j], copy[i]];
    }
    return copy;
  };
  function requiredIndex(result, label) {
    const index = result.headers.findIndex(header => normalize(header) === normalize(label));
    if (index === -1) throw new Error('Falta la columna «' + label + '».');
    return index;
  }
  function getConfiguration(result) {
    const config = new Map();
    for (const row of result.records) config.set(normalize(row[0]), String(row[1] ?? "").trim());
    // La normalización de Sheets trata la primera fila como cabecera; aquí también es clave/valor.
    if (result.headers.length >= 2) config.set(normalize(result.headers[0]), String(result.headers[1] ?? "").trim());
    const keys = ["fecha disponibilidad inicio", "fecha disponibilidad fin", "hora disponibilidad inicio", "hora disponibilidad fin"];
    for (const key of keys) if (!config.get(key)) throw new Error('Falta la clave «' + key + '» en Configuración.');
    return { startDate: config.get(keys[0]), endDate: config.get(keys[1]), startTime: config.get(keys[2]), endTime: config.get(keys[3]) };
  }
  function parseDate(value) {
    const match = String(value).trim().match(/^(\d{1,2})[\/-](\d{1,2})[\/-](\d{4})$/);
    const iso = String(value).trim().match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);
    let year, month, day;
    if (iso) [, year, month, day] = iso;
    else if (match) [, day, month, year] = match;
    else throw new Error("Fecha no reconocida: " + value + ". Usa DD/MM/AAAA o AAAA-MM-DD.");
    const date = new Date(Date.UTC(+year, +month - 1, +day));
    if (date.getUTCFullYear() !== +year || date.getUTCMonth() !== +month - 1 || date.getUTCDate() !== +day) throw new Error("Fecha no válida: " + value);
    return date;
  }
  function parseMinutes(value) {
    const match = String(value).trim().match(/^(\d{1,2}):(\d{2})(?::\d{2})?$/);
    if (!match || +match[1] > 23 || +match[2] > 59) throw new Error("Hora no válida: " + value + ". Usa HH:MM.");
    return +match[1] * 60 + +match[2];
  }
  function allowedDates(config) {
    const start = parseDate(config.startDate), end = parseDate(config.endDate);
    if (end < start) throw new Error("La fecha final es anterior a la inicial.");
    if ((end - start) / 86400000 > 365) throw new Error("El rango de fechas supera un año.");
    const dates = [];
    for (let d = new Date(start); d <= end; d.setUTCDate(d.getUTCDate() + 1)) {
      if (d.getUTCDay() !== 0 && d.getUTCDay() !== 6) dates.push(d.toISOString().slice(0, 10));
    }
    if (!dates.length) throw new Error("El intervalo no contiene días laborables.");
    return dates;
  }
  function allowedTimes(config) {
    const start = parseMinutes(config.startTime), end = parseMinutes(config.endTime);
    const times = [];
    for (let min = start; min + DURATION <= end; min += DURATION) {
      times.push(String(Math.floor(min / 60)).padStart(2, "0") + ":" + String(min % 60).padStart(2, "0"));
    }
    if (!times.length) throw new Error("El intervalo horario no permite defensas completas de 60 minutos.");
    return times;
  }
  function eligibleMembers(result) {
    const index = requiredIndex(result, "Correo Electronico");
    const seen = new Set();
    return result.records.map(row => email(row[index])).filter(address => {
      if (!address || seen.has(address)) return false;
      seen.add(address); return true;
    });
  }
  function slotFree(person, date, time, previous) {
    return !previous.some(row => row[1] === date && row[2] === time &&
      [row[0], row[3], row[4], row[5], row[6], row[7]].some(value => email(value) === email(person)));
  }
  function validDate(date, tfm, previous) { return Boolean(date); }
  function validTime(time, tfm, previous) { return Boolean(time); }
  function validRole(person, tfm, picked, previous, date, time) {
    return Boolean(person) && ![tfm[0], tfm[6], tfm[7], ...picked].some(other => email(other) === email(person)) &&
      slotFree(person, date, time, previous);
  }
  function validPresident(person, tfm, picked, previous, date, time) {
    return validRole(person, tfm, picked, previous, date, time);
  }
  function validSecretary(person, tfm, picked, previous, date, time) {
    return validRole(person, tfm, picked, previous, date, time);
  }
  function validVocal(person, tfm, picked, previous, date, time) {
    return validRole(person, tfm, picked, previous, date, time);
  }
  function generate(tfms, configurationSheet, availabilitySheet) {
    const config = getConfiguration(configurationSheet);
    const dates = allowedDates(config), times = allowedTimes(config);
    const members = eligibleMembers(availabilitySheet);
    if (members.length < 3) throw new Error("Se necesitan al menos tres correos distintos en la disponibilidad seleccionada.");
    const original = tfms.records.map(row => [...row]);
    const result = [];
    const notices = [];
    // Aleatorización de orden para no favorecer siempre a las primeras filas.
    const indexed = shuffle(original.map((row, index) => ({ row, index })));
    const assigned = new Array(original.length);
    for (const { row, index } of indexed) {
      let found = null;
      const slots = shuffle(dates.flatMap(date => times.map(time => [date, time])));
      for (const [date, time] of slots) {
        if (!validDate(date, row, result) || !validTime(time, row, result)) continue;
        if (![row[0], row[6], row[7]].filter(Boolean).every(person => slotFree(person, date, time, result))) continue;
        const candidates = shuffle(members);
        const chosen = [];
        for (const [position, validator] of [validPresident, validSecretary, validVocal].entries()) {
          const candidate = candidates.find(person => !chosen.includes(person) && validator(person, row, chosen, result, date, time));
          if (!candidate) break;
          chosen.push(candidate);
          candidates.splice(candidates.indexOf(candidate), 1);
        }
        if (chosen.length === 3) {
          found = [row[0], date, time, ...chosen, row[6], row[7]];
          break;
        }
      }
      if (found) { result.push(found); assigned[index] = found; }
      else {
        assigned[index] = row;
        notices.push("No se encontró asignación para " + (row[0] || "alumno sin correo") + ".");
      }
    }
    return { headers: tfms.headers, records: assigned, assigned: result.length, notices, availabilityCount: members.length };
  }
  root.TribunalGenerator = { generate, getConfiguration, allowedDates, allowedTimes, eligibleMembers,
    validDate, validTime, validPresident, validSecretary, validVocal, durationMinutes: DURATION };
})(window);
