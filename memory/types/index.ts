/**
 * Core types for the LLM memory system with belief-based filtering
 */

// Import belief system types
import type { Belief, Evidence, BeliefChangeAssessment, UserContext } from '../utils/belief-change';

// Re-export belief system types for use throughout the application
export type { Belief, Evidence, BeliefChangeAssessment, UserContext };

// Basic memory type
export interface Memory {
  id: string;
  content: string;
  createdAt: Date;
  updatedAt: Date;
  
  // Metadata for importance-based retention
  importanceScore: number;
  accessCount: number;
  lastAccessed?: Date;
  
  // Emotional context
  emotionalContext?: {
    valence: number; // -1 (negative) to 1 (positive)
    arousal: number; // 0 (calm) to 1 (excited)
    dominance: number; // 0 (submissive) to 1 (dominant)
    primaryEmotion?: string; // e.g., "joy", "sadness", "anger"
  };
  
  // Belief system integration
  beliefCompatibility?: number; // -1 (contradicts) to 1 (supports)
  contradictoryBeliefs?: string[]; // IDs of beliefs this memory contradicts
  supportiveBeliefs?: string[]; // IDs of beliefs this memory supports
  beliefTags?: string[]; // Tags related to belief integration
  
  // Relational data
  relatedMemoryIds?: string[];
  sourceContext?: string; // Context in which this memory was formed
  category?: string; // General category for organization
  
  // Vector representation for similarity search
  embedding?: number[];
}

// Memory with source tracking
export interface SourcedMemory extends Memory {
  source: MemorySource;
  reliability: number; // 0-1 reliability of this memory
}

// Types of memory sources
export type MemorySource = 
  | 'user_statement'     // Direct user statement
  | 'system_inference'   // Inferred by the system
  | 'conversation'       // From conversation history
  | 'external_data'      // From external data source
  | 'personal_experience'; // User's reported experience

// Type re-exports already handled above

// Memory retrieval options
export interface MemoryRetrievalOptions {
  limit?: number;
  minImportance?: number;
  emotionalContext?: Memory['emotionalContext'];
  beliefConsistency?: number; // -1 (contradictory) to 1 (supportive), 0 = neutral
  recencyWeight?: number; // 0-1 weight for recency in scoring
  semanticWeight?: number; // 0-1 weight for semantic similarity
  emotionalWeight?: number; // 0-1 weight for emotional similarity
  beliefWeight?: number; // 0-1 weight for belief compatibility
}

// Memory filter options during storage
export interface MemoryFilterOptions {
  importanceThreshold?: number; // Minimum importance to store
  deduplicationEnabled?: boolean; // Whether to check for duplicates
  beliefConsistencyWeight?: number; // How much to weight belief consistency
  allowContradictions?: boolean; // Whether to store contradictory information
  tagContradictions?: boolean; // Whether to mark contradictory information
}

// Memory store configuration
export interface MemoryStoreConfig {
  maxShortTermMemories?: number; // Max number of short-term memories
  maxMediumTermMemories?: number; // Max number of medium-term memories
  shortTermDecayRate?: number; // Rate at which short-term memories decay
  consolidationInterval?: number; // How often to run consolidation (in ms)
  importanceThreshold?: number; // Min importance for long-term storage
  emotionalWeighting?: number; // Weight for emotional factors in importance
  beliefWeighting?: number; // Weight for belief factors in importance
}

// System response with memory context
export interface MemoryAugmentedResponse {
  response: string;
  retrievedMemories: Memory[];
  newMemories: Memory[];
  updatedBeliefs?: Belief[];
}
