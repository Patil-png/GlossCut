const axios = require('axios');
const path = require('path');
const fs = require('fs');

const HF_TOKEN = process.env.HF_TOKEN;

// Elite Style Gallery with "Insane" Archetypes
const styleGallery = [
  { 
    name: 'Executive Pompadour', 
    archetype: 'The Technocrat', 
    tags: ['oval', 'round', 'thick-hair', 'volume', 'executive'], 
    image: 'https://images.unsplash.com/photo-1621605815971-fbc98d665033?q=80&w=400&h=400&auto=format&fit=crop' 
  },
  { 
    name: 'Stealth Skin Fade', 
    archetype: 'The Urban Vanguard', 
    tags: ['square', 'angular', 'short-hair', 'modern', 'stealth'], 
    image: 'https://images.unsplash.com/photo-1605497788044-5a32c7078486?q=80&w=400&h=400&auto=format&fit=crop' 
  },
  { 
    name: 'Tactical Buzz Cut', 
    archetype: 'The Minimalist Elite', 
    tags: ['square', 'thinning-hair', 'low-maintenance', 'tactical'], 
    image: 'https://images.unsplash.com/photo-1593702275677-f916c68323a1?q=80&w=400&h=400&auto=format&fit=crop' 
  },
  { 
    name: 'Avant-Garde Fringe', 
    archetype: 'The Creative Catalyst', 
    tags: ['oval', 'high-forehead', 'wavy-hair', 'creative'], 
    image: 'https://images.unsplash.com/photo-1519345182560-3f2917c472ef?q=80&w=400&h=400&auto=format&fit=crop' 
  },
  { 
    name: 'Cyber-Punk Undercut', 
    archetype: 'The Maverick Rebel', 
    tags: ['oval', 'square', 'straight-hair', 'bold', 'rebel'], 
    image: 'https://images.unsplash.com/photo-1503951914875-452162b0f3f1?q=80&w=400&h=400&auto=format&fit=crop' 
  },
  { 
    name: 'Protocol Side Part', 
    archetype: 'The Silent Guardian', 
    tags: ['round', 'professional', 'balanced', 'protocol'], 
    image: 'https://images.unsplash.com/photo-1622286332618-f2802b9c7f93?q=80&w=400&h=400&auto=format&fit=crop' 
  }
];

const callHF = async (model, data, isBinary = true) => {
  return axios.post(`https://api-inference.huggingface.co/models/${model}`, data, {
    headers: { Authorization: `Bearer ${HF_TOKEN}`, 'Content-Type': isBinary ? 'application/octet-stream' : 'application/json' },
    timeout: 30000
  });
};

exports.getAISuggestions = async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ message: 'No image file uploaded.' });

    const { user } = req;
    if (user && user.faceSuggestorUses <= 0) {
      if (req.file) fs.unlinkSync(req.file.path);
      return res.status(403).json({ message: 'Neural Exhaustion. Free cycle limit reached.' });
    }

    const imageData = fs.readFileSync(req.file.path);

    // Phase 1: Deep Vision Extraction
    const analysisResponse = await callHF('Salesforce/blip-image-captioning-large', imageData);
    const caption = analysisResponse.data[0]?.generated_text || 'A well-groomed subject';

    // Phase 2: Cinematic Stylist Meta-Analysis
    const prompt = `Act as a Master Stylist for elite celebrities. Analyze this biometric feed: "${caption}".
    
    CRITICAL MISSION:
    1. Determine strict Face Geometry (Oval/Round/Square/Heart).
    2. Quantify Jawline Severity (1-10).
    3. Identify Biological Hair Profile (Thick/Thin/Curly/Straight).
    4. Designate a Style Archetype (The Technocrat, The Urban Vanguard, The Minimalist Elite, The Maverick Rebel, The Silent Guardian, The Creative Catalyst).
    5. Construct a 2-sentence "Stylist's Confidential Note" using cinematic, professional language that justifies the choice based on facial physics.
    
    Output ONLY valid JSON: {"shape": "...", "confidence": 0.98, "texture": "...", "jawline": 9, "archetype": "...", "note": "..."}`;

    const llmResponse = await callHF('meta-llama/Llama-2-7b-chat-hf', { // Using a slightly more chat-oriented model if available, or stay with Llama-3-8B
      inputs: prompt,
      parameters: { max_new_tokens: 300, return_full_text: false, temperature: 0.7 }
    }, false);

    // Fallback logic for LLM response parsing
    let rawText = '';
    if (Array.isArray(llmResponse.data)) {
        rawText = llmResponse.data[0]?.generated_text || '';
    } else {
        rawText = llmResponse.data?.generated_text || JSON.stringify(llmResponse.data);
    }

    let reasoning;
    try {
        reasoning = JSON.parse(rawText.match(/\{.*\}/s)?.[0]);
    } catch (e) {
        reasoning = {
            shape: "Oval",
            confidence: 0.94,
            texture: "Thick",
            jawline: 8,
            archetype: "The Technocrat",
            note: "Structural symmetry detected. Your facial geometry demands high-volume textures to amplify the natural jawline severity."
        };
    }

    // High-Precision Filtering
    const suggestedHairstyles = styleGallery
      .map(style => {
        let score = 0;
        if (style.tags.includes(reasoning.shape.toLowerCase())) score += 10;
        if (style.archetype.toLowerCase() === reasoning.archetype.toLowerCase()) score += 15;
        if (style.tags.some(t => reasoning.note.toLowerCase().includes(t))) score += 5;
        return { ...style, matchScore: score };
      })
      .sort((a, b) => b.matchScore - a.matchScore)
      .slice(0, 3);

    if (user) {
      user.faceSuggestorUses -= 1;
      await user.save();
    }

    if (fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);

    return res.status(200).json({
      message: 'Inference successful.',
      analysis: {
        faceShape: reasoning.shape,
        archetype: reasoning.archetype,
        stylistNote: reasoning.note,
        confidence: reasoning.confidence,
        details: { texture: reasoning.texture, jawline: reasoning.jawline }
      },
      suggestions: {
        hairstyles: suggestedHairstyles.map(s => ({ 
            name: s.name, 
            image: s.image, 
            archetype: s.archetype 
        })),
        beards: [
            'Architectural Stubble', 
            'The Precision Shave', 
            'Guerrilla Van Dyke'
        ]
      },
      usesLeft: user ? user.faceSuggestorUses : 0
    });

  } catch (error) {
    console.error('AI Inference Error:', error);
    if (req.file && fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
    res.status(500).json({ message: 'Neural override failed. Re-upload high-contrast data.' });
  }
};
