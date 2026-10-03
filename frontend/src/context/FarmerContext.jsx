import React, { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react';
import { rankMarkets, VEHICLE_PRESETS } from '../engine/engine';
import { loadAppData, fetchPrices } from '../api';
import fallbackPrices from '../../../data/prices.json';
import fallbackDistances from '../../../data/distances.json';

const FarmerContext = createContext(null);

export function FarmerProvider({ children }) {
  const [lang, setLang] = useState('en'); // 'en' | 'hi' | 'mr'
  const [loading, setLoading] = useState(true);
  const [apiData, setApiData] = useState({
    markets: [],
    crops: fallbackPrices.crops || [],
    distances: fallbackDistances,
    dataStatus: null,
    isLiveApi: false
  });

  // Central Form State
  const [formState, setFormState] = useState({
    crop: 'soybean',
    quantity: 50,
    location: 'morshi_town',
    vehicle: 'pickup',
    ratePerKm: 18,
    roundTrip: false,
    priceAdjust: 0,
    includeWeatherRisk: false,
    extraCosts: {
      loadingPerQntl: 12.0,
      marketFeePercent: 1.0,
      commissionPercent: 0.0,
      weighmentPerQntl: 6.0,
      spoilageFactor: 0.00015
    }
  });

  // Validation errors
  const [errors, setErrors] = useState({});
  const [geoLocating, setGeoLocating] = useState(false);
  const [geoMessage, setGeoMessage] = useState(null);

  // Load backend / local data on initial mount
  useEffect(() => {
    let isMounted = true;
    async function initData() {
      try {
        setLoading(true);
        const data = await loadAppData();
        if (isMounted) {
          setApiData(data);
        }
      } catch (err) {
        console.error('Failed to load initial API data:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    }
    initData();
    return () => {
      isMounted = false;
    };
  }, []);

  // Update a single form field with validation
  const updateField = useCallback((field, value) => {
    setFormState((prev) => {
      const updated = { ...prev, [field]: value };

      // Auto-prefill transport rate when vehicle changes unless user explicitly sets another rate
      if (field === 'vehicle' && VEHICLE_PRESETS[value]) {
        updated.ratePerKm = VEHICLE_PRESETS[value].ratePerKm;
      }

      return updated;
    });

    // Validate inputs
    setErrors((prevErrors) => {
      const nextErrors = { ...prevErrors };
      if (field === 'quantity') {
        const val = Number(value);
        if (isNaN(val) || val <= 0) {
          nextErrors.quantity = 'Quantity must be a positive number greater than 0 quintals.';
        } else if (val > 1000) {
          nextErrors.quantity = 'For bulk loads exceeding 1,000 quintals, consider multi-rake rail freight.';
        } else {
          delete nextErrors.quantity;
        }
      }

      if (field === 'ratePerKm') {
        const val = Number(value);
        if (isNaN(val) || val <= 0) {
          nextErrors.ratePerKm = 'Transport freight rate must be greater than ₹0/km.';
        } else {
          delete nextErrors.ratePerKm;
        }
      }

      return nextErrors;
    });
  }, []);

  // Browser Geolocation: Snap to nearest start town
  const snapToCurrentLocation = useCallback(() => {
    if (!navigator.geolocation) {
      setGeoMessage({
        type: 'error',
        text: 'Geolocation is not supported by your browser.'
      });
      return;
    }

    setGeoLocating(true);
    setGeoMessage(null);

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const userLat = pos.coords.latitude;
        const userLon = pos.coords.longitude;

        const origins = apiData.distances?.farmerOrigins || fallbackDistances.farmerOrigins || [];
        if (origins.length === 0) {
          setGeoLocating(false);
          return;
        }

        // Find nearest origin
        let nearestOrigin = origins[0];
        let minDistance = Infinity;

        for (const origin of origins) {
          const lat = origin.lat || origin.latitude;
          const lon = origin.lon || origin.longitude;
          const d = Math.hypot(userLat - lat, userLon - lon);
          if (d < minDistance) {
            minDistance = d;
            nearestOrigin = origin;
          }
        }

        const snappedId = nearestOrigin.id || nearestOrigin.location_id;
        updateField('location', snappedId);

        setGeoMessage({
          type: 'success',
          text: `Snapped to nearest cluster: ${nearestOrigin.name} (${nearestOrigin.district})`
        });
        setGeoLocating(false);
      },
      (err) => {
        setGeoLocating(false);
        setGeoMessage({
          type: 'error',
          text: `Unable to access GPS: ${err.message}. Using selected location.`
        });
      },
      { timeout: 8000 }
    );
  }, [apiData.distances, updateField]);

  // Reactive Rank Calculation
  const recommendations = useMemo(() => {
    const qty = Math.max(0.1, Number(formState.quantity) || 0.1);
    return rankMarkets({
      crop: formState.crop,
      quantity: qty,
      location: formState.location,
      vehicle: formState.vehicle,
      ratePerKm: formState.ratePerKm,
      priceAdjust: formState.priceAdjust,
      roundTrip: formState.roundTrip,
      extraCosts: formState.extraCosts,
      lang,
      includeWeatherRisk: formState.includeWeatherRisk,
      weatherData: apiData.mandisWeather
    });
  }, [formState, lang, apiData.mandisWeather]);

  const value = {
    lang,
    setLang,
    loading,
    apiData,
    formState,
    setFormState,
    updateField,
    errors,
    recommendations,
    geoLocating,
    geoMessage,
    snapToCurrentLocation
  };

  return <FarmerContext.Provider value={value}>{children}</FarmerContext.Provider>;
}

export function useFarmer() {
  const context = useContext(FarmerContext);
  if (!context) {
    throw new Error('useFarmer must be used within a FarmerProvider');
  }
  return context;
}
