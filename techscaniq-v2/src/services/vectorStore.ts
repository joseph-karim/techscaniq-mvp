import { createClient } from '@supabase/supabase-js';
import { OpenAIEmbeddings } from '@langchain/openai';
import { SupabaseVectorStore } from '@langchain/community/vectorstores/supabase';
import { Document } from '@langchain/core/documents';
import { config } from '../config';
import { Evidence } from '../types';

export class VectorStoreService {
  private embeddings: OpenAIEmbeddings;
  private supabase: any;
  private vectorStore: SupabaseVectorStore | null = null;

  constructor() {
    this.embeddings = new OpenAIEmbeddings({
      openAIApiKey: config.OPENAI_API_KEY,
      modelName: 'text-embedding-ada-002',
    });

    this.supabase = createClient(
      config.SUPABASE_URL,
      config.SUPABASE_SERVICE_ROLE_KEY
    );
  }

  async initialize() {
    // Initialize vector store with Supabase
    this.vectorStore = await SupabaseVectorStore.fromExistingIndex(
      this.embeddings,
      {
        client: this.supabase,
        tableName: 'evidence_embeddings',
        queryName: 'match_evidence',
      }
    );
  }

  /**
   * Store evidence with embeddings for semantic search
   */
  async storeEvidence(evidence: Evidence[]): Promise<void> {
    if (!this.vectorStore) {
      await this.initialize();
    }

    // Convert evidence to documents
    const documents = evidence.map(e => new Document({
      pageContent: this.createSearchableContent(e),
      metadata: {
        evidenceId: e.id,
        pillarId: e.pillarId,
        sourceUrl: e.source.url,
        sourceType: e.source.type,
        credibility: e.source.credibilityScore,
        qualityScore: e.qualityScore.overall,
        extractedAt: e.metadata.extractedAt,
        keywords: e.metadata.keywords,
      },
    }));

    // Store in vector database
    await this.vectorStore!.addDocuments(documents);
  }

  /**
   * Semantic search for relevant evidence
   */
  async searchEvidence(
    query: string,
    filter?: {
      pillarId?: string;
      minQuality?: number;
      sourceType?: string;
    },
    k: number = 10
  ): Promise<Evidence[]> {
    if (!this.vectorStore) {
      await this.initialize();
    }

    // Build filter conditions
    const filterConditions: any = {};
    if (filter?.pillarId) {
      filterConditions.pillar_id = filter.pillarId;
    }
    if (filter?.minQuality) {
      filterConditions.quality_score = { gte: filter.minQuality };
    }
    if (filter?.sourceType) {
      filterConditions.source_type = filter.sourceType;
    }

    // Perform similarity search
    const results = await this.vectorStore!.similaritySearchWithScore(
      query,
      k,
      filterConditions
    );

    // Fetch full evidence records
    const evidenceIds = results.map(([doc]) => doc.metadata.evidenceId);
    const { data: evidenceRecords, error } = await this.supabase
      .from('evidence')
      .select('*')
      .in('id', evidenceIds);

    if (error) throw error;

    // Map back to Evidence type with scores
    return evidenceRecords.map((record: any, idx: number) => ({
      id: record.id,
      researchQuestionId: record.thesis_id,
      pillarId: record.pillar_id,
      source: {
        type: record.source_type,
        name: record.source_name,
        url: record.source_url,
        credibilityScore: record.source_credibility,
        publishDate: record.source_publish_date ? new Date(record.source_publish_date) : undefined,
        author: record.source_author,
      },
      content: record.content,
      metadata: record.metadata,
      qualityScore: {
        overall: record.quality_score,
        components: record.quality_components,
        reasoning: record.quality_reasoning,
      },
      createdAt: new Date(record.created_at),
      similarityScore: results[idx][1], // Add similarity score
    }));
  }

  /**
   * Find similar evidence to detect duplicates or related content
   */
  async findSimilarEvidence(
    content: string,
    threshold: number = 0.85
  ): Promise<Array<{ evidence: Evidence; similarity: number }>> {
    if (!this.vectorStore) {
      await this.initialize();
    }

    const results = await this.vectorStore!.similaritySearchWithScore(content, 5);
    
    // Filter by similarity threshold
    const similar = results
      .filter(([_, score]) => score >= threshold)
      .map(([doc, score]) => ({
        evidenceId: doc.metadata.evidenceId,
        similarity: score,
      }));

    if (similar.length === 0) {
      return [];
    }

    // Fetch full evidence records
    const { data: evidenceRecords, error } = await this.supabase
      .from('evidence')
      .select('*')
      .in('id', similar.map(s => s.evidenceId));

    if (error) throw error;

    return evidenceRecords.map((record: any) => {
      const similarity = similar.find(s => s.evidenceId === record.id)?.similarity || 0;
      return {
        evidence: this.mapToEvidence(record),
        similarity,
      };
    });
  }

  /**
   * Get evidence recommendations based on current context
   */
  async getEvidenceRecommendations(
    currentEvidenceIds: string[],
    pillarId: string,
    limit: number = 5
  ): Promise<Evidence[]> {
    if (!this.vectorStore) {
      await this.initialize();
    }

    // Get embeddings for current evidence
    const { data: currentEvidence, error } = await this.supabase
      .from('evidence')
      .select('content')
      .in('id', currentEvidenceIds);

    if (error) throw error;

    // Create combined query from current evidence
    const combinedContent = currentEvidence
      .map((e: any) => e.content)
      .join(' ')
      .substring(0, 2000); // Limit length

    // Search for related but different evidence
    const results = await this.vectorStore!.similaritySearchWithScore(
      combinedContent,
      limit + currentEvidenceIds.length,
      {
        pillar_id: pillarId,
        quality_score: { gte: 0.7 },
      }
    );

    // Filter out current evidence
    const recommendations = results
      .filter(([doc]) => !currentEvidenceIds.includes(doc.metadata.evidenceId))
      .slice(0, limit);

    // Fetch full records
    const recommendationIds = recommendations.map(([doc]) => doc.metadata.evidenceId);
    const { data: evidenceRecords, error: fetchError } = await this.supabase
      .from('evidence')
      .select('*')
      .in('id', recommendationIds);

    if (fetchError) throw fetchError;

    return evidenceRecords.map((record: any) => this.mapToEvidence(record));
  }

  private createSearchableContent(evidence: Evidence): string {
    // Combine various fields for better semantic search
    const parts = [
      evidence.content,
      evidence.source.name,
      evidence.metadata.keywords?.join(' ') || '',
      evidence.qualityScore.reasoning,
    ];

    // Add extracted entities if available
    if (evidence.metadata.llmAnalysis) {
      const analysis = evidence.metadata.llmAnalysis;
      if (analysis.entities) {
        parts.push(
          analysis.entities.companies?.join(' ') || '',
          analysis.entities.people?.join(' ') || '',
          analysis.entities.technologies?.join(' ') || ''
        );
      }
      if (analysis.keyPoints) {
        parts.push(analysis.keyPoints.join(' '));
      }
    }

    return parts.filter(Boolean).join(' ');
  }

  private mapToEvidence(record: any): Evidence {
    return {
      id: record.id,
      researchQuestionId: record.thesis_id,
      pillarId: record.pillar_id,
      source: {
        type: record.source_type,
        name: record.source_name,
        url: record.source_url,
        credibilityScore: record.source_credibility,
        publishDate: record.source_publish_date ? new Date(record.source_publish_date) : undefined,
        author: record.source_author,
      },
      content: record.content,
      metadata: record.metadata,
      qualityScore: {
        overall: record.quality_score,
        components: record.quality_components,
        reasoning: record.quality_reasoning,
      },
      createdAt: new Date(record.created_at),
    };
  }
}