import { useState, useRef, useEffect } from 'react';
import axios from 'axios';
import { Send, Bot, User, Database, Activity, DollarSign, Clock, Brain, FileText } from 'lucide-react';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

interface Memory {
  id: number;
  category: string;
  summary: string;
  content: string;
  source: string;
  importance_score: number;
  created_at: string;
  tags: string[];
}

interface AuditLog {
  id: number;
  request_type: string;
  model_used: string;
  routing_reason: string;
  latency_ms: number;
  cost: number;
  tokens_used: number;
  created_at: string;
}

function App() {
  const [activeTab, setActiveTab] = useState('chat');
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const [memories, setMemories] = useState<Memory[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [insight, setInsight] = useState('');

  const [memoryInput, setMemoryInput] = useState('');
  const [memorySource, setMemorySource] = useState('Meeting');

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, activeTab]);

  const fetchMemories = async () => {
    try {
      const res = await axios.get('http://localhost:8003/api/memory');
      setMemories(res.data);
    } catch (e) {
      console.error(e);
    }
  };

  const fetchAuditLogs = async () => {
    try {
      const res = await axios.get('http://localhost:8003/api/audit');
      setAuditLogs(res.data);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchMemories();
    fetchAuditLogs();
  }, [activeTab]);

  const handleChatSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    const userMessage: Message = { role: 'user', content: input };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setLoading(true);

    try {
      const response = await axios.post('http://localhost:8003/api/chat', {
        messages: [...messages, userMessage].map(m => ({
          role: m.role,
          content: m.content
        }))
      });

      const assistantMessage: Message = { 
        role: 'assistant', 
        content: response.data.response 
      };
      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      console.error("Error sending message:", error);
      setMessages(prev => [...prev, { role: 'assistant', content: "Error connecting to Orchestrator." }]);
    } finally {
      setLoading(false);
      fetchMemories();
      fetchAuditLogs();
    }
  };

  const handleAddMemory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!memoryInput.trim()) return;
    try {
      await axios.post('http://localhost:8003/api/memory', {
        content: memoryInput,
        source: memorySource
      });
      setMemoryInput('');
      fetchMemories();
    } catch (error) {
      console.error("Error adding memory", error);
    }
  };

  const generateInsight = async () => {
    try {
      const res = await axios.post('http://localhost:8003/api/reflect');
      setInsight(res.data.insight);
      fetchMemories();
      fetchAuditLogs();
    } catch(e) {
      console.error(e);
    }
  };

  const totalCost = auditLogs.reduce((acc, log) => acc + log.cost, 0);
  const avgLatency = auditLogs.length > 0 ? auditLogs.reduce((acc, log) => acc + log.latency_ms, 0) / auditLogs.length : 0;

  return (
    <div className="flex h-screen bg-gray-100 text-gray-900 font-sans">
      {/* Sidebar */}
      <aside className="w-64 bg-gray-900 text-gray-300 flex flex-col">
        <div className="p-6 flex items-center border-b border-gray-800">
          <Bot className="w-8 h-8 text-blue-500 mr-3" />
          <h1 className="text-xl font-bold text-white">Founder OS</h1>
        </div>
        <nav className="flex-1 p-4 space-y-2">
          <button onClick={() => setActiveTab('chat')} className={`w-full flex items-center p-3 rounded-lg transition-colors ${activeTab === 'chat' ? 'bg-blue-600 text-white' : 'hover:bg-gray-800 hover:text-white'}`}>
            <Bot className="w-5 h-5 mr-3" /> Chat Agent
          </button>
          <button onClick={() => setActiveTab('memory')} className={`w-full flex items-center p-3 rounded-lg transition-colors ${activeTab === 'memory' ? 'bg-blue-600 text-white' : 'hover:bg-gray-800 hover:text-white'}`}>
            <Database className="w-5 h-5 mr-3" /> Memory System
          </button>
          <button onClick={() => setActiveTab('insights')} className={`w-full flex items-center p-3 rounded-lg transition-colors ${activeTab === 'insights' ? 'bg-blue-600 text-white' : 'hover:bg-gray-800 hover:text-white'}`}>
            <Brain className="w-5 h-5 mr-3" /> Founder Insights
          </button>
          <button onClick={() => setActiveTab('audit')} className={`w-full flex items-center p-3 rounded-lg transition-colors ${activeTab === 'audit' ? 'bg-blue-600 text-white' : 'hover:bg-gray-800 hover:text-white'}`}>
            <Activity className="w-5 h-5 mr-3" /> Audit & CascadeFlow
          </button>
        </nav>
        <div className="p-4 border-t border-gray-800 text-xs">
          Level 4 Multi-Agent System
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-hidden">
        {/* Chat Tab */}
        {activeTab === 'chat' && (
          <div className="flex flex-col h-full bg-white">
            <header className="p-4 border-b border-gray-200 bg-gray-50 flex justify-between items-center">
              <h2 className="text-lg font-semibold text-gray-800">Orchestrator Agent</h2>
              <div className="flex space-x-4 text-sm text-gray-500">
                <span className="flex items-center"><DollarSign className="w-4 h-4 mr-1 text-green-500"/> ${totalCost.toFixed(4)}</span>
                <span className="flex items-center"><Clock className="w-4 h-4 mr-1 text-blue-500"/> {avgLatency.toFixed(0)}ms avg</span>
              </div>
            </header>
            <div className="flex-1 overflow-y-auto p-6 bg-gray-50">
              <div className="max-w-4xl mx-auto space-y-6">
                {messages.length === 0 && (
                  <div className="text-center text-gray-500 mt-20">
                    <p className="text-xl font-medium">Hello, Founder.</p>
                    <p className="mt-2">I am your OS. I have context on all your previous meetings and decisions. How can I assist?</p>
                  </div>
                )}
                {messages.map((msg, idx) => (
                  <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`flex max-w-[80%] rounded-2xl p-4 shadow-sm ${msg.role === 'user' ? 'bg-blue-600 text-white' : 'bg-white border border-gray-200 text-gray-800'}`}>
                      <div className="mr-3 flex-shrink-0 mt-1">
                        {msg.role === 'user' ? <User className="w-5 h-5 text-blue-200" /> : <Bot className="w-5 h-5 text-blue-600" />}
                      </div>
                      <div className="whitespace-pre-wrap leading-relaxed">{msg.content}</div>
                    </div>
                  </div>
                ))}
                {loading && (
                  <div className="flex justify-start">
                    <div className="flex bg-white border border-gray-200 rounded-2xl p-4 shadow-sm items-center">
                      <Bot className="w-5 h-5 text-blue-400 mr-3 animate-pulse" />
                      <div className="flex space-x-1">
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                      </div>
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>
            </div>
            <div className="p-4 bg-white border-t border-gray-200">
              <form onSubmit={handleChatSubmit} className="max-w-4xl mx-auto relative flex items-center">
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Ask me anything. I'll route to the right model..."
                  className="w-full pl-6 pr-14 py-4 bg-gray-100 focus:bg-white focus:ring-2 focus:ring-blue-500 rounded-full outline-none transition-all shadow-inner"
                  disabled={loading}
                />
                <button
                  type="submit"
                  disabled={!input.trim() || loading}
                  className="absolute right-2 p-3 bg-blue-600 text-white rounded-full hover:bg-blue-700 disabled:bg-gray-300 transition-colors shadow-md"
                >
                  <Send className="w-5 h-5" />
                </button>
              </form>
            </div>
          </div>
        )}

        {/* Memory Tab */}
        {activeTab === 'memory' && (
          <div className="flex flex-col h-full bg-gray-50 overflow-y-auto p-8">
            <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center"><Database className="mr-3 text-blue-600"/> Memory Subsystem (Hindsight)</h2>
            
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 mb-8">
              <h3 className="text-lg font-semibold mb-4">Add Manual Context</h3>
              <form onSubmit={handleAddMemory} className="space-y-4">
                <div className="flex space-x-4">
                  <select value={memorySource} onChange={e => setMemorySource(e.target.value)} className="p-3 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50">
                    <option value="Meeting">Meeting Note</option>
                    <option value="Customer">Customer Feedback</option>
                    <option value="Investor">Investor Update</option>
                    <option value="Product">Product Decision</option>
                  </select>
                  <input type="text" value={memoryInput} onChange={e => setMemoryInput(e.target.value)} placeholder="Enter context to remember..." className="flex-1 p-3 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50" />
                  <button type="submit" className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium transition-colors">Store Memory</button>
                </div>
              </form>
            </div>

            <h3 className="text-xl font-semibold mb-4">Memory Timeline</h3>
            <div className="space-y-4">
              {memories.map(m => (
                <div key={m.id} className="bg-white p-5 rounded-xl shadow-sm border border-gray-200 relative overflow-hidden">
                  <div className={`absolute top-0 left-0 w-2 h-full ${m.category === 'Reflection' ? 'bg-purple-500' : 'bg-blue-500'}`}></div>
                  <div className="flex justify-between items-start pl-4">
                    <div>
                      <div className="flex items-center space-x-3 mb-2">
                        <span className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-xs font-semibold uppercase tracking-wider">{m.category}</span>
                        <span className="text-xs text-gray-400">{new Date(m.created_at).toLocaleString()}</span>
                        <span className="text-xs text-gray-400">Source: {m.source}</span>
                      </div>
                      <p className="text-gray-800 font-medium mb-1">{m.summary}</p>
                      <p className="text-gray-500 text-sm">{m.content}</p>
                    </div>
                  </div>
                </div>
              ))}
              {memories.length === 0 && <p className="text-gray-500">No memories stored yet.</p>}
            </div>
          </div>
        )}

        {/* Insights Tab */}
        {activeTab === 'insights' && (
          <div className="flex flex-col h-full bg-gray-50 p-8 overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-gray-800 flex items-center"><Brain className="mr-3 text-purple-600"/> Founder Insights</h2>
              <button onClick={generateInsight} className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 font-medium transition-colors flex items-center">
                <Activity className="w-4 h-4 mr-2"/> Generate Strategic Reflection
              </button>
            </div>
            
            {insight && (
              <div className="bg-gradient-to-r from-purple-50 to-white p-6 rounded-xl shadow-sm border border-purple-200 mb-8">
                <h3 className="text-lg font-semibold text-purple-900 mb-3">Latest Reflection</h3>
                <p className="text-gray-800 leading-relaxed whitespace-pre-wrap">{insight}</p>
              </div>
            )}

            <h3 className="text-xl font-semibold mb-4 text-gray-800">Historical Insights</h3>
            <div className="space-y-4">
              {memories.filter(m => m.category === 'Reflection').map(m => (
                <div key={m.id} className="bg-white p-5 rounded-xl shadow-sm border border-purple-100 pl-4 border-l-4 border-l-purple-500">
                  <div className="text-xs text-gray-400 mb-2">{new Date(m.created_at).toLocaleString()}</div>
                  <p className="text-gray-800">{m.content}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Audit Tab */}
        {activeTab === 'audit' && (
          <div className="flex flex-col h-full bg-gray-50 p-8 overflow-y-auto">
            <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center"><Activity className="mr-3 text-green-600"/> CascadeFlow Analytics</h2>
            
            <div className="grid grid-cols-3 gap-6 mb-8">
              <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                <div className="text-gray-500 text-sm font-medium mb-1 flex items-center"><DollarSign className="w-4 h-4 mr-1 text-green-500"/> Total LLM Cost</div>
                <div className="text-3xl font-bold text-gray-900">${totalCost.toFixed(6)}</div>
              </div>
              <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                <div className="text-gray-500 text-sm font-medium mb-1 flex items-center"><Clock className="w-4 h-4 mr-1 text-blue-500"/> Avg Latency</div>
                <div className="text-3xl font-bold text-gray-900">{avgLatency.toFixed(1)} ms</div>
              </div>
              <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                <div className="text-gray-500 text-sm font-medium mb-1 flex items-center"><FileText className="w-4 h-4 mr-1 text-purple-500"/> Total Requests</div>
                <div className="text-3xl font-bold text-gray-900">{auditLogs.length}</div>
              </div>
            </div>

            <h3 className="text-xl font-semibold mb-4 text-gray-800">Routing Audit Logs</h3>
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200 text-sm text-gray-600 uppercase tracking-wider">
                    <th className="p-4 font-medium">Time</th>
                    <th className="p-4 font-medium">Request Type</th>
                    <th className="p-4 font-medium">Model Used</th>
                    <th className="p-4 font-medium">Latency (ms)</th>
                    <th className="p-4 font-medium">Cost ($)</th>
                    <th className="p-4 font-medium">Routing Reason</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {auditLogs.map(log => (
                    <tr key={log.id} className="hover:bg-gray-50">
                      <td className="p-4 text-sm text-gray-500">{new Date(log.created_at).toLocaleString()}</td>
                      <td className="p-4 text-sm font-medium text-gray-900">{log.request_type}</td>
                      <td className="p-4 text-sm">
                        <span className={`px-2 py-1 rounded-full text-xs font-semibold ${log.model_used.includes('mixtral') ? 'bg-purple-100 text-purple-700' : log.model_used.includes('70b') ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-700'}`}>
                          {log.model_used}
                        </span>
                      </td>
                      <td className="p-4 text-sm text-gray-600">{log.latency_ms.toFixed(0)}</td>
                      <td className="p-4 text-sm text-green-600 font-medium">${log.cost.toFixed(6)}</td>
                      <td className="p-4 text-sm text-gray-500">{log.routing_reason}</td>
                    </tr>
                  ))}
                  {auditLogs.length === 0 && (
                    <tr><td colSpan={6} className="p-8 text-center text-gray-500">No logs generated yet.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

export default App;
