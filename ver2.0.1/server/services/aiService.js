import { OpenAI } from 'openai';
import { GoogleGenerativeAI } from '@google/generative-ai';

class AIService {
  constructor() {
    this.providers = {
      openai: process.env.OPENAI_API_KEY ? new OpenAI({
        apiKey: process.env.OPENAI_API_KEY,
      }) : null,
      gemini: process.env.GEMINI_API_KEY ? new GoogleGenerativeAI(process.env.GEMINI_API_KEY) : null,
    };
    this.defaultProvider = process.env.OPENAI_API_KEY ? 'openai' : 'gemini';
  }

  async generateBookSummary(book, provider = this.defaultProvider) {
    const prompt = `
      Generate a concise summary and key takeaways for the book "${book.title}" by ${book.author.name}.
      
      Book Description: ${book.description}
      Genres: ${book.genres.join(', ')}
      
      Please provide:
      1. A brief summary (2-3 paragraphs)
      2. 5-7 key takeaways
      3. Who would benefit from reading this book
      
      Format the response in JSON:
      {
        "summary": "string",
        "keyTakeaways": ["string"],
        "targetAudience": "string"
      }
    `;

    try {
      switch (provider) {
        case 'openai':
          return await this._callOpenAI(prompt);
        case 'gemini':
          return await this._callGemini(prompt);
        default:
          throw new Error('Unsupported AI provider');
      }
    } catch (error) {
      console.error('AI Service Error:', error);
      throw new Error('Failed to generate book summary');
    }
  }

  async generateRecommendations(userData, books, provider = this.defaultProvider) {
    const prompt = `
      Based on the following user profile and reading history, generate personalized book recommendations.
      
      User Information:
      - Favorite Genres: ${userData.favoriteGenres?.join(', ') || 'Not specified'}
      - Reading Goal: ${userData.readingPreferences?.dailyReadingGoal || 30} minutes per day
      - Books Read: ${userData.readingStats?.booksRead || 0}
      
      Recently Viewed Books: ${books.recentlyViewed?.map(b => b.title).join(', ')}
      Previously Purchased: ${books.previouslyPurchased?.map(b => b.title).join(', ')}
      Top Rated Books: ${books.topRated?.map(b => `${b.title} (${b.rating}/5)`).join(', ')}
      
      Please recommend 10 books with:
      1. Similar themes or writing styles
      2. Books by authors in the same genre
      3. Some diversity in recommendations (mix of classics and contemporary)
      4. Brief reasoning for each recommendation
      
      Format the response in JSON:
      {
        "recommendations": [
          {
            "bookId": "string",
            "reason": "string",
            "confidence": number
          }
        ]
      }
    `;

    try {
      switch (provider) {
        case 'openai':
          return await this._callOpenAI(prompt);
        case 'gemini':
          return await this._callGemini(prompt);
        default:
          throw new Error('Unsupported AI provider');
      }
    } catch (error) {
      console.error('AI Service Error:', error);
      throw new Error('Failed to generate recommendations');
    }
  }

  async generateQuizQuestions(provider = this.defaultProvider) {
    const prompt = `
      Generate a book recommendation quiz with 7 questions to help users discover their next favorite book.
      
      Each question should have:
      1. The question text
      2. 4-5 multiple choice options
      3. Each option should map to specific genres, themes, or reading preferences
      
      Questions should cover:
      - Reading preferences (fiction/non-fiction, length, pace)
      - Favorite genres
      - Mood/emotional tone preferences
      - Reading environment preferences
      - Favorite authors/books (as reference points)
      - Learning goals (for non-fiction)
      
      Format the response in JSON:
      {
        "questions": [
          {
            "id": number,
            "question": "string",
            "options": [
              {
                "id": "A",
                "text": "string",
                "value": ["genre", "preference"]
              }
            ]
          }
        ]
      }
    `;

    try {
      switch (provider) {
        case 'openai':
          return await this._callOpenAI(prompt);
        case 'gemini':
          return await this._callGemini(prompt);
        default:
          throw new Error('Unsupported AI provider');
      }
    } catch (error) {
      console.error('AI Service Error:', error);
      throw new Error('Failed to generate quiz questions');
    }
  }

  async _callOpenAI(prompt) {
    if (!this.providers.openai) {
      throw new Error('OpenAI not configured');
    }

    const response = await this.providers.openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        {
          role: "system",
          content: "You are a knowledgeable librarian and book recommendation expert. Provide accurate, helpful information about books and reading."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      temperature: 0.7,
      max_tokens: 1500,
    });

    const content = response.choices[0].message.content;
    return JSON.parse(content);
  }

  async _callGemini(prompt) {
    if (!this.providers.gemini) {
      throw new Error('Gemini not configured');
    }

    const model = this.providers.gemini.getGenerativeModel({ model: "gemini-pro" });
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    
    // Extract JSON from response
    const jsonMatch = text.match(/```json\n([\s\S]*?)\n```/) || text.match(/{[\s\S]*}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0].replace(/```json\n|\n```/g, ''));
    }
    
    return JSON.parse(text);
  }
}

export default new AIService();