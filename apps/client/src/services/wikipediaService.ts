import dayjs from 'dayjs';

export interface WikiEvent {
  title: string;
  description: string;
  date: string;
  lat?: number;
  lng?: number;
  importance: number;
  category: string;
  participants?: string[];
  locationName?: string;
  url: string;
}

export class WikipediaService {
  private static instance: WikipediaService;
  private cache: Map<string, WikiEvent[]> = new Map();

  static getInstance(): WikipediaService {
    if (!WikipediaService.instance) {
      WikipediaService.instance = new WikipediaService();
    }
    return WikipediaService.instance;
  }

  async searchTopic(topic: string, country: string = 'Algeria'): Promise<WikiEvent[]> {
    const cacheKey = `${topic}-${country}`;
    
    if (this.cache.has(cacheKey)) {
      console.log('Returning cached results for:', topic);
      return this.cache.get(cacheKey) || [];
    }

    try {
      console.log('Searching Wikipedia for:', topic);
      
      // Search Wikipedia for the topic
      const searchResults = await this.searchWikipedia(topic, country);
      console.log('Search results:', searchResults.length);
      
      if (searchResults.length === 0) {
        // Return fallback events if no search results
        return this.getFallbackEvents(topic);
      }
      
      // Process only top 3 results to limit events
      const limitedResults = searchResults.slice(0, 3);
      const events = await this.extractEvents(limitedResults, topic);
      
      // If no events extracted, use fallback
      if (events.length === 0) {
        return this.getFallbackEvents(topic);
      }
      
      // Limit total events to 20 max
      const limitedEvents = events.slice(0, 20);
      
      this.cache.set(cacheKey, limitedEvents);
      return limitedEvents;
    } catch (error) {
      console.error('Error searching Wikipedia:', error);
      return this.getFallbackEvents(topic);
    }
  }

  private async searchWikipedia(topic: string, country: string): Promise<any[]> {
    const query = `"${topic}" "${country}" history OR "${topic}" "${country}" conflict OR "${topic}" "${country}" war`;
    const url = `https://en.wikipedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(query)}&format=json&origin=*&srlimit=5`;
    
    try {
      const response = await fetch(url);
      const data = await response.json();
      return data.query?.search || [];
    } catch (error) {
      console.error('Search error:', error);
      return [];
    }
  }

  private async extractEvents(searchResults: any[], topic: string): Promise<WikiEvent[]> {
    const events: WikiEvent[] = [];
    
    for (const result of searchResults) {
      try {
        const pageContent = await this.getPageContent(result.title);
        const extractedEvents = this.parseEventsFromContent(pageContent, result.title, topic);
        events.push(...extractedEvents);
      } catch (error) {
        console.error(`Error processing page ${result.title}:`, error);
      }
    }
    
    return events;
  }

  private async getPageContent(title: string): Promise<string> {
    try {
      const url = `https://en.wikipedia.org/w/api.php?action=parse&page=${encodeURIComponent(title)}&format=json&origin=*&prop=text&section=0`;
      const response = await fetch(url);
      const data = await response.json();
      return data.parse?.text?.['*'] || '';
    } catch (error) {
      console.error('Error fetching page content:', error);
      return '';
    }
  }

  private parseEventsFromContent(html: string, title: string, topic: string): WikiEvent[] {
    const events: WikiEvent[] = [];
    
    // Look for date patterns
    const datePatterns = [
      /(\b\d{1,2}\s+(?:January|February|March|April|May|June|July|August|September|October|November|December)\s+\d{4}\b)/gi,
      /(\b\d{4}-\d{1,2}-\d{1,2}\b)/g,
      /(\b\d{1,2}\/\d{1,2}\/\d{4}\b)/g
    ];
    
    let allDates: string[] = [];
    for (const pattern of datePatterns) {
      const matches = html.match(pattern) || [];
      allDates = [...allDates, ...matches];
    }
    allDates = [...new Set(allDates)];
    
    const paragraphs = html.split(/<p>|<\/p>/);
    let eventsAdded = 0;
    
    for (const para of paragraphs) {
      if (eventsAdded >= 10) break;
      
      let foundDate = null;
      let dateStr = '';
      
      for (const pattern of datePatterns) {
        const match = para.match(pattern);
        if (match) {
          dateStr = match[0];
          foundDate = this.parseDate(dateStr);
          if (foundDate) break;
        }
      }
      
      if (!foundDate) continue;
      
      // Extract description
      const sentences = para.split(/[.!?]+/);
      let description = '';
      for (const sentence of sentences) {
        if (sentence.includes(dateStr) || sentence.includes(foundDate.format('YYYY'))) {
          description = sentence.trim().substring(0, 200);
          break;
        }
      }
      
      if (!description) continue;
      
      // Extract location
      const locationMatch = para.match(/(?:in|at|near|of)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?(?:,?\s+[A-Z][a-z]+)?)/);
      let locationName = 'Algeria';
      if (locationMatch) {
        locationName = locationMatch[1];
      }
      
      // Determine category
      let category = 'historical';
      const text = para.toLowerCase();
      if (text.match(/battle|war|attack|fight|combat|bomb|shoot/)) category = 'battle';
      else if (text.match(/treaty|agreement|accord|peace|ceasefire/)) category = 'treaty';
      else if (text.match(/political|government|declare|independence|election|president/)) category = 'political';
      else if (text.match(/death|kill|massacre|assassination|murder/)) category = 'massacre';
      
      // Get coordinates
      const coords = this.getCoordinates(locationName);
      
      events.push({
        title: title.length > 50 ? title.substring(0, 50) : title,
        description: description || `Event related to ${topic}`,
        date: foundDate.format('YYYY-MM-DD'),
        lat: coords.lat,
        lng: coords.lng,
        importance: Math.min(5 + (category === 'battle' || category === 'massacre' ? 3 : 0), 10),
        category: category,
        participants: [],
        locationName: locationName,
        url: `https://en.wikipedia.org/wiki/${encodeURIComponent(title)}`
      });
      
      eventsAdded++;
    }
    
    return events;
  }

  private parseDate(dateStr: string): dayjs.Dayjs | null {
    try {
      let date = dayjs(dateStr);
      if (date.isValid()) return date;
      
      const formats = [
        'D MMMM YYYY',
        'MMMM D, YYYY',
        'D MMM YYYY',
        'YYYY-MM-DD',
        'MM/DD/YYYY',
        'DD/MM/YYYY'
      ];
      
      for (const format of formats) {
        date = dayjs(dateStr, format);
        if (date.isValid()) return date;
      }
      return null;
    } catch {
      return null;
    }
  }

  private getCoordinates(location: string): { lat: number; lng: number } {
    const locationMap: Record<string, { lat: number; lng: number }> = {
      'Algiers': { lat: 36.7538, lng: 3.0588 },
      'Alger': { lat: 36.7538, lng: 3.0588 },
      'Oran': { lat: 35.6971, lng: -0.6308 },
      'Constantine': { lat: 36.3650, lng: 6.6147 },
      'Annaba': { lat: 36.9027, lng: 7.7572 },
      'Blida': { lat: 36.4700, lng: 2.8300 },
      'Tlemcen': { lat: 34.8800, lng: -1.3200 },
      'Skikda': { lat: 36.8833, lng: 6.9000 },
      'Setif': { lat: 36.1900, lng: 5.4100 },
      'Batna': { lat: 35.5600, lng: 6.1700 },
      'Bejaia': { lat: 36.7500, lng: 5.0800 },
      'Mostaganem': { lat: 35.9300, lng: 0.0900 },
      'Ghardaia': { lat: 32.4900, lng: 3.6700 },
      'Tamanrasset': { lat: 22.7900, lng: 5.5200 },
      'Paris': { lat: 48.8566, lng: 2.3522 },
      'France': { lat: 46.2276, lng: 2.2137 },
      'Evian': { lat: 46.3203, lng: 6.4779 },
    };

    for (const [key, coords] of Object.entries(locationMap)) {
      if (location.toLowerCase().includes(key.toLowerCase())) {
        return coords;
      }
    }
    return { lat: 36.7538, lng: 3.0588 };
  }

  // Fallback events for common topics
  private getFallbackEvents(topic: string): WikiEvent[] {
    const events: WikiEvent[] = [];
    
    // Check if topic is about Algeria or Revolution
    const lowerTopic = topic.toLowerCase();
    
    if (lowerTopic.includes('algeria') || lowerTopic.includes('revolution') || lowerTopic.includes('war')) {
      // Algerian Revolution events
      const algerianEvents = [
        {
          title: 'Algerian Revolution Begins',
          description: 'The National Liberation Front (FLN) launches the armed struggle for Algerian independence.',
          date: '1954-11-01',
          lat: 36.7538,
          lng: 3.0588,
          importance: 10,
          category: 'political',
          locationName: 'Algiers'
        },
        {
          title: 'Battle of Algiers',
          description: 'The famous Battle of Algiers begins as the FLN intensifies attacks in the capital.',
          date: '1956-09-30',
          lat: 36.7538,
          lng: 3.0588,
          importance: 10,
          category: 'battle',
          locationName: 'Algiers'
        },
        {
          title: 'Evian Accords',
          description: 'The Evian Accords are signed, ending the Algerian War and recognizing independence.',
          date: '1962-03-18',
          lat: 46.3203,
          lng: 6.4779,
          importance: 10,
          category: 'treaty',
          locationName: 'Evian'
        },
        {
          title: 'Algerian Independence',
          description: 'Algeria proclaims its independence after 132 years of French colonization.',
          date: '1962-07-05',
          lat: 36.7538,
          lng: 3.0588,
          importance: 10,
          category: 'political',
          locationName: 'Algiers'
        }
      ];
      
      // Add events that match the topic
      for (const event of algerianEvents) {
        if (lowerTopic.includes('algeria') || 
            lowerTopic.includes('revolution') || 
            lowerTopic.includes('war') ||
            lowerTopic.includes('battle') ||
            lowerTopic.includes('independence')) {
          events.push({
            ...event,
            title: event.title,
            description: event.description,
            participants: ['FLN', 'France'],
            url: 'https://en.wikipedia.org/wiki/Algerian_War'
          });
        }
      }
    }
    
    // If still no events, create a generic one
    if (events.length === 0) {
      events.push({
        title: `${topic} - Historical Topic`,
        description: `Historical events related to ${topic}`,
        date: '1950-01-01',
        lat: 36.7538,
        lng: 3.0588,
        importance: 5,
        category: 'historical',
        participants: [],
        locationName: 'Algeria',
        url: ''
      });
    }
    
    return events;
  }

  clearCache(): void {
    this.cache.clear();
  }
}

export const wikiService = WikipediaService.getInstance();