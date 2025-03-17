/**
 * Utility for scoring memory importance based on content, emotional
 * impact, belief relevance, and other factors.
 */

import type { Memory, Belief } from '../types';

/**
 * Content-based importance factors that boost memory retention
 */
interface ImportanceFactors {
  // Self-referential content ("remember this")
  selfReferential: number;
  
  // Distinctiveness or uniqueness
  distinctiveness: number;
  
  // Personal relevance to user
  personalRelevance: number;
  
  // Emotional intensity
  emotionalIntensity: number;
  
  // Information richness/density
  informationDensity: number;
  
  // Belief system relevance
  beliefRelevance: number;
}

/**
 * Score memory importance based on content and metadata
 * 
 * @param memory The memory to score
 * @param beliefs Current belief system to evaluate against
 * @returns Importance score from 0-1
 */
export async function scoreMemoryImportance(
  memory: Memory,
  beliefs: Belief[]
): Promise<number> {
  // Extract importance factors from memory content
  const factors = await extractImportanceFactors(memory, beliefs);
  
  // Calculate weighted importance score
  const weights = {
    selfReferential: 0.25,
    distinctiveness: 0.2,
    personalRelevance: 0.2,
    emotionalIntensity: 0.15,
    informationDensity: 0.1,
    beliefRelevance: 0.1
  };
  
  // Compute weighted sum of factors
  const score = 
    factors.selfReferential * weights.selfReferential +
    factors.distinctiveness * weights.distinctiveness +
    factors.personalRelevance * weights.personalRelevance +
    factors.emotionalIntensity * weights.emotionalIntensity +
    factors.informationDensity * weights.informationDensity +
    factors.beliefRelevance * weights.beliefRelevance;
  
  // Ensure score is within 0-1 range
  return Math.max(0, Math.min(1, score));
}

/**
 * Extract importance factors from memory content
 * Single responsibility: analyze content for importance signals
 */
async function extractImportanceFactors(
  memory: Memory,
  beliefs: Belief[]
): Promise<ImportanceFactors> {
  const content = memory.content.toLowerCase();
  
  // Initialize factors
  const factors: ImportanceFactors = {
    selfReferential: 0,
    distinctiveness: 0,
    personalRelevance: 0,
    emotionalIntensity: 0,
    informationDensity: 0,
    beliefRelevance: 0
  };
  
  // Check for self-referential cues (explicit importance)
  if (
    content.includes('remember this') ||
    content.includes('important') ||
    content.includes('don\'t forget') ||
    content.includes('note this') ||
    content.includes('critical')
  ) {
    factors.selfReferential = 0.9;
  } else if (
    content.includes('consider') ||
    content.includes('take note') ||
    content.includes('significant')
  ) {
    factors.selfReferential = 0.6;
  }
  
  // Assess distinctiveness (uniqueness)
  // In a real system, this would compare against other memories
  // Simplified implementation for demo
  factors.distinctiveness = assessDistinctiveness(content);
  
  // Check for personal relevance (user-related)
  if (
    content.includes('i ') ||
    content.includes('my ') ||
    content.includes('me ') ||
    content.includes('we ') ||
    content.includes('our ')
  ) {
    factors.personalRelevance = 0.8;
  }
  
  // Assess emotional intensity
  factors.emotionalIntensity = assessEmotionalIntensity(memory);
  
  // Assess information density
  factors.informationDensity = calculateInformationDensity(content);
  
  // Assess belief system relevance
  factors.beliefRelevance = assessBeliefRelevance(content, beliefs);
  
  return factors;
}

/**
 * Assess how distinctive/unique the content is
 * Single responsibility: just evaluates distinctiveness
 */
function assessDistinctiveness(content: string): number {
  // In a real system, this would compare against other memories
  // For demo, use length and presence of specific details as proxy
  
  // Longer content tends to have more unique details
  const lengthFactor = Math.min(content.length / 500, 1) * 0.5;
  
  // Check for specific details that increase distinctiveness
  const hasNumbers = /\d+/.test(content);
  const hasProperNouns = /([A-Z][a-z]+\s*)+/.test(content);
  const hasUrls = content.includes('http');
  const hasSpecificTime = /\d+:\d+/.test(content) || 
                          content.includes('yesterday') ||
                          content.includes('tomorrow');
  
  let detailScore = 0;
  if (hasNumbers) detailScore += 0.15;
  if (hasProperNouns) detailScore += 0.2;
  if (hasUrls) detailScore += 0.2;
  if (hasSpecificTime) detailScore += 0.15;
  
  return lengthFactor + detailScore;
}

/**
 * Assess emotional intensity from memory
 * Single responsibility: just evaluates emotional content
 */
function assessEmotionalIntensity(memory: Memory): number {
  // Use emotional context if available
  if (memory.emotionalContext) {
    // Intensity is based on arousal and deviation from neutral valence
    const arousalFactor = memory.emotionalContext.arousal;
    const valenceFactor = Math.abs(memory.emotionalContext.valence);
    
    return (arousalFactor * 0.6) + (valenceFactor * 0.4);
  }
  
  // Fallback: analyze content for emotional words
  const content = memory.content.toLowerCase();
  
  // Simple keyword-based approach (would use NLP in production)
  const highEmotionWords = [
    'love', 'hate', 'furious', 'ecstatic', 'devastated',
    'thrilled', 'terrified', 'delighted', 'miserable', 'overjoyed',
    'heartbroken', 'outraged', 'fantastic', 'horrible'
  ];
  
  const moderateEmotionWords = [
    'happy', 'sad', 'angry', 'afraid', 'excited',
    'worried', 'proud', 'disappointed', 'annoyed', 'pleased',
    'upset', 'glad', 'anxious', 'satisfied'
  ];
  
  // Count emotional words
  let highCount = 0;
  let moderateCount = 0;
  
  highEmotionWords.forEach(word => {
    if (content.includes(word)) highCount++;
  });
  
  moderateEmotionWords.forEach(word => {
    if (content.includes(word)) moderateCount++;
  });
  
  // Calculate emotional intensity score
  const emotionScore = 
    (highCount * 0.2) + 
    (moderateCount * 0.1);
  
  return Math.min(1, emotionScore);
}

/**
 * Calculate information density of content
 * Single responsibility: just evaluates information richness
 */
function calculateInformationDensity(content: string): number {
  const words = content.split(/\s+/);
  
  // Longer content tends to have more information
  if (words.length < 5) return 0.1;
  if (words.length > 50) return 0.9;
  
  // Calculate normalized length score
  const lengthScore = (words.length - 5) / 45;
  
  // Information-rich indicators
  const hasNumbers = /\d+/.test(content);
  const hasDates = /\d{1,2}[\/\-]\d{1,2}([\/\-]\d{2,4})?/.test(content);
  const hasEnumeration = /\d+\s*[\)\.]/.test(content) || 
                        /[a-z]\s*[\)\.]/.test(content);
  const hasManyNouns = countNouns(content) / words.length > 0.3;
  
  let infoScore = lengthScore * 0.5;
  if (hasNumbers) infoScore += 0.1;
  if (hasDates) infoScore += 0.1;
  if (hasEnumeration) infoScore += 0.15;
  if (hasManyNouns) infoScore += 0.15;
  
  return Math.min(1, infoScore);
}

/**
 * Count approximate number of nouns in content (simplified)
 * Single responsibility: just counts nouns
 */
function countNouns(content: string): number {
  // This is a simplified approach
  // Real implementation would use NLP part-of-speech tagging
  
  // Count capitalized words not at sentence start as potential proper nouns
  const words = content.split(/\s+/);
  let nounCount = 0;
  
  for (let i = 1; i < words.length; i++) {
    const word = words[i];
    if (/^[A-Z][a-z]{2,}$/.test(word)) {
      nounCount++;
    }
  }
  
  // Count common noun endings as a heuristic
  const nounEndings = ['tion', 'ment', 'ence', 'ance', 'ity', 'ness', 'ship', 'hood', 'dom'];
  nounEndings.forEach(ending => {
    const regex = new RegExp(`\\w+${ending}\\b`, 'g');
    const matches = content.match(regex);
    if (matches) {
      nounCount += matches.length;
    }
  });
  
  return nounCount;
}

/**
 * Assess relevance to current belief system
 * Single responsibility: just evaluates belief relevance
 */
function assessBeliefRelevance(content: string, beliefs: Belief[]): number {
  if (beliefs.length === 0) return 0;
  
  // Track maximum relevance score across all beliefs
  let maxRelevance = 0;
  
  // Check each belief for relevance
  beliefs.forEach(belief => {
    const beliefContent = belief.content.toLowerCase();
    const contentLower = content.toLowerCase();
    
    // Direct match with belief content
    if (contentLower.includes(beliefContent)) {
      // Weight by belief importance
      const relevance = 0.8 * belief.importance;
      maxRelevance = Math.max(maxRelevance, relevance);
      return;
    }
    
    // Check for keyword matches within belief
    const keywords = beliefContent.split(/\s+/)
      .filter(word => word.length > 4);
    
    let keywordMatches = 0;
    keywords.forEach(keyword => {
      if (contentLower.includes(keyword)) {
        keywordMatches++;
      }
    });
    
    if (keywords.length > 0 && keywordMatches > 0) {
      // Calculate match percentage
      const matchPercent = keywordMatches / keywords.length;
      const relevance = matchPercent * 0.6 * belief.importance;
      maxRelevance = Math.max(maxRelevance, relevance);
    }
  });
  
  return maxRelevance;
}
