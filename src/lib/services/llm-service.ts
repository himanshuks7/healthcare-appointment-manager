import { GoogleGenerativeAI } from '@google/generative-ai';
import type { PreVisitSummary, PostVisitSummary } from '@/types';

const genAI = process.env.GOOGLE_GEMINI_API_KEY
  ? new GoogleGenerativeAI(process.env.GOOGLE_GEMINI_API_KEY)
  : null;

const MAX_RETRIES = 3;
const RETRY_DELAYS = [1000, 3000, 5000]; // Exponential backoff

/**
 * Retries an async operation with exponential backoff
 */
async function withRetry<T>(
  operation: () => Promise<T>,
  retries: number = MAX_RETRIES
): Promise<T> {
  let lastError: Error | null = null;

  for (let attempt = 0; attempt < retries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error as Error;
      if (attempt < retries - 1) {
        await new Promise((resolve) => setTimeout(resolve, RETRY_DELAYS[attempt]));
      }
    }
  }

  throw lastError;
}

/**
 * Generates a pre-visit summary from patient symptoms using LLM.
 * Returns structured analysis with urgency level, chief complaint, and suggested questions.
 */
export async function generatePreVisitSummary(
  symptoms: string
): Promise<{ success: boolean; data?: PreVisitSummary; error?: string }> {
  if (!genAI) {
    return {
      success: true,
      data: getFallbackPreVisitSummary(symptoms),
    };
  }

  try {
    const result = await withRetry(async () => {
      const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

      const prompt = `You are a medical triage assistant. Analyse these patient-reported symptoms and return a JSON response with:
1. "urgencyLevel": one of "LOW", "MEDIUM", or "HIGH"
2. "chiefComplaint": a one-line summary of the main complaint
3. "suggestedQuestions": an array of exactly 3 questions the doctor should ask the patient
4. "briefSummary": a 2-3 sentence clinical summary for the doctor

Patient-reported symptoms: "${symptoms}"

IMPORTANT: Respond ONLY with valid JSON. Do not include any markdown formatting, code blocks, or additional text.`;

      const response = await model.generateContent(prompt);
      const text = response.response.text();
      
      // Clean the response - remove markdown code blocks if present
      const cleanedText = text
        .replace(/```json\n?/g, '')
        .replace(/```\n?/g, '')
        .trim();

      return JSON.parse(cleanedText) as PreVisitSummary;
    });

    return { success: true, data: result };
  } catch (error) {
    console.error('LLM pre-visit summary generation failed:', error);
    return {
      success: true,
      data: getFallbackPreVisitSummary(symptoms),
    };
  }
}

/**
 * Generates a post-visit patient-friendly summary from doctor's notes.
 */
export async function generatePostVisitSummary(
  notes: string,
  prescription: string
): Promise<{ success: boolean; data?: PostVisitSummary; error?: string }> {
  if (!genAI) {
    return {
      success: true,
      data: getFallbackPostVisitSummary(notes, prescription),
    };
  }

  try {
    const result = await withRetry(async () => {
      const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

      const prompt = `You are a patient communication specialist. Convert these clinical notes into a clear, patient-friendly summary. Return a JSON response with:
1. "whatWasFound": a plain-language explanation of the diagnosis (2-3 sentences)
2. "medicationSchedule": an array of objects, each with "medication", "dosage", "frequency", and "duration" fields
3. "followUpSteps": an array of numbered next steps the patient should follow
4. "warningSignsToWatch": an array of symptoms that require immediate medical attention

Clinical Notes: "${notes}"
Prescription: "${prescription}"

IMPORTANT: Respond ONLY with valid JSON. Do not include any markdown formatting, code blocks, or additional text.`;

      const response = await model.generateContent(prompt);
      const text = response.response.text();
      
      const cleanedText = text
        .replace(/```json\n?/g, '')
        .replace(/```\n?/g, '')
        .trim();

      return JSON.parse(cleanedText) as PostVisitSummary;
    });

    return { success: true, data: result };
  } catch (error) {
    console.error('LLM post-visit summary generation failed:', error);
    return {
      success: true,
      data: getFallbackPostVisitSummary(notes, prescription),
    };
  }
}

/**
 * Fallback pre-visit summary when LLM is unavailable
 */
function getFallbackPreVisitSummary(symptoms: string): PreVisitSummary {
  const symptomLower = symptoms.toLowerCase();
  
  let urgencyLevel: 'LOW' | 'MEDIUM' | 'HIGH' = 'LOW';
  if (symptomLower.includes('chest pain') || symptomLower.includes('breathing difficulty') ||
      symptomLower.includes('severe') || symptomLower.includes('emergency')) {
    urgencyLevel = 'HIGH';
  } else if (symptomLower.includes('fever') || symptomLower.includes('pain') ||
             symptomLower.includes('swelling') || symptomLower.includes('persistent')) {
    urgencyLevel = 'MEDIUM';
  }

  return {
    urgencyLevel,
    chiefComplaint: `Patient reports: ${symptoms.substring(0, 100)}`,
    suggestedQuestions: [
      'When did these symptoms first begin?',
      'Have you taken any medications for these symptoms?',
      'Do you have any known allergies or pre-existing conditions?',
    ],
    briefSummary: `Patient has reported the following symptoms: ${symptoms}. Please review during consultation. This is an auto-generated summary as the AI analysis service was unavailable.`,
  };
}

/**
 * Fallback post-visit summary when LLM is unavailable
 */
function getFallbackPostVisitSummary(notes: string, prescription: string): PostVisitSummary {
  const medications = prescription.split('\n').filter(Boolean).map((line) => ({
    medication: line.trim(),
    dosage: 'As prescribed',
    frequency: 'As directed by doctor',
    duration: 'As prescribed',
  }));

  return {
    whatWasFound: `Your doctor has completed the examination. Please refer to the clinical notes for details: ${notes.substring(0, 200)}`,
    medicationSchedule: medications.length > 0 ? medications : [
      { medication: 'No specific medication prescribed', dosage: 'N/A', frequency: 'N/A', duration: 'N/A' },
    ],
    followUpSteps: [
      'Take all prescribed medications as directed',
      'Follow up with your doctor if symptoms persist or worsen',
      'Contact the clinic if you have any questions about your treatment',
    ],
    warningSignsToWatch: [
      'High fever (above 103°F / 39.4°C)',
      'Severe or worsening pain',
      'Difficulty breathing',
      'Any new or unusual symptoms',
    ],
  };
}
