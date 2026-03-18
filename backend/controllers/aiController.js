const fs     = require('fs');
const sharp  = require('sharp');
const crypto = require('crypto');

// ─── Style Gallery ────────────────────────────────────────────────────────────
const styleGallery = [
  { name: 'Executive Pompadour',  archetype: 'The Technocrat',       tags: ['oval','thick','volume','executive'], image: 'https://images.unsplash.com/photo-1582095133179-bfd08e2fb6b8?w=400&h=400&fit=crop&auto=format' },
  { name: 'Stealth Skin Fade',    archetype: 'The Urban Vanguard',    tags: ['square','angular','short','modern','stealth'], image: 'https://images.unsplash.com/photo-1599351431247-f1327b4044a8?w=400&h=400&fit=crop&auto=format' },
  { name: 'Tactical Buzz Cut',    archetype: 'The Minimalist Elite',  tags: ['square','thin','low-maintenance','tactical'], image: 'https://images.unsplash.com/photo-1530268729831-4b0b9e170218?w=400&h=400&fit=crop&auto=format' },
  { name: 'Avant-Garde Fringe',   archetype: 'The Creative Catalyst', tags: ['wavy','creative','artistic','heart'], image: 'https://images.unsplash.com/photo-1519345182560-3f2917c472ef?w=400&h=400&fit=crop&auto=format' },
  { name: 'Cyber-Punk Undercut',  archetype: 'The Maverick Rebel',    tags: ['diamond','straight','bold','rebel'], image: 'https://images.unsplash.com/photo-1503951914875-452162b0f3f1?w=400&h=400&fit=crop&auto=format' },
  { name: 'High-Volume Quiff',    archetype: 'The Elegant Architect', tags: ['oblong','round','volume','classic'], image: 'https://images.unsplash.com/photo-1621605815971-fbc98d665033?w=400&h=400&fit=crop&auto=format' },
];

const PROFILES = {
  Oval:    { archetype: 'The Technocrat',       baseNote: "Perfectly balanced facial topology (H/W: {hw}). Your natural symmetry accepts almost any architectural style directive." },
  Round:   { archetype: 'The Urban Vanguard',    baseNote: "Spherically-dominant geometry (H/W: {hw}) detected. Structural verticality is mandated to elongate your visual axis." },
  Square:  { archetype: 'The Minimalist Elite',  baseNote: "High angular severity (Jaw: {jf}) identified. Bio-mechanical structure requires sharp fades to weaponize your bone architecture." },
  Heart:   { archetype: 'The Creative Catalyst', baseNote: "Tapered cranial geometry (Jaw Ratio: {jf}) detected. Neural logic suggests texture to balance the orbital-brow ratio." },
  Diamond: { archetype: 'The Sharp Aesthetic',   baseNote: "High cheekbone prominence detected with narrow forehead/jaw tapers. Neural signature dictates softening the angles." },
  Oblong:  { archetype: 'The Elegant Architect', baseNote: "Extended vertical axis (Ratio: {hw}) detected. We recommend horizontal expansion using volume on the sides." },
};

/**
 * Biometric Reasoning Engine V7 - Surgical Precision Classification
 */
function getBiometricAnalysis(ratios) {
  const { hw, jf, cw, alignment } = ratios;
  const h = hw; 
  const j = jf; 
  const c = cw; 

  console.log("⚛️ V7 Reasoning Inputs:", { h, j, c, alignment });

  // --- DATA INTEGRITY CHECK (No Guessing) ---
  if (isNaN(h) || isNaN(j) || isNaN(c) || h < 0.2 || j < 0.2) {
    console.log("⚠️ Biometric Calibration Error: Data Out-of-Bounds");
    return {
      shape: 'Oval',
      archetype: PROFILES.Oval.archetype,
      note: "Geometric alignment error. Please use high-contrast lighting and face the camera directly.",
      confidence: 0.1,
      jawline: 5,
      proportionScale: 'Balanced Symmetry'
    };
  }

  let scores = { Oval: 0, Round: 0, Square: 0, Heart: 0, Diamond: 0, Oblong: 0 };

  // --- Phase 1: VERTICAL AXIS (V8 Refinement) ---
  if (h > 1.3)        scores.Oblong += 50;
  else if (h > 1.2)   scores.Oblong += 25;
  else if (h > 1.05)  scores.Oval += 30; // Standard Oval
  else if (h > 0.9)   scores.Oval += 20; // Balanced Oval
  else                scores.Round += 40; // Definite Round

  // --- Phase 2: DATA INTEGRITY GUARD ---
  if (!c || c <= 0 || !j || j <= 0) {
    return {
      shape: 'Undetermined',
      archetype: 'Neutral',
      note: "Insufficient biometric data. Please ensure face is centered and lit.",
      confidence: 0,
      proportionScale: 'Undetermined'
    };
  }

  const jawTaper = j / c; 
  
  // Phase 2 Logic: Structural Differentiation
  if (j > 0.85) { 
    // Square/Oblong Path
    if (h > 1.2) scores.Oblong += 25; 
    else         scores.Square += 45; 
  } else if (jawTaper < 0.82) { 
    // Tapered Path (Heart/Diamond/Round/Oval)
    if (h > 1.15)      scores.Oval += 25;  // Tall tapered is Oval
    else if (h < 1.03) scores.Round += 30; // Short tapered is Round (User fix Case 1)
    else if (c > 0.92) scores.Diamond += 40; 
    else               scores.Heart += 40;
  } else { 
    // Balanced Path
    if (h > 1.05) scores.Oval += 25;
    else          scores.Round += 25;
  }

  // --- Phase 3: CONFIDENCE CALIBRATION ---
  const alignmentFactor = alignment || 1.0;
  const sortedValues = Object.values(scores).sort((a, b) => b - a);
  const topScore = sortedValues[0];
  const margin = topScore - (sortedValues[1] || 0);
  const realConfidence = Math.min(0.99, (margin / 45) * alignmentFactor);

  // --- Phase 4: WINNER SELECTION & TIEBREAK ---
  let shape = Object.keys(scores).reduce((a, b) => scores[a] > scores[b] ? a : b);
  
  const tiedShapes = Object.keys(scores).filter(s => scores[s] === topScore);
  // Tiebreak: Only favor Oblong if it's truly extended
  if (tiedShapes.length > 1 && h > 1.25 && tiedShapes.includes('Oblong')) {
    shape = 'Oblong';
  }

  const profile = PROFILES[shape];
  let dynamicNote = profile.baseNote
    .replace('{hw}', h.toString())
    .replace('{jf}', j.toString());
    
  if (alignmentFactor < 0.9) {
    dynamicNote += " [CAUTION: Alignment Breach]";
  }
  
  const proportionScale = h > 1.15 ? 'Vertical Extended' : (h < 0.85 ? 'Horizontal Dominant' : 'Balanced Symmetry');

  return {
      shape,
      archetype: profile.archetype,
      note: dynamicNote,
      confidence: realConfidence,
      jawline: Math.round(j * 10),
      proportionScale
  };
}

// ─── Main Controller ──────────────────────────────────────────────────────────
exports.getAISuggestions = async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ message: 'No image file uploaded.' });

    const biometrics = req.body.biometrics ? JSON.parse(req.body.biometrics) : null;
    
    let reasoning;
    if (biometrics) {
        console.log("⚛️ Processing V7 Biometrics:", biometrics);
        reasoning = getBiometricAnalysis(biometrics);
    } else {
        console.log("⚠️ Biometrics missing, fallback reasoning");
        reasoning = {
            shape: 'Oval',
            confidence: 0.5,
            texture: 'Medium',
            jawline: 7,
            archetype: 'The Technocrat',
            note: "Structural data missing. Precision compromised."
        };
    }

    // High-precision matching
    const suggestedHairstyles = styleGallery
      .map(style => {
        let score = 0;
        if (style.tags.includes(reasoning.shape.toLowerCase())) score += 10;
        if (style.archetype === reasoning.archetype)             score += 15;
        return { ...style, matchScore: score };
      })
      .sort((a, b) => b.matchScore - a.matchScore)
      .slice(0, 3);

    if (fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);

    return res.status(200).json({
      message: 'Neural V7 inference successful.',
      analysis: {
        faceShape:   reasoning.shape,
        archetype:   reasoning.archetype,
        stylistNote: reasoning.note,
        confidence:  reasoning.confidence,
        details: { texture: reasoning.texture, jawline: reasoning.jawline }
      },
      suggestions: {
        hairstyles: suggestedHairstyles.map(s => ({ name: s.name, image: s.image, archetype: s.archetype })),
        beards: reasoning.shape === 'Square' ? ['Boxed Beard', 'Corporate Stubble'] : ['Architectural Stubble', 'The Precision Shave']
      },
      usesLeft: 999
    });

  } catch (error) {
    console.error('V7 Inference Error:', error);
    if (req.file && fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
    res.status(500).json({ message: 'Neural V7 override failed.' });
  }
};
