
import React, { useState, useEffect } from 'react';
import { ChatInterface } from '../components/ChatInterface';
import { KnowledgeGraphViewer } from '../components/KnowledgeGraphViewer';
import { DataIngestionPanel } from '../components/DataIngestionPanel';
import { AnalyticsService } from '../services/AnalyticsService';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Brain, MessageSquare, Database, Globe, Zap, Search, RefreshCw } from 'lucide-react';

const Index = () => {
  const [isSystemInitialized, setIsSystemInitialized] = useState(false);
  const [crawlingProgress, setCrawlingProgress] = useState(0);
  const [analytics, setAnalytics] = useState(AnalyticsService.getMetrics());

  const refreshAnalytics = () => {
    setAnalytics(AnalyticsService.getMetrics());
  };

  useEffect(() => {
    // Refresh analytics every 5 seconds when on analytics tab
    const interval = setInterval(refreshAnalytics, 5000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-sm border-b sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-2 rounded-lg">
                <Brain className="h-8 w-8 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  NavDrishti
                </h1>
                <p className="text-sm text-gray-600">Intelligent Assistant for ISRO Satellite Data Portal</p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <div className={`h-3 w-3 rounded-full ${isSystemInitialized ? 'bg-green-500' : 'bg-yellow-500'}`}></div>
              <span className="text-sm text-gray-600">
                {isSystemInitialized ? 'System Ready' : 'Initializing...'}
              </span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8">
        {/* Feature Overview */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card className="border-0 shadow-lg bg-white/60 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Globe className="h-5 w-5 text-blue-600" />
                <span>Web Crawling</span>
              </CardTitle>
              <CardDescription>
                Extracts content from MOSDAC portal including PDFs, documentation, and structured data
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="border-0 shadow-lg bg-white/60 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Database className="h-5 w-5 text-purple-600" />
                <span>Knowledge Graph</span>
              </CardTitle>
              <CardDescription>
                Builds semantic relationships between satellites, missions, instruments, and data products
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="border-0 shadow-lg bg-white/60 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <MessageSquare className="h-5 w-5 text-green-600" />
                <span>NavDrishti</span>
              </CardTitle>
              <CardDescription>
                Provides intelligent answers using RAG-based question answering with source attribution
              </CardDescription>
            </CardHeader>
          </Card>
        </div>

        {/* Main Interface */}
        <Tabs defaultValue="chat" className="w-full">
          <TabsList className="grid w-full grid-cols-4 mb-6">
            <TabsTrigger value="chat" className="flex items-center space-x-2">
              <MessageSquare className="h-4 w-4" />
              <span>Chat Interface</span>
            </TabsTrigger>
            <TabsTrigger value="knowledge-graph" className="flex items-center space-x-2">
              <Brain className="h-4 w-4" />
              <span>Knowledge Graph</span>
            </TabsTrigger>
            <TabsTrigger value="data-ingestion" className="flex items-center space-x-2">
              <Database className="h-4 w-4" />
              <span>Data Ingestion</span>
            </TabsTrigger>
            <TabsTrigger value="analytics" className="flex items-center space-x-2">
              <Search className="h-4 w-4" />
              <span>Analytics</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="chat">
            <ChatInterface 
              isSystemReady={isSystemInitialized}
              onSystemReady={setIsSystemInitialized}
            />
          </TabsContent>

          <TabsContent value="knowledge-graph">
            <KnowledgeGraphViewer />
          </TabsContent>

          <TabsContent value="data-ingestion">
            <DataIngestionPanel 
              onProgressUpdate={setCrawlingProgress}
              onComplete={() => {
                setIsSystemInitialized(true);
                refreshAnalytics();
              }}
            />
          </TabsContent>

          <TabsContent value="analytics">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  System Analytics
                  <Button variant="outline" size="sm" onClick={refreshAnalytics}>
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Refresh
                  </Button>
                </CardTitle>
                <CardDescription>
                  Real-time performance metrics and insights from the AI system
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                  <div className="p-4 bg-blue-50 rounded-lg">
                    <h3 className="font-semibold text-blue-900">Documents Processed</h3>
                    <p className="text-2xl font-bold text-blue-600">{analytics.documentsProcessed}</p>
                  </div>
                  <div className="p-4 bg-green-50 rounded-lg">
                    <h3 className="font-semibold text-green-900">Knowledge Entities</h3>
                    <p className="text-2xl font-bold text-green-600">{analytics.knowledgeEntities}</p>
                  </div>
                  <div className="p-4 bg-purple-50 rounded-lg">
                    <h3 className="font-semibold text-purple-900">Relations Mapped</h3>
                    <p className="text-2xl font-bold text-purple-600">{analytics.relationsMapped}</p>
                  </div>
                </div>
                
                <div className="text-sm text-gray-600">
                  <p>Last updated: {analytics.lastUpdated.toLocaleString()}</p>
                  <p className="mt-2">System Status: {isSystemInitialized ? 'Active' : 'Initializing'}</p>
                </div>

                <div className="mt-6">
                  <Button 
                    variant="destructive" 
                    size="sm" 
                    onClick={() => {
                      AnalyticsService.resetMetrics();
                      refreshAnalytics();
                    }}
                  >
                    Reset Analytics
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Index;
