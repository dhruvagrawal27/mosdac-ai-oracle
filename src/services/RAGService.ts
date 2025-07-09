
import { supabase } from '@/integrations/supabase/client';
import { AnalyticsService } from './AnalyticsService';

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
  private knowledgeBase: any[] = [];
  private isInitialized = false;

  async initialize(): Promise<void> {
    if (this.isInitialized) return;

    console.log('Initializing RAG Service with Groq...');

    try {
      // Load MOSDAC knowledge base
      await this.loadMOSDACKnowledgeBase();

      // Update analytics with actual knowledge base size
      const totalEntities = this.calculateTotalEntities();
      const totalRelations = this.calculateTotalRelations();
      AnalyticsService.updateKnowledgeGraph(totalEntities, totalRelations);
      AnalyticsService.updateDocumentsProcessed(this.knowledgeBase.length);

      this.isInitialized = true;
      console.log('RAG Service initialized successfully');
      console.log(`Knowledge base loaded: ${this.knowledgeBase.length} documents, ${totalEntities} entities, ${totalRelations} relations`);
    } catch (error) {
      console.error('Failed to initialize RAG Service:', error);
      throw error;
    }
  }

  private calculateTotalEntities(): number {
    const uniqueEntities = new Set();
    this.knowledgeBase.forEach(doc => {
      doc.entities.forEach((entity: string) => {
        uniqueEntities.add(entity.toLowerCase());
      });
    });
    return uniqueEntities.size;
  }

  private calculateTotalRelations(): number {
    // Calculate based on entity co-occurrence in documents
    let relations = 0;
    this.knowledgeBase.forEach(doc => {
      const entityCount = doc.entities.length;
      // Each pair of entities in the same document creates a potential relation
      relations += (entityCount * (entityCount - 1)) / 2;
    });
    return relations;
  }

  private async loadMOSDACKnowledgeBase(): Promise<void> {
    // Enhanced MOSDAC knowledge base with real data structure
    this.knowledgeBase = [
      {
        id: 'insat-3d',
        title: 'INSAT-3D Satellite Mission',
        content: `INSAT-3D is an advanced meteorological satellite launched by ISRO in July 2013. 
        It carries advanced payloads including Imager and Sounder for weather forecasting and disaster warning. 
        The satellite provides crucial data for monsoon prediction, cyclone tracking, and atmospheric studies.
        Key instruments include 6-channel Imager (0.55-12.5 μm) and 19-channel Sounder (4.5-14.7 μm).
        Data products include temperature profiles, humidity profiles, rainfall estimation, and cloud imagery.`,
        url: 'https://mosdac.gov.in/insat-3d',
        category: 'satellite',
        entities: ['INSAT-3D', 'ISRO', 'meteorological satellite', 'Imager', 'Sounder', 'weather forecasting', 'monsoon', 'cyclone'],
        keywords: ['weather', 'forecasting', 'monsoon', 'cyclone', 'atmospheric'],
        isProcessed: true
      },
      {
        id: 'oceansat-3',
        title: 'Oceansat-3 Earth Observation Mission',
        content: `Oceansat-3 (EOS-06) is an earth observation satellite launched in November 2021. 
        It carries Ocean Colour Monitor-3 (OCM-3) and Sea Surface Temperature Monitor (SSTM) for oceanographic studies.
        The satellite monitors ocean color, sea surface temperature, and chlorophyll concentration for marine ecosystem studies.
        Primary applications include fishery forecasting, coastal zone management, and climate studies.
        Data products include chlorophyll maps, sea surface temperature, and ocean productivity indices.`,
        url: 'https://mosdac.gov.in/oceansat-3',
        category: 'satellite',
        entities: ['Oceansat-3', 'EOS-06', 'OCM-3', 'SSTM', 'ocean observation', 'Ocean Colour Monitor', 'Sea Surface Temperature Monitor'],
        keywords: ['ocean', 'marine', 'fishery', 'coastal', 'chlorophyll'],
        isProcessed: true
      },
      {
        id: 'megha-tropiques',
        title: 'Megha-Tropiques Indo-French Mission',
        content: `Megha-Tropiques is a joint Indo-French satellite mission launched in 2011 for studying tropical climate.
        It carries MADRAS microwave radiometer, SAPHIR humidity sounder, and GPS Radio-occultation receiver.
        The mission focuses on atmospheric water cycle, precipitation measurement, and tropical weather systems.
        Data products include rainfall estimation, humidity profiles, atmospheric temperature, and water vapor content.
        The satellite provides crucial data for understanding monsoon patterns and tropical cyclone formation.`,
        url: 'https://mosdac.gov.in/megha-tropiques',
        category: 'satellite',
        entities: ['Megha-Tropiques', 'Indo-French mission', 'MADRAS', 'SAPHIR', 'tropical climate', 'microwave radiometer', 'humidity sounder'],
        keywords: ['tropical', 'precipitation', 'humidity', 'monsoon', 'cyclone'],
        isProcessed: true
      },
      {
        id: 'data-access',
        title: 'MOSDAC Data Access Policy',
        content: `MOSDAC provides free access to satellite data for research and operational use.
        Users need to register on the portal and agree to data usage terms.
        Data is available in various formats including HDF5, NetCDF, and GeoTIFF.
        Real-time and archive data are accessible through web interface and FTP services.
        Commercial use requires separate licensing agreements. Educational institutions get priority access.`,
        url: 'https://mosdac.gov.in/data-access-policy',
        category: 'policy',
        entities: ['MOSDAC', 'data access', 'HDF5', 'NetCDF', 'GeoTIFF', 'registration', 'licensing'],
        keywords: ['access', 'policy', 'registration', 'format', 'licensing'],
        isProcessed: true
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
        entities: ['rainfall products', 'INSAT-3D', 'Hydro-Estimator', 'GPM-IMERG', 'GSMaP', 'SAPHIR rainfall'],
        keywords: ['rainfall', 'precipitation', 'hydro-estimator', 'real-time', 'validation'],
        isProcessed: true
      }
    ];
  }

  async askQuestion(question: string): Promise<RAGResponse> {
    if (!this.isInitialized) {
      throw new Error('RAG Service not initialized');
    }

    console.log('Processing question with Groq:', question);

    try {
      // Find relevant documents using keyword matching
      const relevantDocs = this.findRelevantDocuments(question);
      console.log(`Found ${relevantDocs.length} relevant documents for question`);
      
      // Prepare context from relevant documents
      const context = relevantDocs.map(doc => 
        `Title: ${doc.title}\nContent: ${doc.content}\nURL: ${doc.url}`
      ).join('\n\n');

      // Call Groq API through Supabase Edge Function
      const { data, error } = await supabase.functions.invoke('groq-chat', {
        body: {
          messages: [
            {
              role: 'user',
              content: question
            }
          ],
          context: context
        }
      });

      if (error) {
        console.error('Groq API error:', error);
        throw new Error(error.message || 'Failed to get response from AI');
      }

      // Prepare sources
      const sources: Source[] = relevantDocs.map(doc => ({
        title: doc.title,
        url: doc.url,
        snippet: doc.content.substring(0, 200) + '...',
        confidence: 0.8
      }));

      // Extract entities from question and relevant documents
      const entities = this.extractEntitiesFromContext(question, relevantDocs);

      console.log(`Response generated with ${sources.length} sources and ${entities.length} entities`);

      return {
        answer: data.answer || "I couldn't process your question. Please try again.",
        sources,
        entities
      };

    } catch (error) {
      console.error('Error in askQuestion:', error);
      return {
        answer: "I apologize, but I encountered an error processing your question. Please try rephrasing or ask about MOSDAC satellites, data products, or access policies.",
        sources: [],
        entities: []
      };
    }
  }

  private findRelevantDocuments(question: string): any[] {
    const questionLower = question.toLowerCase();
    
    const scoredDocs = this.knowledgeBase.map(doc => {
      let score = 0;
      
      // Check title relevance
      if (doc.title.toLowerCase().includes(questionLower.split(' ')[0])) {
        score += 2;
      }
      
      // Check keyword matches
      const questionWords = questionLower.split(' ').filter(word => word.length > 3);
      questionWords.forEach(word => {
        if (doc.content.toLowerCase().includes(word)) {
          score += 1;
        }
        if (doc.keywords.some((keyword: string) => keyword.toLowerCase().includes(word))) {
          score += 1.5;
        }
        if (doc.entities.some((entity: string) => entity.toLowerCase().includes(word))) {
          score += 2;
        }
      });
      
      return { ...doc, score };
    });
    
    const relevantDocs = scoredDocs
      .filter(doc => doc.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, 3);

    console.log('Document relevance scores:', relevantDocs.map(doc => ({
      title: doc.title,
      score: doc.score
    })));

    return relevantDocs;
  }

  private extractEntitiesFromContext(question: string, relevantDocs: any[]): Entity[] {
    const entities: Entity[] = [];
    const entityPatterns = [
      { pattern: /(INSAT-3D|INSAT-3DR)/gi, label: 'SATELLITE' },
      { pattern: /(Oceansat-3|Oceansat-2|EOS-06)/gi, label: 'SATELLITE' },
      { pattern: /(Megha-Tropiques)/gi, label: 'SATELLITE' },
      { pattern: /(MADRAS|SAPHIR|OCM-3|SSTM|Imager|Sounder|Hydro-Estimator)/gi, label: 'INSTRUMENT' },
      { pattern: /(ISRO|MOSDAC)/gi, label: 'ORGANIZATION' },
      { pattern: /(rainfall|precipitation|humidity|temperature|chlorophyll|ocean color)/gi, label: 'DATA_PRODUCT' }
    ];

    // Extract from question
    const searchText = question + ' ' + relevantDocs.map(doc => doc.content).join(' ');

    entityPatterns.forEach(({ pattern, label }) => {
      const matches = searchText.match(pattern);
      if (matches) {
        const uniqueMatches = [...new Set(matches)];
        uniqueMatches.forEach(match => {
          entities.push({
            text: match,
            label,
            confidence: 0.9
          });
        });
      }
    });

    return entities;
  }

  getKnowledgeBase() {
    return this.knowledgeBase;
  }

  getAnalytics() {
    return {
      documentsCount: this.knowledgeBase.length,
      entitiesCount: this.calculateTotalEntities(),
      relationsCount: this.calculateTotalRelations()
    };
  }
}
