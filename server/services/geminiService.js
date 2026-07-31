const fs = require('fs');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const { config } = require('../config/env');

/**
 * Service to interact with Google Gemini API for plant crop diagnosis.
 * Strictly executed on Node.js backend without exposing API keys to React.
 */
class GeminiService {
  constructor() {
    this.apiKey = process.env.GEMINI_API_KEY || config.gemini.apiKey;
    this.modelName = process.env.GEMINI_MODEL || 'gemini-3.6-flash';
    this.isConnected = false;
    if (this.apiKey) {
      this.genAI = new GoogleGenerativeAI(this.apiKey);
    }
  }

  /**
   * Validates API key configuration locally without consuming quota repeatedly.
   */
  async verifyConnection() {
    this.apiKey = process.env.GEMINI_API_KEY || config.gemini.apiKey || this.apiKey;
    this.modelName = process.env.GEMINI_MODEL || 'gemini-3.6-flash';

    if (!this.apiKey || typeof this.apiKey !== 'string' || this.apiKey.trim() === '') {
      console.warn('⚠️ [Gemini AI Notice] GEMINI_API_KEY is not defined in server/.env.');
      this.isConnected = false;
      return false;
    }

    // Do not call Gemini repeatedly during server startup (Requirement 11).
    // Just assume connected if initialized.
    this.isConnected = true;
    if (!this.genAI) {
      this.genAI = new GoogleGenerativeAI(this.apiKey);
    }
    return true;
  }

  /**
   * Helper to convert local image file into Gemini generative content part
   */
  fileToGenerativePart(filePath, mimeType) {
    return {
      inlineData: {
        data: Buffer.from(fs.readFileSync(filePath)).toString('base64'),
        mimeType
      },
    };
  }

  /**
   * Safely strip markdown code fences and parse JSON output from Gemini
   */
  parseCleanJson(rawText) {
    try {
      let cleanText = rawText.trim();
      if (cleanText.startsWith('```json')) {
        cleanText = cleanText.substring(7);
      } else if (cleanText.startsWith('```')) {
        cleanText = cleanText.substring(3);
      }
      if (cleanText.endsWith('```')) {
        cleanText = cleanText.substring(0, cleanText.length - 3);
      }
      return JSON.parse(cleanText.trim());
    } catch (error) {
      console.warn('⚠️ Could not directly parse Gemini JSON response, returning safe formatted interpretation:', error.message);
      return null;
    }
  }

  /**
   * Analyze uploaded plant image using Gemini Vision model
   */
  async analyzePlantImage(filePath, mimeType, description = '', language = 'en') {
    const isTamil = language === 'ta';
    const friendlyError = isTamil 
      ? "AI பகுப்பாய்வு நேரம் முடிந்தது. சிறிய அல்லது தெளிவான படத்துடன் மீண்டும் முயற்சிக்கவும்." 
      : "AI analysis timed out. Please try again with a smaller or clearer image.";

    console.log('[PlantDoctor] Request started');
    let finalImageBuffer;
    let finalMimeType = mimeType || 'image/jpeg';
    
    try {
      const originalBuffer = fs.readFileSync(filePath);
      console.log(`[PlantDoctor] Image size before compression: ${(originalBuffer.length / 1024).toFixed(2)} KB`);
      
      const sharp = require('sharp');
      finalImageBuffer = await sharp(originalBuffer)
        .resize(1280, 1280, { fit: 'inside', withoutEnlargement: true })
        .jpeg({ quality: 80 })
        .toBuffer();
      
      finalMimeType = 'image/jpeg';
      console.log(`[PlantDoctor] Image size after compression: ${(finalImageBuffer.length / 1024).toFixed(2)} KB`);
    } catch (err) {
      console.error('⚠️ [PlantDoctor] Image compression failed:', err.message);
      finalImageBuffer = fs.readFileSync(filePath);
    }

    if (!this.apiKey) {
      return this.getSimulatedFallback(filePath, description, language, "Gemini API is not configured. Add GEMINI_API_KEY to server/.env.");
    }

    try {
      const model = this.genAI.getGenerativeModel({ model: this.modelName });
      
      const imagePart = {
        inlineData: {
          data: finalImageBuffer.toString('base64'),
          mimeType: finalMimeType
        },
      };

      const prompt = `
You are an AI Plant Doctor specialized in agricultural crop health, particularly for farming practices in Tamil Nadu, India.
Analyze the uploaded image along with the optional farmer problem description: "${description}".
Selected website language for the response output: "${language}".

CRITICAL SAFETY AND BEHAVIORAL RULES:
1. Never claim 100% accuracy or state that a diagnosis is definitive/confirmed. Always use words like "possible disease" or "indicated symptoms".
2. Confidence must be an integer between 0 and 100 representing reasonable algorithmic certainty based on clear visible evidence.
3. Analyze only visible evidence in the image. If the image is clearly NOT a plant, leaf, crop, or soil crop pathology, set "isPlantImage" to false and leave treatment fields empty.
4. Do not invent symptoms or create fake pesticide brand names.
5. Always prefer organic treatments first (e.g. neem oil, trichoderma, cultural controls).
6. For chemical guidance, mention only safe general treatment types or standard active ingredients (e.g., Copper Oxychloride, Mancozeb).
7. Always advise farmers to strictly follow product labels and consult their regional agricultural extension officer or Krishi Vigyan Kendra (KVK) in Tamil Nadu before chemical application.
8. Preserve standard scientific taxonomic names for crops and pathogens.
9. LANGUAGE OBLIGATION: Return the values of all narrative strings in the requested language code ("${language}"). For example, if "ta" (Tamil) is selected, return farmer-friendly conversational Tamil. If "en", return English.

YOU MUST RETURN STRICTLY VALID JSON ONLY, WITH ZERO MARKDOWN OR COMMENTARY OUTSIDE THE JSON BLOCK, matching this exact structure:
{
  "isPlantImage": true,
  "plantName": "Common Name of the Crop",
  "localPlantName": "Regional/Local Name in selected language",
  "scientificName": "Scientific Botanical Name",
  "healthStatus": "Healthy / Mild Concern / Moderate Concern / Severe Infection",
  "possibleDisease": "Name of the likely condition or disease",
  "diseaseCategory": "Fungal / Bacterial / Viral / Nutrient Deficiency / Pest / Healthy",
  "confidence": 85,
  "severity": "None", /* must be strictly one of: "None", "Low", "Medium", "High", "Critical" */
  "visibleSymptoms": ["symptom 1", "symptom 2"],
  "possibleCauses": ["cause 1", "cause 2"],
  "organicTreatment": ["step 1", "step 2"],
  "chemicalTreatment": ["general chemical instruction 1"],
  "preventionSteps": ["prevention 1", "prevention 2"],
  "fertilizerAdvice": ["fertilizer nutrient note"],
  "wateringAdvice": ["irrigation practice guidance"],
  "whenToConsultExpert": "Advice on when to escalate to agricultural authorities",
  "safetyWarning": "Warning to read chemical pesticide labels and use safety gear",
  "analysisLimitations": "Note: AI estimate based on visual observation only; not guaranteed 100% infallible."
}`;

      let attempt = 0;
      let lastError = null;

      while (attempt < 2) {
        attempt++;
        try {
          const abortController = new AbortController();
          const timeoutId = setTimeout(() => abortController.abort(), 120000); // 120s timeout

          console.log(`[PlantDoctor] Gemini request started (Attempt ${attempt})`);
          const startTime = Date.now();
          
          const result = await model.generateContent(
            [prompt, imagePart],
            { signal: abortController.signal, timeout: 120000 }
          );
          
          clearTimeout(timeoutId);
          
          const durationMs = Date.now() - startTime;
          console.log(`[PlantDoctor] Gemini response received in ${durationMs} ms`);

          const response = await result.response;
          const rawText = response.text();
          const parsedJson = this.parseCleanJson(rawText);

          if (
            parsedJson &&
            parsedJson.plantName &&
            parsedJson.scientificName &&
            parsedJson.healthStatus &&
            typeof parsedJson.confidence === 'number' &&
            parsedJson.severity &&
            Array.isArray(parsedJson.visibleSymptoms) &&
            Array.isArray(parsedJson.possibleCauses) &&
            Array.isArray(parsedJson.organicTreatment) &&
            Array.isArray(parsedJson.chemicalTreatment) &&
            Array.isArray(parsedJson.preventionSteps)
          ) {
            return {
              success: true,
              aiSource: "gemini",
              isFallback: false,
              modelUsed: this.modelName,
              data: parsedJson
            };
          }

          throw new Error('AI output formatting error or missing validation fields.');
        } catch (error) {
          lastError = error;
          let msg = error.message || String(error);
          
          const isTimeout = msg.toLowerCase().includes('abort') || msg.toLowerCase().includes('timeout') || error.name === 'AbortError';
          
          if (isTimeout && attempt < 2) {
            console.log(`[PlantDoctor] Request timed out. Retrying in 2 seconds...`);
            await new Promise(res => setTimeout(res, 2000));
            continue;
          }
          break; // Don't retry for non-timeouts or if attempts exhausted
        }
      }

      let msg = lastError.message || String(lastError);
      if (this.apiKey) {
        msg = msg.split(this.apiKey).join('[SANITIZED_API_KEY]');
      }
      msg = msg.replace(/key=[^&\s,]+/ig, 'key=[SANITIZED_API_KEY]');
      
      console.error('⚠️ [Gemini AI Execution Error]:', msg);

      // Requirement 8 & 10: Do not return hardcoded Tomato/Early blight data on timeout.
      // Return a strict error response instead of the fallback.
      return {
        success: false,
        isFallback: false,
        aiSource: "error",
        message: friendlyError
      };

    } catch (outerError) {
      console.error('⚠️ [Gemini Setup Error]:', outerError.message);
      return {
        success: false,
        isFallback: false,
        aiSource: "error",
        message: friendlyError
      };
    }
  }

  /**
   * Safe demonstration fallback data if offline or key is unconfigured
   */
  getSimulatedFallback(filePath, description, language, note = '') {
    const isTamil = language === 'ta';
    return {
      success: true,
      aiSource: "fallback",
      isFallback: true,
      notice: note,
      data: {
        isPlantImage: true,
        plantName: isTamil ? "தக்காளி (நாட்டு ரகம்)" : "Tomato (Tamil Nadu Country Variety)",
        localPlantName: isTamil ? "நாட்டு தக்காளி" : "Nattu Thakkali",
        scientificName: "Solanum lycopersicum",
        healthStatus: isTamil ? "நடுத்தர பாதிப்பு" : "Moderate Concern",
        possibleDisease: isTamil ? "முன் பழுப்பு நோயின் சாத்தியம் (Early Blight)" : "Possible Early Blight (Alternaria solani)",
        diseaseCategory: isTamil ? "பூஞ்சை நோய் (Fungal)" : "Fungal",
        confidence: 88,
        severity: "Medium",
        visibleSymptoms: isTamil 
          ? ["பழைய அடிப்பகுதி இலைகளில் வட்டமான பழுப்பு நிற புள்ளிகள்", "புள்ளிகளைச் சுற்றி மஞ்சள் நிற வளையம் தோன்றியுள்ளது"]
          : ["Dark brown concentric rings observed on lower older leaves", "Yellowing halo surrounding localized leaf lesions"],
        possibleCauses: isTamil
          ? ["சமீபத்திய மழை மற்றும் காற்றில் அதிக ஈர்ப்பதம் (>80%)", "முந்தைய பயிர் எச்சங்களில் உள்ள பூஞ்சை வித்துக்கள்"]
          : ["High atmospheric humidity (>80%) common in recent seasonal dampness", "Fungal spores overwintering in uncleaned crop debris"],
        organicTreatment: isTamil
          ? ["வேப்பிலை எண்ணெய் கரைசலை (3% செறிவு) 7 நாட்களுக்கு ஒரு முறை தெளிக்கவும", "டிரைகோடர்மா விரிடி (Trichoderma viride) உயிரியல் பூஞ்சாணக்கொல்லியை வேர்ப்பகுதியில் இடவும"]
          : ["Spray Neem Oil solution (3% concentration) mixed with gentle soap every 7 days", "Apply Trichoderma viride bio-fungicide to the surrounding root zone"],
        chemicalTreatment: isTamil
          ? ["பாதிப்பு அதிகமெனில், காப்பர் ஆக்சிக்ளோரைடு (Copper Oxychloride - 2g/liter) தெளிக்கவும்"]
          : ["If infection progresses severely, spray general active ingredient Copper Oxychloride (2g per liter) or Mancozeb 75% WP"],
        preventionSteps: isTamil
          ? ["சுழற்சி முறை விவசாயம் செய்யவும; ஒரே நிலத்தில் தொடர்ந்து தக்காளி, கத்தரி பயிரிடுவதை தவிர்க்கவும"]
          : ["Practice Crop Rotation: Avoid growing Solanaceous crops continuously in the same soil patch", "Switch to root drip irrigation to keep upper leaf canopy dry"],
        fertilizerAdvice: isTamil
          ? ["ஈரமான வானிலையில் அதிக யூரியா / தழைச்சத்து இடுவதை குறைக்கவும்; பொட்டாஷ் உரங்களை இடவும"]
          : ["Reduce excess Nitrogen application during damp periods; ensure balanced Potassium for disease resistance"],
        wateringAdvice: isTamil
          ? ["காலை வேளையில் வேர்ப்பகுதியில் மட்டும் நீர் பாசனம் செய்யவும; இலைகள் நனைவதை தவிர்க்கவும"]
          : ["Water strictly near soil roots during early morning hours; avoid pooling around main stems"],
        whenToConsultExpert: isTamil
          ? ["நோய் 48 மணி நேரத்தில் புதிய துளிர் இலைகளுக்கு பரவினால், உடனே உங்கள் பகுதி வேளாண் விரிவாக்க அலுவலரை அணுகவும்."]
          : ["If symptoms spread rapidly to new apical growth within 48 hours, immediately consult your regional Agricultural Extension Officer."],
        safetyWarning: isTamil
          ? ["எச்சரிக்கை: எந்தவொரு மருந்தையும் தெளிக்கும் முன் அட்டைப்பட விதிகளை படிக்கவும; கையுறைகள் மற்றும் முகவரி அணியவும."]
          : ["Safety Warning: Always read pesticide container labels carefully and wear adequate protective gloves and masks."],
        analysisLimitations: isTamil
          ? ["குறிப்பு: இது புகைப்பட சான்றுகளை அடிப்படையாகக் கொண்ட AI மதிப்பீடு மட்டுமே; 100% ஆய்வக துல்லியம் அல்ல."]
          : ["Note: This analysis is an algorithmic estimate based solely on visible evidence and is not a 100% confirmed laboratory diagnosis."]
      }
    };
  }
}

module.exports = new GeminiService();
