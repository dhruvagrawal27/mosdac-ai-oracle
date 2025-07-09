
import { pipeline, Pipeline } from '@huggingface/transformers';

interface Source {
  title: string;
  url: string;
  snippet: string;
  confidence: number;
}

interface Entity {
  text: string;
  label: string;
  confidence: number;
}

interface RAGResponse {
  answer: string;
  sources: Source[];
  entities: Entity[];
}

export class RAGService {
  private questionAnsweringPipeline: Pipeline | null = null;
  private nerPipeline: Pipeline | null = null;
  private embeddingPipeline: Pipeline | null = null;
  private knowledgeBase: any[] = [];
  private isInitialized = false;

  async initialize(): Promise<void> {
    if (this.isInitialized) return;

    console.log('Initializing RAG Service...');

    try {
      // Initialize AI models
      this.questionAnsweringPipeline = await pipeline(
        'question-answering',
        'distilbert-base-cased-distilled-squad'
      );

      this.nerPipeline = await pipeline(
        'token-classification',
        'dbmdz/bert-large-cased-finetuned-conll03-english'
      );

      this.embeddingPipeline = await pipeline(
        'feature-extraction',
        'sentence-transformers/all-MiniLM-L6-v2'
      );

      // Load MOSDAC knowledge base
      await this.loadMOSDACKnowledgeBase();

      this.isInitialized = true;
      console.log('RAG Service initialized successfully');
    } catch (error) {
      console.error('Failed to initialize RAG Service:', error);
      throw error;
    }
  }

  private async loadMOSDACKnowledgeBase(): Promise<void> {
    // Simulated MOSDAC knowledge base - in a real implementation,
    // this would be loaded from the crawled and processed data
    this.knowledgeBase = [
      {
        id: 'insat-3d',
        title: 'INSAT-3D Satellite Mission',
        content: `INSAT-3D is an advanced meteorological satellite launched by ISRO in July 2013. 
        It carries advanced payloads including Imager and Sounder for weather forecasting and disaster warning. 
        The satellite provides crucial data for monsoon prediction, cyclone tracking, and atmospheric studies.
        Key instruments include 6-channel Imager (0.55-12.5 μm) and 19-channel Sounder (4.5-14.7 μm).`,
        url: 'https://mosdac.gov.in/insat-3d',
        category: 'satellite',
        entities: ['INSAT-3D', 'ISRO', 'meteorological satellite', 'Imager', 'Sounder'],
        embedding: null
      },
      {
        id: 'oceansat-3',
        title: 'Oceansat-3 Earth Observation Mission',
        content: `Oceansat-3 (EOS-06) is an earth observation satellite launched in November 2021. 
        It carries Ocean Colour Monitor-3 (OCM-3) and Sea Surface Temperature Monitor (SSTM) for oceanographic studies.
        The satellite monitors ocean color, sea surface temperature, and chlorophyll concentration for marine ecosystem studies.
        Primary applications include fishery forecasting, coastal zone management, and climate studies.`,
        url: 'https://mosdac.gov.in/oceansat-3',
        category: 'satellite',
        entities: ['Oceansat-3', 'EOS-06', 'OCM-3', 'SSTM', 'ocean observation'],
        embedding: null
      },
      {
        id: 'megha-tropiques',
        title: 'Megha-Tropiques Indo-French Mission',
        content: `Megha-Tropiques is a joint Indo-French satellite mission launched in 2011 for studying tropical climate.
        It carries MADRAS microwave radiometer, SAPHIR humidity sounder, and GPS Radio-occultation receiver.
        The mission focuses on atmospheric water cycle, precipitation measurement, and tropical weather systems.
        Data products include rainfall estimation, humidity profiles, and atmospheric temperature.`,
        url: 'https://mosdac.gov.in/megha-tropiques',
        category: 'satellite',
        entities: ['Megha-Tropiques', 'Indo-French', 'MADRAS', 'SAPHIR', 'tropical climate'],
        embedding: null
      },
      {
        id: 'data-access',
        title: 'MOSDAC Data Access Policy',
        content: `MOSDAC provides free access to satellite data for research and operational use.
        Users need to register on the portal and agree to data usage terms.
        Data is available in various formats including HDF5, NetCDF, and GeoTIFF.
        Real-time and archive data are accessible through web interface and FTP services.
        Commercial use requires separate licensing agreements.`,
        url: 'https://mosdac.gov.in/data-access-policy',
        category: 'policy',
        entities: ['MOSDAC', 'data access', 'HDF5', 'NetCDF', 'GeoTIFF'],
        embedding: null
      },
      {
        id: 'rainfall-products',
        title: 'Satellite-based Rainfall Products',
        content: `MOSDAC provides multiple rainfall products from various satellite missions.
        Products include INSAT-3D/3DR Hydro-Estimator, GPM-IMERG, GSMaP, and Megha-Tropiques SAPHIR rainfall.
        Temporal resolution ranges from 30 minutes to daily, with spatial resolution from 4km to 25km.
        Data is available in real-time and archive modes for meteorological and hydrological applications.
        Quality assessment and validation information is provided with each product.`,
        url: 'https://mosdac.gov.in/rainfall-products',
        category: 'data-product',
        entities: ['rainfall', 'INSAT-3D', 'GPM-IMERG', 'GSMaP', 'SAPHIR'],
        embedding: null
      }
    ];

    // Generate embeddings for semantic search
    for (const item of this.knowledgeBase) {
      if (this.embeddingPipeline) {
        const embedding = await this.embeddingPipeline(item.content);
        item.embedding = embedding;
      }
    }
  }

  async askQuestion(question: string): Promise<RAGResponse> {
    if (!this.isInitialized) {
      throw new Error('RAG Service not initialized');
    }

    console.log('Processing question:', question);

    // Extract entities from the question
    const entities = await this.extractEntities(question);

    // Find relevant documents using semantic search
    const relevantDocs = await this.findRelevantDocuments(question);

    // Generate answer using question-answering model
    const answer = await this.generateAnswer(question, relevantDocs);

    // Prepare sources
    const sources: Source[] = relevantDocs.map(doc => ({
      title: doc.title,
      url: doc.url,
      snippet: doc.content.substring(0, 200) + '...',
      confidence: doc.similarity || 0.8
    }));

    return {
      answer,
      sources,
      entities
    };
  }

  private async extractEntities(text: string): Promise<Entity[]> {
    if (!this.nerPipeline) return [];

    try {
      const result = await this.nerPipeline(text);
      
      // Process NER results
      const entities: Entity[] = [];
      if (Array.isArray(result)) {
        for (const token of result) {
          if (token.entity !== 'O' && token.score > 0.8) {
            entities.push({
              text: token.word,
              label: token.entity,
              confidence: token.score
            });
          }
        }
      }

      return entities;
    } catch (error) {
      console.error('Error extracting entities:', error);
      return [];
    }
  }

  private async findRelevantDocuments(question: string): Promise<any[]> {
    if (!this.embeddingPipeline) {
      // Fallback to keyword matching
      return this.knowledgeBase.filter(doc => 
        this.calculateKeywordSimilarity(question.toLowerCase(), doc.content.toLowerCase()) > 0.3
      ).slice(0, 3);
    }

    try {
      // Generate embedding for the question
      const questionEmbedding = await this.embeddingPipeline(question);

      // Calculate similarity with all documents
      const similarities = this.knowledgeBase.map(doc => ({
        ...doc,
        similarity: this.calculateCosineSimilarity(questionEmbedding, doc.embedding)
      }));

      // Sort by similarity and return top results
      return similarities
        .sort((a, b) => (b.similarity || 0) - (a.similarity || 0))
        .slice(0, 3);
    } catch (error) {
      console.error('Error finding relevant documents:', error);
      return this.knowledgeBase.slice(0, 3);
    }
  }

  private async generateAnswer(question: string, relevantDocs: any[]): Promise<string> {
    if (!this.questionAnsweringPipeline || relevantDocs.length === 0) {
      return "I apologize, but I couldn't find relevant information to answer your question. Please try rephrasing or ask about MOSDAC satellites, data products, or access policies.";
    }

    try {
      // Combine relevant documents as context
      const context = relevantDocs.map(doc => doc.content).join('\n\n');

      // Use question-answering model
      const result = await this.questionAnsweringPipeline({
        question,
        context
      });

      if (result && result.answer && result.score > 0.1) {
        return result.answer;
      } else {
        // Fallback answer generation
        return this.generateFallbackAnswer(question, relevantDocs);
      }
    } catch (error) {
      console.error('Error generating answer:', error);
      return this.generateFallbackAnswer(question, relevantDocs);
    }
  }

  private generateFallbackAnswer(question: string, relevantDocs: any[]): string {
    const questionLower = question.toLowerCase();
    
    // Simple rule-based responses
    if (questionLower.includes('insat-3d')) {
      return "INSAT-3D is an advanced meteorological satellite launched by ISRO in July 2013. It provides weather forecasting and disaster warning capabilities with its Imager and Sounder instruments.";
    }
    
    if (questionLower.includes('oceansat')) {
      return "Oceansat-3 is an earth observation satellite that monitors ocean color, sea surface temperature, and marine ecosystems using OCM-3 and SSTM instruments.";
    }
    
    if (questionLower.includes('data access') || questionLower.includes('download')) {
      return "MOSDAC provides free access to satellite data for research use. You need to register on the portal and can access data in HDF5, NetCDF, and GeoTIFF formats.";
    }
    
    if (questionLower.includes('rainfall') || questionLower.includes('precipitation')) {
      return "MOSDAC offers various satellite-based rainfall products including INSAT-3D Hydro-Estimator, GPM-IMERG, and GSMaP with different temporal and spatial resolutions.";
    }

    // Generic response based on relevant documents
    if (relevantDocs.length > 0) {
      const firstDoc = relevantDocs[0];
      return `Based on MOSDAC information: ${firstDoc.content.substring(0, 300)}...`;
    }

    return "I can help you with information about MOSDAC satellites, data products, access policies, and more. Please ask me about specific missions like INSAT-3D, Oceansat-3, or data access procedures.";
  }

  private calculateCosineSimilarity(embedding1: any, embedding2: any): number {
    if (!embedding1 || !embedding2) return 0;
    
    try {
      // Simple cosine similarity calculation
      // In a real implementation, you'd use proper tensor operations
      return Math.random() * 0.5 + 0.5; // Placeholder
    } catch (error) {
      return 0;
    }
  }

  private calculateKeywordSimilarity(text1: string, text2: string): number {
    const words1 = text1.split(/\s+/);
    const words2 = text2.split(/\s+/);
    
    const commonWords = words1.filter(word => 
      words2.includes(word) && word.length > 3
    );
    
    return commonWords.length / Math.max(words1.length, words2.length);
  }
}
