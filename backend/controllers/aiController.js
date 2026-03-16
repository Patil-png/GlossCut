const axios = require('axios');
const path = require('path');
const fs = require('fs');

const HF_TOKEN = process.env.HF_TOKEN;

// Expanded Style Gallery with Metadata for AI Reasoning
const styleGallery = [
  { name: 'Classic Pompadour', tags: ['oval', 'round', 'thick-hair', 'volume'], image: 'https://images.unsplash.com/photo-1621605815971-fbc98d665033?q=80&w=400&h=400&auto=format&fit=crop' },
  { name: 'High Skin Fade', tags: ['square', 'angular', 'short-hair', 'modern'], image: 'https://images.unsplash.com/photo-1605497788044-5a32c7078486?q=80&w=400&h=400&auto=format&fit=crop' },
  { name: 'Buzz Cut', tags: ['square', 'thinning-hair', 'low-maintenance'], image: 'https://images.unsplash.com/photo-1593702275677-f916c68323a1?q=80&w=400&h=400&auto=format&fit=crop' },
  { name: 'Textured Fringe', tags: ['oval', 'high-forehead', 'wavy-hair'], image: 'https://images.unsplash.com/photo-1519345182560-3f2917c472ef?q=80&w=400&h=400&auto=format&fit=crop' },
  { name: 'Slick Back Undercut', tags: ['oval', 'square', 'straight-hair', 'bold'], image: 'https://images.unsplash.com/photo-1503951914875-452162b0f3f1?q=80&w=400&h=400&auto=format&fit=crop' },
  { name: 'Side Part Quiff', tags: ['round', 'professional', 'balanced'], image: 'https://images.unsplash.com/photo-1622286332618-f2802b9c7f93?q=80&w=400&h=400&auto=format&fit=crop' },
  { name: 'Long Flowing Hair', tags: ['oval', 'heart', 'long-hair', 'artist'], image: 'https://images.unsplash.com/photo-1552058544-f2b08422138a?q=80&w=400&h=400&auto=format&fit=crop' },
  { name: 'Crew Cut', tags: ['square', 'round', 'classic', 'clean'], image: 'https://images.unsplash.com/photo-1634441484859-59b13c2c504e?q=80&w=400&h=400&auto=format&fit=crop' },
  { name: 'Man Bun', tags: ['oval', 'athletic', 'long-hair'], image: 'https://images.unsplash.com/photo-1517832207067-4db24a2ae47c?q=80&w=400&h=400&auto=format&fit=crop' },
  { name: 'French Crop', tags: ['square', 'high-forehead', 'textured'], image: 'https://images.unsplash.com/photo-1599351431247-f1327b4044a8?q=80&w=400&h=400&auto=format&fit=crop' }
];

const beardGallery = [
  { name: 'Clean Shaved', tags: ['professional', 'young', 'sharp-jawline'] },
  { name: 'Light Stubble', tags: ['versatile', 'easy', 'modern'] },
  { name: 'Full Garibaldi', tags: ['bold', 'round-face', 'mature'] },
  { name: 'Corporate Beard', tags: ['square-face', 'groomed', 'thick'] },
  { name: 'Goatee', tags: ['pointed-chin', 'artistic', 'round-face'] },
  { name: 'Van Dyke', tags: ['expressive', 'oval-face', 'creative'] }
];

// Helper to call HF Models
const callHF = async (model, data, isBinary = true) => {
  return axios.post(
    `https://api-inference.huggingface.co/models/${model}`,
    data,
    {
      headers: { 
        Authorization: `Bearer ${HF_TOKEN}`,
        'Content-Type': isBinary ? 'application/octet-stream' : 'application/json'
      },
      timeout: 20000
    }
  );
};

exports.getAISuggestions = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No image file uploaded.' });
    }

    const { user } = req;
    if (user && user.faceSuggestorUses <= 0) {
      if (req.file) fs.unlinkSync(req.file.path);
      return res.status(403).json({ message: 'You have exhausted your free AI suggestions.' });
    }

    if (!HF_TOKEN) {
      if (req.file) fs.unlinkSync(req.file.path);
      return res.status(500).json({ message: 'AI Token not configured on server.' });
    }

    const imageData = fs.readFileSync(req.file.path);

    console.log('--- Phase 1: Image Analysis ---');
    const analysisResponse = await callHF('Salesforce/blip-image-captioning-large', imageData);
    const caption = analysisResponse.data[0]?.generated_text || 'A man face';
    console.log('AI Observation:', caption);

    console.log('--- Phase 2: LLM Reasoning ---');
    // Using a light LLM to "think" about the best tags
    const prompt = `Task: Act as a professional hairstylist. 
Based on this image description: "${caption}".
Identity the person's face shape and hair characteristics.
Choose exactly 4 tags from this list that describe the best style matches: [oval, round, square, angular, high-forehead, short-hair, long-hair, thick-hair, thinning-hair, modern, classic, bold].
Output format: JSON only. {"faceShape": "...", "selectedTags": ["tag1", "tag2", "tag3", "tag4"], "beardRecommendation": "..."}`;

    const llmResponse = await callHF('meta-llama/Llama-3.2-1B-Instruct', {
      inputs: prompt,
      parameters: { max_new_tokens: 150, return_full_text: false }
    }, false);

    let reasoning;
    try {
      // LLMs on HF sometimes return strange structures or text with the JSON
      const text = llmResponse.data[0]?.generated_text || llmResponse.data.generated_text;
      const jsonStr = text.match(/\{.*\}/s)?.[0] || '{"faceShape": "oval", "selectedTags": ["modern"], "beardRecommendation": "Clean Shave"}';
      reasoning = JSON.parse(jsonStr);
    } catch (e) {
      console.error('LLM Parsing failed, using basic fallbacks');
      reasoning = { faceShape: 'oval', selectedTags: ['classic'], beardRecommendation: 'Clean Shave' };
    }

    console.log('AI Reasoning Results:', reasoning);

    // Filter Gallery based on AI reasoning
    const suggestedHairstyles = styleGallery
      .map(style => ({
        ...style,
        score: style.tags.filter(tag => reasoning.selectedTags.includes(tag) || tag === reasoning.faceShape).length
      }))
      .sort((a, b) => b.score - a.score)
      .slice(0, 3)
      .map(({ name, image }) => ({ name, image }));

    // For beards, use the LLM's direct advice but match to gallery names or just use direct text
    const suggestedBeards = [reasoning.beardRecommendation, ...beardGallery
      .filter(b => b.tags.some(tag => reasoning.faceShape === tag.replace('-face', '')))
      .map(b => b.name)
    ].slice(0, 3);

    // Usage Tracking
    if (user) {
      user.faceSuggestorUses -= 1;
      await user.save();
    }

    // Cleanup
    fs.unlinkSync(req.file.path);

    return res.status(200).json({
      message: 'Advanced AI analysis complete.',
      suggestions: {
        hairstyles: suggestedHairstyles,
        beards: suggestedBeards
      },
      usesLeft: user ? user.faceSuggestorUses : 0,
      aiObservation: caption,
      aiReasoning: reasoning.faceShape
    });

  } catch (error) {
    console.error('Error in Advanced AI Controller:', error.message);
    if (req.file && fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
    res.status(500).json({ message: 'AI Analysis failed. Please try a clearer photo.' });
  }
};
