/**
 * Utilities for managing belief change thresholds and assessment.
 * 
 * These functions implement cognitive dissonance theory (Festinger, 1957)
 * and models of belief change through evidence accumulation.
 */

// Types for belief change mechanism
export interface Belief {
  id: string;
  content: string;
  confidence: number; // 0-1 confidence in this belief
  importance: number; // 0-1 how central to identity/worldview
  supportingEvidenceIds: string[]; // References to evidence supporting this belief
  contradictingEvidenceIds: string[]; // References to contradictory evidence
  lastEvaluated: Date;
  socialGroups: string[]; // IDs of social groups associated with this belief
  changeResistance: number; // 0-1 how difficult to change this belief
}

export interface Evidence {
  id: string;
  content: string;
  strength: number; // 0-1 how strong this evidence is
  sourceCredibility: number; // 0-1 credibility of the source
  emotionalImpact: number; // 0-1 emotional impact of this evidence
  timestamp: Date;
  sourceType: 'personal_experience' | 'authority' | 'peer' | 'media' | 'education';
}

export interface BeliefChangeAssessment {
  thresholdMet: boolean;
  changeScore: number;
  factors: {
    evidenceStrength: number;
    beliefEntrenchment: number;
    socialFactor: number;
    dissonanceLevel: number;
  };
}

export interface UserContext {
  socialGroups: Array<{
    id: string;
    name: string;
    influence: number; // 0-1 how influential this group is to the user
  }>;
  personalityTraits: {
    openness: number; // 0-1 openness to experience
    dogmatism: number; // 0-1 resistance to changing views
  };
}

// Constants
const BELIEF_CHANGE_THRESHOLD = 0.7; // Threshold for belief change

/**
 * Calculates the strength of evidence against a belief.
 * Single responsibility: just evaluate evidence strength
 */
export function calculateEvidenceStrength(contradictingEvidence: Evidence[]): number {
  if (!contradictingEvidence.length) return 0;
  
  // Calculate weighted average of evidence strength and credibility
  const weightedStrengths = contradictingEvidence.map(
    evidence => evidence.strength * evidence.sourceCredibility
  );
  
  // Average the weighted strengths
  return weightedStrengths.reduce((sum, val) => sum + val, 0) / contradictingEvidence.length;
}

/**
 * Assesses how entrenched a belief is based on its properties.
 * Single responsibility: just evaluate belief entrenchment
 */
export function assessBeliefEntrenchment(belief: Belief): number {
  // Combine factors affecting belief entrenchment
  const importanceFactor = belief.importance * 0.4;
  const confidenceFactor = belief.confidence * 0.3;
  const resistanceFactor = belief.changeResistance * 0.3;
  
  return importanceFactor + confidenceFactor + resistanceFactor;
}

/**
 * Calculates social pressure for or against belief change.
 * Single responsibility: just evaluate social factors
 */
export function calculateSocialPressure(
  belief: Belief, 
  userSocialGroups: UserContext['socialGroups']
): number {
  // If no social groups, return neutral value
  if (!userSocialGroups.length) return 0.5;
  
  // Calculate pressure from each social group
  let totalPressure = 0;
  let totalInfluence = 0;
  
  userSocialGroups.forEach(group => {
    // If this group is associated with the belief, it exerts pressure to maintain
    const isPressureToMaintain = belief.socialGroups.includes(group.id);
    
    // Add weighted pressure based on group influence
    totalPressure += group.influence * (isPressureToMaintain ? 0 : 1);
    totalInfluence += group.influence;
  });
  
  // Normalize pressure by total influence
  return totalInfluence > 0 ? totalPressure / totalInfluence : 0.5;
}

/**
 * Measures cognitive dissonance level based on contradicting evidence.
 * Single responsibility: just calculate dissonance
 */
export function measureCognitiveDissonance(
  belief: Belief, 
  contradictingEvidence: Evidence[]
): number {
  if (!contradictingEvidence.length) return 0;
  
  // Calculate dissonance as function of evidence strength and quantity
  const evidenceVolume = Math.min(contradictingEvidence.length / 10, 1);
  const averageImpact = contradictingEvidence.reduce(
    (sum, evidence) => sum + evidence.emotionalImpact, 0
  ) / contradictingEvidence.length;
  
  // Combine quantity and quality factors
  return evidenceVolume * 0.4 + averageImpact * 0.6;
}

/**
 * Computes the final change threshold based on all factors.
 * Single responsibility: combine all factors into final threshold
 */
export function computeChangeThreshold(
  evidenceStrength: number,
  beliefEntrenchment: number,
  socialFactor: number,
  dissonanceLevel: number
): number {
  // Weight the factors
  const evidenceWeight = 0.35;
  const entrenchmentWeight = 0.3;
  const socialWeight = 0.2;
  const dissonanceWeight = 0.15;
  
  // Calculate change likelihood (higher = more likely to change)
  return (
    evidenceStrength * evidenceWeight +
    (1 - beliefEntrenchment) * entrenchmentWeight +
    socialFactor * socialWeight +
    dissonanceLevel * dissonanceWeight
  );
}

/**
 * Main function to assess if a belief should change based on evidence and context.
 * Composes smaller functions to maintain single responsibility principle.
 */
export function assessBeliefChangeThreshold(
  belief: Belief,
  contradictingEvidence: Evidence[],
  userContext: UserContext
): BeliefChangeAssessment {
  // Calculate evidence strength (single responsibility)
  const evidenceStrength = calculateEvidenceStrength(contradictingEvidence);
  
  // Assess belief entrenchment (single responsibility)
  const beliefEntrenchment = assessBeliefEntrenchment(belief);
  
  // Evaluate social factors (single responsibility)
  const socialFactor = calculateSocialPressure(belief, userContext.socialGroups);
  
  // Compute cognitive dissonance (single responsibility)
  const dissonanceLevel = measureCognitiveDissonance(belief, contradictingEvidence);
  
  // Calculate final threshold
  const changeScore = computeChangeThreshold(
    evidenceStrength,
    beliefEntrenchment,
    socialFactor,
    dissonanceLevel
  );
  
  return {
    thresholdMet: changeScore > BELIEF_CHANGE_THRESHOLD,
    changeScore,
    factors: {
      evidenceStrength,
      beliefEntrenchment,
      socialFactor,
      dissonanceLevel
    }
  };
}
