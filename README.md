# LLM Memory System

An experimental implementation of a human-inspired memory system for Large Language Models.

## Background

### Human Memory Limitations

Human working memory is worse than a chimpanzee in specific short-term memory tasks [^1].
Humans can only actively remember 4-5 items [^2], even less when they are older than 20 [^3].
Despite this limitation, humans excel at complex cognitive tasks through specialized memory strategies.

[^1]: Inoue, S., & Matsuzawa, T. (2007). Working memory of numerals in chimpanzees. _Current Biology_, 17(23), R1004-R1005. https://www.cell.com/current-biology/fulltext/S0960-9822(07)02088-X
[^2]: Cowan, N. (2001). The magical number 4 in short-term memory: A reconsideration of mental storage capacity. _Behavioral and Brain Sciences_, 24(1), 87-114. https://www.cambridge.org/core/journals/behavioral-and-brain-sciences/article/magical-number-4-in-shortterm-memory-a-reconsideration-of-mental-storage-capacity/44023F1147D4A1D44BDC0AD226838496
[^3]: Brockmole, J. R., & Logie, R. H. (2013). Age-related change in visual working memory: A study of 55,753 participants aged 8–75. _Frontiers in Psychology_, 4, 12. https://www.frontiersin.org/articles/10.3389/fpsyg.2013.00012/full
[^4]: Gobet, F., Lane, P. C., Croker, S., Cheng, P. C., Jones, G., Oliver, I., & Pine, J. M. (2001). Chunking mechanisms in human learning. _Trends in cognitive sciences_, 5(6), 236-243. https://www.sciencedirect.com/science/article/abs/pii/S1364661300016624
[^5]: Talmi, D. (2013). Enhanced emotional memory: Cognitive and neural mechanisms. _Current Directions in Psychological Science_, 22(6), 430-436. https://journals.sagepub.com/doi/10.1177/0963721413498893
[^6]: Buchanan, T. W. (2007). Retrieval of emotional memories. _Psychological Bulletin_, 133(5), 761-779. https://doi.org/10.1037/0033-2909.133.5.761
[^7]: Nickerson, R. S. (1998). Confirmation bias: A ubiquitous phenomenon in many guises. _Review of General Psychology_, 2(2), 175-220. https://doi.org/10.1037/1089-2680.2.2.175
[^8]: Festinger, L. (1957). A Theory of Cognitive Dissonance. Stanford University Press.

### Memory Systems Comparison

| Memory Type | Humans | LLMs |
|-------------|--------|------|
| Working memory | Limited (4-5 items) | Large (thousands of tokens) |
| Long-term memory | Nearly unlimited, slow access | Fixed in parameters |
| Episodic memory | Autobiographical events | None natively |
| External memory | Notes, books, computers | None without RAG |
| Chunking ability | Strong, automatic [^4] | Limited without specific design |
| Importance-based retention | Prioritizes important information [^5] | No native prioritization |
| Emotion-linked memory | Strong correlation with emotional states [^6] | No emotional states |
| Belief system integration | Filters memories through beliefs [^7] | No belief consistency filtering |

## Research Questions

1. **Human vs. Chimpanzee Cognition**
   - Q: How do humans outperform chimpanzees in complex tasks despite worse working memory?
   - H1: Humans leverage external memory systems (writing, tools, etc.)
   - H2: Humans employ attention-shifting and chunking strategies more effectively
   - H3: Language provides a compression mechanism for complex concepts

2. **Text Generation with Limited Memory**
   - Q: How do humans generate coherent text with severely limited working memory?
   - H1: Humans use an interleaved process: generate a small chunk → recall → generate next chunk
   - H2: Chunking strategies compress multiple concepts into single memory slots
   - H3: External storage (notes, drafts) offloads memory requirements

## Key Aspects of Human Memory

### Importance-Based Memory Retention

Humans don't store all information equally. The brain selectively retains information based on perceived importance:

1. **Selective attention**: Humans naturally filter and prioritize information during encoding
2. **Self-relevance effect**: Information related to oneself is remembered better
3. **Survival processing**: Information relevant to survival receives priority in memory systems
4. **Distinctiveness**: Unique or unusual information stands out and is better retained
5. **Depth of processing**: Information processed deeply (analyzing meaning vs. appearance) is better remembered

This prioritization system allows humans to focus limited memory resources on information most likely to be useful in the future.

### Emotion-Memory Connection

Human memory formation and recall are strongly influenced by emotional states:

1. **Enhanced encoding**: Emotional experiences create stronger memory traces
2. **Flashbulb memories**: Highly emotional events create vivid, detailed memories
3. **State-dependent recall**: Memories are more accessible when emotional state during recall matches state during encoding
4. **Amygdala activation**: The brain's emotional center enhances hippocampal memory formation
5. **Stress hormones**: Cortisol and adrenaline help "tag" emotionally significant memories

This emotion-memory link provides another layer of prioritization that helps humans remember events of potential future importance.

### Belief-Based Memory Filtering

Humans don't simply store all new information equally - they filter it through existing belief systems:

1. **Belief perseverance**: Existing beliefs resist change even when contradicted by new evidence
2. **Selective encoding**: Information consistent with existing beliefs gets encoded more deeply
3. **Motivated reasoning**: People interpret ambiguous information to align with existing beliefs
4. **Source credibility assessment**: Sources that contradict beliefs are often deemed less credible
5. **Memory compartmentalization**: Contradictory memories get stored but with cognitive "flags" noting their inconsistency

This belief-filtering mechanism explains how people can simultaneously remember contradictory information ("someone told me the Earth is round") while maintaining inconsistent beliefs ("I believe the Earth is flat"). The human memory system stores both but prioritizes belief-consistent information during recall and decision-making.

### Belief Change Mechanisms

People change deeply-held beliefs (such as from "flat Earth" to "round Earth") through gradual processes rather than immediate updates:

1. **Evidence accumulation threshold**: Single contradictions are easily dismissed, but persistent patterns of evidence eventually reach a tipping point

2. **Source credibility factors**: Information from trusted sources (respected peers, authority figures, educational institutions) has greater influence on belief revision

3. **Cognitive dissonance resolution**: When the mental effort to maintain contradictory beliefs exceeds the effort to update beliefs, people tend to resolve the inconsistency

4. **Social group alignment**: Beliefs tied to social identity change more readily when social connections shift or when the group itself changes position

5. **Emotional and identity investment**: Beliefs deeply tied to personal identity or emotional investment are more resistant to change than peripheral beliefs

These mechanisms operate in parallel, with belief change typically occurring when multiple factors align to overcome the inherent resistance to updating core beliefs [^8].

## Observations about LLMs

1. LLMs have superior working memory compared to humans, excelling at tasks requiring large context retention (e.g., summarizing long texts)

2. LLMs struggle with runtime learning without fine-tuning

3. Standard RAG implementations don't replicate the interleaved recall-generation pattern humans use

4. LLMs lack the automatic chunking mechanisms humans use to overcome working memory limitations

5. LLMs have no native importance-based memory prioritization system

6. LLMs lack emotional states that influence memory encoding and retrieval

7. LLMs don't filter new information through existing beliefs or knowledge

8. LLMs typically store all information with equal priority, regardless of belief compatibility

## Task Performance Comparison: Human vs. LLM

| Task | Memory Aspect | Who Excels | Reason |
|------|---------------|------------|--------|
| **Remembering large texts verbatim** | Short-term capacity | LLM | LLMs can hold thousands of tokens in context; humans are limited to ~7 chunks |
| **Long-term factual recall** | Semantic memory | LLM | LLMs store vast amounts of facts with high precision; humans have significant forgetting and distortion |
| **Adapting to new information** | Learning & integration | Human | Humans can update mental models instantly; LLMs require fine-tuning or RAG |
| **Contextual memory across days** | Episodic memory | Human | Humans maintain continuous autobiographical memory; LLMs reset between sessions |
| **Identifying relevant memories** | Associative retrieval | Human | Humans intuitively connect related concepts; LLMs require explicit vector similarity |
| **Recalling personal experiences** | Autobiographical memory | Human | Humans store subjective experiences; LLMs have no true personal memory |
| **Remembering rare procedures** | Procedural memory | Human | Humans can recall rarely-used procedures; LLMs may forget low-frequency training data |
| **Summarizing key points** | Information compression | LLM | LLMs excel at extracting and condensing essential information |
| **Creative recombination** | Memory manipulation | Tie | Both can combine memories in novel ways, but with different strengths |
| **Memory under distraction** | Focus & attention | LLM | Human memory deteriorates with distraction; LLMs maintain perfect focus |
| **Spatial memory** | Environmental recall | Human | Humans excel at navigating and recalling spatial information; LLMs struggle with spatial relationships |
| **Memory consolidation during rest** | Memory organization | Human | Humans reorganize memories during sleep; LLMs reorganize memories during fine-tuning |
| **Self-aware memory limitations** | Metacognition | Human | Humans know what they don't know; LLMs often confidently present incorrect recalls |
| **Processing contradictory information** | Belief integration | Human | Humans filter and tag information that contradicts beliefs; LLMs store information without belief filtering |

## Core Hypothesis

An LLM system that mimics human memory patterns—specifically interleaved generation and recall with chunking—will produce:

1. Better retention of learned information over longer contexts
2. More personalized responses by refreshing relevant memories during generation
3. More coherent long-form content by periodically grounding in recalled context

## Technical Implementation

### Architecture

1. **Chunked Generation**
   - Limit generation to small units (15-30 tokens or approximately one sentence)
   - Use natural linguistic boundaries for chunk segmentation
   - Mimic human working memory constraints to improve coherence

2. **Interleaved RAG**
   - Perform retrieval between generation steps
   - Use sliding context window with recency bias
   - Simulate human recall-generate-recall pattern

3. **Importance-Based Memory**
   - Implement priority scoring for stored memories:
     - User-specific information receives higher priority
     - Explicitly flagged important information ("remember this")
     - Information referenced multiple times
     - Distinctive or unusual information
   - Apply decay function to non-important memories

4. **Emotion-Aware Retrieval**
   - Extract emotional context from user input
   - Bias retrieval toward memories with matching emotional tone
   - Tag memories with associated emotional states when storing
   - Use emotional relevance as a retrieval dimension

5. **Belief-Based Filtering**
   - Maintain a belief system representation for the user
   - Score new memories for compatibility with existing beliefs
   - Tag contradictory information rather than discarding it
   - Prioritize belief-consistent information during retrieval
   - Track evidence accumulation against existing beliefs
   - Implement belief change thresholds based on multiple factors

6. **Tiered Memory Store**
   - Short-term: Most recent context (last few exchanges)
   - Medium-term: Current session information with priority scoring
   - Long-term: User profile and persistent prioritized information
   - Belief system: Core knowledge and worldview components

7. **Memory Consolidation**
   - Periodically review and reorganize stored memories
   - Promote frequently accessed memories to higher priority
   - Merge related memories to create "chunked" concepts
   - Prune low-priority memories to prevent context overload
   - Reinforce beliefs with supporting memories

### Implementation Plan

1. Create baseline generation pipeline with single-sentence limits
2. Implement simple memory storage with basic recency prioritization
3. Add importance detection for prioritized memory storage
4. Develop emotional context extraction and matching
5. Implement belief system representation and compatibility scoring
6. Build orchestration layer for interleaved retrieval-generation
7. Create memory filtering pipeline with belief consistency checks
8. Implement periodic memory consolidation process

Each component will maintain a single responsibility and clear interfaces, allowing for incremental development and testing of each memory aspect independently. All functions will adhere to the 100-line maximum guideline, with most targeting the 20-50 line optimal range for readability and maintainability.

## Evaluation Methodology

We will compare standard LLM generation against our interleaved approach using:

1. **Coherence metrics**: 
   - ROUGE, BERTScore for generated text quality
   - Human evaluation of narrative continuity

2. **Information retention**:
   - Accuracy on facts presented earlier in conversation
   - Consistency of persona/user details over time

3. **Computational efficiency**:
   - Latency measurements
   - Token usage efficiency

## Limitations & Challenges

- Additional latency from multiple retrieval steps
- Potential coherence disruption at chunk boundaries
- Implementation complexity vs. standard generation
- Balancing memory refreshing against context prioritization
