// No export statements at the top - define everything and export at the end

interface HistoricalEvent {
  id: string;
  title: string;
  date: string;
  endDate?: string;
  lat: number;
  lng: number;
  importance: number;
  category: string;
  photos?: string[];
  videos?: string[];
  description: string;
  narration: string;
  sources: any[];
  participants: string[];
  locationName?: string;
  topicId?: string;
}

interface Topic {
  id: string;
  name: string;
  description: string;
  events: HistoricalEvent[];
  color: string;
  active: boolean;
}

interface AIAnalysis {
  summary: string;
  connections: string[];
  timeline: { date: string; event: string }[];
  keyFigures: string[];
  significance: string;
  relatedTopics: string[];
}

class AIAgentServiceClass {
  private static instance: AIAgentServiceClass;
  private apiKey: string | null = null;

  static getInstance(): AIAgentServiceClass {
    if (!AIAgentServiceClass.instance) {
      AIAgentServiceClass.instance = new AIAgentServiceClass();
    }
    return AIAgentServiceClass.instance;
  }

  setApiKey(key: string) {
    this.apiKey = key;
  }

  async analyzeTopic(topic: Topic, events: HistoricalEvent[]): Promise<AIAnalysis> {
    if (!this.apiKey) {
      throw new Error('Please set your Gemini API key first');
    }

    try {
      const prompt = this.buildAnalysisPrompt(topic, events);
      const response = await this.callGeminiAPI(prompt);
      return this.parseAnalysis(response);
    } catch (error) {
      console.error('AI Analysis error:', error);
      return this.generateFallbackAnalysis(topic, events);
    }
  }

  private buildAnalysisPrompt(topic: Topic, events: HistoricalEvent[]): string {
    const eventSummaries = events.map(e => 
      `- ${e.date}: ${e.title} - ${e.description}`
    ).join('\n');

    return `
      You are a historical analyst AI. Analyze the following historical topic and events:
      
      Topic: ${topic.name}
      ${topic.description}
      
      Events:
      ${eventSummaries}
      
      Provide a comprehensive analysis with:
      1. A concise summary (2-3 sentences)
      2. Key connections between events (list 3-5)
      3. A chronological timeline (list 5-8 key dates with events)
      4. Key figures involved (list 3-5)
      5. Historical significance (1-2 sentences)
      6. Related historical topics (list 3-5)
      
      Format your response as JSON with these keys: 
      summary, connections, timeline, keyFigures, significance, relatedTopics
    `;
  }

  private async callGeminiAPI(prompt: string): Promise<string> {
    if (!this.apiKey) {
      throw new Error('Gemini API key not set');
    }

    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${this.apiKey}`;
    
    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [{
            parts: [{ text: prompt }]
          }]
        })
      });

      if (!response.ok) {
        throw new Error(`API Error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      return data.candidates?.[0]?.content?.parts?.[0]?.text || '';
    } catch (error) {
      console.error('API call failed:', error);
      throw error;
    }
  }

  private parseAnalysis(text: string): AIAnalysis {
    try {
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        return {
          summary: parsed.summary || 'No summary available',
          connections: parsed.connections || [],
          timeline: parsed.timeline || [],
          keyFigures: parsed.keyFigures || [],
          significance: parsed.significance || 'No significance data',
          relatedTopics: parsed.relatedTopics || []
        };
      }
    } catch (e) {
      console.warn('Failed to parse AI response as JSON, using fallback');
    }
    
    return this.generateFallbackAnalysis({ 
      id: '', 
      name: 'History', 
      description: '', 
      color: '', 
      active: true, 
      events: [] 
    }, []);
  }

  private generateFallbackAnalysis(topic: Topic, events: HistoricalEvent[]): AIAnalysis {
    const sortedEvents = [...events].sort((a, b) => {
      const dateA = new Date(a.date);
      const dateB = new Date(b.date);
      return dateA.getTime() - dateB.getTime();
    });

    return {
      summary: `Analysis of ${topic.name} spanning ${events.length} historical events.`,
      connections: [
        'Events are connected through historical context',
        'Multiple locations and time periods are involved',
        'The topic spans several key historical moments'
      ],
      timeline: sortedEvents.slice(0, 8).map(e => ({
        date: e.date,
        event: e.title
      })),
      keyFigures: ['Various historical figures', 'Multiple participants'],
      significance: `${topic.name} represents an important historical topic with multiple documented events.`,
      relatedTopics: ['History', 'Events', 'Timeline']
    };
  }

  async connectDots(events: HistoricalEvent[]): Promise<string[]> {
    if (!this.apiKey) {
      return this.generateFallbackConnections(events);
    }

    try {
      const prompt = `
        Analyze these historical events and find connections between them:
        ${events.map(e => `- ${e.date}: ${e.title}`).join('\n')}
        
        List 5-8 interesting connections or patterns between these events.
        Format as a JSON array of strings.
      `;

      const response = await this.callGeminiAPI(prompt);
      try {
        const jsonMatch = response.match(/\[[\s\S]*\]/);
        if (jsonMatch) {
          return JSON.parse(jsonMatch[0]);
        }
      } catch (e) {
        const lines = response.split('\n').filter(l => l.trim().startsWith('-'));
        return lines.length > 0 ? lines.map(l => l.replace(/^-\s*/, '').trim()) : this.generateFallbackConnections(events);
      }
    } catch (error) {
      console.error('Connect dots error:', error);
      return this.generateFallbackConnections(events);
    }
    
    return this.generateFallbackConnections(events);
  }

  private generateFallbackConnections(events: HistoricalEvent[]): string[] {
    if (events.length < 2) {
      return ['Not enough events to find connections'];
    }
    
    const connections = [
      'These events occurred during the same historical period',
      'Multiple locations are involved in this historical narrative',
      'The events show a progression of historical developments'
    ];
    
    const sorted = [...events].sort((a, b) => {
      const dateA = new Date(a.date);
      const dateB = new Date(b.date);
      return dateA.getTime() - dateB.getTime();
    });
    
    if (sorted.length > 2) {
      connections.push(`Events span from ${sorted[0].date} to ${sorted[sorted.length-1].date}`);
    }
    
    return connections;
  }

  async getEducationalInsights(topic: Topic): Promise<string> {
    if (!this.apiKey) {
      return `Explore ${topic.name} through these historical events and discover the connections between them.`;
    }

    try {
      const prompt = `
        Provide 3-4 educational insights or learning points about ${topic.name}.
        Focus on what students can learn from these historical events.
        Format as a single paragraph.
      `;

      const response = await this.callGeminiAPI(prompt);
      return response || `Explore ${topic.name} through these historical events.`;
    } catch (error) {
      console.error('Educational insights error:', error);
      return `Explore ${topic.name} through these historical events and discover the connections between them.`;
    }
  }
}

// Create the instance
const aiAgent = AIAgentServiceClass.getInstance();

// Export everything as a single object
export default {
  aiAgent,
  // Export types as values so they can be imported
  AIAnalysis: {} as AIAnalysis,
  HistoricalEvent: {} as HistoricalEvent,
  Topic: {} as Topic
};

// Also export the instance directly
export { aiAgent };