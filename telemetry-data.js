window.TRACKS = [
  {
    id: 'track-01',
    code: 'TRACK 01',
    title: 'Carbon Dioxide (CO2) Emissions',
    videoSrc: 'Videos/odiac_2023_720p.mp4',
    waveform: 'sawtooth',
    frameStep: 30,
    description: 'ODIAC global fossil-fuel CO2 plume pixel density sonified via industrial sawtooth pulse.',
    states: [
      { maxHz: 200, label: 'BASELINE / CLEAN AIR', level: 'nominal' },
      { maxHz: 450, label: 'MODERATE EMISSION LEVEL', level: 'elevated' },
      { maxHz: Infinity, label: 'HIGH EMISSION PLUME', level: 'extreme' }
    ],
    frequencies: [
      329.63, 329.63, 329.63, 329.63, 329.63, 329.63, 130.81, 130.81, 329.63, 130.81,
      130.81, 329.63, 130.81, 130.81, 130.81, 329.63, 130.81, 130.81, 130.81, 329.63,
      130.81, 329.63, 130.81, 130.81, 130.81, 130.81, 130.81, 130.81, 130.81, 130.81,
      130.81, 130.81, 130.81, 130.81, 130.81, 130.81, 130.81, 329.63, 130.81, 130.81,
      130.81, 329.63, 329.63, 329.63, 329.63, 587.33, 329.63, 587.33, 329.63, 587.33,
      587.33, 329.63, 587.33, 587.33, 587.33, 329.63, 329.63, 329.63, 329.63, 329.63
    ],
    metrics: [
      { ppm: 424 }, { ppm: 425 }, { ppm: 424 }, { ppm: 423 }, { ppm: 424 }, { ppm: 425 },
      { ppm: 412 }, { ppm: 412 }, { ppm: 424 }, { ppm: 413 }, { ppm: 412 }, { ppm: 424 },
      { ppm: 412 }, { ppm: 411 }, { ppm: 412 }, { ppm: 424 }, { ppm: 412 }, { ppm: 412 },
      { ppm: 413 }, { ppm: 424 }, { ppm: 412 }, { ppm: 424 }, { ppm: 412 }, { ppm: 411 },
      { ppm: 412 }, { ppm: 412 }, { ppm: 413 }, { ppm: 412 }, { ppm: 412 }, { ppm: 411 },
      { ppm: 412 }, { ppm: 412 }, { ppm: 412 }, { ppm: 413 }, { ppm: 412 }, { ppm: 411 },
      { ppm: 412 }, { ppm: 424 }, { ppm: 412 }, { ppm: 412 }, { ppm: 413 }, { ppm: 424 },
      { ppm: 425 }, { ppm: 425 }, { ppm: 426 }, { ppm: 439 }, { ppm: 425 }, { ppm: 441 },
      { ppm: 426 }, { ppm: 443 }, { ppm: 445 }, { ppm: 425 }, { ppm: 444 }, { ppm: 446 },
      { ppm: 442 }, { ppm: 425 }, { ppm: 424 }, { ppm: 424 }, { ppm: 423 }, { ppm: 424 }
    ],
    hotspots: [
      { startIdx: 0, endIdx: 5, region: 'NORTH AMERICAN INDUSTRIAL CORRIDOR', lat: '40.7° N', lon: '82.4° W', x: 26, y: 36, pan: -0.65 },
      { startIdx: 8, endIdx: 21, region: 'EUROPEAN & RHINE-RUHR BASIN', lat: '51.4° N', lon: '7.0° E', x: 51, y: 31, pan: 0.05 },
      { startIdx: 37, endIdx: 44, region: 'INDO-GANGETIC & SOUTH ASIAN PLUME', lat: '26.8° N', lon: '80.9° E', x: 70, y: 44, pan: 0.45 },
      { startIdx: 45, endIdx: 54, region: 'EAST ASIAN URBAN-INDUSTRIAL BELT', lat: '35.8° N', lon: '116.4° E', x: 79, y: 39, pan: 0.72 }
    ],
    defaultHotspot: { region: 'GLOBAL ATMOSPHERIC BACKGROUND', lat: '0.0° EQ', lon: '0.0° PM', x: 50, y: 50, pan: 0.0 }
  },
  {
    id: 'track-02',
    code: 'TRACK 02',
    title: 'Global Temperature Anomalies',
    videoSrc: 'Videos/2023GISTEMP_Map_HD.mp4',
    waveform: 'sine',
    frameStep: 30,
    description: 'NASA GISTEMP historical red-vs-blue thermal shifts rendered as a smooth portamento sine pad.',
    states: [
      { maxHz: 260, label: 'COOLER / HISTORICAL ERA', level: 'nominal' },
      { maxHz: 380, label: 'NORMAL BASELINE PERIOD', level: 'nominal' },
      { maxHz: 550, label: 'MODERATE WARMING TREND', level: 'elevated' },
      { maxHz: Infinity, label: 'EXTREME WARMING SPIKE', level: 'extreme' }
    ],
    frequencies: [
      329.63, 329.63, 329.63, 440.0, 329.63, 220.0, 329.63, 329.63, 329.63, 440.0,
      440.0, 659.25, 440.0, 329.63, 440.0, 329.63, 329.63, 329.63, 440.0, 659.25,
      440.0, 698.46, 659.25, 698.46, 698.46, 698.46, 698.46, 698.46, 698.46, 698.46
    ],
    metrics: [
      { deltaC: 0.05 }, { deltaC: 0.05 }, { deltaC: 0.05 }, { deltaC: 0.68 }, { deltaC: 0.05 },
      { deltaC: -0.35 }, { deltaC: 0.05 }, { deltaC: 0.05 }, { deltaC: 0.05 }, { deltaC: 0.68 },
      { deltaC: 0.68 }, { deltaC: 1.24 }, { deltaC: 0.68 }, { deltaC: 0.05 }, { deltaC: 0.68 },
      { deltaC: 0.05 }, { deltaC: 0.05 }, { deltaC: 0.05 }, { deltaC: 0.68 }, { deltaC: 1.24 },
      { deltaC: 0.68 }, { deltaC: 1.48 }, { deltaC: 1.24 }, { deltaC: 1.48 }, { deltaC: 1.48 },
      { deltaC: 1.48 }, { deltaC: 1.48 }, { deltaC: 1.48 }, { deltaC: 1.48 }, { deltaC: 1.48 }
    ],
    hotspots: [
      { startIdx: 0, endIdx: 8, region: 'SOUTHERN OCEAN & ANTARCTIC BASIN', lat: '62.5° S', lon: '45.0° W', x: 38, y: 82, pan: -0.25 },
      { startIdx: 9, endIdx: 14, region: 'NORTH ATLANTIC & EUROPEAN SECTOR', lat: '54.2° N', lon: '12.5° W', x: 46, y: 29, pan: -0.08 },
      { startIdx: 18, endIdx: 22, region: 'SIBERIAN & EURASIAN HEAT DOME', lat: '64.0° N', lon: '95.0° E', x: 73, y: 24, pan: 0.55 },
      { startIdx: 23, endIdx: 29, region: 'HIGH ARCTIC AMPLIFICATION ZONE', lat: '78.5° N', lon: '15.0° E', x: 52, y: 14, pan: 0.08 }
    ],
    defaultHotspot: { region: 'GLOBAL THERMAL BASELINE', lat: '0.0° EQ', lon: '0.0° PM', x: 50, y: 50, pan: 0.0 }
  },
  {
    id: 'track-03',
    code: 'TRACK 03',
    title: 'Wildfire Radiative Power (VIIRS)',
    videoSrc: 'Videos/fires_frp_VIIRS_2048p30.mp4',
    waveform: 'square',
    frameStep: 30,
    description: 'VIIRS thermal flare-up clusters translated into percussive plucks with silent rests on calm frames.',
    states: [
      { maxHz: 200, label: 'CALM / NO ACTIVE FIRES', level: 'nominal', rest: true },
      { maxHz: 400, label: 'LOW BACKGROUND BLAZES', level: 'nominal', rest: false },
      { maxHz: 650, label: 'MODERATE BURN ZONES', level: 'elevated', rest: false },
      { maxHz: Infinity, label: 'HIGH FIRE ACTIVITY', level: 'extreme', rest: false }
    ],
    frequencies: [
      783.99, 164.81, 783.99, 783.99, 783.99, 523.25, 164.81, 783.99, 783.99, 783.99,
      783.99, 164.81, 783.99, 783.99, 783.99, 783.99, 329.63, 783.99, 783.99, 164.81,
      523.25, 523.25, 783.99, 783.99, 783.99, 523.25, 523.25, 783.99, 783.99, 523.25
    ],
    metrics: [
      { p: 2, b: 253 }, { p: 0, b: 0 }, { p: 2, b: 255 }, { p: 2, b: 220 }, { p: 3, b: 211 },
      { p: 3, b: 87 }, { p: 0, b: 0 }, { p: 2, b: 254 }, { p: 2, b: 252 }, { p: 2, b: 197 },
      { p: 3, b: 162 }, { p: 0, b: 0 }, { p: 3, b: 251 }, { p: 2, b: 247 }, { p: 3, b: 252 },
      { p: 1, b: 252 }, { p: 1, b: 79 }, { p: 2, b: 255 }, { p: 2, b: 228 }, { p: 0, b: 0 },
      { p: 2, b: 148 }, { p: 1, b: 132 }, { p: 2, b: 253 }, { p: 2, b: 254 }, { p: 1, b: 212 },
      { p: 3, b: 128 }, { p: 1, b: 113 }, { p: 1, b: 254 }, { p: 2, b: 250 }, { p: 1, b: 149 }
    ],
    hotspots: [
      { startIdx: 0, endIdx: 5, region: 'AMAZON BASIN & MATO GROSSO ARC', lat: '11.8° S', lon: '55.4° W', x: 34, y: 63, pan: -0.45 },
      { startIdx: 7, endIdx: 10, region: 'CANADIAN BOREAL & PACIFIC NORTHWEST', lat: '56.2° N', lon: '118.5° W', x: 20, y: 27, pan: -0.75 },
      { startIdx: 12, endIdx: 18, region: 'CONGO BASIN & SUB-SAHARAN SAVANNA', lat: '6.4° S', lon: '23.6° E', x: 55, y: 58, pan: 0.15 },
      { startIdx: 20, endIdx: 29, region: 'SOUTHEAST ASIAN & INDONESIAN PEATLANDS', lat: '2.2° S', lon: '113.9° E', x: 78, y: 56, pan: 0.68 }
    ],
    calmHotspot: { region: 'NO ACTIVE THERMAL ANOMALIES', lat: 'SCANNING...', lon: 'GLOBAL SWEEP', x: 50, y: 50, pan: 0.0 },
    defaultHotspot: { region: 'NO ACTIVE THERMAL ANOMALIES', lat: 'SCANNING...', lon: 'GLOBAL SWEEP', x: 50, y: 50, pan: 0.0 }
  }
];
