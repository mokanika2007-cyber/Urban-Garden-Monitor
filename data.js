// Shared data and rules. Replace Garden.plots and Garden.sites with calls to your Flask API later.
const CROPS = {
  Tomato:  { m: [55, 75], ph: [6, 6.8],   t: [18, 32] },
  Okra:    { m: [50, 70], ph: [6, 6.8],   t: [22, 36] },
  Spinach: { m: [55, 75], ph: [6.5, 7.5], t: [8, 26] },
  Beans:   { m: [45, 65], ph: [6, 7],     t: [16, 32] },
  Chilli:  { m: [50, 70], ph: [6, 7],     t: [20, 34] },
  Lettuce: { m: [60, 80], ph: [6, 7],     t: [10, 26] }
};

const NAMES = ['Tomato', 'Okra', 'Spinach', 'Beans', 'Chilli', 'Lettuce', 'Okra', 'Tomato', 'Beans', 'Spinach', 'Chilli', 'Lettuce'];
const SEED = [62, 48, 70, 38, 66, 58, 55, 81, 52, 64, 72, 59];

const Garden = {
  rain: 35,
  wxSrc: 'live',
  wxAge: 0,
  plots: NAMES.map((crop, i) => {
    const m = SEED[i];
    const h = Array.from({ length: 24 }, () => m + (Math.random() - 0.5) * 6);
    return { id: 'ABC'[Math.floor(i / 4)] + (i % 4 + 1), crop, m, t: 27 + Math.random() * 4, ph: 6.2 + Math.random() * 0.9, h, off: false };
  }),
  sites: [
    { name: 'Sector 14 Community Plot', yield: 86, shade: 'Partial shade', water: 'Low', beds: 24 },
    { name: 'Railway Colony Garden', yield: 78, shade: 'Full sun', water: 'Medium', beds: 18 },
    { name: 'Rooftop, Civil Lines', yield: 71, shade: 'Full sun', water: 'Medium', beds: 12 },
    { name: 'Lake Road Allotments', yield: 64, shade: 'Shade after 2 pm', water: 'Low', beds: 30 },
    { name: 'School Yard Beds', yield: 52, shade: 'Heavy shade', water: 'High', beds: 10 }
  ],

  // Turns one plot's readings into a status and a plain-language next step.
  judge(p) {
    if (p.off) return { s: 'off', msg: 'Sensor offline. Showing the last good reading, marked as an estimate. Check the node’s battery and signal.' };
    const c = CROPS[p.crop], crop = p.crop.toLowerCase();
    if (p.m < c.m[0]) return { s: 'warn', msg: `Water now. Moisture is ${p.m.toFixed(0)}% against a ${c.m[0]}–${c.m[1]}% target for ${crop}.` };
    if (p.m > c.m[1]) return { s: 'warn', msg: `Skip watering and check drainage. Moisture is ${p.m.toFixed(0)}%, above the ${c.m[1]}% ceiling.` };
    if (p.ph < c.ph[0]) return { s: 'warn', msg: `Soil is acidic at pH ${p.ph.toFixed(1)}. Work garden lime into the bed before the next planting.` };
    if (p.ph > c.ph[1]) return { s: 'warn', msg: `pH ${p.ph.toFixed(1)} is high. Add compost or a little sulphur.` };
    if (p.t > c.t[1]) return { s: 'warn', msg: 'Hot bed. Mulch it and water at dusk.' };
    if (this.rain >= 60) return { s: 'ok', msg: 'Readings are in range. Rain is likely, so hold off watering today.' };
    return { s: 'ok', msg: `All readings are in range for ${crop}. No action needed.` };
  },

  // Moves every online sensor a little, as a real reading would.
  tick() {
    this.plots.forEach(p => {
      if (!p.off) {
        p.m = Math.max(20, Math.min(95, p.m - 0.5 + (Math.random() - 0.5) * 2.4));
        p.t += (Math.random() - 0.5) * 0.6;
      }
      p.h.push(p.m);
      p.h.shift();
    });
  }
};
Garden.plots[3].ph = 5.6;
