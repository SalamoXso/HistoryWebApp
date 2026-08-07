import React, { useState, useEffect } from 'react';
import { useTimelineStore } from '../../store/timelineStore';
import aiAgentService from '../../services/aiAgentService';
import { FaRobot, FaBrain, FaLink, FaChartLine, FaTimes, FaKey } from 'react-icons/fa';

const { aiAgent } = aiAgentService;

interface AIAnalysisResult {
  summary: string;
  connections: string[];
  timeline: { date: string; event: string }[];
  keyFigures: string[];
  significance: string;
  relatedTopics: string[];
}

export const AIAgentPanel: React.FC = () => {
  const { topics, activeTopicId, events } = useTimelineStore();
  const [isOpen, setIsOpen] = useState(false);
  const [analysis, setAnalysis] = useState<AIAnalysisResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [apiKey, setApiKey] = useState('');
  const [showApiKeyInput, setShowApiKeyInput] = useState(true);

  const activeTopic = topics.find(t => t.id === activeTopicId);
  const topicEvents = activeTopic 
    ? events.filter(e => e.topicId === activeTopic.id)
    : [];

  useEffect(() => {
    const savedKey = localStorage.getItem('gemini_api_key');
    if (savedKey) {
      aiAgent.setApiKey(savedKey);
      setApiKey(savedKey);
      setShowApiKeyInput(false);
    }
  }, []);

  const handleAnalyze = async () => {
    if (!activeTopic || topicEvents.length === 0) {
      alert('Please select a topic with events to analyze.');
      return;
    }

    if (!apiKey) {
      setShowApiKeyInput(true);
      return;
    }

    setIsLoading(true);
    try {
      const result = await aiAgent.analyzeTopic(activeTopic, topicEvents);
      setAnalysis(result);
    } catch (error) {
      console.error('Analysis error:', error);
      alert('Failed to analyze topic. Please check your API key and try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleConnectDots = async () => {
    if (topicEvents.length < 2) {
      alert('Need at least 2 events to find connections.');
      return;
    }

    if (!apiKey) {
      setShowApiKeyInput(true);
      return;
    }

    setIsLoading(true);
    try {
      const connections = await aiAgent.connectDots(topicEvents);
      setAnalysis(prev => prev ? {
        ...prev,
        connections: connections
      } : {
        summary: 'Connections found between events.',
        connections: connections,
        timeline: [],
        keyFigures: [],
        significance: 'Connected events',
        relatedTopics: []
      });
    } catch (error) {
      console.error('Connect dots error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveApiKey = () => {
    if (apiKey.trim()) {
      aiAgent.setApiKey(apiKey.trim());
      localStorage.setItem('gemini_api_key', apiKey.trim());
      setShowApiKeyInput(false);
      alert('API Key saved! You can now use the AI features.');
    }
  };

  const togglePanel = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    setIsOpen(!isOpen);
  };

  return (
    <>
      {/* AI Button - Now on the LEFT side */}
      <div 
        className="fixed bottom-32 left-4 z-[9999] cursor-pointer"
        onClick={togglePanel}
        onMouseDown={(e) => e.stopPropagation()}
        style={{ 
          pointerEvents: 'auto',
          position: 'fixed',
          bottom: '8rem',
          left: '1rem',
          zIndex: 9999
        }}
      >
        <div className={`bg-amber-400/10 hover:bg-amber-400/20 border border-amber-400/30 rounded-full p-3 text-amber-400 hover:text-amber-300 transition-all shadow-2xl shadow-black/50 ${
          isOpen ? 'scale-90 opacity-70' : ''
        }`}>
          <FaRobot size={20} />
        </div>
      </div>

      {/* AI Panel - Now on the LEFT side */}
      {isOpen && (
        <div 
          className="fixed bottom-36 left-4 z-[9999] w-96 max-h-[80vh] bg-cinema-black/95 backdrop-blur-xl border border-amber-400/20 rounded-lg shadow-2xl overflow-hidden"
          onClick={(e) => e.stopPropagation()}
          onMouseDown={(e) => e.stopPropagation()}
          style={{
            position: 'fixed',
            bottom: '9rem',
            left: '1rem',
            zIndex: 9999,
            pointerEvents: 'auto'
          }}
        >
          <div className="flex items-center justify-between px-4 py-3 border-b border-amber-400/10">
            <div className="flex items-center gap-2">
              <FaRobot className="text-amber-400" size={16} />
              <span className="text-amber-300 font-cinema text-sm tracking-wider">AI Agent</span>
            </div>
            <button
              onClick={(e) => {
                e.stopPropagation();
                setIsOpen(false);
              }}
              className="text-amber-400/40 hover:text-amber-300 transition-colors"
            >
              <FaTimes size={14} />
            </button>
          </div>

          <div className="p-4 overflow-y-auto max-h-[calc(80vh-60px)]">
            {(showApiKeyInput || !apiKey) && (
              <div className="mb-4 p-3 bg-amber-400/5 border border-amber-400/20 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <FaKey className="text-amber-400/60" size={12} />
                  <span className="text-amber-400/60 text-xs font-mono">Enter Gemini API Key</span>
                </div>
                <div className="flex gap-2">
                  <input
                    type="password"
                    value={apiKey}
                    onChange={(e) => setApiKey(e.target.value)}
                    placeholder="AIza..."
                    className="flex-1 px-3 py-1.5 bg-cinema-black/80 border border-amber-400/20 rounded text-amber-200 text-sm font-mono focus:outline-none focus:border-amber-400/50"
                    onClick={(e) => e.stopPropagation()}
                  />
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleSaveApiKey();
                    }}
                    className="px-3 py-1.5 bg-amber-400/10 hover:bg-amber-400/20 border border-amber-400/30 rounded text-amber-300 text-sm transition-colors whitespace-nowrap"
                  >
                    Save Key
                  </button>
                </div>
                <div className="mt-1 text-amber-400/20 text-[8px] font-mono">
                  Get your free key at: ai.google.dev
                </div>
              </div>
            )}

            <div className="mb-4">
              <div className="text-amber-400/30 text-[10px] font-mono uppercase tracking-wider">
                Active Topic
              </div>
              <div className="text-amber-200 font-cinema text-lg">
                {activeTopic?.name || 'No topic selected'}
              </div>
              <div className="text-amber-400/40 text-xs">
                {topicEvents.length} events loaded
              </div>
            </div>

            <div className="flex gap-2 mb-4">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleAnalyze();
                }}
                disabled={isLoading || !activeTopic || topicEvents.length === 0}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-amber-400/10 hover:bg-amber-400/20 border border-amber-400/30 rounded-lg text-amber-300 text-sm font-mono transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <FaBrain size={14} />
                {isLoading ? 'Analyzing...' : 'Analyze Topic'}
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleConnectDots();
                }}
                disabled={isLoading || topicEvents.length < 2}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-amber-400/10 hover:bg-amber-400/20 border border-amber-400/30 rounded-lg text-amber-300 text-sm font-mono transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <FaLink size={14} />
                Connect Dots
              </button>
            </div>

            {analysis && (
              <div className="space-y-3">
                <div className="p-3 bg-amber-400/5 border border-amber-400/10 rounded-lg">
                  <div className="text-amber-400/40 text-[10px] font-mono uppercase tracking-wider mb-1">
                    Summary
                  </div>
                  <div className="text-amber-200/80 text-sm leading-relaxed">
                    {analysis.summary}
                  </div>
                </div>

                {analysis.timeline && analysis.timeline.length > 0 && (
                  <div className="p-3 bg-amber-400/5 border border-amber-400/10 rounded-lg">
                    <div className="text-amber-400/40 text-[10px] font-mono uppercase tracking-wider mb-2">
                      <FaChartLine className="inline mr-1" size={10} />
                      Timeline
                    </div>
                    <div className="space-y-1 max-h-32 overflow-y-auto">
                      {analysis.timeline.slice(0, 6).map((item, idx) => (
                        <div key={idx} className="flex items-center gap-2 text-xs">
                          <span className="text-amber-400/40 font-mono w-24">{item.date}</span>
                          <span className="text-amber-200/70">{item.event}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {analysis.connections && analysis.connections.length > 0 && (
                  <div className="p-3 bg-amber-400/5 border border-amber-400/10 rounded-lg">
                    <div className="text-amber-400/40 text-[10px] font-mono uppercase tracking-wider mb-2">
                      <FaLink className="inline mr-1" size={10} />
                      Connections
                    </div>
                    <ul className="space-y-1 max-h-32 overflow-y-auto">
                      {analysis.connections.map((conn, idx) => (
                        <li key={idx} className="text-amber-200/70 text-xs flex items-start gap-2">
                          <span className="text-amber-400/40">•</span>
                          {conn}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {analysis.keyFigures && analysis.keyFigures.length > 0 && (
                  <div className="p-3 bg-amber-400/5 border border-amber-400/10 rounded-lg">
                    <div className="text-amber-400/40 text-[10px] font-mono uppercase tracking-wider mb-1">
                      Key Figures
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {analysis.keyFigures.map((figure, idx) => (
                        <span key={idx} className="px-2 py-0.5 bg-amber-400/10 border border-amber-400/20 rounded text-amber-300/70 text-xs">
                          {figure}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {analysis.significance && (
                  <div className="p-3 bg-amber-400/5 border border-amber-400/10 rounded-lg">
                    <div className="text-amber-400/40 text-[10px] font-mono uppercase tracking-wider mb-1">
                      Significance
                    </div>
                    <div className="text-amber-200/80 text-sm leading-relaxed">
                      {analysis.significance}
                    </div>
                  </div>
                )}

                {analysis.relatedTopics && analysis.relatedTopics.length > 0 && (
                  <div className="p-3 bg-amber-400/5 border border-amber-400/10 rounded-lg">
                    <div className="text-amber-400/40 text-[10px] font-mono uppercase tracking-wider mb-1">
                      Related Topics
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {analysis.relatedTopics.map((topic, idx) => (
                        <span key={idx} className="px-2 py-0.5 bg-amber-400/5 border border-amber-400/10 rounded text-amber-400/40 text-xs">
                          {topic}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
};