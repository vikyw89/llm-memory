/**
 * Memory store service
 * 
 * Responsible for storing and retrieving memories with importance-based
 * retention and belief filtering.
 */

// Use node's crypto module instead of uuid for compatibility
import { randomUUID } from 'crypto';
import type {
  Memory,
  MemoryRetrievalOptions,
  MemoryFilterOptions,
  MemoryStoreConfig,
  Belief,
  Evidence,
  BeliefChangeAssessment,
  UserContext
} from '../types';
import { scoreMemoryImportance } from '../utils/score-event';
import { assessBeliefChangeThreshold } from '../utils/belief-change';

// Default configuration
const DEFAULT_CONFIG: MemoryStoreConfig = {
  maxShortTermMemories: 100,
  maxMediumTermMemories: 1000,
  shortTermDecayRate: 0.05,
  consolidationInterval: 3600000, // 1 hour
  importanceThreshold: 0.3,
  emotionalWeighting: 0.3,
  beliefWeighting: 0.2
};

/**
 * Core memory store service
 */
export class MemoryStore {
  private shortTermMemories: Memory[] = [];
  private mediumTermMemories: Memory[] = [];
  private longTermMemories: Map<string, Memory> = new Map();
  private beliefs: Map<string, Belief> = new Map();
  private evidenceStore: Map<string, Evidence> = new Map();
  private config: MemoryStoreConfig;
  private consolidationTimer?: NodeJS.Timeout | null;

  constructor(config: Partial<MemoryStoreConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.startConsolidation();
  }

  /**
   * Add a new memory with belief-based filtering
   */
  public async addMemory(
    content: string, 
    initialImportance = 0.5,
    options: MemoryFilterOptions = {}
  ): Promise<Memory> {
    // Create new memory object
    const memory: Memory = {
      id: randomUUID(),
      content,
      createdAt: new Date(),
      updatedAt: new Date(),
      importanceScore: initialImportance,
      accessCount: 0
    };

    // Apply belief filtering if enabled
    if (options.beliefConsistencyWeight !== undefined && options.beliefConsistencyWeight > 0) {
      await this.applyBeliefFiltering(memory, options);
    }

    // Score memory importance (based on content, beliefs, etc.)
    memory.importanceScore = await scoreMemoryImportance(
      memory, 
      Array.from(this.beliefs.values())
    );

    // Check importance threshold
    if (
      options.importanceThreshold !== undefined && 
      memory.importanceScore < options.importanceThreshold
    ) {
      // Memory not important enough to store
      return memory;
    }

    // Store in appropriate tier based on importance
    this.storeInAppropiateTier(memory);
    
    return memory;
  }

  /**
   * Process a memory through belief system filters
   * Single responsibility: only handles belief filtering
   */
  private async applyBeliefFiltering(
    memory: Memory, 
    options: MemoryFilterOptions
  ): Promise<void> {
    const allBeliefs = Array.from(this.beliefs.values());
    
    // No beliefs yet, skip filtering
    if (allBeliefs.length === 0) return;

    // Find compatible and contradictory beliefs
    const compatibilityScores = await Promise.all(
      allBeliefs.map(belief => this.assessMemoryBeliefCompatibility(memory, belief))
    );
    
    // Track contradictory and supportive beliefs
    memory.contradictoryBeliefs = [];
    memory.supportiveBeliefs = [];
    memory.beliefTags = [];
    
    // Process each belief's compatibility
    let netCompatibility = 0;
    compatibilityScores.forEach((score, index) => {
      const belief = allBeliefs[index];
      
      if (score < -0.3) {
        // Contradictory to belief
        memory.contradictoryBeliefs?.push(belief.id);
        if (options.tagContradictions) {
          memory.beliefTags?.push(`contradicts:${belief.id}`);
        }
      } else if (score > 0.3) {
        // Supportive of belief
        memory.supportiveBeliefs?.push(belief.id);
        memory.beliefTags?.push(`supports:${belief.id}`);
      }
      
      // Add to net compatibility (weighted average)
      netCompatibility += score * belief.importance;
    });
    
    // Calculate overall belief compatibility
    const totalImportance = allBeliefs.reduce((sum, belief) => sum + belief.importance, 0);
    memory.beliefCompatibility = totalImportance > 0 
      ? netCompatibility / totalImportance 
      : 0;
    
    // Adjust importance based on belief compatibility
    if (options.beliefConsistencyWeight !== undefined) {
      // Positive scores boost importance, negative slightly reduce it
      const beliefAdjustment = memory.beliefCompatibility > 0
        ? memory.beliefCompatibility * options.beliefConsistencyWeight
        : memory.beliefCompatibility * options.beliefConsistencyWeight * 0.5;
        
      memory.importanceScore = Math.max(
        0, 
        Math.min(1, memory.importanceScore + beliefAdjustment)
      );
    }
  }

  /**
   * Assess how compatible a memory is with a specific belief
   * Single responsibility: just calculates compatibility
   */
  private async assessMemoryBeliefCompatibility(
    memory: Memory, 
    belief: Belief
  ): Promise<number> {
    // This would use NLP/LLM to assess semantic compatibility
    // Placeholder implementation - in real system would use embedding similarity
    // or directly query an LLM for compatibility assessment
    
    // For now, simple term matching (placeholder)
    const memoryLower = memory.content.toLowerCase();
    const beliefLower = belief.content.toLowerCase();
    
    if (memoryLower.includes(beliefLower)) {
      return 0.8; // Strongly supports
    } else if (
      beliefLower.split(' ').some(word => 
        word.length > 4 && memoryLower.includes(word.toLowerCase())
      )
    ) {
      return 0.4; // Somewhat supports
    } else if (
      memoryLower.includes('not ' + beliefLower) || 
      memoryLower.includes('disagree') || 
      memoryLower.includes('incorrect')
    ) {
      return -0.6; // Contradicts
    }
    
    return 0; // Neutral
  }

  /**
   * Store a memory in the appropriate tier based on importance
   * Single responsibility: just handles storage placement
   */
  private storeInAppropiateTier(memory: Memory): void {
    if (memory.importanceScore >= 0.7) {
      // Important enough for long-term storage
      this.longTermMemories.set(memory.id, memory);
    } else if (memory.importanceScore >= 0.4) {
      // Medium importance
      this.addToMediumTerm(memory);
    } else {
      // Low importance, short-term only
      this.addToShortTerm(memory);
    }
  }

  /**
   * Add memory to short-term store with capacity management
   */
  private addToShortTerm(memory: Memory): void {
    this.shortTermMemories.push(memory);
    
    // Check capacity
    if (this.shortTermMemories.length > (this.config.maxShortTermMemories || 100)) {
      // Remove least important
      this.shortTermMemories.sort((a, b) => a.importanceScore - b.importanceScore);
      this.shortTermMemories.shift();
    }
  }

  /**
   * Add memory to medium-term store with capacity management
   */
  private addToMediumTerm(memory: Memory): void {
    this.mediumTermMemories.push(memory);
    
    // Check capacity
    if (this.mediumTermMemories.length > (this.config.maxMediumTermMemories || 1000)) {
      // Remove least important
      this.mediumTermMemories.sort((a, b) => a.importanceScore - b.importanceScore);
      this.mediumTermMemories.shift();
    }
  }

  /**
   * Retrieve memories based on query and options
   */
  public async retrieveMemories(
    query: string,
    options: MemoryRetrievalOptions = {}
  ): Promise<Memory[]> {
    // Combine all memories for searching
    const allMemories = [
      ...this.shortTermMemories,
      ...this.mediumTermMemories,
      ...Array.from(this.longTermMemories.values())
    ];
    
    if (allMemories.length === 0) {
      return [];
    }

    // Score memories by relevance to query
    const scoredMemories = await Promise.all(
      allMemories.map(async memory => {
        const scores = {
          // Would use vector similarity in real implementation
          // This is just a placeholder
          semantic: this.calculateSemanticScore(memory, query),
          recency: this.calculateRecencyScore(memory),
          importance: memory.importanceScore,
          emotional: this.calculateEmotionalScore(memory, options.emotionalContext),
          belief: this.calculateBeliefScore(memory, options.beliefConsistency)
        };
        
        // Calculate weighted combined score
        const weightedScore = 
          scores.semantic * (options.semanticWeight || 0.4) +
          scores.recency * (options.recencyWeight || 0.2) +
          scores.importance * 0.2 +
          scores.emotional * (options.emotionalWeight || 0.1) +
          scores.belief * (options.beliefWeight || 0.1);
          
        return { memory, score: weightedScore };
      })
    );
    
    // Sort by score and apply limit
    scoredMemories.sort((a, b) => b.score - a.score);
    const limit = options.limit || 10;
    
    // Update access metadata for retrieved memories
    const retrievedMemories = scoredMemories
      .slice(0, limit)
      .map(item => {
        // Update access info
        const memory = item.memory;
        memory.accessCount += 1;
        memory.lastAccessed = new Date();
        return memory;
      });
      
    return retrievedMemories;
  }

  /**
   * Calculate semantic relevance score
   * Single responsibility: just calculate semantic similarity
   */
  private calculateSemanticScore(memory: Memory, query: string): number {
    // This would use vector similarity in production
    // Placeholder implementation
    const queryTerms = query.toLowerCase().split(' ');
    const memoryContent = memory.content.toLowerCase();
    
    // Count matching terms
    let matchCount = 0;
    queryTerms.forEach(term => {
      if (term.length > 3 && memoryContent.includes(term)) {
        matchCount++;
      }
    });
    
    return matchCount / queryTerms.length;
  }

  /**
   * Calculate recency score
   * Single responsibility: just calculate recency
   */
  private calculateRecencyScore(memory: Memory): number {
    const now = new Date();
    const createdDiff = now.getTime() - memory.createdAt.getTime();
    const maxAge = 30 * 24 * 60 * 60 * 1000; // 30 days in ms
    
    // Newer memories get higher scores
    return Math.max(0, 1 - (createdDiff / maxAge));
  }

  /**
   * Calculate emotional context score
   * Single responsibility: just calculate emotional similarity
   */
  private calculateEmotionalScore(
    memory: Memory, 
    targetEmotional?: Memory['emotionalContext']
  ): number {
    if (!memory.emotionalContext || !targetEmotional) {
      return 0.5; // Neutral if either doesn't have emotional context
    }
    
    // Calculate similarity between emotional contexts
    const valenceMatch = 1 - Math.abs(memory.emotionalContext.valence - targetEmotional.valence);
    const arousalMatch = 1 - Math.abs(memory.emotionalContext.arousal - targetEmotional.arousal);
    const dominanceMatch = 1 - Math.abs(memory.emotionalContext.dominance - targetEmotional.dominance);
    
    // Combine the scores
    return (valenceMatch + arousalMatch + dominanceMatch) / 3;
  }

  /**
   * Calculate belief compatibility score
   * Single responsibility: just calculate belief compatibility
   */
  private calculateBeliefScore(
    memory: Memory, 
    targetConsistency?: number
  ): number {
    if (
      memory.beliefCompatibility === undefined || 
      targetConsistency === undefined
    ) {
      return 0.5; // Neutral if no belief info
    }
    
    if (targetConsistency === 0) {
      // If target is neutral, return neutral score
      return 0.5;
    } else if (targetConsistency > 0) {
      // Seeking belief-consistent memories
      return memory.beliefCompatibility > 0 ? 0.5 + (memory.beliefCompatibility * 0.5) : 0.5;
    } else {
      // Seeking belief-challenging memories
      return memory.beliefCompatibility < 0 ? 0.5 + (Math.abs(memory.beliefCompatibility) * 0.5) : 0.5;
    }
  }

  /**
   * Start periodic memory consolidation process
   */
  private startConsolidation(): void {
    if (this.config.consolidationInterval) {
      // Use NodeJS.Timeout type for compatibility
      this.consolidationTimer = setInterval(
        () => this.consolidateMemories(),
        this.config.consolidationInterval
      ) as unknown as NodeJS.Timeout;
    }
  }
  
  /**
   * Stop the consolidation process when done
   */
  public stopConsolidation(): void {
    if (this.consolidationTimer) {
      clearInterval(this.consolidationTimer);
      this.consolidationTimer = null;
    }
  }

  /**
   * Periodically consolidate memories
   * - Promote frequently accessed memories
   * - Apply decay to old short-term memories
   * - Check for belief updates based on evidence accumulation
   */
  private async consolidateMemories(): Promise<void> {
    await Promise.all([
      this.applyShortTermDecay(),
      this.promoteFrequentlyAccessedMemories(),
      this.checkBeliefChanges()
    ]);
  }

  /**
   * Apply decay to short-term memories based on age
   * Single responsibility: just handles short-term decay
   */
  private async applyShortTermDecay(): Promise<void> {
    const decayRate = this.config.shortTermDecayRate || 0.05;
    const now = new Date();
    
    this.shortTermMemories = this.shortTermMemories.filter(memory => {
      // Calculate age in hours
      const ageHours = (now.getTime() - memory.createdAt.getTime()) / (1000 * 60 * 60);
      
      // Apply decay based on age
      memory.importanceScore -= decayRate * ageHours;
      
      // Remove if importance drops too low
      return memory.importanceScore > 0.1;
    });
  }

  /**
   * Promote frequently accessed memories to higher tiers
   * Single responsibility: just handles promotion
   */
  private async promoteFrequentlyAccessedMemories(): Promise<void> {
    // Promote short-term to medium-term
    const shortTermPromotions: Memory[] = [];
    this.shortTermMemories = this.shortTermMemories.filter(memory => {
      if (memory.accessCount >= 3) {
        // Boost importance for frequently accessed memories
        memory.importanceScore = Math.min(0.7, memory.importanceScore + 0.2);
        shortTermPromotions.push(memory);
        return false;
      }
      return true;
    });
    
    // Add promotions to medium-term
    shortTermPromotions.forEach(memory => this.addToMediumTerm(memory));
    
    // Promote medium-term to long-term
    const mediumTermPromotions: Memory[] = [];
    this.mediumTermMemories = this.mediumTermMemories.filter(memory => {
      if (memory.accessCount >= 5) {
        // Boost importance for frequently accessed memories
        memory.importanceScore = Math.min(1.0, memory.importanceScore + 0.3);
        mediumTermPromotions.push(memory);
        return false;
      }
      return true;
    });
    
    // Add promotions to long-term
    mediumTermPromotions.forEach(memory => {
      this.longTermMemories.set(memory.id, memory);
    });
  }

  /**
   * Check if belief changes are warranted based on evidence
   * Single responsibility: just evaluates belief changes
   */
  private async checkBeliefChanges(): Promise<void> {
    // For each belief, check if it should be updated
    for (const belief of this.beliefs.values()) {
      // Get contradicting evidence
      const contradictingEvidence: Evidence[] = belief.contradictingEvidenceIds
        .map(id => this.evidenceStore.get(id))
        .filter((evidence): evidence is Evidence => evidence !== undefined);
      
      if (contradictingEvidence.length === 0) continue;
      
      // Create mock user context (in real system, would be from user profile)
      const userContext = {
        socialGroups: [],
        personalityTraits: {
          openness: 0.5,
          dogmatism: 0.5
        }
      };
      
      // Assess if belief should change
      const assessment = assessBeliefChangeThreshold(
        belief,
        contradictingEvidence,
        userContext
      );
      
      if (assessment.thresholdMet) {
        // In a real system, this would potentially update the belief
        // or notify the system that belief change is warranted
        console.log(`Belief ${belief.id} may need to be updated based on evidence`);
        
        // Update belief confidence proportionally to change score
        belief.confidence = Math.max(0.1, belief.confidence - (assessment.changeScore * 0.2));
        
        // Reset last evaluation timestamp
        belief.lastEvaluated = new Date();
      }
    }
  }

  /**
   * Add a new belief to the system
   */
  public addBelief(belief: Omit<Belief, 'id'>): Belief {
    const newBelief: Belief = {
      ...belief,
      id: randomUUID(),
      lastEvaluated: new Date(), 
      supportingEvidenceIds: belief.supportingEvidenceIds || [],
      contradictingEvidenceIds: belief.contradictingEvidenceIds || []
    };
    
    this.beliefs.set(newBelief.id, newBelief);
    return newBelief;
  }

  /**
   * Add evidence that may support or contradict beliefs
   */
  public addEvidence(
    evidence: Omit<Evidence, 'id'>, 
    relatedBeliefIds: string[]
  ): Evidence {
    const newEvidence: Evidence = {
      ...evidence,
      id: randomUUID(),
      timestamp: new Date()
    };
    
    // Store the evidence
    this.evidenceStore.set(newEvidence.id, newEvidence);
    
    // Link evidence to beliefs
    for (const beliefId of relatedBeliefIds) {
      const belief = this.beliefs.get(beliefId);
      if (!belief) continue;
      
      // Determine if this evidence supports or contradicts the belief
      // This would use NLP in a real system
      // Simplified implementation for demo
      const compatibility = this.isEvidenceSupportive(newEvidence, belief);
      
      if (compatibility > 0.3) {
        // Supporting evidence
        belief.supportingEvidenceIds.push(newEvidence.id);
      } else if (compatibility < -0.3) {
        // Contradicting evidence
        belief.contradictingEvidenceIds.push(newEvidence.id);
      }
    }
    
    return newEvidence;
  }

  /**
   * Determine if evidence supports a belief (simplified)
   * Single responsibility: just assesses evidence support
   */
  private isEvidenceSupportive(evidence: Evidence, belief: Belief): number {
    // This would use NLP/LLM in a real system
    // Simplified implementation - just keyword matching
    const evidenceContent = evidence.content.toLowerCase();
    const beliefContent = belief.content.toLowerCase();
    
    // Check for contradictory language
    if (
      evidenceContent.includes('not ' + beliefContent) ||
      evidenceContent.includes('disagree') ||
      evidenceContent.includes('contrary') ||
      evidenceContent.includes('false')
    ) {
      return -0.8; // Strongly contradicts
    }
    
    // Check for supportive language
    if (
      evidenceContent.includes(beliefContent) ||
      evidenceContent.includes('agree') ||
      evidenceContent.includes('support') ||
      evidenceContent.includes('confirm')
    ) {
      return 0.8; // Strongly supports
    }
    
    return 0; // Neutral
  }

  /**
   * Clean up resources (e.g., timers) when done
   */
  public dispose(): void {
    if (this.consolidationTimer) {
      clearInterval(this.consolidationTimer);
    }
  }
}
