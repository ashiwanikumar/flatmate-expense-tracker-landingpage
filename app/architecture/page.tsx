'use client';

import { useCallback, useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import ReactFlow, {
  MiniMap,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  addEdge,
  Panel,
  BackgroundVariant,
  Connection,
  Edge,
  Node,
  useReactFlow,
  getRectOfNodes,
  getTransformForBounds,
  ReactFlowProvider,
} from 'reactflow';
import { toPng } from 'html-to-image';
import 'reactflow/dist/style.css';
import Footer from '@/components/Footer';
import { SquareNode, CircleNode, DiamondNode, TriangleNode, HexagonNode, CylinderNode } from '@/components/CustomNodes';
import { architectureAPI } from '@/lib/api';

const nodeTypes = {
  square: SquareNode,
  circle: CircleNode,
  diamond: DiamondNode,
  triangle: TriangleNode,
  hexagon: HexagonNode,
  cylinder: CylinderNode,
};

const initialNodes: Node[] = [
  {
    id: '1',
    type: 'square',
    position: { x: 250, y: 50 },
    data: { label: 'Frontend', color: '#9333ea' },
  },
  {
    id: '2',
    type: 'square',
    position: { x: 250, y: 200 },
    data: { label: 'Backend API', color: '#3b82f6' },
  },
  {
    id: '3',
    type: 'cylinder',
    position: { x: 100, y: 350 },
    data: { label: 'MongoDB', color: '#22c55e' },
  },
  {
    id: '4',
    type: 'circle',
    position: { x: 400, y: 350 },
    data: { label: 'Email Service', color: '#eab308' },
  },
];

const initialEdges: Edge[] = [
  { id: 'e1-2', source: '1', target: '2', label: 'API Calls', animated: true },
  { id: 'e2-3', source: '2', target: '3', label: 'Database' },
  { id: 'e2-4', source: '2', target: '4', label: 'Notifications' },
];

const aspectRatios = [
  { label: 'Current View', value: 'current' },
  { label: 'Square (1:1)', value: '1:1', width: 1920, height: 1920 },
  { label: 'Landscape (16:9)', value: '16:9', width: 1920, height: 1080 },
  { label: 'Portrait (9:16)', value: '9:16', width: 1080, height: 1920 },
  { label: 'Wide (21:9)', value: '21:9', width: 2560, height: 1080 },
  { label: 'HD (4:3)', value: '4:3', width: 1600, height: 1200 },
];

const shapeOptions = [
  { label: 'Square', value: 'square', color: '#9333ea' },
  { label: 'Circle', value: 'circle', color: '#3b82f6' },
  { label: 'Diamond', value: 'diamond', color: '#10b981' },
  { label: 'Triangle', value: 'triangle', color: '#f59e0b' },
  { label: 'Hexagon', value: 'hexagon', color: '#ef4444' },
  { label: 'Cylinder', value: 'cylinder', color: '#8b5cf6' },
];

function ArchitecturePageContent() {
  const router = useRouter();
  const reactFlowWrapper = useRef<HTMLDivElement>(null);
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
  const [nodeName, setNodeName] = useState('');
  const [nodeColor, setNodeColor] = useState('#9333ea');
  const [nodeShape, setNodeShape] = useState('square');
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [showExportModal, setShowExportModal] = useState(false);
  const [selectedAspectRatio, setSelectedAspectRatio] = useState('current');
  const { getNodes } = useReactFlow();

  // Database state
  const [diagrams, setDiagrams] = useState<any[]>([]);
  const [currentDiagramId, setCurrentDiagramId] = useState<string | null>(null);
  const [diagramName, setDiagramName] = useState('');
  const [diagramDescription, setDiagramDescription] = useState('');
  const [showDiagramList, setShowDiagramList] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('user');

    if (!token || !userData) {
      router.push('/auth/login');
      return;
    }

    setUser(JSON.parse(userData));
    loadDiagrams();
  }, [router]);

  const loadDiagrams = async () => {
    try {
      const response = await architectureAPI.getAll();
      setDiagrams(response.data.data || []);
      setLoading(false);
    } catch (error: any) {
      console.error('Error loading diagrams:', error);
      setLoading(false);
    }
  };

  const loadDiagram = async (id: string) => {
    try {
      const response = await architectureAPI.getOne(id);
      const diagram = response.data.data;
      setCurrentDiagramId(diagram._id);
      setDiagramName(diagram.name);
      setDiagramDescription(diagram.description || '');
      setNodes(diagram.nodes || []);
      setEdges(diagram.edges || []);
      setShowDiagramList(false);
    } catch (error: any) {
      alert('Failed to load diagram: ' + (error.response?.data?.message || error.message));
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    router.push('/');
  };

  const onConnect = useCallback(
    (params: Connection | Edge) => setEdges((eds) => addEdge(params, eds)),
    [setEdges]
  );

  const addNewNode = () => {
    if (!nodeName.trim()) return;

    const newNode: Node = {
      id: `${Date.now()}`,
      type: nodeShape,
      position: { x: Math.random() * 400 + 50, y: Math.random() * 400 + 50 },
      data: { label: nodeName, color: nodeColor },
    };

    setNodes((nds) => [...nds, newNode]);
    setNodeName('');
  };

  const deleteSelectedNode = () => {
    if (selectedNodeId) {
      setNodes((nds) => nds.filter((node) => node.id !== selectedNodeId));
      setEdges((eds) => eds.filter((edge) => edge.source !== selectedNodeId && edge.target !== selectedNodeId));
      setSelectedNodeId(null);
    }
  };

  const saveDiagram = async () => {
    if (!diagramName.trim()) {
      alert('Please enter a diagram name');
      return;
    }

    setSaving(true);
    try {
      const diagramData = {
        name: diagramName,
        description: diagramDescription,
        nodes,
        edges,
      };

      if (currentDiagramId) {
        // Update existing diagram
        await architectureAPI.update(currentDiagramId, diagramData);
        alert('Diagram updated successfully!');
      } else {
        // Create new diagram
        const response = await architectureAPI.create(diagramData);
        setCurrentDiagramId(response.data.data._id);
        alert('Diagram saved successfully!');
      }

      // Reload diagrams list
      await loadDiagrams();
    } catch (error: any) {
      alert('Failed to save diagram: ' + (error.response?.data?.message || error.message));
    } finally {
      setSaving(false);
    }
  };

  const createNewDiagram = () => {
    if (confirm('Create a new diagram? Any unsaved changes will be lost.')) {
      setCurrentDiagramId(null);
      setDiagramName('');
      setDiagramDescription('');
      setNodes(initialNodes);
      setEdges(initialEdges);
      setShowDiagramList(false);
    }
  };

  const deleteDiagram = async (id: string) => {
    if (!confirm('Are you sure you want to delete this diagram?')) return;

    try {
      await architectureAPI.delete(id);
      alert('Diagram deleted successfully!');

      if (currentDiagramId === id) {
        createNewDiagram();
      }

      await loadDiagrams();
    } catch (error: any) {
      alert('Failed to delete diagram: ' + (error.response?.data?.message || error.message));
    }
  };

  const clearDiagram = () => {
    if (confirm('Are you sure you want to clear the entire diagram?')) {
      setNodes([]);
      setEdges([]);
    }
  };

  const exportAsJSON = () => {
    const diagram = { nodes, edges };
    const dataStr = JSON.stringify(diagram, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,' + encodeURIComponent(dataStr);
    const exportFileDefaultName = `${diagramName || 'architecture_diagram'}.json`;

    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
  };

  const exportToPNG = async () => {
    const selectedRatio = aspectRatios.find(r => r.value === selectedAspectRatio);

    if (!reactFlowWrapper.current) return;

    const nodesBounds = getRectOfNodes(getNodes());
    const viewport = reactFlowWrapper.current.querySelector('.react-flow__viewport') as HTMLElement;

    if (!viewport) return;

    try {
      let imageWidth = selectedRatio?.width || nodesBounds.width;
      let imageHeight = selectedRatio?.height || nodesBounds.height;

      if (selectedAspectRatio === 'current') {
        imageWidth = reactFlowWrapper.current.offsetWidth;
        imageHeight = reactFlowWrapper.current.offsetHeight;
      }

      const transform = getTransformForBounds(
        nodesBounds,
        imageWidth,
        imageHeight,
        0.5,
        2,
        0.1
      );

      const dataUrl = await toPng(viewport, {
        backgroundColor: '#ffffff',
        width: imageWidth,
        height: imageHeight,
        style: {
          width: `${imageWidth}px`,
          height: `${imageHeight}px`,
          transform: `translate(${transform[0]}px, ${transform[1]}px) scale(${transform[2]})`,
        },
      });

      const link = document.createElement('a');
      link.download = `${diagramName || 'architecture'}_${selectedAspectRatio}.png`;
      link.href = dataUrl;
      link.click();

      setShowExportModal(false);
    } catch (error) {
      console.error('Error exporting PNG:', error);
      alert('Failed to export PNG. Please try again.');
    }
  };

  const onNodeClick = useCallback((event: React.MouseEvent, node: Node) => {
    setSelectedNodeId(node.id);
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center"
           style={{ background: 'rgb(12, 190, 225)', boxShadow: 'rgb(12, 190, 225) 0px 0px 4px 0px' }}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto"></div>
          <p className="mt-4 text-white font-semibold">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-3 sm:gap-0">
            <div className="flex items-center gap-2 sm:gap-4">
              <img src="/img/logo/netraga_logo.png" alt="Netraga Logo" className="h-10 w-10 sm:h-12 sm:w-12" />
              <h1 className="text-lg sm:text-2xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
                Campaign Manager
              </h1>
            </div>
            <button onClick={handleLogout} className="w-full sm:w-auto px-4 py-2 text-xs sm:text-sm text-gray-700 hover:text-gray-900 border border-gray-300 rounded-lg hover:bg-gray-50 transition">
              Logout
            </button>
          </div>
        </div>
      </header>

      {/* Navigation */}
      <nav className="bg-white border-b overflow-x-auto">
        <div className="px-4 sm:px-6 lg:px-8">
          <div className="flex space-x-4 sm:space-x-8 min-w-max sm:min-w-0">
            <Link href="/dashboard" className="px-2 sm:px-3 py-3 sm:py-4 text-xs sm:text-sm font-medium text-gray-600 hover:text-gray-900 border-b-2 border-transparent hover:border-gray-300 whitespace-nowrap">
              Dashboard
            </Link>
            <Link href="/csv" className="px-2 sm:px-3 py-3 sm:py-4 text-xs sm:text-sm font-medium text-gray-600 hover:text-gray-900 border-b-2 border-transparent hover:border-gray-300 whitespace-nowrap">
              CSV Files
            </Link>
            <Link href="/campaigns" className="px-2 sm:px-3 py-3 sm:py-4 text-xs sm:text-sm font-medium text-gray-600 hover:text-gray-900 border-b-2 border-transparent hover:border-gray-300 whitespace-nowrap">
              Campaigns
            </Link>
            <Link href="/company-accounts" className="px-2 sm:px-3 py-3 sm:py-4 text-xs sm:text-sm font-medium text-gray-600 hover:text-gray-900 border-b-2 border-transparent hover:border-gray-300 whitespace-nowrap">
              Company Accounts
            </Link>
            <Link href="/calendar" className="px-2 sm:px-3 py-3 sm:py-4 text-xs sm:text-sm font-medium text-gray-600 hover:text-gray-900 border-b-2 border-transparent hover:border-gray-300 whitespace-nowrap">
              Calendar
            </Link>
            <Link href="/activity-logs" className="px-2 sm:px-3 py-3 sm:py-4 text-xs sm:text-sm font-medium text-gray-600 hover:text-gray-900 border-b-2 border-transparent hover:border-gray-300 whitespace-nowrap">
              Activity Logs
            </Link>
            <Link href="/infrastructure" className="px-2 sm:px-3 py-3 sm:py-4 text-xs sm:text-sm font-medium text-gray-600 hover:text-gray-900 border-b-2 border-transparent hover:border-gray-300 whitespace-nowrap">
              Infrastructures
            </Link>
            <Link href="/architecture" className="px-2 sm:px-3 py-3 sm:py-4 text-xs sm:text-sm font-medium text-purple-600 border-b-2 border-purple-600 whitespace-nowrap">
              Architecture
            </Link>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="flex-1 p-4">
        <div className="mb-4 flex justify-between items-start">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Architecture Diagram</h2>
            <p className="text-sm text-gray-600 mt-1">Visualize and document your application architecture</p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setShowDiagramList(!showDiagramList)}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium"
            >
              📋 My Diagrams ({diagrams.length})
            </button>
            <button
              onClick={createNewDiagram}
              className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 text-sm font-medium"
            >
              ➕ New Diagram
            </button>
          </div>
        </div>

        {/* Diagram List Modal */}
        {showDiagramList && (
          <div className="mb-4 bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <h3 className="text-lg font-bold text-gray-900 mb-3">Saved Diagrams</h3>
            {diagrams.length === 0 ? (
              <p className="text-sm text-gray-500">No saved diagrams yet.</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {diagrams.map((diagram) => (
                  <div
                    key={diagram._id}
                    className={`border rounded-lg p-3 cursor-pointer transition ${
                      currentDiagramId === diagram._id
                        ? 'border-purple-600 bg-purple-50'
                        : 'border-gray-200 hover:border-purple-300'
                    }`}
                  >
                    <div onClick={() => loadDiagram(diagram._id)}>
                      <h4 className="font-semibold text-gray-900">{diagram.name}</h4>
                      {diagram.description && (
                        <p className="text-xs text-gray-600 mt-1">{diagram.description}</p>
                      )}
                      <p className="text-xs text-gray-400 mt-2">
                        Last updated: {new Date(diagram.updatedAt).toLocaleDateString()}
                      </p>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteDiagram(diagram._id);
                      }}
                      className="mt-2 text-xs text-red-600 hover:text-red-700"
                    >
                      🗑️ Delete
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Diagram Info */}
        <div className="mb-4 bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Diagram Name *</label>
              <input
                type="text"
                value={diagramName}
                onChange={(e) => setDiagramName(e.target.value)}
                placeholder="e.g., Production Architecture"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-purple-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
              <input
                type="text"
                value={diagramDescription}
                onChange={(e) => setDiagramDescription(e.target.value)}
                placeholder="e.g., Main application architecture diagram"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-purple-500"
              />
            </div>
          </div>
        </div>

        <div ref={reactFlowWrapper} className="bg-white rounded-lg shadow-sm border border-gray-200" style={{ height: 'calc(100vh - 450px)' }}>
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            onNodeClick={onNodeClick}
            nodeTypes={nodeTypes}
            fitView
          >
            <Controls />
            <MiniMap
              nodeColor={(node) => {
                return node.data?.color || '#9333ea';
              }}
            />
            <Background variant={BackgroundVariant.Dots} gap={12} size={1} />

            <Panel position="top-right" className="bg-white p-4 rounded-lg shadow-lg border border-gray-200 space-y-3 max-h-[calc(100vh-460px)] overflow-y-auto">
              <div className="text-sm font-bold text-gray-900 mb-2">Add Node</div>

              {/* Node Shape Selector */}
              <div>
                <label className="block text-xs text-gray-700 font-medium mb-1">Shape:</label>
                <select
                  value={nodeShape}
                  onChange={(e) => {
                    setNodeShape(e.target.value);
                    const selected = shapeOptions.find(s => s.value === e.target.value);
                    if (selected) setNodeColor(selected.color);
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-purple-500"
                >
                  {shapeOptions.map(shape => (
                    <option key={shape.value} value={shape.value}>{shape.label}</option>
                  ))}
                </select>
              </div>

              <input
                type="text"
                value={nodeName}
                onChange={(e) => setNodeName(e.target.value)}
                placeholder="Node name"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-purple-500"
                onKeyPress={(e) => e.key === 'Enter' && addNewNode()}
              />
              <div className="flex items-center gap-2">
                <label className="text-xs text-gray-600 font-medium">Color:</label>
                <input
                  type="color"
                  value={nodeColor}
                  onChange={(e) => setNodeColor(e.target.value)}
                  className="w-12 h-8 rounded cursor-pointer"
                />
              </div>
              <button
                onClick={addNewNode}
                className="w-full px-3 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 text-sm font-medium"
              >
                Add Node
              </button>

              {selectedNodeId && (
                <button
                  onClick={deleteSelectedNode}
                  className="w-full px-3 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 text-sm font-medium"
                >
                  Delete Selected
                </button>
              )}

              <div className="border-t border-gray-200 pt-3 mt-3 space-y-2">
                <button
                  onClick={saveDiagram}
                  disabled={saving}
                  className="w-full px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm font-medium disabled:opacity-50"
                >
                  {saving ? '💾 Saving...' : '💾 Save to Database'}
                </button>
                <button
                  onClick={() => setShowExportModal(true)}
                  className="w-full px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium"
                >
                  📸 Export PNG
                </button>
                <button
                  onClick={exportAsJSON}
                  className="w-full px-3 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 text-sm font-medium"
                >
                  📄 Export JSON
                </button>
                <button
                  onClick={clearDiagram}
                  className="w-full px-3 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 text-sm font-medium"
                >
                  🗑️ Clear All
                </button>
              </div>
            </Panel>
          </ReactFlow>
        </div>

        <div className="mt-4 bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h3 className="text-sm font-bold text-blue-900 mb-2">How to use:</h3>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>• Enter diagram name and save to database (accessible from any device)</li>
            <li>• Choose a shape (Square, Circle, Triangle, Diamond, Hexagon, Cylinder)</li>
            <li>• Click and drag nodes to reposition them</li>
            <li>• Connect nodes by dragging from one node's edge to another</li>
            <li>• Click a node to select it, then delete it using the button</li>
            <li>• Load existing diagrams using "My Diagrams" button</li>
            <li>• Export as PNG (multiple aspect ratios) or JSON</li>
          </ul>
        </div>
      </main>

      {/* Export PNG Modal */}
      {showExportModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6">
            <h3 className="text-xl font-bold text-gray-900 mb-4">Export as PNG</h3>
            <p className="text-sm text-gray-600 mb-4">Choose an aspect ratio for your export:</p>

            <div className="space-y-2">
              {aspectRatios.map((ratio) => (
                <label key={ratio.value} className="flex items-center p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer">
                  <input
                    type="radio"
                    name="aspectRatio"
                    value={ratio.value}
                    checked={selectedAspectRatio === ratio.value}
                    onChange={(e) => setSelectedAspectRatio(e.target.value)}
                    className="mr-3"
                  />
                  <span className="text-sm font-medium text-gray-900">{ratio.label}</span>
                  {ratio.width && (
                    <span className="ml-auto text-xs text-gray-500">
                      {ratio.width} × {ratio.height}
                    </span>
                  )}
                </label>
              ))}
            </div>

            <div className="mt-6 flex gap-3">
              <button
                onClick={() => setShowExportModal(false)}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium"
              >
                Cancel
              </button>
              <button
                onClick={exportToPNG}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
              >
                Export
              </button>
            </div>
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
}

export default function ArchitecturePage() {
  return (
    <ReactFlowProvider>
      <ArchitecturePageContent />
    </ReactFlowProvider>
  );
}
