interface CrawledDocument {
  url: string;
  title: string;
  content: string;
  type: 'html' | 'pdf' | 'doc';
  size: number;
  status: 'pending' | 'processing' | 'completed' | 'error';
}

interface ProcessedDocument extends CrawledDocument {
  entities: Array<{
    text: string;
    label: string;
    confidence: number;
    startOffset: number;
    endOffset: number;
  }>;
  summary: string;
  keywords: string[];
  sections: Array<{
    title: string;
    content: string;
    startOffset: number;
    endOffset: number;
  }>;
  metadata: {
    language: string;
    readability: number;
    wordCount: number;
    sentenceCount: number;
  };
}

export class DocumentProcessor {
  private nlpModels: any = null;

  constructor() {
    this.initializeNLP();
  }

  private async initializeNLP() {
    // In a real implementation, you would initialize actual NLP models here
    console.log('Initializing NLP models for document processing...');
    this.nlpModels = {
      tokenizer: this.createTokenizer(),
      ner: this.createNERProcessor(),
      summarizer: this.createSummarizer(),
      keywordExtractor: this.createKeywordExtractor()
    };
  }

  async processDocument(document: CrawledDocument): Promise<ProcessedDocument> {
    console.log(`Processing document: ${document.title}`);
    
    document.status = 'processing';
    
    try {
      // Extract text content based on document type
      const cleanContent = this.extractCleanText(document);
      
      // Extract entities
      const entities = await this.extractEntities(cleanContent);
      
      // Generate summary
      const summary = await this.generateSummary(cleanContent);
      
      // Extract keywords
      const keywords = await this.extractKeywords(cleanContent);
      
      // Extract sections
      const sections = this.extractSections(cleanContent);
      
      // Calculate metadata
      const metadata = this.calculateMetadata(cleanContent);
      
      const processedDoc: ProcessedDocument = {
        ...document,
        entities,
        summary,
        keywords,
        sections,
        metadata,
        status: 'completed'
      };
      
      console.log(`Document processed successfully: ${document.title}`);
      return processedDoc;
      
    } catch (error) {
      console.error(`Error processing document ${document.title}:`, error);
      document.status = 'error';
      throw error;
    }
  }

  private extractCleanText(document: CrawledDocument): string {
    let content = document.content;
    
    if (document.type === 'html') {
      // Remove HTML tags and clean up
      content = content
        .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
        .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
        .replace(/<[^>]*>/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();
    }
    
    return content;
  }

  private async extractEntities(text: string): Promise<Array<{
    text: string;
    label: string;
    confidence: number;
    startOffset: number;
    endOffset: number;
  }>> {
    // Simulate entity extraction with predefined patterns for MOSDAC domain
    const entities = [];
    
    // Satellite names
    const satellitePattern = /\b(INSAT[-\s]?\w*|Oceansat[-\s]?\w*|Megha[-\s]?Tropiques|ScatSat[-\s]?\w*|Kalpana[-\s]?\w*|SARAL[-\s]?\w*)\b/gi;
    let match;
    
    while ((match = satellitePattern.exec(text)) !== null) {
      entities.push({
        text: match[0],
        label: 'SATELLITE',
        confidence: 0.9,
        startOffset: match.index,
        endOffset: match.index + match[0].length
      });
    }
    
    // Instruments
    const instrumentPattern = /\b(Imager|Sounder|OCM[-\s]?\w*|SSTM|MADRAS|SAPHIR|ScaRaB)\b/gi;
    while ((match = instrumentPattern.exec(text)) !== null) {
      entities.push({
        text: match[0],
        label: 'INSTRUMENT',
        confidence: 0.85,
        startOffset: match.index,
        endOffset: match.index + match[0].length
      });
    }
    
    // Organizations
    const orgPattern = /\b(ISRO|SAC|MOSDAC|CNES|NASA)\b/gi;
    while ((match = orgPattern.exec(text)) !== null) {
      entities.push({
        text: match[0],
        label: 'ORGANIZATION',
        confidence: 0.95,
        startOffset: match.index,
        endOffset: match.index + match[0].length
      });
    }
    
    // Data products
    const productPattern = /\b(rainfall|temperature|humidity|chlorophyll|SST|precipitation|wind speed)\b/gi;
    while ((match = productPattern.exec(text)) !== null) {
      entities.push({
        text: match[0],
        label: 'DATA_PRODUCT',
        confidence: 0.8,
        startOffset: match.index,
        endOffset: match.index + match[0].length
      });
    }
    
    return entities;
  }

  private async generateSummary(text: string): Promise<string> {
    // Simple extractive summarization
    const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 20);
    
    if (sentences.length <= 3) return text;
    
    // Score sentences based on keyword frequency and position
    const scores = sentences.map((sentence, index) => {
      let score = 0;
      
      // Position score (earlier sentences get higher scores)
      score += (sentences.length - index) / sentences.length * 0.3;
      
      // Keyword score
      const keywords = ['satellite', 'mission', 'data', 'instrument', 'observation', 'mosdac', 'isro'];
      const lowerSentence = sentence.toLowerCase();
      keywords.forEach(keyword => {
        if (lowerSentence.includes(keyword)) score += 0.2;
      });
      
      // Length score (prefer medium-length sentences)
      if (sentence.length > 50 && sentence.length < 200) score += 0.1;
      
      return { sentence: sentence.trim(), score };
    });
    
    // Select top 3 sentences
    const topSentences = scores
      .sort((a, b) => b.score - a.score)
      .slice(0, 3)
      .map(s => s.sentence);
    
    return topSentences.join('. ') + '.';
  }

  private async extractKeywords(text: string): Promise<string[]> {
    // Simple keyword extraction based on frequency and domain relevance
    const words = text.toLowerCase()
      .replace(/[^\w\s]/g, ' ')
      .split(/\s+/)
      .filter(word => word.length > 3);
    
    // Count word frequencies
    const wordCount: { [key: string]: number } = {};
    words.forEach(word => {
      wordCount[word] = (wordCount[word] || 0) + 1;
    });
    
    // Domain-specific important terms
    const domainTerms = [
      'satellite', 'mission', 'data', 'instrument', 'observation', 'mosdac', 'isro',
      'meteorological', 'oceanographic', 'climate', 'weather', 'forecast', 'monitoring',
      'temperature', 'humidity', 'rainfall', 'chlorophyll', 'ocean', 'atmosphere'
    ];
    
    // Boost domain terms
    domainTerms.forEach(term => {
      if (wordCount[term]) {
        wordCount[term] *= 2;
      }
    });
    
    // Sort by frequency and return top keywords
    return Object.entries(wordCount)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 15)
      .map(([word]) => word);
  }

  private extractSections(text: string): Array<{
    title: string;
    content: string;
    startOffset: number;
    endOffset: number;
  }> {
    const sections = [];
    
    // Look for common section patterns
    const sectionPatterns = [
      /^(Overview|Introduction|Background)[\s:]/im,
      /^(Mission Objectives?|Goals?)[\s:]/im,
      /^(Instruments?|Payload)[\s:]/im,
      /^(Data Products?)[\s:]/im,
      /^(Applications?)[\s:]/im,
      /^(Technical Specifications?)[\s:]/im,
      /^(Contact|Support)[\s:]/im
    ];
    
    const lines = text.split('\n').filter(line => line.trim());
    let currentSection = null;
    let sectionContent = [];
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      
      // Check if this line is a section header
      const isHeader = sectionPatterns.some(pattern => pattern.test(line)) ||
                      (line.length < 100 && line.endsWith(':')) ||
                      (line.length < 50 && /^[A-Z][A-Za-z\s]+$/.test(line));
      
      if (isHeader && currentSection) {
        // Save previous section
        sections.push({
          title: currentSection,
          content: sectionContent.join('\n'),
          startOffset: 0, // Simplified for this implementation
          endOffset: 0
        });
        sectionContent = [];
      }
      
      if (isHeader) {
        currentSection = line.replace(/:$/, '');
      } else if (currentSection) {
        sectionContent.push(line);
      }
    }
    
    // Add final section
    if (currentSection && sectionContent.length > 0) {
      sections.push({
        title: currentSection,
        content: sectionContent.join('\n'),
        startOffset: 0,
        endOffset: 0
      });
    }
    
    return sections;
  }

  private calculateMetadata(text: string): {
    language: string;
    readability: number;
    wordCount: number;
    sentenceCount: number;
  } {
    const words = text.split(/\s+/).filter(word => word.length > 0);
    const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
    
    // Simple readability score (Flesch-like)
    const avgWordsPerSentence = words.length / sentences.length;
    const avgSyllablesPerWord = this.estimateSyllables(words);
    const readability = Math.max(0, Math.min(100, 
      206.835 - 1.015 * avgWordsPerSentence - 84.6 * avgSyllablesPerWord
    ));
    
    return {
      language: 'en', // Simplified language detection
      readability: Math.round(readability),
      wordCount: words.length,
      sentenceCount: sentences.length
    };
  }

  private estimateSyllables(words: string[]): number {
    // Simple syllable estimation
    const totalSyllables = words.reduce((count, word) => {
      const syllables = word.toLowerCase()
        .replace(/[^a-z]/g, '')
        .replace(/[aeiou]{2,}/g, 'a') // Replace consecutive vowels with single vowel
        .match(/[aeiou]/g)?.length || 1;
      return count + Math.max(1, syllables);
    }, 0);
    
    return totalSyllables / words.length;
  }

  private createTokenizer() {
    return {
      tokenize: (text: string) => text.split(/\s+/)
    };
  }

  private createNERProcessor() {
    return {
      process: (text: string) => this.extractEntities(text)
    };
  }

  private createSummarizer() {
    return {
      summarize: (text: string) => this.generateSummary(text)
    };
  }

  private createKeywordExtractor() {
    return {
      extract: (text: string) => this.extractKeywords(text)
    };
  }
}
