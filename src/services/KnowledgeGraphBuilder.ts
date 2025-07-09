
interface ProcessedDocument {
  url: string;
  title: string;
  content: string;
  entities: Array<{
    text: string;
    label: string;
    confidence: number;
    startOffset: number;
    endOffset: number;
  }>;
  keywords: string[];
}

interface Entity {
  id: string;
  name: string;
  type: string;
  description: string;
  properties: { [key: string]: any };
  documents: string[];
}

interface Relation {
  id: string;
  source: string;
  target: string;
  type: string;
  confidence: number;
  evidence: string[];
}

export class KnowledgeGraphBuilder {
  private entities: Map<string, Entity> = new Map();
  private relations: Map<string, Relation> = new Map();

  async buildGraph(documents: ProcessedDocument[]): Promise<{
    entities: Entity[];
    relations: Relation[];
  }> {
    console.log('Building knowledge graph from processed documents...');
    
    // Extract and merge entities
    await this.extractEntities(documents);
    
    // Build relations between entities
    await this.buildRelations(documents);
    
    // Enhance with domain knowledge
    await this.enhanceWithDomainKnowledge();
    
    console.log(`Knowledge graph built: ${this.entities.size} entities, ${this.relations.size} relations`);
    
    return {
      entities: Array.from(this.entities.values()),
      relations: Array.from(this.relations.values())
    };
  }

  private async extractEntities(documents: ProcessedDocument[]) {
    for (const doc of documents) {
      for (const entity of doc.entities) {
        const entityId = this.generateEntityId(entity.text, entity.label);
        
        if (this.entities.has(entityId)) {
          // Update existing entity
          const existing = this.entities.get(entityId)!;
          existing.documents.push(doc.url);
          existing.properties.frequency = (existing.properties.frequency || 0) + 1;
          existing.properties.totalConfidence = (existing.properties.totalConfidence || 0) + entity.confidence;
          existing.properties.avgConfidence = existing.properties.totalConfidence / existing.properties.frequency;
        } else {
          // Create new entity
          const newEntity: Entity = {
            id: entityId,
            name: entity.text,
            type: entity.label.toLowerCase(),
            description: this.generateEntityDescription(entity),
            properties: {
              frequency: 1,
              totalConfidence: entity.confidence,
              avgConfidence: entity.confidence,
              firstSeen: doc.url
            },
            documents: [doc.url]
          };
          
          this.entities.set(entityId, newEntity);
        }
      }
    }
  }

  private async buildRelations(documents: ProcessedDocument[]) {
    for (const doc of documents) {
      const docEntities = doc.entities.filter(e => e.confidence > 0.7);
      
      // Build co-occurrence relations
      for (let i = 0; i < docEntities.length; i++) {
        for (let j = i + 1; j < docEntities.length; j++) {
          const entity1 = docEntities[i];
          const entity2 = docEntities[j];
          
          // Skip if entities are too far apart in text
          if (Math.abs(entity1.startOffset - entity2.startOffset) > 500) continue;
          
          const relation = this.inferRelation(entity1, entity2, doc);
          if (relation) {
            const relationId = `${relation.source}-${relation.type}-${relation.target}`;
            
            if (this.relations.has(relationId)) {
              const existing = this.relations.get(relationId)!;
              existing.evidence.push(doc.url);
              existing.confidence = Math.min(1.0, existing.confidence + 0.1);
            } else {
              this.relations.set(relationId, {
                ...relation,
                id: relationId,
                evidence: [doc.url]
              });
            }
          }
        }
      }
    }
  }

  private inferRelation(entity1: any, entity2: any, doc: ProcessedDocument): Relation | null {
    const id1 = this.generateEntityId(entity1.text, entity1.label);
    const id2 = this.generateEntityId(entity2.text, entity2.label);
    
    // Determine relation type based on entity types and context
    let relationType = 'related_to';
    let confidence = 0.6;
    
    // Satellite-Instrument relations
    if (entity1.label === 'SATELLITE' && entity2.label === 'INSTRUMENT') {
      relationType = 'carries';
      confidence = 0.8;
    } else if (entity1.label === 'INSTRUMENT' && entity2.label === 'SATELLITE') {
      relationType = 'carried_by';
      confidence = 0.8;
    }
    
    // Instrument-Data Product relations
    else if (entity1.label === 'INSTRUMENT' && entity2.label === 'DATA_PRODUCT') {
      relationType = 'measures';
      confidence = 0.7;
    } else if (entity1.label === 'DATA_PRODUCT' && entity2.label === 'INSTRUMENT') {
      relationType = 'measured_by';
      confidence = 0.7;
    }
    
    // Organization-Satellite relations
    else if (entity1.label === 'ORGANIZATION' && entity2.label === 'SATELLITE') {
      relationType = 'operates';
      confidence = 0.9;
    } else if (entity1.label === 'SATELLITE' && entity2.label === 'ORGANIZATION') {
      relationType = 'operated_by';
      confidence = 0.9;
    }
    
    // Mission-Data Product relations
    else if (entity1.label === 'MISSION' && entity2.label === 'DATA_PRODUCT') {
      relationType = 'provides';
      confidence = 0.7;
    } else if (entity1.label === 'DATA_PRODUCT' && entity2.label === 'MISSION') {
      relationType = 'provided_by';
      confidence = 0.7;
    }
    
    // Look for contextual clues in nearby text
    const contextStart = Math.min(entity1.startOffset, entity2.startOffset) - 100;
    const contextEnd = Math.max(entity1.endOffset, entity2.endOffset) + 100;
    const context = doc.content.substring(Math.max(0, contextStart), contextEnd);
    
    // Enhance relation type based on context
    if (context.toLowerCase().includes('launched')) {
      if (entity1.label === 'ORGANIZATION' && entity2.label === 'SATELLITE') {
        relationType = 'launched';
        confidence = 0.85;
      }
    }
    
    if (context.toLowerCase().includes('provides') || context.toLowerCase().includes('offers')) {
      relationType = 'provides';
      confidence = 0.8;
    }
    
    return {
      id: '',
      source: id1,
      target: id2,
      type: relationType,
      confidence,
      evidence: []
    };
  }

  private async enhanceWithDomainKnowledge() {
    // Add predefined domain knowledge about MOSDAC entities
    const domainKnowledge = [
      {
        source: 'ISRO',
        target: 'MOSDAC',
        type: 'operates',
        confidence: 1.0
      },
      {
        source: 'INSAT-3D',
        target: 'Imager',
        type: 'carries',
        confidence: 1.0
      },
      {
        source: 'INSAT-3D',
        target: 'Sounder',
        type: 'carries',
        confidence: 1.0
      },
      {
        source: 'Oceansat-3',
        target: 'OCM-3',
        type: 'carries',
        confidence: 1.0
      },
      {
        source: 'Oceansat-3',
        target: 'SSTM',
        type: 'carries',
        confidence: 1.0
      },
      {
        source: 'Megha-Tropiques',
        target: 'MADRAS',
        type: 'carries',
        confidence: 1.0
      },
      {
        source: 'Megha-Tropiques',
        target: 'SAPHIR',
        type: 'carries',
        confidence: 1.0
      }
    ];

    for (const knowledge of domainKnowledge) {
      const relationId = `${knowledge.source}-${knowledge.type}-${knowledge.target}`;
      
      if (!this.relations.has(relationId)) {
        this.relations.set(relationId, {
          id: relationId,
          source: knowledge.source,
          target: knowledge.target,
          type: knowledge.type,
          confidence: knowledge.confidence,
          evidence: ['domain_knowledge']
        });
      }
    }

    // Enhance entity descriptions with domain knowledge
    this.enhanceEntityDescriptions();
  }

  private enhanceEntityDescriptions() {
    const descriptions: { [key: string]: string } = {
      'ISRO': 'Indian Space Research Organisation - India\'s national space agency',
      'MOSDAC': 'Meteorological and Oceanographic Satellite Data Archival Centre',
      'INSAT-3D': 'Advanced meteorological satellite for weather forecasting and disaster warning',
      'Oceansat-3': 'Earth observation satellite for ocean color and sea surface temperature monitoring',
      'Megha-Tropiques': 'Indo-French satellite mission for tropical climate studies',
      'Imager': '6-channel imaging radiometer for weather observation',
      'Sounder': '19-channel atmospheric sounder for temperature and humidity profiling',
      'OCM-3': 'Ocean Colour Monitor-3 for marine ecosystem studies',
      'SSTM': 'Sea Surface Temperature Monitor for ocean temperature measurement',
      'MADRAS': 'Microwave radiometer for rain and atmospheric structure detection',
      'SAPHIR': 'Humidity sounder for tropical atmospheric profiling'
    };

    for (const [entityId, entity] of this.entities.entries()) {
      if (descriptions[entity.name]) {
        entity.description = descriptions[entity.name];
      }
    }
  }

  private generateEntityId(text: string, label: string): string {
    return `${label.toLowerCase()}_${text.toLowerCase().replace(/\s+/g, '_')}`;
  }

  private generateEntityDescription(entity: any): string {
    const typeDescriptions: { [key: string]: string } = {
      'SATELLITE': 'Earth observation or meteorological satellite',
      'INSTRUMENT': 'Scientific instrument or sensor',
      'ORGANIZATION': 'Space agency or research organization',
      'DATA_PRODUCT': 'Satellite-derived data product',
      'MISSION': 'Space mission or application domain'
    };

    return typeDescriptions[entity.label] || 'Entity identified in MOSDAC documentation';
  }
}
