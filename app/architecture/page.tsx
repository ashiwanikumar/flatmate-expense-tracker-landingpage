'use client';

import { useCallback, useState, useEffect } from 'react';
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
} from 'reactflow';
import 'reactflow/dist/style.css';
import Footer from '@/components/Footer';

const initialNodes: Node[] = [
  {
    id: '1',
    type: 'default',
    position: { x: 250, y: 50 },
    data: { label: 'Frontend (Next.js)' },
    style: { background: 'rgb(147, 51, 234)', color: 'white', padding: 10, borderRadius: 8 },
  },
  {
    id: '2',
    type: 'default',
    position: { x: 250, y: 200 },
    data: { label: 'Backend API (Node.js)' },
    style: { background: 'rgb(59, 130, 246)', color: 'white', padding: 10, borderRadius: 8 },
  },
  {
    id: '3',
    type: 'default',
    position: { x: 100, y: 350 },
    data: { label: 'MongoDB' },
    style: { background: 'rgb(34, 197, 94)', color: 'white', padding: 10, borderRadius: 8 },
  },
  {
    id: '4',
    type: 'default',
    position: { x: 400, y: 350 },
    data: { label: 'Email Service' },
    style: { background: 'rgb(234, 179, 8)', color: 'white', padding: 10, borderRadius: 8 },
  },
];

const initialEdges: Edge[] = [
  { id: 'e1-2', source: '1', target: '2', label: 'API Calls', animated: true },
  { id: 'e2-3', source: '2', target: '3', label: 'Database', animated: false },
  { id: 'e2-4', source: '2', target: '4', label: 'Notifications', animated: false },
];

export default function ArchitecturePage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
  const [nodeName, setNodeName] = useState('');
  const [nodeColor, setNodeColor] = useState('#9333ea');
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('user');

    if (!token || !userData) {
      router.push('/auth/login');
      return;
    }

    setUser(JSON.parse(userData));

    // Load saved diagram if exists
    const savedDiagram = localStorage.getItem('architecture_diagram');
    if (savedDiagram) {
      const { nodes: savedNodes, edges: savedEdges } = JSON.parse(savedDiagram);
      setNodes(savedNodes);
      setEdges(savedEdges);
    }

    setLoading(false);
  }, [router]);

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
      id: `${nodes.length + 1}`,
      type: 'default',
      position: { x: Math.random() * 400 + 50, y: Math.random() * 400 + 50 },
      data: { label: nodeName },
      style: { background: nodeColor, color: 'white', padding: 10, borderRadius: 8 },
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

  const saveDiagram = () => {
    const diagram = {
      nodes,
      edges,
    };
    localStorage.setItem('architecture_diagram', JSON.stringify(diagram));
    alert('Diagram saved successfully!');
  };

  const clearDiagram = () => {
    if (confirm('Are you sure you want to clear the entire diagram?')) {
      setNodes([]);
      setEdges([]);
      localStorage.removeItem('architecture_diagram');
    }
  };

  const exportAsJSON = () => {
    const diagram = { nodes, edges };
    const dataStr = JSON.stringify(diagram, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,' + encodeURIComponent(dataStr);
    const exportFileDefaultName = 'architecture_diagram.json';

    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
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
        <div className="mb-4">
          <h2 className="text-2xl font-bold text-gray-900">Architecture Diagram</h2>
          <p className="text-sm text-gray-600 mt-1">Visualize and document your application architecture</p>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200" style={{ height: 'calc(100vh - 280px)' }}>
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            onNodeClick={onNodeClick}
            fitView
          >
            <Controls />
            <MiniMap
              nodeColor={(node) => {
                return node.style?.background as string || '#9333ea';
              }}
            />
            <Background variant={BackgroundVariant.Dots} gap={12} size={1} />

            <Panel position="top-right" className="bg-white p-4 rounded-lg shadow-lg border border-gray-200 space-y-3" style={{ width: '280px' }}>
              <div className="text-sm font-bold text-gray-900 mb-2">Add Node</div>
              <input
                type="text"
                value={nodeName}
                onChange={(e) => setNodeName(e.target.value)}
                placeholder="Node name"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-900 bg-white placeholder-gray-400 focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none"
                onKeyPress={(e) => e.key === 'Enter' && addNewNode()}
              />
              <div className="flex items-center gap-2">
                <label className="text-xs font-medium text-gray-700">Color:</label>
                <input
                  type="color"
                  value={nodeColor}
                  onChange={(e) => setNodeColor(e.target.value)}
                  className="w-16 h-10 rounded cursor-pointer border border-gray-300"
                />
                <div
                  className="w-10 h-10 rounded border border-gray-300"
                  style={{ backgroundColor: nodeColor }}
                  title="Current color"
                ></div>
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
                  className="w-full px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm font-medium"
                >
                  Save Diagram
                </button>
                <button
                  onClick={exportAsJSON}
                  className="w-full px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium"
                >
                  Export JSON
                </button>
                <button
                  onClick={clearDiagram}
                  className="w-full px-3 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 text-sm font-medium"
                >
                  Clear All
                </button>
              </div>
            </Panel>
          </ReactFlow>
        </div>

        <div className="mt-4 bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h3 className="text-sm font-bold text-blue-900 mb-2">How to use:</h3>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>• Click and drag nodes to reposition them</li>
            <li>• Connect nodes by dragging from one node's edge to another</li>
            <li>• Add new nodes using the panel on the right</li>
            <li>• Click a node to select it, then delete it using the button</li>
            <li>• Save your diagram to local storage or export as JSON</li>
          </ul>
        </div>
      </main>

      <Footer />
    </div>
  );
}
