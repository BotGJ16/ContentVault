const tf = require('@tensorflow/tfjs-node');
const mongoose = require('mongoose');

class AIRecommendationService {
  constructor() {
    this.model = null;
    this.isModelLoaded = false;
    this.contentVectors = new Map();
    this.userVectors = new Map();
  }

  // Initialize the recommendation model
  async initializeModel() {
    try {
      // Create a simple collaborative filtering model
      this.model = tf.sequential({
        layers: [
          tf.layers.dense({ inputShape: [100], units: 64, activation: 'relu' }),
          tf.layers.dropout({ rate: 0.2 }),
          tf.layers.dense({ units: 32, activation: 'relu' }),
          tf.layers.dropout({ rate: 0.2 }),
          tf.layers.dense({ units: 16, activation: 'relu' }),
          tf.layers.dense({ units: 1, activation: 'sigmoid' })
        ]
      });

      this.model.compile({
        optimizer: tf.train.adam(0.001),
        loss: 'binaryCrossentropy',
        metrics: ['accuracy']
      });

      this.isModelLoaded = true;
      console.log('AI recommendation model initialized successfully');
    } catch (error) {
      console.error('Error initializing AI model:', error);
      throw error;
    }
  }

  // Generate content embedding vector
  generateContentVector(content) {
    const features = this.extractContentFeatures(content);
    return tf.tensor2d([features]);
  }

  // Generate user embedding vector
  generateUserVector(userInteractions) {
    const features = this.extractUserFeatures(userInteractions);
    return tf.tensor2d([features]);
  }

  // Extract features from content
  extractContentFeatures(content) {
    const features = new Array(100).fill(0);
    
    // Content type encoding (0-3)
    const typeMap = { 'image': 0, 'video': 1, 'audio': 2, 'document': 3 };
    features[typeMap[content.type] || 0] = 1;
    
    // Price category (4-7)
    if (content.price === 0) features[4] = 1;
    else if (content.price < 0.01) features[5] = 1;
    else if (content.price < 0.1) features[6] = 1;
    else features[7] = 1;
    
    // Tag embeddings (8-99)
    if (content.tags && content.tags.length > 0) {
      content.tags.forEach((tag, index) => {
        const hash = this.simpleHash(tag);
        const featureIndex = 8 + (hash % 92);
        features[featureIndex] += 1;
      });
    }
    
    // Creator reputation signal
    features[99] = Math.min(content.totalEarnings / 10, 1);
    
    return features;
  }

  // Extract features from user interactions
  extractUserFeatures(interactions) {
    const features = new Array(100).fill(0);
    
    // Interaction types (0-4)
    interactions.forEach(interaction => {
      if (interaction.type === 'view') features[0] += 1;
      else if (interaction.type === 'like') features[1] += 1;
      else if (interaction.type === 'purchase') features[2] += 1;
      else if (interaction.type === 'tip') features[3] += 1;
      else if (interaction.type === 'share') features[4] += 1;
    });
    
    // Normalize interaction counts
    for (let i = 0; i < 5; i++) {
      features[i] = Math.min(features[i] / 100, 1);
    }
    
    // Content preferences (5-99)
    const contentTypePrefs = this.calculateContentTypePreferences(interactions);
    Object.entries(contentTypePrefs).forEach(([type, score], index) => {
      features[5 + index] = score;
    });
    
    // Price preferences
    const pricePrefs = this.calculatePricePreferences(interactions);
    features[95] = pricePrefs.free || 0;
    features[96] = pricePrefs.low || 0;
    features[97] = pricePrefs.medium || 0;
    features[98] = pricePrefs.high || 0;
    
    // Activity level
    features[99] = Math.min(interactions.length / 1000, 1);
    
    return features;
  }

  // Calculate content type preferences
  calculateContentTypePreferences(interactions) {
    const typeScores = { image: 0, video: 0, audio: 0, document: 0 };
    const typeCounts = { image: 0, video: 0, audio: 0, document: 0 };
    
    interactions.forEach(interaction => {
      if (interaction.contentType) {
        typeCounts[interaction.contentType] += 1;
        typeScores[interaction.contentType] += this.getInteractionWeight(interaction.type);
      }
    });
    
    // Normalize scores
    Object.keys(typeScores).forEach(type => {
      if (typeCounts[type] > 0) {
        typeScores[type] = typeScores[type] / typeCounts[type];
      }
    });
    
    return typeScores;
  }

  // Calculate price preferences
  calculatePricePreferences(interactions) {
    const priceScores = { free: 0, low: 0, medium: 0, high: 0 };
    const priceCounts = { free: 0, low: 0, medium: 0, high: 0 };
    
    interactions.forEach(interaction => {
      const price = interaction.contentPrice || 0;
      let priceCategory;
      
      if (price === 0) priceCategory = 'free';
      else if (price < 0.01) priceCategory = 'low';
      else if (price < 0.1) priceCategory = 'medium';
      else priceCategory = 'high';
      
      priceCounts[priceCategory] += 1;
      priceScores[priceCategory] += this.getInteractionWeight(interaction.type);
    });
    
    // Normalize scores
    Object.keys(priceScores).forEach(category => {
      if (priceCounts[category] > 0) {
        priceScores[category] = priceScores[category] / priceCounts[category];
      }
    });
    
    return priceScores;
  }

  // Get weight for different interaction types
  getInteractionWeight(type) {
    const weights = {
      view: 1,
      like: 3,
      purchase: 10,
      tip: 8,
      share: 5,
      bookmark: 4
    };
    return weights[type] || 1;
  }

  // Simple hash function for tag embedding
  simpleHash(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash);
  }

  // Get recommendations for a user
  async getRecommendations(userAddress, limit = 10) {
    try {
      // Get user interactions
      const userInteractions = await this.getUserInteractions(userAddress);
      
      // Get all available content
      const availableContent = await this.getAvailableContent();
      
      // Generate user vector
      const userVector = this.generateUserVector(userInteractions);
      
      // Score all content
      const scoredContent = await Promise.all(
        availableContent.map(async (content) => {
          const contentVector = this.generateContentVector(content);
          const score = await this.calculateSimilarity(userVector, contentVector);
          
          // Apply business rules
          let finalScore = score;
          
          // Boost new content
          const age = Date.now() - content.uploadTimestamp;
          const daysOld = age / (1000 * 60 * 60 * 24);
          if (daysOld < 7) {
            finalScore *= 1.2; // 20% boost for new content
          }
          
          // Boost popular content
          if (content.accessCount > 100) {
            finalScore *= 1.1; // 10% boost for popular content
          }
          
          // Penalize already purchased content
          const hasPurchased = userInteractions.some(
            interaction => interaction.contentId === content.id && interaction.type === 'purchase'
          );
          if (hasPurchased) {
            finalScore *= 0.5; // 50% penalty for purchased content
          }
          
          return {
            ...content,
            score: finalScore,
            reason: this.generateRecommendationReason(content, userInteractions)
          };
        })
      );
      
      // Sort by score and return top recommendations
      const recommendations = scoredContent
        .sort((a, b) => b.score - a.score)
        .slice(0, limit);
      
      return recommendations;
    } catch (error) {
      console.error('Error getting recommendations:', error);
      throw error;
    }
  }

  // Calculate similarity between user and content vectors
  async calculateSimilarity(userVector, contentVector) {
    try {
      if (!this.isModelLoaded) {
        await this.initializeModel();
      }
      
      // Use cosine similarity as a fallback if model prediction fails
      const userArray = await userVector.array();
      const contentArray = await contentVector.array();
      
      return this.cosineSimilarity(userArray[0], contentArray[0]);
    } catch (error) {
      console.error('Error calculating similarity:', error);
      return Math.random() * 0.5; // Fallback to random score
    }
  }

  // Calculate cosine similarity between two vectors
  cosineSimilarity(vecA, vecB) {
    let dotProduct = 0;
    let normA = 0;
    let normB = 0;
    
    for (let i = 0; i < vecA.length; i++) {
      dotProduct += vecA[i] * vecB[i];
      normA += vecA[i] * vecA[i];
      normB += vecB[i] * vecB[i];
    }
    
    return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
  }

  // Generate recommendation reason
  generateRecommendationReason(content, userInteractions) {
    const reasons = [];
    
    // Check for similar creators
    const creatorInteractions = userInteractions.filter(
      i => i.creatorAddress === content.creatorAddress
    );
    if (creatorInteractions.length > 2) {
      reasons.push('From a creator you follow');
    }
    
    // Check for similar content types
    const typeInteractions = userInteractions.filter(
      i => i.contentType === content.type
    );
    if (typeInteractions.length > 5) {
      reasons.push(`Similar to your ${content.type} preferences`);
    }
    
    // Check for trending content
    if (content.accessCount > 100) {
      reasons.push('Trending content');
    }
    
    // Default reason
    if (reasons.length === 0) {
      reasons.push('Recommended for you');
    }
    
    return reasons.slice(0, 2).join(' • ');
  }

  // Get user interactions from database
  async getUserInteractions(userAddress) {
    // This would typically query your database
    // For now, returning mock data
    return [
      {
        contentId: '1',
        contentType: 'video',
        contentPrice: 0.01,
        creatorAddress: '0x1234',
        type: 'purchase',
        timestamp: Date.now() - 86400000, // 1 day ago
      },
      // Add more mock interactions...
    ];
  }

  // Get available content from database
  async getAvailableContent() {
    // This would typically query your database
    // For now, returning mock data
    return [
      {
        id: '1',
        title: 'Sample Content',
        type: 'video',
        price: 0.01,
        creatorAddress: '0x1234',
        uploadTimestamp: Date.now() - 172800000, // 2 days ago
        accessCount: 50,
        totalEarnings: 0.5,
        tags: ['tutorial', 'blockchain'],
      },
      // Add more mock content...
    ];
  }

  // Train the model with new interaction data
  async trainModel(interactionData) {
    try {
      if (!this.isModelLoaded) {
        await this.initializeModel();
      }
      
      const inputs = interactionData.map(interaction => 
        this.extractUserFeatures([interaction]).concat(this.extractContentFeatures(interaction.content))
      );
      
      const labels = interactionData.map(interaction => 
        interaction.type === 'purchase' ? 1 : 0
      );
      
      const inputTensor = tf.tensor2d(inputs);
      const labelTensor = tf.tensor2d(labels, [labels.length, 1]);
      
      await this.model.fit(inputTensor, labelTensor, {
        epochs: 10,
        batchSize: 32,
        validationSplit: 0.2,
      });
      
      console.log('Model training completed');
    } catch (error) {
      console.error('Error training model:', error);
      throw error;
    }
  }

  // Get trending content
  async getTrendingContent(limit = 10) {
    try {
      const content = await this.getAvailableContent();
      
      const trendingContent = content
        .filter(c => c.accessCount > 10)
        .sort((a, b) => {
          const scoreA = this.calculateTrendingScore(a);
          const scoreB = this.calculateTrendingScore(b);
          return scoreB - scoreA;
        })
        .slice(0, limit);
      
      return trendingContent;
    } catch (error) {
      console.error('Error getting trending content:', error);
      throw error;
    }
  }

  // Calculate trending score
  calculateTrendingScore(content) {
    const age = Date.now() - content.uploadTimestamp;
    const daysOld = age / (1000 * 60 * 60 * 24);
    
    // Decay factor for older content
    const decayFactor = Math.exp(-daysOld / 7); // 7-day half-life
    
    return content.accessCount * decayFactor;
  }
}

module.exports = AIRecommendationService;