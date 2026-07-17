const RULES = [
  { keywords: ['chest pain', 'difficulty breathing', 'unconscious', 'severe bleeding'], urgency: 'emergency', advice: 'Seek immediate emergency care. Call campus security or proceed to the nearest hospital.' },
  { keywords: ['high fever', 'persistent vomiting', 'severe headache', 'fainting'], urgency: 'high', advice: 'Visit the clinic today. Rest, stay hydrated, and avoid strenuous activity.' },
  { keywords: ['fever', 'cough', 'sore throat', 'body ache', 'fatigue'], urgency: 'medium', advice: 'Schedule a clinic appointment within 24-48 hours. Monitor symptoms and rest well.' },
  { keywords: ['mild', 'slight', 'minor'], urgency: 'low', advice: 'Self-care may be sufficient. Visit the clinic if symptoms persist beyond 3 days.' },
];

export function assessSymptoms(symptoms) {
  const text = symptoms.toLowerCase();
  let match = RULES.find(r => r.keywords.some(k => text.includes(k)));
  if (!match) match = { urgency: 'low', advice: 'Based on your description, a routine clinic visit is recommended for proper evaluation.' };

  const assessments = {
    emergency: 'Your symptoms may indicate a medical emergency requiring immediate attention.',
    high: 'Your symptoms suggest you should be seen by a healthcare provider promptly.',
    medium: 'Your symptoms warrant a clinic consultation within the next day or two.',
    low: 'Your symptoms appear mild. Monitor them and seek care if they worsen.',
  };

  return {
    urgency_level: match.urgency,
    ai_assessment: `${assessments[match.urgency]} ${match.advice}`,
  };
}
