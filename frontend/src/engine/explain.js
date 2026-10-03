/**
 * MandiMitra AI - Decision Rationale & Explanation Module
 * 
 * Requirements:
 * - explainRecommendation(result) returns structured reasons plus a plain-language paragraph
 *   (template-based) covering price advantage, transport, trend, margin over #2,
 *   and the "highest price is not highest profit" case when it applies.
 */

/**
 * Explains top market recommendation with structured reasons and plain-language paragraph
 * @param {Object} params
 * @param {Object} params.top - Top ranked market record
 * @param {Object} [params.runnerUp] - Runner up (#2) market record
 * @param {Object} [params.nearest] - Geographically nearest market record
 * @param {Object} [params.highestPriceMarket] - Market with the absolute highest modal price
 * @param {string} [params.cropName='Produce'] - Crop name
 * @param {string} [params.lang='en'] - 'en' | 'hi' | 'mr'
 * @returns {Object} Structured reasons and generated explanation paragraph
 */
export function explainRecommendation({
  top,
  runnerUp = null,
  nearest = null,
  highestPriceMarket = null,
  cropName = 'crop',
  lang = 'en'
} = {}) {
  if (!top || !top.market) {
    return {
      structured: {},
      summary: ''
    };
  }

  const topName = top.market.name;
  const topNet = Math.round(top.netReturn);
  const topPrice = Math.round(top.expectedPrice || top.price);
  const topDist = Math.round(top.distanceKm);
  const topTransport = Math.round(top.transport);

  // Check if highest price market is not #1
  const isHighestPriceNotHighestProfit = Boolean(
    highestPriceMarket &&
    (highestPriceMarket.market?.id || highestPriceMarket.marketId) !== (top.market?.id || top.marketId) &&
    (highestPriceMarket.price || highestPriceMarket.modalPrice) > (top.price || top.modalPrice)
  );

  let marginRs = 0;
  let marginPct = 0;
  if (runnerUp) {
    marginRs = Math.round(top.netReturn - runnerUp.netReturn);
    marginPct = runnerUp.netReturn > 0
      ? Math.round((marginRs / runnerUp.netReturn) * 1000) / 10
      : 0;
  }

  const structured = {
    topMarketName: topName,
    topNetReturn: topNet,
    topExpectedPrice: topPrice,
    topDistanceKm: topDist,
    topTransportCost: topTransport,
    marginOverRunnerUpRs: marginRs,
    marginOverRunnerUpPct: marginPct,
    runnerUpName: runnerUp?.market?.name || null,
    isHighestPriceNotHighestProfit,
    highestPriceMarketName: highestPriceMarket?.market?.name || null,
    highestPriceModal: highestPriceMarket ? Math.round(highestPriceMarket.price || highestPriceMarket.modalPrice) : null,
    trend: top.trend || 'STABLE',
    trendAdjustmentPct: Math.round((top.trendAdjustment || 0) * 1000) / 10
  };

  let summary = '';

  // Case 1: Highest posted price lost to a more profitable market
  if (isHighestPriceNotHighestProfit && highestPriceMarket) {
    const hpName = highestPriceMarket.market.name;
    const hpPrice = Math.round(highestPriceMarket.price || highestPriceMarket.modalPrice);
    const hpDist = Math.round(highestPriceMarket.distanceKm);
    const hpTransport = Math.round(highestPriceMarket.transport);

    if (lang === 'mr') {
      summary = `महत्त्वाचा निष्कर्ष: ${hpName} मध्ये मॉडेल भाव सर्वाधिक (₹${hpPrice.toLocaleString('en-IN')}/क्विं.) असला, तरी ${hpDist} किमी लांब अंतरामुळे लागणारा ₹${hpTransport.toLocaleString('en-IN')} वाहतूक खर्च नफा हिरावून घेतो. त्याउलट, ${topName} निवडल्याने सर्व वाहतूक व हमाली वजा जाता सर्वाधिक निव्वळ नफा (₹${topNet.toLocaleString('en-IN')}) मिळतो.`;
    } else if (lang === 'hi') {
      summary = `महत्वपूर्ण निष्कर्ष: ${hpName} में सबसे अधिक मॉडल भाव (₹${hpPrice.toLocaleString('en-IN')}/क्विं.) होने के बावजूद, ${hpDist} किमी की दूरी का ₹${hpTransport.toLocaleString('en-IN')} परिवहन खर्च मुनाफे को कम कर देता है। इसलिए ${topName} आपको सभी खर्च घटाकर सर्वाधिक शुद्ध लाभ (₹${topNet.toLocaleString('en-IN')}) देता है।`;
    } else {
      summary = `Highest price is not highest profit: Even though ${hpName} offers the highest posted price of ₹${hpPrice.toLocaleString('en-IN')}/q, its distance of ${hpDist} km incurs ₹${hpTransport.toLocaleString('en-IN')} in transport costs. Choosing ${topName} saves freight logistics and delivers the maximum in-pocket net profit of ₹${topNet.toLocaleString('en-IN')}.`;
    }
    return { structured, summary };
  }

  // Case 2: Outperforming nearest market and runner-up
  if (nearest && nearest.market?.id !== top.market?.id) {
    const nearName = nearest.market.name;
    const extraDist = Math.round(topDist - nearest.distanceKm);
    const runnerName = runnerUp ? runnerUp.market.name : 'other mandis';

    if (lang === 'mr') {
      summary = `सर्वोत्तम निवड: ${topName} मधील अधिक मॉडेल भाव (₹${topPrice.toLocaleString('en-IN')}/क्विं.) मुळे ${runnerName} पेक्षा +₹${marginRs.toLocaleString('en-IN')} (+${marginPct}%) जास्त निव्वळ नफा मिळतो. ${nearName} च्या तुलनेत +${extraDist} किमी अतिरिक्त अंतराचा ₹${topTransport.toLocaleString('en-IN')} वाहतूक खर्च उच्च भावामुळे सहज भरून निघतो.`;
    } else if (lang === 'hi') {
      summary = `#1 सिफारिश: ${topName} में अनुकूल मॉडल भाव (₹${topPrice.toLocaleString('en-IN')}/क्विं.) के कारण ${runnerName} से +₹${marginRs.toLocaleString('en-IN')} (+${marginPct}%) अधिक शुद्ध लाभ मिलता है, जो ${nearName} से +${extraDist} किमी अतिरिक्त दूरी का ₹${topTransport.toLocaleString('en-IN')} परिवहन खर्च आसानी से निकाल लेता है।`;
    } else {
      summary = `Selected ${topName} as #1 recommendation: Favorable modal price (₹${topPrice.toLocaleString('en-IN')}/q) yields +₹${marginRs.toLocaleString('en-IN')} (+${marginPct}%) higher net return than ${runnerName}, easily overcoming ₹${topTransport.toLocaleString('en-IN')} transport across +${extraDist} km extra distance compared to ${nearName}.`;
    }
    return { structured, summary };
  }

  // Case 3: Default comparison against runner-up
  if (runnerUp) {
    const runnerName = runnerUp.market.name;
    if (lang === 'mr') {
      summary = `सर्वोत्तम निवड: सर्व वाहतूक व बाजार समिती शुल्क वजा जाता उत्तम मॉडेल भावामुळे (₹${topPrice.toLocaleString('en-IN')}/क्विं.) ${topName} मध्ये ${runnerName} पेक्षा ₹${marginRs.toLocaleString('en-IN')} (+${marginPct}%) जास्त निव्वळ नफा मिळतो.`;
    } else if (lang === 'hi') {
      summary = `#1 सिफारिश: सभी परिवहन व मंडी कटौतियों के बाद बेहतर मॉडल भाव (₹${topPrice.toLocaleString('en-IN')}/क्विं.) के कारण ${topName} में ${runnerName} से ₹${marginRs.toLocaleString('en-IN')} (+${marginPct}%) अधिक शुद्ध लाभ प्राप्त होता है।`;
    } else {
      summary = `Selected ${topName} as #1 recommendation: Superior modal price (₹${topPrice.toLocaleString('en-IN')}/q) delivers ₹${marginRs.toLocaleString('en-IN')} (+${marginPct}%) higher net return than ${runnerName} after all transport and handling deductions.`;
    }
    return { structured, summary };
  }

  // Single market scenario
  if (lang === 'mr') {
    summary = `${topName} आपल्या ${cropName} पिकासाठी दैनिक अद्यतनित अधिकृत बाजार समिती माहितीनुसार सर्वाधिक अंदाजित निव्वळ नफा (₹${topNet.toLocaleString('en-IN')}) देते.`;
  } else if (lang === 'hi') {
    summary = `${topName} आपकी ${cropName} उपज के लिए दैनिक अद्यतन आधिकारिक मंडी डेटा के आधार पर उच्चतम अपेक्षित शुद्ध लाभ (₹${topNet.toLocaleString('en-IN')}) प्रदान करती है।`;
  } else {
    summary = `${topName} delivers the highest expected net return of ₹${topNet.toLocaleString('en-IN')} for your ${cropName} based on daily-updated official mandi modal prices.`;
  }

  return { structured, summary };
}
