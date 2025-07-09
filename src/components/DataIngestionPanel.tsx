import React, { useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Play, Pause, Square, Download, FileText, Globe, Database, CheckCircle, AlertCircle, Info } from 'lucide-react';
import { WebCrawler } from '../services/WebCrawler';
import { DocumentProcessor } from '../services/DocumentProcessor';
import { KnowledgeGraphBuilder } from '../services/KnowledgeGraphBuilder';
import { toast } from "@/hooks/use-toast";

interface IngestionStatus {
  phase: 'idle' | 'crawling' | 'processing' | 'building-kg' | 'indexing' | 'complete';
  progress: number;
  message: string;
  errors: string[];
  documentsFound: number;
  documentsProcessed: number;
  entitiesExtracted: number;
  relationsBuilt: number;
}

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
  keywords: string[];
}

interface DataIngestionPanelProps {
  onProgressUpdate: (progress: number) => void;
  onComplete: () => void;
}

export const DataIngestionPanel: React.FC<DataIngestionPanelProps> = ({ 
  onProgressUpdate, 
  onComplete 
}) => {
  const [status, setStatus] = useState<IngestionStatus>({
    phase: 'idle',
    progress: 0,
    message: 'Ready to start data ingestion',
    errors: [],
    documentsFound: 0,
    documentsProcessed: 0,
    entitiesExtracted: 0,
    relationsBuilt: 0
  });

  const [documents, setDocuments] = useState<CrawledDocument[]>([]);
  const [processedDocuments, setProcessedDocuments] = useState<ProcessedDocument[]>([]);
  const [baseUrl, setBaseUrl] = useState('https://mosdac.gov.in');
  const [isRunning, setIsRunning] = useState(false);
  const [selectedTab, setSelectedTab] = useState('crawler');

  const updateStatus = useCallback((updates: Partial<IngestionStatus>) => {
    setStatus(prev => {
      const newStatus = { ...prev, ...updates };
      onProgressUpdate(newStatus.progress);
      return newStatus;
    });
  }, [onProgressUpdate]);

  const addError = useCallback((error: string) => {
    setStatus(prev => ({
      ...prev,
      errors: [...prev.errors, error]
    }));
  }, []);

  const startIngestion = async () => {
    setIsRunning(true);
    setDocuments([]);
    setProcessedDocuments([]);
    
    try {
      // Phase 1: Web Crawling (Simulated with real progress)
      updateStatus({
        phase: 'crawling',
        progress: 10,
        message: 'Starting web crawling...',
        errors: []
      });

      const crawler = new WebCrawler();
      
      // Simulate progressive crawling with real updates
      const totalUrls = 25;
      const crawledDocs: CrawledDocument[] = [];
      
      for (let i = 0; i < totalUrls; i++) {
        await new Promise(resolve => setTimeout(resolve, 200)); // Realistic delay
        
        const mockDoc: CrawledDocument = {
          url: `${baseUrl}/page-${i + 1}`,
          title: `Document ${i + 1}`,
          content: `Sample content for document ${i + 1}`,
          type: 'html',
          size: Math.floor(Math.random() * 50000) + 10000,
          status: 'pending'
        };
        
        crawledDocs.push(mockDoc);
        setDocuments([...crawledDocs]);
        
        updateStatus({
          progress: 10 + ((i + 1) / totalUrls) * 30,
          message: `Crawling: Found ${i + 1}/${totalUrls} documents`,
          documentsFound: i + 1
        });
      }

      // Phase 2: Document Processing with real progress updates
      updateStatus({
        phase: 'processing',
        progress: 40,
        message: 'Processing documents...',
        documentsFound: crawledDocs.length
      });

      const processor = new DocumentProcessor();
      const processedDocs: ProcessedDocument[] = [];
      
      for (let i = 0; i < crawledDocs.length; i++) {
        const doc = crawledDocs[i];
        
        // Update document status to processing
        doc.status = 'processing';
        setDocuments([...crawledDocs]);
        
        await new Promise(resolve => setTimeout(resolve, 150)); // Realistic processing time
        
        try {
          // Simulate processing with mock data
          const processed: ProcessedDocument = {
            ...doc,
            status: 'completed',
            entities: [
              {
                text: 'ISRO',
                label: 'ORGANIZATION',
                confidence: 0.95,
                startOffset: 10,
                endOffset: 14
              },
              {
                text: 'satellite',
                label: 'INSTRUMENT',
                confidence: 0.87,
                startOffset: 25,
                endOffset: 34
              }
            ],
            keywords: ['satellite', 'data', 'weather', 'ocean']
          };
          
          processedDocs.push(processed);
          doc.status = 'completed';
          
          updateStatus({
            progress: 40 + ((i + 1) / crawledDocs.length) * 30,
            message: `Processing: ${i + 1}/${crawledDocs.length} documents`,
            documentsProcessed: i + 1
          });
          
        } catch (error) {
          doc.status = 'error';
          addError(`Failed to process ${doc.url}: ${error}`);
        }
        
        setDocuments([...crawledDocs]);
      }

      setProcessedDocuments(processedDocs);

      // Phase 3: Knowledge Graph Building
      updateStatus({
        phase: 'building-kg',
        progress: 70,
        message: 'Building knowledge graph...'
      });

      await new Promise(resolve => setTimeout(resolve, 1000));

      const kgBuilder = new KnowledgeGraphBuilder();
      const { entities, relations } = await kgBuilder.buildGraph(processedDocs);

      updateStatus({
        progress: 85,
        message: 'Knowledge graph built successfully',
        entitiesExtracted: entities.length,
        relationsBuilt: relations.length
      });

      // Phase 4: Indexing
      updateStatus({
        phase: 'indexing',
        progress: 90,
        message: 'Indexing for semantic search...'
      });

      await new Promise(resolve => setTimeout(resolve, 1500));

      // Complete
      updateStatus({
        phase: 'complete',
        progress: 100,
        message: 'Data ingestion completed successfully!'
      });

      onComplete();
      
      toast({
        title: "Ingestion Complete",
        description: `Successfully processed ${processedDocs.length} documents and built knowledge graph with ${entities.length} entities.`,
      });

    } catch (error) {
      addError(`Ingestion failed: ${error}`);
      updateStatus({
        phase: 'idle',
        message: 'Ingestion failed. Check errors for details.'
      });
      
      toast({
        title: "Ingestion Failed",
        description: "Check the error logs for more details.",
        variant: "destructive",
      });
    } finally {
      setIsRunning(false);
    }
  };

  const stopIngestion = () => {
    setIsRunning(false);
    updateStatus({
      phase: 'idle',
      message: 'Ingestion stopped by user'
    });
  };

  const getPhaseIcon = (phase: string) => {
    switch (phase) {
      case 'crawling': return <Globe className="h-4 w-4" />;
      case 'processing': return <FileText className="h-4 w-4" />;
      case 'building-kg': return <Database className="h-4 w-4" />;
      case 'indexing': return <Database className="h-4 w-4" />;
      case 'complete': return <CheckCircle className="h-4 w-4 text-green-500" />;
      default: return <Info className="h-4 w-4" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Control Panel */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Database className="h-5 w-5 text-blue-600" />
            <span>Data Ingestion Control Panel</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* URL Input */}
            <div className="flex items-center space-x-2">
              <Input
                value={baseUrl}
                onChange={(e) => setBaseUrl(e.target.value)}
                placeholder="Base URL to crawl"
                disabled={isRunning}
                className="flex-1"
              />
              <Button
                onClick={startIngestion}
                disabled={isRunning || status.phase === 'complete'}
                className="flex items-center space-x-2"
              >
                <Play className="h-4 w-4" />
                <span>Start Ingestion</span>
              </Button>
              {isRunning && (
                <Button
                  onClick={stopIngestion}
                  variant="destructive"
                  className="flex items-center space-x-2"
                >
                  <Square className="h-4 w-4" />
                  <span>Stop</span>
                </Button>
              )}
            </div>

            {/* Status */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  {getPhaseIcon(status.phase)}
                  <span className="font-medium capitalize">{status.phase.replace('-', ' ')}</span>
                </div>
                <Badge variant={status.phase === 'complete' ? 'default' : 'secondary'}>
                  {status.progress}%
                </Badge>
              </div>
              <Progress value={status.progress} className="w-full" />
              <p className="text-sm text-gray-600">{status.message}</p>
            </div>

            {/* Statistics */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center p-3 bg-blue-50 rounded-lg">
                <div className="text-2xl font-bold text-blue-600">{status.documentsFound}</div>
                <div className="text-xs text-blue-700">Documents Found</div>
              </div>
              <div className="text-center p-3 bg-green-50 rounded-lg">
                <div className="text-2xl font-bold text-green-600">{status.documentsProcessed}</div>
                <div className="text-xs text-green-700">Documents Processed</div>
              </div>
              <div className="text-center p-3 bg-yellow-50 rounded-lg">
                <div className="text-2xl font-bold text-yellow-600">{status.entitiesExtracted}</div>
                <div className="text-xs text-yellow-700">Entities Extracted</div>
              </div>
              <div className="text-center p-3 bg-purple-50 rounded-lg">
                <div className="text-2xl font-bold text-purple-600">{status.relationsBuilt}</div>
                <div className="text-xs text-purple-700">Relations Built</div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Detailed Views */}
      <Tabs value={selectedTab} onValueChange={setSelectedTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="crawler">Web Crawler</TabsTrigger>
          <TabsTrigger value="documents">Documents</TabsTrigger>
          <TabsTrigger value="errors">Errors & Logs</TabsTrigger>
        </TabsList>

        <TabsContent value="crawler">
          <Card>
            <CardHeader>
              <CardTitle>Web Crawler Configuration</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium">Crawl Depth</label>
                    <Input type="number" defaultValue="3" disabled={isRunning} />
                  </div>
                  <div>
                    <label className="text-sm font-medium">Max Pages</label>
                    <Input type="number" defaultValue="100" disabled={isRunning} />
                  </div>
                </div>
                
                <div>
                  <label className="text-sm font-medium">URL Patterns to Include</label>
                  <Input 
                    placeholder="/data-*, /satellite-*, /mission-*" 
                    disabled={isRunning}
                  />
                </div>
                
                <div>
                  <label className="text-sm font-medium">File Types</label>
                  <div className="flex items-center space-x-4 mt-2">
                    <label className="flex items-center space-x-2">
                      <input type="checkbox" defaultChecked disabled={isRunning} />
                      <span className="text-sm">HTML Pages</span>
                    </label>
                    <label className="flex items-center space-x-2">
                      <input type="checkbox" defaultChecked disabled={isRunning} />
                      <span className="text-sm">PDF Documents</span>
                    </label>
                    <label className="flex items-center space-x-2">
                      <input type="checkbox" disabled={isRunning} />
                      <span className="text-sm">Word Documents</span>
                    </label>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="documents">
          <Card>
            <CardHeader>
              <CardTitle>Discovered Documents</CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-96">
                <div className="space-y-2">
                  {documents.length === 0 ? (
                    <p className="text-gray-500 text-center py-8">
                      No documents found yet. Start crawling to discover content.
                    </p>
                  ) : (
                    documents.map((doc, idx) => (
                      <div key={idx} className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="flex-1">
                          <div className="font-medium text-sm">{doc.title || 'Untitled'}</div>
                          <div className="text-xs text-gray-500">{doc.url}</div>
                          <div className="text-xs text-gray-400">
                            {doc.type.toUpperCase()} • {(doc.size / 1024).toFixed(1)} KB
                          </div>
                        </div>
                        <Badge 
                          variant={
                            doc.status === 'completed' ? 'default' :
                            doc.status === 'error' ? 'destructive' :
                            doc.status === 'processing' ? 'secondary' : 'outline'
                          }
                        >
                          {doc.status}
                        </Badge>
                      </div>
                    ))
                  )}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="errors">
          <Card>
            <CardHeader>
              <CardTitle>Error Logs</CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-96">
                <div className="space-y-2">
                  {status.errors.length === 0 ? (
                    <p className="text-gray-500 text-center py-8">
                      No errors reported.
                    </p>
                  ) : (
                    status.errors.map((error, idx) => (
                      <div key={idx} className="flex items-start space-x-2 p-3 bg-red-50 border border-red-200 rounded-lg">
                        <AlertCircle className="h-4 w-4 text-red-500 mt-0.5" />
                        <div className="text-sm text-red-700">{error}</div>
                      </div>
                    ))
                  )}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};
