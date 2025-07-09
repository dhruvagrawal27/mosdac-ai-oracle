
interface SystemMetrics {
  documentsProcessed: number;
  knowledgeEntities: number;
  relationsMapped: number;
  lastUpdated: Date;
}

export class AnalyticsService {
  private static STORAGE_KEY = 'mosdac_analytics';

  static getMetrics(): SystemMetrics {
    const stored = localStorage.getItem(this.STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      return {
        ...parsed,
        lastUpdated: new Date(parsed.lastUpdated)
      };
    }

    // Initialize with realistic starting values
    return {
      documentsProcessed: 0,
      knowledgeEntities: 0,
      relationsMapped: 0,
      lastUpdated: new Date()
    };
  }

  static updateDocumentsProcessed(count: number) {
    const metrics = this.getMetrics();
    metrics.documentsProcessed = count;
    metrics.lastUpdated = new Date();
    this.saveMetrics(metrics);
  }

  static updateKnowledgeGraph(entities: number, relations: number) {
    const metrics = this.getMetrics();
    metrics.knowledgeEntities = entities;
    metrics.relationsMapped = relations;
    metrics.lastUpdated = new Date();
    this.saveMetrics(metrics);
  }

  static incrementDocuments() {
    const metrics = this.getMetrics();
    metrics.documentsProcessed += 1;
    metrics.lastUpdated = new Date();
    this.saveMetrics(metrics);
  }

  private static saveMetrics(metrics: SystemMetrics) {
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(metrics));
  }

  static resetMetrics() {
    localStorage.removeItem(this.STORAGE_KEY);
  }
}
