/**
 * MandiMitra AI - Weather Analysis & Risk Engine
 * 
 * Rules:
 * - Weather conditions appear as an advisory warning and optional risk adjustment.
 * - Does NOT silently change the default ranking (toggle must be ON to apply penalty).
 * - Open-Meteo standard daily fields:
 *   weather_code, temperature_2m_max, precipitation_sum, precipitation_probability_max, wind_speed_10m_max
 * - Forecasts are labeled "Forecasts are estimates and may change."
 */

export const WEATHER_THRESHOLDS = {
  // Risk triggers
  RISK_PRECIPITATION_SUM_MM: 20.0, // >= 20 mm heavy rain
  RISK_PRECIPITATION_PROB_PCT: 70, // >= 70% probability
  RISK_WIND_SPEED_KMH: 40.0, // >= 40 km/h high wind
  RISK_WEATHER_CODES: [65, 82, 95, 96, 99], // Heavy rain, violent rain showers, thunderstorm, hail

  // Caution triggers
  CAUTION_PRECIPITATION_SUM_MM: 5.0, // 5 to 20 mm moderate rain
  CAUTION_PRECIPITATION_PROB_PCT: 40, // 40% to 70% probability
  CAUTION_MAX_TEMP_C: 40.0, // >= 40°C extreme heat
  CAUTION_WEATHER_CODES: [53, 55, 61, 63, 80, 81] // Moderate drizzle/rain, moderate showers
};

// Documented small percentage penalties applied ONLY when toggle is ON
export const WEATHER_RISK_PENALTY_RATES = {
  clear: 0.0,     // 0%
  caution: 0.005, // 0.5% of net return
  risk: 0.015     // 1.5% of net return
};

/**
 * WMO Weather Code Descriptions and Icons
 */
export const WMO_WEATHER_MAP = {
  0: { label: 'Clear Sky', icon: 'Sun', severity: 'clear' },
  1: { label: 'Mainly Clear', icon: 'SunDim', severity: 'clear' },
  2: { label: 'Partly Cloudy', icon: 'CloudSun', severity: 'clear' },
  3: { label: 'Overcast', icon: 'Cloud', severity: 'clear' },
  45: { label: 'Foggy', icon: 'CloudFog', severity: 'caution' },
  48: { label: 'Depositing Rime Fog', icon: 'CloudFog', severity: 'caution' },
  51: { label: 'Light Drizzle', icon: 'CloudDrizzle', severity: 'clear' },
  53: { label: 'Moderate Drizzle', icon: 'CloudDrizzle', severity: 'caution' },
  55: { label: 'Dense Drizzle', icon: 'CloudDrizzle', severity: 'caution' },
  61: { label: 'Slight Rain', icon: 'CloudRain', severity: 'caution' },
  63: { label: 'Moderate Rain', icon: 'CloudRain', severity: 'caution' },
  65: { label: 'Heavy Rain', icon: 'CloudRainWind', severity: 'risk' },
  80: { label: 'Slight Rain Showers', icon: 'CloudRain', severity: 'caution' },
  81: { label: 'Moderate Showers', icon: 'CloudRain', severity: 'caution' },
  82: { label: 'Violent Showers', icon: 'CloudRainWind', severity: 'risk' },
  95: { label: 'Thunderstorm', icon: 'CloudLightning', severity: 'risk' },
  96: { label: 'Thunderstorm with Hail', icon: 'CloudLightning', severity: 'risk' },
  99: { label: 'Severe Thunderstorm', icon: 'CloudLightning', severity: 'risk' }
};

/**
 * Classifies weather condition from daily forecast object
 * 
 * @param {Object} daily - Open-Meteo daily forecast object
 * @param {Object} [customThresholds] - Optional configurable thresholds override
 * @returns {Object} { level: 'clear' | 'caution' | 'risk', reasons: Array<string>, primaryDay: Object }
 */
export function classifyWeather(daily, customThresholds = {}) {
  const th = { ...WEATHER_THRESHOLDS, ...customThresholds };

  if (!daily || !daily.time || !daily.time.length) {
    return {
      level: 'clear',
      reasons: ['Weather data unavailable (neutral)'],
      isAvailable: false
    };
  }

  // Evaluate day 0 (intended travel/dispatch day)
  const weatherCode = Number(daily.weather_code?.[0] ?? 0);
  const precipSum = Number(daily.precipitation_sum?.[0] ?? 0);
  const precipProb = Number(daily.precipitation_probability_max?.[0] ?? 0);
  const maxTemp = Number(daily.temperature_2m_max?.[0] ?? 30);
  const maxWind = Number(daily.wind_speed_10m_max?.[0] ?? 10);

  const reasons = [];
  let isRisk = false;
  let isCaution = false;

  // 1. Risk Evaluation
  if (precipSum >= th.RISK_PRECIPITATION_SUM_MM) {
    isRisk = true;
    reasons.push(`Heavy rainfall expected (${precipSum.toFixed(1)} mm)`);
  } else if (precipProb >= th.RISK_PRECIPITATION_PROB_PCT) {
    isRisk = true;
    reasons.push(`High probability of rain (${precipProb}%)`);
  }

  if (th.RISK_WEATHER_CODES.includes(weatherCode)) {
    const codeDesc = WMO_WEATHER_MAP[weatherCode]?.label || 'Severe storm';
    isRisk = true;
    if (!reasons.some(r => r.includes(codeDesc))) {
      reasons.push(`${codeDesc} warning`);
    }
  }

  if (maxWind >= th.RISK_WIND_SPEED_KMH) {
    isRisk = true;
    reasons.push(`High wind gusts (${maxWind.toFixed(0)} km/h)`);
  }

  // 2. Caution Evaluation (if not already risk)
  if (!isRisk) {
    if (precipSum >= th.CAUTION_PRECIPITATION_SUM_MM) {
      isCaution = true;
      reasons.push(`Moderate rainfall (${precipSum.toFixed(1)} mm)`);
    } else if (precipProb >= th.CAUTION_PRECIPITATION_PROB_PCT) {
      isCaution = true;
      reasons.push(`Chance of rain (${precipProb}%)`);
    }

    if (th.CAUTION_WEATHER_CODES.includes(weatherCode)) {
      const codeDesc = WMO_WEATHER_MAP[weatherCode]?.label || 'Rain showers';
      isCaution = true;
      if (!reasons.some(r => r.includes(codeDesc))) {
        reasons.push(codeDesc);
      }
    }

    if (maxTemp >= th.CAUTION_MAX_TEMP_C) {
      isCaution = true;
      reasons.push(`Extreme heat alert (${maxTemp.toFixed(1)}°C)`);
    }
  }

  let level = 'clear';
  if (isRisk) {
    level = 'risk';
  } else if (isCaution) {
    level = 'caution';
  } else {
    reasons.push('Clear and favorable transport conditions');
  }

  return {
    level,
    reasons,
    isAvailable: true,
    day0: {
      date: daily.time[0],
      weatherCode,
      label: WMO_WEATHER_MAP[weatherCode]?.label || 'Fair',
      icon: WMO_WEATHER_MAP[weatherCode]?.icon || 'Sun',
      tempMax: maxTemp,
      precipSum,
      precipProb,
      windSpeed: maxWind
    },
    days: daily.time.map((d, i) => ({
      date: d,
      weatherCode: Number(daily.weather_code?.[i] ?? 0),
      label: WMO_WEATHER_MAP[daily.weather_code?.[i]]?.label || 'Fair',
      icon: WMO_WEATHER_MAP[daily.weather_code?.[i]]?.icon || 'Sun',
      tempMax: Number(daily.temperature_2m_max?.[i] ?? 30),
      precipSum: Number(daily.precipitation_sum?.[i] ?? 0),
      precipProb: Number(daily.precipitation_probability_max?.[i] ?? 0),
      windSpeed: Number(daily.wind_speed_10m_max?.[i] ?? 10)
    }))
  };
}

/**
 * Computes risk penalty in rupees
 * Documented small percentage penalty applied ONLY when toggle is ON
 * 
 * @param {string} level - 'clear' | 'caution' | 'risk'
 * @param {number} netReturn - Baseline net return in rupees
 * @returns {number} Penalty in rupees
 */
export function weatherRiskPenalty(level, netReturn) {
  const rate = WEATHER_RISK_PENALTY_RATES[level] || 0.0;
  return Math.round(Math.max(0, netReturn * rate) * 100) / 100;
}

/**
 * Built-in Sample Weather Snapshot for Demo and Offline use.
 * Overrides Akola APMC with heavy rain (95 Thunderstorm, 28mm rain) to demonstrate
 * the weather warning and the ranking adjustment toggle.
 */
export const SAMPLE_DEMO_WEATHER = {
  status: 'sample',
  updatedAt: '10:30 AM',
  notice: 'Forecasts are estimates and may change. (Sample Demo Mode)',
  mandis: {
    amravati_apmc: {
      status: 'available',
      daily: {
        time: ['2026-10-03', '2026-10-04', '2026-10-05'],
        weather_code: [0, 1, 0],
        temperature_2m_max: [33.5, 34.0, 33.8],
        precipitation_sum: [0.0, 0.0, 0.0],
        precipitation_probability_max: [5, 10, 5],
        wind_speed_10m_max: [12.0, 11.0, 10.5]
      }
    },
    // Akola has simulated storm / heavy rain for the demo scenario
    akola_apmc: {
      status: 'available',
      isSampleOverride: true,
      daily: {
        time: ['2026-10-03', '2026-10-04', '2026-10-05'],
        weather_code: [95, 65, 80],
        temperature_2m_max: [28.2, 29.0, 30.1],
        precipitation_sum: [28.5, 18.0, 4.2],
        precipitation_probability_max: [85, 75, 40],
        wind_speed_10m_max: [38.5, 26.0, 18.0]
      }
    },
    nagpur_apmc: {
      status: 'available',
      daily: {
        time: ['2026-10-03', '2026-10-04', '2026-10-05'],
        weather_code: [2, 1, 0],
        temperature_2m_max: [34.8, 35.1, 34.5],
        precipitation_sum: [0.0, 0.0, 0.0],
        precipitation_probability_max: [10, 15, 5],
        wind_speed_10m_max: [14.0, 12.5, 11.0]
      }
    },
    yavatmal_apmc: {
      status: 'available',
      daily: {
        time: ['2026-10-03', '2026-10-04', '2026-10-05'],
        weather_code: [1, 2, 1],
        temperature_2m_max: [33.8, 34.2, 33.9],
        precipitation_sum: [0.2, 1.0, 0.0],
        precipitation_probability_max: [20, 25, 10],
        wind_speed_10m_max: [13.2, 12.0, 11.5]
      }
    },
    wardha_apmc: {
      status: 'available',
      daily: {
        time: ['2026-10-03', '2026-10-04', '2026-10-05'],
        weather_code: [0, 0, 1],
        temperature_2m_max: [34.0, 34.5, 34.2],
        precipitation_sum: [0.0, 0.0, 0.0],
        precipitation_probability_max: [5, 5, 10],
        wind_speed_10m_max: [11.0, 10.5, 10.0]
      }
    },
    washim_apmc: {
      status: 'available',
      daily: {
        time: ['2026-10-03', '2026-10-04', '2026-10-05'],
        weather_code: [61, 2, 1],
        temperature_2m_max: [31.5, 32.2, 33.0],
        precipitation_sum: [6.5, 1.2, 0.0],
        precipitation_probability_max: [55, 30, 15],
        wind_speed_10m_max: [19.0, 16.0, 12.0]
      }
    },
    buldhana_apmc: {
      status: 'available',
      daily: {
        time: ['2026-10-03', '2026-10-04', '2026-10-05'],
        weather_code: [1, 0, 1],
        temperature_2m_max: [32.0, 32.5, 32.8],
        precipitation_sum: [0.0, 0.0, 0.0],
        precipitation_probability_max: [15, 10, 5],
        wind_speed_10m_max: [15.0, 13.5, 12.0]
      }
    },
    achalpur_apmc: {
      status: 'available',
      daily: {
        time: ['2026-10-03', '2026-10-04', '2026-10-05'],
        weather_code: [0, 1, 0],
        temperature_2m_max: [33.0, 33.4, 33.2],
        precipitation_sum: [0.0, 0.0, 0.0],
        precipitation_probability_max: [5, 10, 5],
        wind_speed_10m_max: [10.5, 11.0, 9.8]
      }
    }
  }
};
