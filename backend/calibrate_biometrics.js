/**
 * Biometric Calibration Script
 * Simulates the backend reasoning with various ratio inputs.
 * Use this to find the sweet spots for Oval, Round, Square, and Heart.
 */

const PROFILES = {
  Oval:   { archetype: 'The Technocrat' },
  Round:  { archetype: 'The Urban Vanguard' },
  Square: { archetype: 'The Minimalist Elite' },
  Heart:  { archetype: 'The Creative Catalyst' },
};

function getBiometricAnalysis(ratios) {
  const { hw, jf } = ratios;
  const h = parseFloat(hw);
  const j = parseFloat(jf);

  let scores = { Oval: 0, Round: 0, Square: 0, Heart: 0 };

  // CALIBRATION LOGIC (V6 - High Sensitivity)
  
  // Verticality (Eyes to Chin)
  if (h > 0.82) scores.Oval += 15;
  else if (h > 0.77) scores.Oval += 5;
  else if (h < 0.74) { scores.Round += 10; scores.Square += 5; }
  else { scores.Round += 5; scores.Square += 5; }

  // Horizontal Taper (Jaw vs Face Width)
  if (j < 0.81) scores.Heart += 15; // User images are 0.80-0.82
  else if (j < 0.84) scores.Oval += 10;
  else if (j > 0.90) scores.Square += 15;
  else scores.Round += 10;

  // Final blend
  let shape = Object.keys(scores).reduce((a, b) => scores[a] > scores[b] ? a : b);
  return { shape, scores };
}

const testCases = [
  { hw: '0.83', jf: '0.80', name: 'User Image 2' },
  { hw: '0.73', jf: '0.82', name: 'User Image 1' },
  { hw: '1.00', jf: '0.85', name: 'Long Face' },
  { hw: '0.65', jf: '0.92', name: 'Wide Square Face' },
  { hw: '0.70', jf: '0.70', name: 'Heart Face' },
  { hw: '0.95', jf: '0.82', name: 'Perfect Oval' }
];

console.log("--- Biometric Calibration Test ---");
testCases.forEach(tc => {
    const result = getBiometricAnalysis(tc);
    console.log(`[${tc.name}] Ratios: H/W=${tc.hw}, J/F=${tc.jf} => Shape: ${result.shape}`);
    // console.log("   Scores:", JSON.stringify(result.scores));
});
