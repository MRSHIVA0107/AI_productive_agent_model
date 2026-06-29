import { useState, useRef, useEffect } from 'react';
import axios from 'axios';
import { Send, Bot, User, Activity, DollarSign, Clock, FileText } from 'lucide-react';

interface Message {
  role: 'user' | 'assistant';
  content: string;
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
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, activeTab]);

  const fetchAuditLogs = async () => {
    try {
      const res = await axios.get('http://localhost:8002/api/audit');
      setAuditLogs(res.data);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    if (activeTab === 'audit') fetchAuditLogs();
  }, [activeTab]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    const userMessage: Message = { role: 'user', content: input };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setLoading(true);

    try {
      const response = await axios.post('http://localhost:8002/api/chat', {
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
      const errorMessage: Message = { 
        role: 'assistant', 
        content: "Sorry, I encountered an error communicating with the server." 
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setLoading(false);
      fetchAuditLogs();
    }
  };

  const totalCost = auditLogs.reduce((acc, log) => acc + log.cost, 0);
  const avgLatency = auditLogs.length > 0 ? auditLogs.reduce((acc, log) => acc + log.latency_ms, 0) / auditLogs.length : 0;

  return (
    <div className="flex h-screen bg-gray-50 text-gray-900 font-sans">
      <aside className="w-64 bg-gray-900 text-gray-300 flex flex-col">
        <div className="p-6 flex items-center border-b border-gray-800">
          <Bot className="w-8 h-8 text-blue-500 mr-3" />
          <h1 className="text-xl font-bold text-white">Founder OS</h1>
        </div>
        <nav className="flex-1 p-4 space-y-2">
          <button onClick={() => setActiveTab('chat')} className={`w-full flex items-center p-3 rounded-lg transition-colors ${activeTab === 'chat' ? 'bg-blue-600 text-white' : 'hover:bg-gray-800 hover:text-white'}`}>
            <Bot className="w-5 h-5 mr-3" /> Chat Agent
          </button>
          <button onClick={() => setActiveTab('audit')} className={`w-full flex items-center p-3 rounded-lg transition-colors ${activeTab === 'audit' ? 'bg-blue-600 text-white' : 'hover:bg-gray-800 hover:text-white'}`}>
            <Activity className="w-5 h-5 mr-3" /> Audit & CascadeFlow
          </button>
        </nav>
        <div className="p-4 border-t border-gray-800 text-xs">
          Level 3 Runtime Agent
        </div>
      </aside>

      <main className="flex-1 flex flex-col overflow-hidden">
        {activeTab === 'chat' && (
          <div className="flex flex-col h-full bg-white">
            <header className="p-4 border-b border-gray-200 bg-gray-50 flex justify-between items-center">
              <h2 className="text-lg font-semibold text-gray-800">CascadeFlow Agent</h2>
            </header>
            <div className="flex-1 overflow-y-auto p-6 bg-gray-50">
              <div className="max-w-4xl mx-auto space-y-6">
                {messages.length === 0 && (
                  <div className="text-center text-gray-500 mt-20">
                    <p className="text-xl font-medium">Hello, Founder.</p>
                    <p className="mt-2">I dynamically route requests based on complexity to save money.</p>
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
              <form onSubmit={handleSubmit} className="max-w-4xl mx-auto relative flex items-center">
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Ask me a question to test routing..."
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
