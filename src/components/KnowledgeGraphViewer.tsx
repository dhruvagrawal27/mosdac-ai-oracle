
import React, { useEffect, useRef, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Network, Search, Filter, Download, Maximize2 } from 'lucide-react';
import * as d3 from 'd3';

interface GraphNode {
  id: string;
  name: string;
  type: 'satellite' | 'instrument' | 'data-product' | 'mission' | 'organization';
  description?: string;
  properties?: Record<string, any>;
}

interface GraphLink {
  source: string;
  target: string;
  relationship: string;
  strength: number;
}

interface KnowledgeGraph {
  nodes: GraphNode[];
  links: GraphLink[];
}

export const KnowledgeGraphViewer: React.FC = () => {
  const svgRef = useRef<SVGSVGElement>(null);
  const [graph, setGraph] = useState<KnowledgeGraph | null>(null);
  const [selectedNode, setSelectedNode] = useState<GraphNode | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<string>('all');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Generate MOSDAC knowledge graph
    generateMOSDACGraph();
  }, []);

  useEffect(() => {
    if (graph && svgRef.current) {
      renderGraph();
    }
  }, [graph, searchTerm, filterType]);

  const generateMOSDACGraph = () => {
    const nodes: GraphNode[] = [
      // Organizations
      { id: 'isro', name: 'ISRO', type: 'organization', description: 'Indian Space Research Organisation' },
      { id: 'mosdac', name: 'MOSDAC', type: 'organization', description: 'Meteorological and Oceanographic Satellite Data Archival Centre' },
      
      // Satellites
      { id: 'insat-3d', name: 'INSAT-3D', type: 'satellite', description: 'Advanced meteorological satellite' },
      { id: 'insat-3dr', name: 'INSAT-3DR', type: 'satellite', description: 'Follow-on meteorological satellite' },
      { id: 'oceansat-2', name: 'Oceansat-2', type: 'satellite', description: 'Ocean observation satellite' },
      { id: 'oceansat-3', name: 'Oceansat-3', type: 'satellite', description: 'Advanced ocean observation satellite' },
      { id: 'megha-tropiques', name: 'Megha-Tropiques', type: 'satellite', description: 'Indo-French tropical climate mission' },
      { id: 'scatsat-1', name: 'ScatSat-1', type: 'satellite', description: 'Scatterometer satellite' },
      
      // Instruments
      { id: 'imager', name: 'Imager', type: 'instrument', description: '6-channel imaging radiometer' },
      { id: 'sounder', name: 'Sounder', type: 'instrument', description: '19-channel atmospheric sounder' },
      { id: 'ocm-3', name: 'OCM-3', type: 'instrument', description: 'Ocean Colour Monitor-3' },
      { id: 'sstm', name: 'SSTM', type: 'instrument', description: 'Sea Surface Temperature Monitor' },
      { id: 'madras', name: 'MADRAS', type: 'instrument', description: 'Microwave Analysis and Detection of Rain and Atmospheric Structures' },
      { id: 'saphir', name: 'SAPHIR', type: 'instrument', description: 'Sondeur Atmosphérique du Profil d\'Humidité Intertropicale par Radiométrie' },
      { id: 'scatsat', name: 'ScatSat', type: 'instrument', description: 'Ku-band scatterometer' },
      
      // Data Products
      { id: 'sst', name: 'Sea Surface Temperature', type: 'data-product', description: 'Ocean temperature measurements' },
      { id: 'chlorophyll', name: 'Chlorophyll Concentration', type: 'data-product', description: 'Marine productivity indicator' },
      { id: 'rainfall', name: 'Rainfall Estimates', type: 'data-product', description: 'Precipitation measurements' },
      { id: 'humidity', name: 'Atmospheric Humidity', type: 'data-product', description: 'Water vapor profiles' },
      { id: 'wind-speed', name: 'Ocean Wind Speed', type: 'data-product', description: 'Surface wind measurements' },
      { id: 'cloud-properties', name: 'Cloud Properties', type: 'data-product', description: 'Cloud cover and characteristics' },
      
      // Missions
      { id: 'weather-forecasting', name: 'Weather Forecasting', type: 'mission', description: 'Meteorological prediction services' },
      { id: 'climate-monitoring', name: 'Climate Monitoring', type: 'mission', description: 'Long-term climate observations' },
      { id: 'ocean-research', name: 'Ocean Research', type: 'mission', description: 'Marine ecosystem studies' },
      { id: 'disaster-management', name: 'Disaster Management', type: 'mission', description: 'Early warning systems' }
    ];

    const links: GraphLink[] = [
      // Organization relationships
      { source: 'isro', target: 'mosdac', relationship: 'operates', strength: 1 },
      { source: 'mosdac', target: 'insat-3d', relationship: 'archives_data_from', strength: 0.9 },
      { source: 'mosdac', target: 'oceansat-3', relationship: 'archives_data_from', strength: 0.9 },
      
      // Satellite-Instrument relationships
      { source: 'insat-3d', target: 'imager', relationship: 'carries', strength: 1 },
      { source: 'insat-3d', target: 'sounder', relationship: 'carries', strength: 1 },
      { source: 'oceansat-3', target: 'ocm-3', relationship: 'carries', strength: 1 },
      { source: 'oceansat-3', target: 'sstm', relationship: 'carries', strength: 1 },
      { source: 'megha-tropiques', target: 'madras', relationship: 'carries', strength: 1 },
      { source: 'megha-tropiques', target: 'saphir', relationship: 'carries', strength: 1 },
      { source: 'scatsat-1', target: 'scatsat', relationship: 'carries', strength: 1 },
      
      // Instrument-Data Product relationships
      { source: 'imager', target: 'cloud-properties', relationship: 'measures', strength: 0.8 },
      { source: 'sounder', target: 'humidity', relationship: 'measures', strength: 0.9 },
      { source: 'ocm-3', target: 'chlorophyll', relationship: 'measures', strength: 0.9 },
      { source: 'sstm', target: 'sst', relationship: 'measures', strength: 0.9 },
      { source: 'madras', target: 'rainfall', relationship: 'measures', strength: 0.8 },
      { source: 'saphir', target: 'humidity', relationship: 'measures', strength: 0.9 },
      { source: 'scatsat', target: 'wind-speed', relationship: 'measures', strength: 0.9 },
      
      // Data Product-Mission relationships
      { source: 'rainfall', target: 'weather-forecasting', relationship: 'supports', strength: 0.9 },
      { source: 'humidity', target: 'weather-forecasting', relationship: 'supports', strength: 0.8 },
      { source: 'cloud-properties', target: 'weather-forecasting', relationship: 'supports', strength: 0.7 },
      { source: 'sst', target: 'climate-monitoring', relationship: 'supports', strength: 0.8 },
      { source: 'chlorophyll', target: 'ocean-research', relationship: 'supports', strength: 0.9 },
      { source: 'wind-speed', target: 'ocean-research', relationship: 'supports', strength: 0.7 },
      { source: 'rainfall', target: 'disaster-management', relationship: 'supports', strength: 0.8 }
    ];

    setGraph({ nodes, links });
    setIsLoading(false);
  };

  const renderGraph = () => {
    if (!graph || !svgRef.current) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();

    const width = 800;
    const height = 600;

    // Filter nodes and links based on search and filter
    let filteredNodes = graph.nodes;
    let filteredLinks = graph.links;

    if (searchTerm) {
      filteredNodes = filteredNodes.filter(node => 
        node.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (node.description && node.description.toLowerCase().includes(searchTerm.toLowerCase()))
      );
      const nodeIds = new Set(filteredNodes.map(n => n.id));
      filteredLinks = filteredLinks.filter(link => 
        nodeIds.has(link.source.toString()) && nodeIds.has(link.target.toString())
      );
    }

    if (filterType !== 'all') {
      filteredNodes = filteredNodes.filter(node => node.type === filterType);
      const nodeIds = new Set(filteredNodes.map(n => n.id));
      filteredLinks = filteredLinks.filter(link => 
        nodeIds.has(link.source.toString()) && nodeIds.has(link.target.toString())
      );
    }

    // Color scheme for node types
    const colorScale = d3.scaleOrdinal()
      .domain(['satellite', 'instrument', 'data-product', 'mission', 'organization'])
      .range(['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6']);

    // Create force simulation
    const simulation = d3.forceSimulation(filteredNodes as any)
      .force('link', d3.forceLink(filteredLinks).id((d: any) => d.id).distance(100))
      .force('charge', d3.forceManyBody().strength(-300))
      .force('center', d3.forceCenter(width / 2, height / 2));

    // Create links
    const link = svg.append('g')
      .selectAll('line')
      .data(filteredLinks)
      .join('line')
      .attr('stroke', '#999')
      .attr('stroke-opacity', 0.6)
      .attr('stroke-width', (d: any) => Math.sqrt(d.strength * 3));

    // Create nodes
    const node = svg.append('g')
      .selectAll('circle')
      .data(filteredNodes)
      .join('circle')
      .attr('r', (d: any) => {
        const linkCount = filteredLinks.filter(l => l.source === d.id || l.target === d.id).length;
        return Math.max(8, Math.min(20, linkCount * 3));
      })
      .attr('fill', (d: any) => colorScale(d.type) as string)
      .attr('stroke', '#fff')
      .attr('stroke-width', 2)
      .style('cursor', 'pointer')
      .call(d3.drag<any, any>()
        .on('start', dragstarted)
        .on('drag', dragged)
        .on('end', dragended));

    // Add labels
    const label = svg.append('g')
      .selectAll('text')
      .data(filteredNodes)
      .join('text')
      .text((d: any) => d.name)
      .attr('font-size', 12)
      .attr('font-family', 'Arial, sans-serif')
      .attr('text-anchor', 'middle')
      .attr('dy', 4)
      .style('pointer-events', 'none');

    // Node click handler
    node.on('click', (event: any, d: any) => {
      setSelectedNode(d);
    });

    // Update positions on simulation tick
    simulation.on('tick', () => {
      link
        .attr('x1', (d: any) => d.source.x)
        .attr('y1', (d: any) => d.source.y)
        .attr('x2', (d: any) => d.target.x)
        .attr('y2', (d: any) => d.target.y);

      node
        .attr('cx', (d: any) => d.x)
        .attr('cy', (d: any) => d.y);

      label
        .attr('x', (d: any) => d.x)
        .attr('y', (d: any) => d.y);
    });

    function dragstarted(event: any) {
      if (!event.active) simulation.alphaTarget(0.3).restart();
      event.subject.fx = event.subject.x;
      event.subject.fy = event.subject.y;
    }

    function dragged(event: any) {
      event.subject.fx = event.x;
      event.subject.fy = event.y;
    }

    function dragended(event: any) {
      if (!event.active) simulation.alphaTarget(0);
      event.subject.fx = null;
      event.subject.fy = null;
    }
  };

  const exportGraph = () => {
    if (!graph) return;
    
    const dataStr = JSON.stringify(graph, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'mosdac-knowledge-graph.json';
    link.click();
    URL.revokeObjectURL(url);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <Network className="h-12 w-12 animate-spin mx-auto mb-4 text-blue-600" />
          <p className="text-lg">Building Knowledge Graph...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
      {/* Graph Visualization */}
      <div className="lg:col-span-3">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center space-x-2">
                <Network className="h-5 w-5 text-blue-600" />
                <span>MOSDAC Knowledge Graph</span>
              </CardTitle>
              <div className="flex items-center space-x-2">
                <Button variant="outline" size="sm" onClick={exportGraph}>
                  <Download className="h-4 w-4 mr-2" />
                  Export
                </Button>
                <Button variant="outline" size="sm">
                  <Maximize2 className="h-4 w-4 mr-2" />
                  Fullscreen
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {/* Controls */}
            <div className="flex items-center space-x-4 mb-4">
              <div className="flex-1">
                <Input
                  placeholder="Search nodes..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full"
                />
              </div>
              <Select value={filterType} onValueChange={setFilterType}>
                <SelectTrigger className="w-48">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="satellite">Satellites</SelectItem>
                  <SelectItem value="instrument">Instruments</SelectItem>
                  <SelectItem value="data-product">Data Products</SelectItem>
                  <SelectItem value="mission">Missions</SelectItem>
                  <SelectItem value="organization">Organizations</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Legend */}
            <div className="flex flex-wrap items-center gap-4 mb-4 p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center space-x-2">
                <div className="w-4 h-4 rounded-full bg-blue-500"></div>
                <span className="text-sm">Satellites</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-4 h-4 rounded-full bg-green-500"></div>
                <span className="text-sm">Instruments</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-4 h-4 rounded-full bg-yellow-500"></div>
                <span className="text-sm">Data Products</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-4 h-4 rounded-full bg-red-500"></div>
                <span className="text-sm">Missions</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-4 h-4 rounded-full bg-purple-500"></div>
                <span className="text-sm">Organizations</span>
              </div>
            </div>

            {/* Graph SVG */}
            <div className="border rounded-lg bg-white">
              <svg
                ref={svgRef}
                width="100%"
                height="600"
                viewBox="0 0 800 600"
                className="w-full"
              />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Node Details Sidebar */}
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Node Details</CardTitle>
          </CardHeader>
          <CardContent>
            {selectedNode ? (
              <div className="space-y-4">
                <div>
                  <h3 className="font-semibold text-lg">{selectedNode.name}</h3>
                  <Badge variant="secondary" className="mt-1">
                    {selectedNode.type}
                  </Badge>
                </div>
                
                {selectedNode.description && (
                  <p className="text-sm text-gray-600">{selectedNode.description}</p>
                )}

                {selectedNode.properties && (
                  <div className="space-y-2">
                    <h4 className="font-medium">Properties:</h4>
                    {Object.entries(selectedNode.properties).map(([key, value]) => (
                      <div key={key} className="text-sm">
                        <span className="font-medium">{key}:</span> {value}
                      </div>
                    ))}
                  </div>
                )}

                {graph && (
                  <div className="space-y-2">
                    <h4 className="font-medium">Connections:</h4>
                    <div className="text-sm space-y-1">
                      {graph.links
                        .filter(link => link.source === selectedNode.id || link.target === selectedNode.id)
                        .map((link, idx) => (
                          <div key={idx} className="flex items-center text-xs">
                            <span className="bg-gray-100 px-2 py-1 rounded">
                              {link.relationship}
                            </span>
                            <span className="ml-2">
                              {link.source === selectedNode.id 
                                ? graph.nodes.find(n => n.id === link.target)?.name
                                : graph.nodes.find(n => n.id === link.source)?.name
                              }
                            </span>
                          </div>
                        ))
                      }
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <p className="text-gray-500 text-sm">Click on a node to view details</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Graph Statistics</CardTitle>
          </CardHeader>
          <CardContent>
            {graph && (
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm">Total Nodes:</span>
                  <Badge variant="outline">{graph.nodes.length}</Badge>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm">Total Links:</span>
                  <Badge variant="outline">{graph.links.length}</Badge>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm">Satellites:</span>
                  <Badge variant="outline">
                    {graph.nodes.filter(n => n.type === 'satellite').length}
                  </Badge>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm">Instruments:</span>
                  <Badge variant="outline">
                    {graph.nodes.filter(n => n.type === 'instrument').length}
                  </Badge>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm">Data Products:</span>
                  <Badge variant="outline">
                    {graph.nodes.filter(n => n.type === 'data-product').length}
                  </Badge>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
