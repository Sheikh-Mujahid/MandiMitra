import React, { useEffect, useRef } from 'react';
import L from 'leaflet';
import { Navigation } from 'lucide-react';
import { translations } from '../i18n/translations';

export default function MandiMap({ rankedMarkets, origins, selectedOriginId, lang }) {
  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const t = translations[lang] || translations.en;

  const origin = origins.find(o => o.id === selectedOriginId) || origins[0] || {
    lat: 20.0898,
    lon: 74.1089,
    name: 'Farmer Origin'
  };

  useEffect(() => {
    if (!mapContainerRef.current) return;

    // Initialize or reuse map
    if (!mapInstanceRef.current) {
      mapInstanceRef.current = L.map(mapContainerRef.current, {
        center: [origin.lat, origin.lon],
        zoom: 8,
        scrollWheelZoom: false
      });

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap contributors'
      }).addTo(mapInstanceRef.current);
    }

    const map = mapInstanceRef.current;
    setTimeout(() => {
      if (map) map.invalidateSize();
    }, 150);

    
    // Clear previous dynamic layers (markers and polylines)
    map.eachLayer((layer) => {
      if (layer instanceof L.Marker || layer instanceof L.Polyline) {
        map.removeLayer(layer);
      }
    });

    // 1. Farmer Origin Icon (Green Barn / Farm pin)
    const farmerIcon = L.divIcon({
      className: 'custom-farmer-icon',
      html: `
        <div style="background-color: #059669; color: white; width: 34px; height: 34px; border-radius: 50%; display: flex; align-items: center; justify-content: center; border: 3px solid white; box-shadow: 0 4px 10px rgba(0,0,0,0.3); font-weight: bold; font-size: 14px;">
          🌾
        </div>
      `,
      iconSize: [34, 34],
      iconAnchor: [17, 17]
    });

    const farmerMarker = L.marker([origin.lat, origin.lon], { icon: farmerIcon }).addTo(map);
    farmerMarker.bindPopup(`
      <div style="font-family: sans-serif; font-size: 12px; line-height: 1.4;">
        <strong style="color: #059669;">📍 ${origin.name}</strong><br/>
        <span>${t.mapFarmerOrigin}</span>
      </div>
    `);

    const bounds = L.latLngBounds([[origin.lat, origin.lon]]);

    // 2. Add Mandi Markers & Route Lines
    rankedMarkets.forEach((item) => {
      const isTop = item.rank === 1;
      const mLat = item.market.lat;
      const mLon = item.market.lon;
      bounds.extend([mLat, mLon]);

      // Color based on rank
      const bgColor = isTop ? '#10b981' : item.rank === 2 ? '#3b82f6' : '#64748b';
      const badgeText = `#${item.rank}`;

      const mandiIcon = L.divIcon({
        className: 'custom-mandi-icon',
        html: `
          <div style="background-color: ${bgColor}; color: white; min-width: 28px; height: 28px; padding: 0 6px; border-radius: 14px; display: flex; align-items: center; justify-content: center; border: 2px solid white; box-shadow: 0 4px 10px rgba(0,0,0,0.25); font-weight: 800; font-size: 11px;">
            ${badgeText}
          </div>
        `,
        iconSize: [32, 28],
        iconAnchor: [16, 14]
      });

      const marker = L.marker([mLat, mLon], { icon: mandiIcon }).addTo(map);
      marker.bindPopup(`
        <div style="font-family: sans-serif; font-size: 12px; min-width: 170px; line-height: 1.4;">
          <strong style="color: #0f172a; font-size: 13px;">${item.market.name}</strong><br/>
          <span style="color: #059669; font-weight: bold; font-size: 13px;">${t.netReturnShort}: ₹${Math.round(item.netReturn).toLocaleString('en-IN')}</span><br/>
          <span style="color: #475569;">${t.modalPriceLabel}: ₹${item.price}/q</span><br/>
          <span style="color: #475569;">${t.roadDistanceLabel}: ${item.distanceKm} km</span><br/>
          <span style="color: #e11d48;">${t.totalTransportLabel}: ₹${Math.round(item.transport).toLocaleString('en-IN')}</span>
        </div>
      `);

      // Connect Top Mandi with prominent dashed line
      if (isTop) {
        L.polyline([[origin.lat, origin.lon], [mLat, mLon]], {
          color: '#10b981',
          weight: 3.5,
          dashArray: '6, 8',
          opacity: 0.85
        }).addTo(map);
      } else if (item.rank <= 3) {
        L.polyline([[origin.lat, origin.lon], [mLat, mLon]], {
          color: '#94a3b8',
          weight: 1.5,
          dashArray: '3, 6',
          opacity: 0.5
        }).addTo(map);
      }
    });

    map.fitBounds(bounds, { padding: [40, 40], maxZoom: 10 });

  }, [rankedMarkets, origin, t]);

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200/90 p-5 overflow-hidden">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
        <div>
          <div className="flex items-center gap-2">
            <Navigation className="w-4 h-4 text-emerald-600" />
            <h2 className="text-base font-bold text-slate-800 m-0">
              {t.mapTitle}
            </h2>
          </div>
          <p className="text-xs text-slate-500 m-0">
            {t.mapSubtitle}
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs">
          <span className="flex items-center gap-1 font-semibold text-emerald-700">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span> #1 {t.bestChoiceBadge}
          </span>
          <span className="flex items-center gap-1 text-slate-500">
            <span className="w-2.5 h-2.5 rounded-full bg-slate-400"></span> {t.tabRankings}
          </span>
        </div>
      </div>

      <div 
        ref={mapContainerRef} 
        className="w-full h-80 rounded-xl overflow-hidden border border-slate-200 shadow-inner z-0"
        style={{ minHeight: '320px' }}
      />

      <div className="mt-2 text-center text-[11px] text-slate-400">
        {t.mapClickNote}
      </div>
    </div>
  );
}
