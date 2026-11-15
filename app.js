(() => {
  'use strict';

  const TRACKS = Array.isArray(window.TRACKS) ? window.TRACKS : [];

  const SCALE_MAX_HZ = 1000;
  const HZ_MIN = 20;
  const HZ_MAX = 2000;
  const DRONE_HZ = 80;
  const DRONE_DB = -28;
  const FADE_S = 0.04;
  const DISPOSE_DELAY_MS = 120;
  const ANNOUNCE_MIN_GAP_MS = 3000;
  const SPIKE_MIN_GAP_MS = 5000;
  const SPEECH_MIN_GAP_MS = 5000;
  const SCOPE_BARS = 32;
  const SCOPE_FFT = 256;

  const NOTE_NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];

  const GLYPHS = {
    standby: '○',
    nominal: '●',
    elevated: '▲',
    extreme: '■',
    critical: '■'
  };

  const LEVEL_TO_BAND = {
    standby: 'cyan',
    nominal: 'cyan',
    elevated: 'amber',
    extreme: 'red',
    critical: 'red'
  };

  const TRACK_EXTRAS = {
    'track-01': {
      source: 'ODIAC Global Fossil-Fuel CO2 Emissions (2023)',
      mapping: 'Industrial sawtooth pulse. Higher CO2 ppm raises pitch and opens filter; longitude pans stereo.',
      guide: 'Track one. Carbon dioxide emissions. Industrial sawtooth pulse pans across longitude as plumes intensify.',
      voiceBlurb: 'an industrial sawtooth pulse with stereo longitude panning'
    },
    'track-02': {
      source: 'NASA GISS Surface Temperature Analysis (GISTEMP)',
      mapping: 'Smooth portamento sine pad. Temperature delta glides pitch and filter cutoff across polar sectors.',
      guide: 'Track two. Global temperature anomalies. A smooth sine pad tracks warming sectors from Antarctic to High Arctic.',
      voiceBlurb: 'a smooth portamento sine pad with stereo panning'
    },
    'track-03': {
      source: 'NASA VIIRS Active Fire Radiative Power',
      mapping: 'Percussive square plucks. Calm frames rest on the 80 Hz drone; VIIRS brightness drives filter cutoff.',
      guide: 'Track three. Wildfire radiative power. Calm frames rest in silence; active fire clusters pan across stereo.',
      voiceBlurb: 'percussive square plucks with VIIRS brightness filtering'
    }
  };

  const clamp01 = (v) => Math.min(1, Math.max(0, v));
  const clampPan = (v) => Math.min(1, Math.max(-1, Number.isFinite(v) ? v : 0));
  const pad2 = (n) => String(n).padStart(2, '0');

  function normHz(v) {
    return typeof v === 'number' && Number.isFinite(v) && v > 0
      ? Math.min(HZ_MAX, Math.max(HZ_MIN, v))
      : null;
  }

  function freqToNoteName(hz) {
    if (typeof hz !== 'number' || !Number.isFinite(hz) || hz <= 0) return '--';
    const midi = Math.round(69 + 12 * Math.log2(hz / 440));
    const name = NOTE_NAMES[((midi % 12) + 12) % 12];
    const octave = Math.floor(midi / 12) - 1;
    return `${name}${octave}`;
  }

  function evaluateTrackState(track, freq) {
    const states = track && Array.isArray(track.states) ? track.states : [];
    if (states.length === 0) {
      return { maxHz: Infinity, label: 'NOMINAL', level: 'nominal', rest: false };
    }
    if (typeof freq !== 'number' || !Number.isFinite(freq)) {
      return { ...states[0], rest: Boolean(states[0].rest) };
    }
    for (let i = 0; i < states.length; i++) {
      const st = states[i];
      if (freq <= st.maxHz) {
        return { ...st, rest: Boolean(st.rest) };
      }
    }
    const last = states[states.length - 1];
    return { ...last, rest: Boolean(last.rest) };
  }

  function bandForLevel(level) {
    return LEVEL_TO_BAND[level] || 'cyan';
  }

  function computeFrameIndex(track, currentTime, duration) {
    const len = track && Array.isArray(track.frequencies) ? track.frequencies.length : 0;
    if (len === 0) return 0;
    const progress = (duration && Number.isFinite(duration))
      ? Math.max(0, Math.min(1, currentTime / duration))
      : 0;
    return Math.min(len - 1, Math.max(0, Math.floor(progress * len)));
  }

  function getHotspotForIndex(track, idx, activeState, metric) {
    const fallback = (track && track.defaultHotspot) || {
      region: 'GLOBAL ATMOSPHERIC BACKGROUND',
      lat: '0.0° EQ',
      lon: '0.0° PM',
      x: 50,
      y: 50,
      pan: 0
    };
    if (!track) return fallback;
    if ((activeState && activeState.rest) || (metric && metric.p === 0)) {
      return track.calmHotspot || fallback;
    }
    const hotspots = Array.isArray(track.hotspots) ? track.hotspots : [];
    for (let i = 0; i < hotspots.length; i++) {
      const h = hotspots[i];
      if (idx >= h.startIdx && idx <= h.endIdx) {
        return h;
      }
    }
    return fallback;
  }

  function formatScientificMetric(track, idx) {
    const m = track && Array.isArray(track.metrics) ? track.metrics[idx] : null;
    if (!track || !m) {
      return { label: 'SCIENTIFIC METRIC', value: '--', speech: 'no metric' };
    }
    if (typeof m.ppm === 'number') {
      return {
        label: 'CO2 COLUMN CONCENTRATION',
        value: `${m.ppm} ppm`,
        speech: `${m.ppm} parts per million CO2`
      };
    }
    if (typeof m.deltaC === 'number') {
      const sign = m.deltaC > 0 ? '+' : '';
      return {
        label: 'SURFACE TEMP ANOMALY',
        value: `${sign}${m.deltaC.toFixed(2)} °C`,
        speech: `${sign}${m.deltaC.toFixed(2)} degrees Celsius`
      };
    }
    if (typeof m.p === 'number' && typeof m.b === 'number') {
      if (m.p === 0) {
        return {
          label: 'VIIRS FIRE RADIATIVE POWER',
          value: '0 PX · 0 BRIGHTNESS',
          speech: '0 active fire pixels'
        };
      }
      return {
        label: 'VIIRS FIRE RADIATIVE POWER',
        value: `${m.p} PX · ${m.b} PEAK`,
        speech: `${m.p} fire pixels, peak brightness ${m.b} of 255`
      };
    }
    return { label: 'SCIENTIFIC METRIC', value: '--', speech: 'no metric' };
  }

  function computeFilterCutoff(track, freq, metric) {
    if (track && track.waveform === 'square') {
      const brightness = metric && Number.isFinite(metric.b) ? metric.b : 128;
      return 600 + clamp01(brightness / 255) * 3600;
    }
    const baseHz = typeof freq === 'number' && Number.isFinite(freq) ? freq : 220;
    return 600 + clamp01((baseHz - 120) / 600) * 3200;
  }

  function fmtHz(hz) {
    return typeof hz === 'number' && Number.isFinite(hz) ? hz.toFixed(2) : '----';
  }

  function fmtClock(s) {
    const clean = Math.max(0, Math.floor(Number(s) || 0));
    const mins = String(Math.floor(clean / 60)).padStart(2, '0');
    const secs = String(clean % 60).padStart(2, '0');
    return `${mins}:${secs}`;
  }

  function fmtPan(pan) {
    const p = clampPan(pan);
    if (p < -0.02) return `L ${Math.abs(p).toFixed(2)}`;
    if (p > 0.02) return `R ${p.toFixed(2)}`;
    return 'C 0.00';
  }

  function getTrackExtras(track) {
    const fallbackMapping = `Sonified with a ${track.waveform || 'sine'} synthesizer mapped to satellite telemetry.`;
    return TRACK_EXTRAS[track.id] || {
      source: track.code || 'NASA Earth Observations',
      mapping: fallbackMapping,
      guide: `${track.code || 'Track'}. ${track.title}. ${track.description || ''}`.slice(0, 195),
      voiceBlurb: `a ${track.waveform || 'sine'} synthesizer`
    };
  }

  const state = {
    trackIndex: -1,
    lastIdx: -1,
    level: 'standby',
    band: 'cyan',
    targetHz: null,
    isResting: false,
    lastRenderedHzText: '----',
    audioReady: null,
    graph: null,
    calCleanup: null,
    raf: 0,
    guideOn: false,
    speechSupported: false,
    toneAvailable: false,
    switchToken: 0,
    switching: false,
    lastAnnounceAt: 0,
    lastSpikeAt: 0,
    lastSpeechAt: 0,
    pendingAnnounce: null,
    announceTimer: 0,
    flip: false,
    accent: '#00D1FF',
    dpr: 1,
    reducedMotion: false,
    lastScopeDrawAt: 0,
    pluckActiveUntil: 0
  };

  const dom = {};

  function cacheDom() {
    dom.root = document.documentElement;
    dom.body = document.body;
    dom.btnGuide = document.getElementById('btn-guide');
    dom.guideState = document.getElementById('guide-state');
    dom.guideHint = document.getElementById('guide-hint');
    dom.btnDescribe = document.getElementById('btn-describe');
    dom.feedMeta = document.getElementById('feed-meta');
    dom.video = document.getElementById('video');
    dom.videoError = document.getElementById('video-error');
    dom.btnPlay = document.getElementById('btn-play');
    dom.playIcon = document.getElementById('play-icon');
    dom.playText = document.getElementById('play-text');
    dom.seek = document.getElementById('seek');
    dom.tElapsed = document.getElementById('t-elapsed');
    dom.tTotal = document.getElementById('t-total');
    dom.trackCode = document.getElementById('track-code');
    dom.hzValue = document.getElementById('hz-value');
    dom.hzNote = document.getElementById('hz-note');
    dom.noteReadout = document.getElementById('note-readout');
    dom.frameReadout = document.getElementById('frame-readout');
    dom.sectorRegion = document.getElementById('sector-region');
    dom.sectorCoords = document.getElementById('sector-coords');
    dom.panThumb = document.getElementById('pan-thumb');
    dom.panReadout = document.getElementById('pan-readout');
    dom.metricLabel = document.getElementById('metric-label');
    dom.metricValue = document.getElementById('metric-value');
    dom.statusBadge = document.getElementById('status-badge');
    dom.statusGlyph = document.getElementById('status-glyph');
    dom.statusText = document.getElementById('status-text');
    dom.hzScale = document.getElementById('hz-scale');
    dom.hzMarker = document.getElementById('hz-marker');
    dom.hzTick1 = document.getElementById('hz-tick-1');
    dom.hzTick2 = document.getElementById('hz-tick-2');
    dom.bandLegend = document.getElementById('band-legend');
    dom.btnTestNominal = document.getElementById('btn-test-nominal');
    dom.btnTestElevated = document.getElementById('btn-test-elevated');
    dom.btnTestCritical = document.getElementById('btn-test-critical');
    dom.trackSource = document.getElementById('track-source');
    dom.trackDesc = document.getElementById('track-desc');
    dom.trackMapping = document.getElementById('track-mapping');
    dom.audioStatus = document.getElementById('audio-status');
    dom.scopeCanvas = document.getElementById('scope-canvas');
    dom.trackList = document.getElementById('track-list');
    dom.liveRegion = document.getElementById('live-region');
    dom.trackBtns = [];
  }

  function writeLiveRegion(msg) {
    if (!dom.liveRegion) return;
    dom.liveRegion.textContent = '';
    state.flip = !state.flip;
    const suffix = state.flip ? '\u200B' : '';
    requestAnimationFrame(() => {
      dom.liveRegion.textContent = msg + suffix;
    });
  }

  function announce(msg, { priority = false } = {}) {
    if (!msg) return;
    const now = performance.now();
    if (priority) {
      if (state.announceTimer) {
        clearTimeout(state.announceTimer);
        state.announceTimer = 0;
      }
      state.pendingAnnounce = null;
      state.lastAnnounceAt = now;
      writeLiveRegion(msg);
      return;
    }
    const gap = now - state.lastAnnounceAt;
    if (gap >= ANNOUNCE_MIN_GAP_MS || state.lastAnnounceAt === 0) {
      state.lastAnnounceAt = now;
      writeLiveRegion(msg);
    } else {
      state.pendingAnnounce = msg;
      if (!state.announceTimer) {
        state.announceTimer = setTimeout(() => {
          state.announceTimer = 0;
          const nextMsg = state.pendingAnnounce;
          state.pendingAnnounce = null;
          if (nextMsg) {
            state.lastAnnounceAt = performance.now();
            writeLiveRegion(nextMsg);
          }
        }, ANNOUNCE_MIN_GAP_MS - gap);
      }
    }
  }

  function cancelSpeech() {
    if (state.speechSupported) {
      try {
        window.speechSynthesis.cancel();
      } catch (_) {}
    }
  }

  function speak(text) {
    if (!state.speechSupported || !text) return;
    try {
      window.speechSynthesis.cancel();
      const u = new SpeechSynthesisUtterance(String(text).slice(0, 195));
      u.lang = 'en-US';
      window.speechSynthesis.speak(u);
    } catch (_) {}
  }

  function describeNow() {
    const track = TRACKS[state.trackIndex];
    const idx = Math.max(0, state.lastIdx);
    const label = dom.statusText ? dom.statusText.textContent : 'STANDBY';
    const liveHz = state.graph ? state.graph.voice.liveHz() : null;
    const hz = state.isResting ? null : (liveHz ?? state.targetHz);
    const hzPhrase = state.isResting
      ? 'silent rest on 80 hertz drone'
      : hz != null
        ? `${hz.toFixed(2)} hertz, note ${freqToNoteName(hz)}`
        : 'standby';

    if (!track) {
      return `${label}. ${hzPhrase}.`;
    }
    const activeState = evaluateTrackState(track, state.targetHz);
    const metric = formatScientificMetric(track, idx);
    const hotspot = getHotspotForIndex(track, idx, activeState, track.metrics ? track.metrics[idx] : null);
    const frameNum = (idx + 1) * (track.frameStep || 30);
    return `${track.code}, frame ${frameNum}. ${hotspot.region}, ${hotspot.lat}, ${hotspot.lon}. ${label}. ${metric.speech}. ${hzPhrase}.`;
  }

  function bootAudio() {
    if (!state.toneAvailable) return Promise.resolve(false);
    if (!state.audioReady) {
      state.audioReady = Tone.start().then(
        () => true,
        () => false
      );
    }
    return state.audioReady;
  }

  function registerFirstGesture() {
    const onFirstGesture = () => {
      document.removeEventListener('click', onFirstGesture, true);
      document.removeEventListener('keydown', onFirstGesture, true);
      bootAudio();
    };
    document.addEventListener('click', onFirstGesture, true);
    document.addEventListener('keydown', onFirstGesture, true);
  }

  function createVoiceForTrack(track, panner, filter) {
    const waveform = track.waveform || 'sine';

    if (waveform === 'square') {
      const synth = new Tone.Synth({
        oscillator: { type: 'square' },
        envelope: { attack: 0.008, decay: 0.14, sustain: 0.08, release: 0.12 }
      });
      synth.connect(filter);

      let lastHz = null;
      let activeUntil = 0;

      return {
        levelDb: -18,
        update(freq, activeState, hotspot, metric, now) {
          panner.pan.rampTo(clampPan(hotspot.pan), 0.25, now);
          filter.frequency.rampTo(computeFilterCutoff(track, freq, metric), 0.2, now);

          if (activeState.rest || freq == null) {
            try {
              synth.triggerRelease(now);
            } catch (_) {}
            lastHz = null;
            activeUntil = 0;
            state.pluckActiveUntil = 0;
            return;
          }
          synth.triggerAttackRelease(freq, '16n', now);
          lastHz = freq;
          activeUntil = performance.now() + 360;
          state.pluckActiveUntil = activeUntil;
        },
        release(now) {
          try {
            synth.triggerRelease(now);
          } catch (_) {}
          lastHz = null;
          activeUntil = 0;
          state.pluckActiveUntil = 0;
        },
        liveHz() {
          return performance.now() <= activeUntil ? lastHz : null;
        },
        dispose() {
          try {
            synth.dispose();
          } catch (_) {}
        }
      };
    }

    if (waveform === 'sawtooth') {
      const synth = new Tone.Synth({
        oscillator: { type: 'sawtooth' },
        envelope: { attack: 0.02, decay: 0.1, sustain: 0.85, release: 0.12 }
      });
      const dist = new Tone.Distortion(0.28);
      const trem = new Tone.Tremolo(4, 0.7).start();
      synth.connect(dist);
      dist.connect(trem);
      trem.connect(filter);

      let held = false;
      let currentHz = null;

      return {
        levelDb: -22,
        update(freq, activeState, hotspot, metric, now) {
          panner.pan.rampTo(clampPan(hotspot.pan), 0.25, now);
          filter.frequency.rampTo(computeFilterCutoff(track, freq, metric), 0.2, now);

          if (activeState.rest || freq == null) {
            if (held) {
              synth.triggerRelease(now);
              held = false;
            }
            currentHz = null;
            return;
          }
          currentHz = freq;
          if (!held) {
            synth.triggerAttack(freq, now);
            held = true;
          } else {
            synth.frequency.rampTo(freq, 0.12, now);
          }
          const rate = 3 + 7 * clamp01((freq - 130) / (600 - 130));
          trem.frequency.rampTo(rate, 0.12, now);
        },
        release(now) {
          if (held) {
            try {
              synth.triggerRelease(now);
            } catch (_) {}
            held = false;
          }
          currentHz = null;
        },
        liveHz() {
          if (!held) return null;
          const v = Number(synth.frequency.value);
          return Number.isFinite(v) && v > 0 ? v : currentHz;
        },
        dispose() {
          [synth, dist, trem].forEach((n) => {
            try {
              n.dispose();
            } catch (_) {}
          });
        }
      };
    }

    const synth = new Tone.Synth({
      oscillator: { type: 'sine' },
      envelope: { attack: 0.35, decay: 0.2, sustain: 0.9, release: 0.9 }
    });
    const chorus = new Tone.Chorus(4, 2.5, 0.45).start();
    const delay = new Tone.FeedbackDelay('8n', 0.25);
    delay.wet.value = 0.2;
    synth.connect(chorus);
    chorus.connect(delay);
    delay.connect(filter);

    let held = false;
    let currentHz = null;

    return {
      levelDb: -16,
      update(freq, activeState, hotspot, metric, now) {
        panner.pan.rampTo(clampPan(hotspot.pan), 0.25, now);
        filter.frequency.rampTo(computeFilterCutoff(track, freq, metric), 0.2, now);

        if (activeState.rest || freq == null) {
          if (held) {
            synth.triggerRelease(now);
            held = false;
          }
          currentHz = null;
          return;
        }
        currentHz = freq;
        if (!held) {
          synth.triggerAttack(freq, now);
          held = true;
        } else {
          synth.frequency.rampTo(freq, 0.12, now);
        }
      },
      release(now) {
        if (held) {
          try {
            synth.triggerRelease(now);
          } catch (_) {}
          held = false;
        }
        currentHz = null;
      },
      liveHz() {
        if (!held) return null;
        const v = Number(synth.frequency.value);
        return Number.isFinite(v) && v > 0 ? v : currentHz;
      },
      dispose() {
        [synth, chorus, delay].forEach((n) => {
          try {
            n.dispose();
          } catch (_) {}
        });
      }
    };
  }

  function startAudio() {
    if (!state.toneAvailable || state.graph) return;
    const track = TRACKS[state.trackIndex];
    if (!track) return;

    const limiter = new Tone.Limiter(-3);
    const analyser = new Tone.Analyser('waveform', SCOPE_FFT);
    limiter.connect(analyser);
    analyser.toDestination();

    const bus = new Tone.Gain(0);
    bus.connect(limiter);

    const droneGain = new Tone.Gain(Tone.dbToGain(DRONE_DB));
    droneGain.connect(bus);

    const osc = new Tone.Oscillator({ type: 'sine', frequency: DRONE_HZ });
    osc.connect(droneGain);
    osc.start();

    const panner = new Tone.Panner(0);
    panner.connect(bus);

    const voiceGain = new Tone.Gain(1);
    voiceGain.connect(panner);

    const filter = new Tone.Filter({ type: 'lowpass', frequency: 1800, Q: 1.5 });
    filter.connect(voiceGain);

    const voice = createVoiceForTrack(track, panner, filter);
    voiceGain.gain.value = Tone.dbToGain(voice.levelDb);

    const now = Tone.now();
    bus.gain.setValueAtTime(0, now);
    bus.gain.linearRampToValueAtTime(1, now + FADE_S);

    state.graph = {
      osc,
      droneGain,
      panner,
      filter,
      voice,
      voiceGain,
      bus,
      limiter,
      analyser,
      dispose() {
        try {
          voice.dispose();
        } catch (_) {}
        [osc, droneGain, filter, voiceGain, panner, bus, limiter, analyser].forEach((n) => {
          try {
            n.dispose();
          } catch (_) {}
        });
      }
    };

    if (dom.audioStatus) {
      dom.audioStatus.textContent = 'Audio live';
    }

    if (!state.raf) {
      state.raf = requestAnimationFrame(frame);
    }
  }

  function stopCalibrationAudio() {
    if (typeof state.calCleanup === 'function') {
      const cleanup = state.calCleanup;
      state.calCleanup = null;
      cleanup();
    }
  }

  function stopAllAudio({ keepSpeech = false } = {}) {
    stopCalibrationAudio();
    if (state.raf) {
      cancelAnimationFrame(state.raf);
      state.raf = 0;
    }
    if (!keepSpeech) {
      cancelSpeech();
    }
    const g = state.graph;
    state.graph = null;
    state.pluckActiveUntil = 0;

    if (state.toneAvailable && dom.audioStatus) {
      dom.audioStatus.textContent = 'Audio idle';
    }

    if (!g) {
      renderReadout(state.targetHz, state.isResting);
      drawScope(true, performance.now());
      return;
    }

    try {
      const t = Tone.now();
      g.bus.gain.cancelScheduledValues(t);
      g.bus.gain.setValueAtTime(g.bus.gain.value, t);
      g.bus.gain.linearRampToValueAtTime(0, t + FADE_S);
      try {
        g.voice.release(t);
      } catch (_) {}
      try {
        g.osc.stop(t + FADE_S + 0.01);
      } catch (_) {}
    } catch (_) {}

    setTimeout(() => {
      g.dispose();
    }, DISPOSE_DELAY_MS);

    renderReadout(state.targetHz, state.isResting);
    drawScope(true, performance.now());
  }

  function playCalibrationTone(targetLevel) {
    const track = TRACKS[state.trackIndex];
    if (!track) return;

    if (!state.toneAvailable) {
      announce('Audio engine unavailable for calibration preview.', { priority: true });
      return;
    }

    stopCalibrationAudio();

    let sampleIdx = -1;
    for (let i = 0; i < track.frequencies.length; i++) {
      const st = evaluateTrackState(track, track.frequencies[i]);
      if (st.level === targetLevel && !st.rest) {
        sampleIdx = i;
        break;
      }
    }
    if (sampleIdx === -1) {
      sampleIdx = 0;
    }

    const freq = normHz(track.frequencies[sampleIdx]) || (targetLevel === 'extreme' ? 698.46 : targetLevel === 'elevated' ? 440 : 220);
    const activeState = evaluateTrackState(track, freq);
    const metric = track.metrics ? track.metrics[sampleIdx] : null;
    const cutoff = computeFilterCutoff(track, freq, metric);
    const note = freqToNoteName(freq);

    announce(`Calibration sample: ${activeState.label}, ${freq.toFixed(2)} hertz, note ${note}.`, { priority: true });

    bootAudio().then((ok) => {
      if (!ok) return;
      stopCalibrationAudio();

      const waveform = track.waveform || 'sine';
      const gain = new Tone.Gain(Tone.dbToGain(-16)).toDestination();
      const filter = new Tone.Filter({ type: 'lowpass', frequency: cutoff, Q: 1.5 }).connect(gain);
      const synth = new Tone.Synth({
        oscillator: { type: waveform },
        envelope: waveform === 'square'
          ? { attack: 0.008, decay: 0.14, sustain: 0.25, release: 0.14 }
          : { attack: 0.03, decay: 0.12, sustain: 0.7, release: 0.15 }
      }).connect(filter);

      const now = Tone.now();
      synth.triggerAttackRelease(freq, 0.4, now);

      let disposed = false;
      const disposeNodes = () => {
        if (disposed) return;
        disposed = true;
        clearTimeout(timer);
        try {
          synth.triggerRelease();
        } catch (_) {}
        [synth, filter, gain].forEach((n) => {
          try {
            n.dispose();
          } catch (_) {}
        });
        if (state.calCleanup === disposeNodes) {
          state.calCleanup = null;
        }
      };

      const timer = setTimeout(disposeNodes, 600);
      state.calCleanup = disposeNodes;
    });
  }

  function refreshAccentColor() {
    const computed = getComputedStyle(dom.root).getPropertyValue('--accent').trim();
    if (computed) {
      state.accent = computed;
    }
  }

  function renderBand(band, level, labelText) {
    state.band = band;
    state.level = level;
    dom.root.setAttribute('data-band', band);
    dom.root.setAttribute('data-level', level);
    if (dom.statusBadge) {
      dom.statusBadge.setAttribute('data-level', level);
    }
    if (dom.statusGlyph) {
      dom.statusGlyph.textContent = GLYPHS[level] || GLYPHS.standby;
    }
    if (dom.statusText) {
      dom.statusText.textContent = labelText;
    }
    refreshAccentColor();
  }

  function renderReadout(hz, isRest = false, targetFreq = hz) {
    const valid = typeof hz === 'number' && Number.isFinite(hz);
    const text = fmtHz(valid ? hz : null);
    if (text !== state.lastRenderedHzText && dom.hzValue) {
      dom.hzValue.textContent = text;
      state.lastRenderedHzText = text;
    }

    const noteSource = typeof targetFreq === 'number' && Number.isFinite(targetFreq) ? targetFreq : hz;
    const note = typeof noteSource === 'number' && Number.isFinite(noteSource)
      ? freqToNoteName(noteSource)
      : '--';

    if (dom.hzNote) {
      dom.hzNote.textContent = valid ? `(${note})` : '(--)';
    }

    if (dom.noteReadout) {
      if (typeof targetFreq === 'number' && Number.isFinite(targetFreq)) {
        dom.noteReadout.textContent = isRest
          ? `${targetFreq.toFixed(2)} Hz (${note}) · REST`
          : `${targetFreq.toFixed(2)} Hz (${note})`;
      } else {
        dom.noteReadout.textContent = 'STANDBY';
      }
    }

    if (dom.hzMarker) {
      const pos = valid ? clamp01(hz / SCALE_MAX_HZ) * 100 : 0;
      dom.hzMarker.style.setProperty('--pos', pos.toFixed(2));
    }
  }

  function renderFrameReadout(track, idx, standby = false) {
    if (!dom.frameReadout || !track) return;
    const step = track.frameStep || 30;
    const totalFrames = (Array.isArray(track.frequencies) ? track.frequencies.length : 0) * step;
    const activeFrame = standby ? 0 : (idx + 1) * step;
    dom.frameReadout.textContent = `FRAME ${activeFrame} / ${totalFrames}`;
  }

  function renderGeospatial(hotspot) {
    if (!hotspot) return;
    if (dom.sectorRegion) {
      dom.sectorRegion.textContent = hotspot.region;
    }
    if (dom.sectorCoords) {
      dom.sectorCoords.textContent = hotspot.lat === 'SCANNING...'
        ? `${hotspot.lat} · ${hotspot.lon}`
        : `LAT ${hotspot.lat} · LON ${hotspot.lon}`;
    }
    if (dom.panThumb) {
      const panPct = ((clampPan(hotspot.pan) + 1) / 2) * 100;
      dom.panThumb.style.setProperty('--pan-pos', panPct.toFixed(1));
    }
    if (dom.panReadout) {
      dom.panReadout.textContent = fmtPan(hotspot.pan);
    }
  }

  function renderMetric(track, idx, standby = false) {
    const metric = formatScientificMetric(track, idx);
    if (dom.metricLabel) dom.metricLabel.textContent = metric.label;
    if (dom.metricValue) dom.metricValue.textContent = standby ? '--' : metric.value;
  }

  function renderScaleAndLegend(track) {
    if (!track || !Array.isArray(track.states)) return;

    const nominalCutoff = track.states
      .filter((s) => s.level === 'nominal' && Number.isFinite(s.maxHz))
      .reduce((max, s) => Math.max(max, s.maxHz), 200);
    const elevatedCutoff = track.states
      .filter((s) => s.level === 'elevated' && Number.isFinite(s.maxHz))
      .reduce((max, s) => Math.max(max, s.maxHz), nominalCutoff + 150);

    const stop1 = clamp01(nominalCutoff / SCALE_MAX_HZ) * 100;
    const stop2 = clamp01(elevatedCutoff / SCALE_MAX_HZ) * 100;

    if (dom.hzScale) {
      dom.hzScale.style.setProperty('--stop-1', stop1.toFixed(3));
      dom.hzScale.style.setProperty('--stop-2', stop2.toFixed(3));
    }
    if (dom.hzTick1) {
      dom.hzTick1.style.setProperty('--tick', stop1.toFixed(3));
      dom.hzTick1.textContent = String(nominalCutoff);
    }
    if (dom.hzTick2) {
      dom.hzTick2.style.setProperty('--tick', stop2.toFixed(3));
      dom.hzTick2.textContent = String(elevatedCutoff);
    }

    if (dom.bandLegend) {
      dom.bandLegend.innerHTML = '';
      let prevMax = 0;
      track.states.forEach((st) => {
        const li = document.createElement('li');
        li.className = 'legend__item';
        li.dataset.band = bandForLevel(st.level);

        const glyph = document.createElement('span');
        glyph.setAttribute('aria-hidden', 'true');
        glyph.textContent = GLYPHS[st.level] || '●';

        let rangeLabel;
        if (!Number.isFinite(st.maxHz)) {
          rangeLabel = `Above ${prevMax} Hz`;
        } else if (prevMax === 0) {
          rangeLabel = `Up to ${st.maxHz} Hz`;
        } else {
          rangeLabel = `${prevMax + 1} to ${st.maxHz} Hz`;
        }
        prevMax = Number.isFinite(st.maxHz) ? st.maxHz : prevMax;

        const restSuffix = st.rest ? ' (silent rest)' : '';
        li.append(glyph, ` ${rangeLabel}: ${st.label}${restSuffix}`);
        dom.bandLegend.appendChild(li);
      });
    }
  }

  function renderTrackButtons() {
    if (!dom.trackList) return;
    dom.trackList.innerHTML = '';
    dom.trackBtns = [];

    TRACKS.forEach((track, idx) => {
      const extras = getTrackExtras(track);
      const li = document.createElement('li');
      li.className = 'tracks__item';
      li.style.setProperty('--i', String(idx));

      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'track-btn';
      btn.id = `track-btn-${idx + 1}`;
      btn.dataset.index = String(idx);
      btn.dataset.state = 'idle';
      btn.setAttribute('aria-pressed', 'false');
      btn.setAttribute(
        'aria-label',
        `${track.code}: ${track.title}. Plays the video with ${extras.voiceBlurb}.`
      );

      const lamp = document.createElement('span');
      lamp.className = 'track-btn__lamp';
      lamp.setAttribute('aria-hidden', 'true');

      const num = document.createElement('span');
      num.className = 'track-btn__num';
      num.textContent = track.code || `TRACK ${pad2(idx + 1)}`;

      const title = document.createElement('span');
      title.className = 'track-btn__title';
      title.textContent = track.title;

      const st = document.createElement('span');
      st.className = 'track-btn__state';
      st.setAttribute('aria-hidden', 'true');
      st.textContent = 'Ready';

      btn.append(lamp, num, title, st);
      btn.addEventListener('click', () => onTrackPress(idx));
      li.appendChild(btn);
      dom.trackList.appendChild(li);
      dom.trackBtns.push({ btn, stateEl: st });
    });
  }

  function renderSelection() {
    const isPlaying = dom.video && !dom.video.paused && !dom.video.ended;
    const track = TRACKS[state.trackIndex];

    dom.trackBtns.forEach(({ btn, stateEl }, idx) => {
      const selected = idx === state.trackIndex;
      btn.setAttribute('aria-pressed', selected ? 'true' : 'false');
      if (!selected) {
        btn.dataset.state = 'idle';
        stateEl.textContent = 'Ready';
      } else if (isPlaying) {
        btn.dataset.state = 'playing';
        stateEl.textContent = 'Playing';
      } else {
        btn.dataset.state = 'selected';
        stateEl.textContent = 'Selected';
      }
    });

    if (dom.btnPlay) {
      dom.btnPlay.dataset.state = isPlaying ? 'playing' : 'paused';
      const actionWord = isPlaying ? 'Pause' : 'Play';
      if (dom.playIcon) dom.playIcon.textContent = isPlaying ? '❚❚' : '▶';
      if (dom.playText) dom.playText.textContent = actionWord;
      dom.btnPlay.setAttribute(
        'aria-label',
        track ? `${actionWord} ${track.title}` : actionWord
      );
    }

    if (track) {
      const modeWord = isPlaying ? 'Playing' : 'Paused';
      if (dom.feedMeta) dom.feedMeta.textContent = `${track.code} · ${track.title}`;
      if (dom.trackCode) dom.trackCode.textContent = `${track.code} · ${modeWord}`;
    } else {
      if (dom.feedMeta) dom.feedMeta.textContent = 'Standby';
      if (dom.trackCode) dom.trackCode.textContent = 'No track playing';
    }
  }

  function renderTrackMeta() {
    const track = TRACKS[state.trackIndex];
    if (!track) return;
    const extras = getTrackExtras(track);

    if (dom.trackSource) dom.trackSource.textContent = extras.source;
    if (dom.trackDesc) dom.trackDesc.textContent = track.description;
    if (dom.trackMapping) dom.trackMapping.textContent = extras.mapping;

    const fallbackLen = Array.isArray(track.frequencies) ? track.frequencies.length : 30;
    if (dom.seek) {
      dom.seek.max = String(fallbackLen);
      dom.seek.value = '0';
      dom.seek.setAttribute('aria-valuetext', `0 seconds of ${fallbackLen}`);
    }
    if (dom.tElapsed) dom.tElapsed.textContent = 'T+00:00';
    if (dom.tTotal) dom.tTotal.textContent = fmtClock(fallbackLen);

    renderFrameReadout(track, 0, true);
    renderMetric(track, 0, true);
    renderGeospatial(track.defaultHotspot || getHotspotForIndex(track, 0, { rest: false }, null));
    renderScaleAndLegend(track);
  }

  function updateClockUI(currentTime, duration) {
    const fallbackTotal = Number(dom.seek ? dom.seek.max : 30) || 30;
    const total = (duration && Number.isFinite(duration) && duration > 0) ? duration : fallbackTotal;
    const clamped = Math.min(total, Math.max(0, Number.isFinite(currentTime) ? currentTime : 0));
    if (dom.seek) {
      dom.seek.value = clamped.toFixed(1);
      dom.seek.setAttribute('aria-valuetext', `${Math.floor(clamped)} seconds of ${Math.floor(total)}`);
    }
    if (dom.tElapsed) {
      dom.tElapsed.textContent = `T+${fmtClock(clamped)}`;
    }
  }

  function onThresholdAlert(activeState, hotspot, metric, freq) {
    const now = performance.now();
    const label = activeState.label;
    const rounded = Math.round(freq);
    const note = freqToNoteName(freq);

    if (
      activeState.level === 'extreme' &&
      (now - state.lastSpikeAt >= SPIKE_MIN_GAP_MS || state.lastSpikeAt === 0)
    ) {
      state.lastSpikeAt = now;
      announce(`Warning: ${label}. ${hotspot.region}, ${hotspot.lat}, ${hotspot.lon}. ${rounded} hertz, note ${note}.`);
    }

    if (
      state.guideOn &&
      state.graph &&
      (now - state.lastSpeechAt >= SPEECH_MIN_GAP_MS || state.lastSpeechAt === 0)
    ) {
      state.lastSpeechAt = now;
      speak(`${label} at ${hotspot.region}. ${metric.speech}. ${rounded} hertz.`);
    }
  }

  function applySample(idx, force = false) {
    if (!force && idx === state.lastIdx) return;
    state.lastIdx = idx;

    const track = TRACKS[state.trackIndex];
    if (!track || !Array.isArray(track.frequencies)) return;

    const rawFreq = track.frequencies[idx];
    const freq = normHz(rawFreq);
    const activeState = evaluateTrackState(track, freq);
    const metricObj = track.metrics ? track.metrics[idx] : null;
    const hotspot = getHotspotForIndex(track, idx, activeState, metricObj);
    const metricFormatted = formatScientificMetric(track, idx);
    const band = bandForLevel(activeState.level);
    const prevLevel = state.level;

    state.targetHz = freq;
    state.isResting = Boolean(activeState.rest);

    renderBand(band, activeState.level, activeState.label);
    renderReadout(freq, state.isResting, freq);
    renderFrameReadout(track, idx, false);
    renderMetric(track, idx, false);
    renderGeospatial(hotspot);

    const dur = dom.video && Number.isFinite(dom.video.duration) ? dom.video.duration : 0;
    const cur = dom.video && Number.isFinite(dom.video.currentTime) ? dom.video.currentTime : 0;
    updateClockUI(cur, dur);

    if (state.graph) {
      state.graph.voice.update(freq, activeState, hotspot, metricObj, Tone.now());
    }

    if (
      !state.isResting &&
      freq != null &&
      ((activeState.level === 'extreme' && prevLevel !== 'extreme') ||
        (activeState.level === 'elevated' && prevLevel !== 'elevated' && prevLevel !== 'extreme'))
    ) {
      onThresholdAlert(activeState, hotspot, metricFormatted, freq);
    }
  }

  function syncFromVideo(force = false) {
    if (!dom.video) return;
    const track = TRACKS[state.trackIndex];
    if (!track || !Array.isArray(track.frequencies) || track.frequencies.length === 0) return;

    const dur = (dom.video.duration && Number.isFinite(dom.video.duration) && dom.video.duration > 0)
      ? dom.video.duration
      : 0;
    const currentTime = Number.isFinite(dom.video.currentTime) ? dom.video.currentTime : 0;
    const idx = computeFrameIndex(track, currentTime, dur);

    if (!force && idx === state.lastIdx) {
      updateClockUI(currentTime, dur);
      return;
    }
    applySample(idx, force);
  }

  function frame(ts) {
    if (!state.graph) {
      state.raf = 0;
      return;
    }
    syncFromVideo(false);
    const liveHz = state.isResting ? null : state.graph.voice.liveHz();
    renderReadout(liveHz ?? state.targetHz, state.isResting, state.targetHz);

    if (!state.reducedMotion || ts - state.lastScopeDrawAt >= 100) {
      state.lastScopeDrawAt = ts;
      drawScope(false, ts);
    }
    state.raf = requestAnimationFrame(frame);
  }

  function drawScope(idle = false, ts = performance.now()) {
    const canvas = dom.scopeCanvas;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const w = canvas.width;
    const h = canvas.height;
    const dpr = state.dpr;
    ctx.clearRect(0, 0, w, h);

    const midY = h / 2;
    const live = !idle && Boolean(state.graph);
    const data = live ? state.graph.analyser.getValue() : null;
    const samplesPerBar = data ? Math.max(1, Math.floor(data.length / SCOPE_BARS)) : 8;
    const gap = 2 * dpr;
    const barW = Math.max(2 * dpr, (w - gap * (SCOPE_BARS + 1)) / SCOPE_BARS);
    const freqEnergy = state.targetHz
      ? clamp01((state.targetHz - 100) / 700)
      : 0.25;
    const track = TRACKS[state.trackIndex];
    const isPluckTrack = track && track.waveform === 'square';
    const pluckBurst = isPluckTrack && ts <= state.pluckActiveUntil
      ? clamp01((state.pluckActiveUntil - ts) / 360)
      : 0;

    ctx.save();
    ctx.fillStyle = state.accent;
    if (!live) {
      ctx.globalAlpha = 0.22;
    } else if (state.isResting) {
      ctx.globalAlpha = 0.28;
    } else {
      ctx.globalAlpha = 0.42;
      if (!state.reducedMotion) {
        ctx.shadowColor = state.accent;
        ctx.shadowBlur = 10 * dpr;
      }
    }

    const phase = ts * 0.0028;
    for (let i = 0; i < SCOPE_BARS; i++) {
      let peak = 0;
      if (data) {
        const start = i * samplesPerBar;
        for (let j = 0; j < samplesPerBar; j++) {
          const v = Math.abs(data[start + j] || 0);
          if (v > peak) peak = v;
        }
      }

      let barH;
      if (!live) {
        barH = 2 * dpr;
      } else if (state.isResting) {
        const calmRipple = 0.05 + 0.045 * (0.5 + 0.5 * Math.sin(phase + i * 0.45));
        barH = Math.max(3 * dpr, calmRipple * h);
      } else {
        const harmonicRipple = 0.14 + 0.22 * freqEnergy * (0.5 + 0.5 * Math.sin(phase * 1.9 + i * 0.55));
        const synthBoost = isPluckTrack
          ? pluckBurst * (0.35 + 0.45 * freqEnergy) * (0.65 + 0.35 * Math.sin(i * 0.8 + phase))
          : harmonicRipple;
        const combined = Math.max(peak * 1.45, synthBoost);
        barH = Math.max(4 * dpr, Math.min(h * 0.9, combined * h * 0.88));
      }

      const x = gap + i * (barW + gap);
      const y = midY - barH / 2;
      ctx.fillRect(x, y, barW, barH);
    }
    ctx.restore();

    ctx.save();
    ctx.strokeStyle = state.accent;
    ctx.lineWidth = 2 * dpr;
    ctx.globalAlpha = !live ? 0.4 : state.isResting ? 0.65 : 1;
    if (live && !state.isResting && !state.reducedMotion) {
      ctx.shadowColor = state.accent;
      ctx.shadowBlur = 14 * dpr;
    } else {
      ctx.shadowBlur = 0;
    }

    ctx.beginPath();
    if (!data || !live) {
      ctx.moveTo(0, midY);
      ctx.lineTo(w, midY);
    } else if (state.isResting) {
      const len = 64;
      for (let i = 0; i < len; i++) {
        const x = (i / (len - 1)) * w;
        const y = midY + Math.sin(phase + i * 0.25) * (h * 0.035);
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
    } else {
      const len = data.length;
      for (let i = 0; i < len; i++) {
        const x = (i / (len - 1)) * w;
        const sample = Math.max(-1, Math.min(1, data[i] || 0));
        const y = midY + sample * (h * 0.42);
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
    }
    ctx.stroke();
    ctx.restore();
  }

  function setupScopeResize() {
    if (!dom.scopeCanvas) return;
    const resize = () => {
      state.dpr = Math.min(window.devicePixelRatio || 1, 2);
      const rect = dom.scopeCanvas.getBoundingClientRect();
      const w = Math.max(300, Math.round(rect.width * state.dpr));
      const h = Math.max(120, Math.round(rect.height * state.dpr));
      if (dom.scopeCanvas.width !== w || dom.scopeCanvas.height !== h) {
        dom.scopeCanvas.width = w;
        dom.scopeCanvas.height = h;
      }
      drawScope(!state.graph, performance.now());
    };
    resize();
    if ('ResizeObserver' in window) {
      const ro = new ResizeObserver(resize);
      ro.observe(dom.scopeCanvas);
    } else {
      window.addEventListener('resize', resize);
    }
  }

  function hideVideoError() {
    if (!dom.videoError) return;
    dom.videoError.hidden = true;
    dom.videoError.textContent = '';
  }

  function showVideoError() {
    const track = TRACKS[state.trackIndex];
    if (!track || !dom.videoError) return;
    const msg = `${track.code} video could not load from ${track.videoSrc}.`;
    dom.videoError.textContent = msg;
    dom.videoError.hidden = false;
    stopAllAudio({ keepSpeech: true });
    renderSelection();
    announce(msg, { priority: true });
  }

  function playCurrent(token = state.switchToken) {
    if (!dom.video) return Promise.resolve();
    hideVideoError();
    return bootAudio().then(() => {
      if (token !== state.switchToken) return;
      return dom.video.play().catch((err) => {
        if (token !== state.switchToken) return;
        if (err && err.name !== 'AbortError') {
          showVideoError();
        }
      });
    });
  }

  function loadTrack(index, { silent = false } = {}) {
    const track = TRACKS[index];
    if (!track || !dom.video) return;
    state.switching = true;
    dom.video.pause();
    stopAllAudio();
    hideVideoError();

    state.trackIndex = index;
    state.lastIdx = -1;
    state.targetHz = null;
    state.isResting = false;
    state.level = 'standby';

    dom.video.src = track.videoSrc;
    dom.video.load();
    state.switching = false;

    renderSelection();
    renderTrackMeta();
    renderBand('cyan', 'standby', 'STANDBY');
    renderReadout(null, false, null);

    if (!silent) {
      const extras = getTrackExtras(track);
      announce(`${track.code} selected: ${track.title}. Playing.`, { priority: true });
      if (state.guideOn) {
        speak(extras.guide);
      }
    }
  }

  function onTrackPress(index) {
    const hasError = dom.videoError && !dom.videoError.hidden;
    if (index === state.trackIndex && dom.video && !hasError) {
      if (dom.video.paused || dom.video.ended) {
        return playCurrent(state.switchToken);
      }
      dom.video.pause();
      return Promise.resolve();
    }
    const token = ++state.switchToken;
    loadTrack(index, { silent: false });
    return playCurrent(token);
  }

  function renderGuideButton() {
    if (!dom.btnGuide || !dom.guideState) return;
    dom.btnGuide.setAttribute('aria-pressed', state.guideOn ? 'true' : 'false');
    dom.guideState.textContent = state.guideOn ? 'On' : 'Off';
  }

  function toggleGuide() {
    state.guideOn = !state.guideOn;
    renderGuideButton();
    try {
      localStorage.setItem('ejb.guide', state.guideOn ? '1' : '0');
    } catch (_) {}

    if (state.guideOn) {
      announce('Audio guide on.', { priority: true });
      const track = TRACKS[state.trackIndex];
      const extras = track ? getTrackExtras(track) : null;
      speak(extras ? `Audio guide on. ${extras.guide}` : 'Audio guide on.');
    } else {
      cancelSpeech();
      announce('Audio guide off.', { priority: true });
    }
  }

  function isInteractiveControl(target) {
    if (!target) return false;
    const tag = target.tagName;
    return (
      tag === 'BUTTON' ||
      tag === 'INPUT' ||
      tag === 'A' ||
      tag === 'SELECT' ||
      tag === 'TEXTAREA' ||
      Boolean(target.isContentEditable)
    );
  }

  function wireEvents() {
    if (dom.btnPlay) {
      dom.btnPlay.addEventListener('click', () => {
        if (!dom.video) return;
        if (dom.video.paused || dom.video.ended) {
          playCurrent(state.switchToken);
        } else {
          dom.video.pause();
        }
      });
    }

    if (dom.btnTestNominal) {
      dom.btnTestNominal.addEventListener('click', () => playCalibrationTone('nominal'));
    }
    if (dom.btnTestElevated) {
      dom.btnTestElevated.addEventListener('click', () => playCalibrationTone('elevated'));
    }
    if (dom.btnTestCritical) {
      dom.btnTestCritical.addEventListener('click', () => playCalibrationTone('extreme'));
    }

    if (dom.seek) {
      dom.seek.addEventListener('input', () => {
        if (!dom.video) return;
        const targetSec = Number(dom.seek.value) || 0;
        const dur = (dom.video.duration && Number.isFinite(dom.video.duration) && dom.video.duration > 0)
          ? dom.video.duration
          : 0;
        try {
          dom.video.currentTime = targetSec;
        } catch (_) {}
        const track = TRACKS[state.trackIndex];
        if (track && dur > 0) {
          const idx = computeFrameIndex(track, targetSec, dur);
          applySample(idx, true);
        } else {
          updateClockUI(targetSec, dur);
        }
      });
    }

    if (dom.btnGuide) {
      dom.btnGuide.addEventListener('click', toggleGuide);
    }

    if (dom.btnDescribe) {
      dom.btnDescribe.addEventListener('click', () => {
        const msg = describeNow();
        announce(msg, { priority: true });
        speak(msg);
      });
    }

    if (dom.video) {
      dom.video.addEventListener('loadedmetadata', () => {
        const dur = dom.video.duration;
        if (Number.isFinite(dur) && dur > 0) {
          if (dom.seek) {
            dom.seek.max = dur.toFixed(1);
            const cur = Number.isFinite(dom.video.currentTime) ? dom.video.currentTime : 0;
            dom.seek.setAttribute('aria-valuetext', `${Math.floor(cur)} seconds of ${Math.floor(dur)}`);
          }
          if (dom.tTotal) {
            dom.tTotal.textContent = fmtClock(dur);
          }
        }
      });

      dom.video.addEventListener('playing', () => {
        hideVideoError();
        startAudio();
        syncFromVideo(true);
        renderSelection();
      });

      dom.video.addEventListener('pause', () => {
        if (state.switching) return;
        stopAllAudio({ keepSpeech: false });
        renderSelection();
      });

      dom.video.addEventListener('ended', () => {
        stopAllAudio({ keepSpeech: false });
        renderSelection();
        announce('Track finished.');
      });

      dom.video.addEventListener('waiting', () => {
        stopAllAudio({ keepSpeech: true });
      });

      dom.video.addEventListener('emptied', () => {
        stopAllAudio({ keepSpeech: true });
      });

      dom.video.addEventListener('error', () => {
        showVideoError();
      });

      dom.video.addEventListener('timeupdate', () => syncFromVideo(false));
      dom.video.addEventListener('seeked', () => syncFromVideo(true));
    }

    document.addEventListener('visibilitychange', () => {
      if (document.hidden && dom.video && !dom.video.paused) {
        dom.video.pause();
      }
    });

    window.addEventListener('pagehide', () => {
      stopAllAudio({ keepSpeech: false });
    });

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        cancelSpeech();
        return;
      }
      if (e.ctrlKey || e.metaKey || e.altKey) return;

      if (e.code === 'Space' && !isInteractiveControl(e.target)) {
        e.preventDefault();
        if (!dom.video) return;
        if (dom.video.paused || dom.video.ended) {
          playCurrent(state.switchToken);
        } else {
          dom.video.pause();
        }
      }
    });
  }

  function init() {
    cacheDom();

    const mq = window.matchMedia
      ? window.matchMedia('(prefers-reduced-motion: reduce)')
      : null;
    if (mq) {
      state.reducedMotion = mq.matches;
      if (mq.addEventListener) {
        mq.addEventListener('change', (e) => {
          state.reducedMotion = e.matches;
        });
      }
    }

    state.speechSupported =
      'speechSynthesis' in window && 'SpeechSynthesisUtterance' in window;
    if (!state.speechSupported) {
      if (dom.btnGuide) dom.btnGuide.disabled = true;
      if (dom.btnDescribe) dom.btnDescribe.disabled = true;
      if (dom.guideHint) {
        dom.guideHint.textContent = 'Speech is not supported in this browser.';
      }
    } else {
      try {
        state.guideOn = localStorage.getItem('ejb.guide') === '1';
      } catch (_) {
        state.guideOn = false;
      }
      renderGuideButton();
    }

    state.toneAvailable = typeof window.Tone !== 'undefined';
    if (!state.toneAvailable) {
      if (dom.audioStatus) dom.audioStatus.textContent = 'Audio unavailable';
      announce('Audio engine did not load. Video plays without sound.', {
        priority: true
      });
    }

    renderTrackButtons();
    registerFirstGesture();
    wireEvents();
    refreshAccentColor();
    setupScopeResize();

    if (TRACKS.length > 0) {
      loadTrack(0, { silent: true });
    }

    setTimeout(() => {
      if (dom.body) dom.body.classList.remove('is-booting');
    }, 900);

    if (window.location.search.includes('debug')) {
      window.__EJB = {
        TRACKS,
        state,
        evaluateTrackState,
        bandForLevel,
        freqToNoteName,
        computeFrameIndex,
        getHotspotForIndex,
        formatScientificMetric,
        computeFilterCutoff,
        stopAllAudio
      };
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
