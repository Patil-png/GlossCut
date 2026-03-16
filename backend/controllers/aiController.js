const axios = require('axios');
const path = require('path');
const fs = require('fs');

const HF_TOKEN = process.env.HF_TOKEN;

// Rich Style Gallery with Archetypes
const styleGallery = [
  { name: 'Classic Pompadour', archetype: 'Executive', tags: ['oval', 'round', 'thick-hair', 'volume'], image: 'https://images.unsplash.com/photo-1621605815971-fbc98d665033?q=80&w=400&h=400&auto=format&fit=crop' },
  { name: 'High Skin Fade', archetype: 'Modern', tags: ['square', 'angular', 'short-hair', 'modern'], image: 'https://images.unsplash.com/photo-1605497788044-5a32c7078486?q=80&w=400&h=400&auto=format&fit=crop' },
  { name: 'Buzz Cut', archetype: 'Minimalist', tags: ['square', 'thinning-hair', 'low-maintenance'], image: 'https://images.unsplash.com/photo-1593702275677-f916c68323a1?q=80&w=400&h=400&auto=format&fit=crop' },
  { name: 'Textured Fringe', archetype: 'Creative', tags: ['oval', 'high-forehead', 'wavy-hair'], image: 'https://images.unsplash.com/photo-1519345182560-3f2917c472ef?q=80&w=400&h=400&auto=format&fit=crop' },
  { name: 'Slick Back Undercut', archetype: 'Bold', tags: ['oval', 'square', 'straight-hair', 'bold', 'rebel'], image: 'https://images.unsplash.com/photo-1503951914875-452162b0f3f1?q=80&w=400&h=400&auto=format&fit=crop' },
  { name: 'Side Part Quiff', archetype: 'Professional', tags: ['round', 'professional', 'balanced'], image: 'https://images.unsplash.com/photo-1622286332618-f2802b9c7f93?q=80&w=400&h=400&auto=format&fit=crop' }
];

const callHF = async (model, data, isBinary = true) => {
  return axios.post(`https://api-inference.huggingface.co/models/${model}`, data, {
    headers: { Authorization: `Bearer ${HF_TOKEN}`, 'Content-Type': isBinary ? 'application/octet-stream' : 'application/json' },
    timeout: 25000
  });
};

exports.getAISuggestions = async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ message: 'No image file uploaded.' });

    const { user } = req;
    if (user && user.faceSuggestorUses <= 0) {
      if (req.file) fs.unlinkSync(req.file.path);
      return res.status(403).json({ message: 'Free limit reached.' });
    }

    const imageData = fs.readFileSync(req.file.path);

    // Phase 1: Deep Vision Analysis
    const analysisResponse = await callHF('Salesforce/blip-image-captioning-large', imageData);
    const caption = analysisResponse.data[0]?.generated_text || 'A well-groomed man';

    // Phase 2: Professional Stylist Reasoning (LLM)
    const prompt = `Act as a celebrity elite hairstylist. Analyze this client description: "${caption}".
1. Identify Face Shape (Oval/Round/Square/Heart).
2. Rate Jawline Sharpness (1-10).
3. Identify Hair Texture (Thick/Thin/Curly/Straight).
4. Choose a Style Archetype (The CEO, The Rebel, The Trendsetter, The Minimalist).
5. Write a 2-sentence "Stylist's Secret Note" explaining why these work.
Output ONLY JSON: {"shape": "...", "confidence": 0.9, "texture": "...", "jawline": 8, "archetype": "...", "note": "..."}`;

    const llmResponse = await callHF('meta-llama/Llama-3.2-1B-Instruct', {
      inputs: prompt,
      parameters: { max_new_tokens: 250, return_full_text: false }
    }, false);

    const text = llmResponse.data[0]?.generated_text || llmResponse.data.generated_text;
    const reasoning = JSON.parse(text.match(/\{.*\}/s)?.[0] || '{"shape": "oval", "confidence": 0.85, "texture": "thick", "jawline": 7, "archetype": "The CEO", "note": "Maintain balance with volume on top to complement your features."}');

    // Advanced Gallery Filtering
    const suggestedHairstyles = styleGallery
      .map(style => ({
        ...style,
        matchScore: (style.tags.includes(reasoning.shape.toLowerCase()) ? 5 : 0) + 
                     (style.archetype.toLowerCase().includes(reasoning.archetype.toLowerCase().split(' ')[1] || 'modern') ? 3 : 0)
      }))
      .sort((a, b) => b.matchScore - a.matchScore)
      .slice(0, 3);

    if (user) {
      user.faceSuggestorUses -= 1;
      await user.save();
    }

    fs.unlinkSync(req.file.path);

    return res.status(200).json({
      message: 'Analysis complete.',
      analysis: {
        faceShape: reasoning.shape,
        archetype: reasoning.archetype,
        stylistNote: reasoning.note,
        confidence: reasoning.confidence,
        details: { texture: reasoning.texture, jawline: reasoning.jawline }
      },
      suggestions: {
        hairstyles: suggestedHairstyles.map(s => ({ name: s.name, image: s.image, archetype: s.archetype })),
        beards: ['Professional Stubble', 'Clean Shave (Sharp Look)', 'Van Dyke (Balanced)']
      },
      usesLeft: user ? user.faceSuggestorUses : 0
    });

  } catch (error) {
    console.error('AI Error:', error.message);
    if (req.file && fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
    res.status(500).json({ message: 'Deep analysis failed. Try a brighter photo.' });
  }
};
