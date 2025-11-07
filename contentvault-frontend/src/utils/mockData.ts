export interface ContentItem {
  id: string;
  title: string;
  creator: string;
  creatorAddress: string;
  type: 'image' | 'video' | 'audio' | 'document';
  thumbnail?: string;
  price: number;
  isPremium: boolean;
  uploadTimestamp: number;
  accessCount: number;
  tags: string[];
  description: string;
}

export const mockContent: ContentItem[] = [
  {
    id: '1',
    title: 'Web3 Development Tutorial',
    creator: 'CryptoDev',
    creatorAddress: '0x1234...5678',
    type: 'video',
    thumbnail: 'https://via.placeholder.com/300x200/3b82f6/ffffff?text=Web3+Tutorial',
    price: 0.01,
    isPremium: true,
    uploadTimestamp: Date.now() - 86400000 * 2,
    accessCount: 156,
    tags: ['web3', 'tutorial', 'blockchain'],
    description: 'Complete guide to Web3 development with hands-on examples'
  },
  {
    id: '2',
    title: 'Digital Art Collection',
    creator: 'ArtMaster',
    creatorAddress: '0xabcd...efgh',
    type: 'image',
    thumbnail: 'https://via.placeholder.com/300x200/8b5cf6/ffffff?text=Digital+Art',
    price: 0.05,
    isPremium: true,
    uploadTimestamp: Date.now() - 86400000 * 5,
    accessCount: 89,
    tags: ['art', 'digital', 'nft'],
    description: 'Exclusive digital art collection with high-resolution files'
  },
  {
    id: '3',
    title: 'Music Production Tips',
    creator: 'BeatMaker',
    creatorAddress: '0x9876...5432',
    type: 'audio',
    thumbnail: 'https://via.placeholder.com/300x200/10b981/ffffff?text=Music+Tips',
    price: 0.0,
    isPremium: false,
    uploadTimestamp: Date.now() - 86400000 * 1,
    accessCount: 234,
    tags: ['music', 'production', 'tutorial'],
    description: 'Free tips and tricks for music production'
  },
  {
    id: '4',
    title: 'Blockchain Whitepaper',
    creator: 'ResearchPro',
    creatorAddress: '0x2468...1357',
    type: 'document',
    thumbnail: 'https://via.placeholder.com/300x200/f59e0b/ffffff?text=Whitepaper',
    price: 0.02,
    isPremium: true,
    uploadTimestamp: Date.now() - 86400000 * 7,
    accessCount: 67,
    tags: ['blockchain', 'research', 'whitepaper'],
    description: 'In-depth research on blockchain scalability solutions'
  },
  {
    id: '5',
    title: 'Photography Masterclass',
    creator: 'PhotoPro',
    creatorAddress: '0x1357...2468',
    type: 'video',
    thumbnail: 'https://via.placeholder.com/300x200/ef4444/ffffff?text=Photography',
    price: 0.03,
    isPremium: true,
    uploadTimestamp: Date.now() - 86400000 * 3,
    accessCount: 123,
    tags: ['photography', 'tutorial', 'masterclass'],
    description: 'Professional photography techniques and editing tips'
  },
  {
    id: '6',
    title: 'Crypto Trading Guide',
    creator: 'TradeExpert',
    creatorAddress: '0x8765...4321',
    type: 'document',
    thumbnail: 'https://via.placeholder.com/300x200/6366f1/ffffff?text=Trading+Guide',
    price: 0.08,
    isPremium: true,
    uploadTimestamp: Date.now() - 86400000 * 4,
    accessCount: 201,
    tags: ['crypto', 'trading', 'finance'],
    description: 'Comprehensive guide to cryptocurrency trading strategies'
  },
  {
    id: '7',
    title: 'Free Sound Effects Pack',
    creator: 'SoundDesigner',
    creatorAddress: '0x4321...8765',
    type: 'audio',
    thumbnail: 'https://via.placeholder.com/300x200/84cc16/ffffff?text=Sound+Effects',
    price: 0.0,
    isPremium: false,
    uploadTimestamp: Date.now() - 86400000 * 6,
    accessCount: 456,
    tags: ['audio', 'sound-effects', 'free'],
    description: 'Collection of free sound effects for content creators'
  },
  {
    id: '8',
    title: 'UI/UX Design Principles',
    creator: 'DesignGuru',
    creatorAddress: '0x5678...1234',
    type: 'video',
    thumbnail: 'https://via.placeholder.com/300x200/db2777/ffffff?text=UI+UX+Design',
    price: 0.04,
    isPremium: true,
    uploadTimestamp: Date.now() - 86400000 * 8,
    accessCount: 178,
    tags: ['design', 'ui', 'ux'],
    description: 'Essential UI/UX design principles for modern applications'
  }
];

export const mockCreators = [
  {
    address: '0x1234...5678',
    username: 'CryptoDev',
    avatar: 'https://via.placeholder.com/100/3b82f6/ffffff?text=CD',
    followers: 1250,
    totalEarnings: '2.45 ETH',
    contentCount: 15,
    isVerified: true
  },
  {
    address: '0xabcd...efgh',
    username: 'ArtMaster',
    avatar: 'https://via.placeholder.com/100/8b5cf6/ffffff?text=AM',
    followers: 890,
    totalEarnings: '1.89 ETH',
    contentCount: 8,
    isVerified: true
  },
  {
    address: '0x9876...5432',
    username: 'BeatMaker',
    avatar: 'https://via.placeholder.com/100/10b981/ffffff?text=BM',
    followers: 2100,
    totalEarnings: '0.95 ETH',
    contentCount: 25,
    isVerified: false
  }
];

export const mockAnalytics = {
  totalViews: 15420,
  totalEarnings: '5.67 ETH',
  followers: 3420,
  contentPieces: 45,
  monthlyGrowth: 15.3,
  topContent: mockContent.slice(0, 3),
  recentTransactions: [
    {
      type: 'purchase',
      amount: '0.01 ETH',
      from: '0x1111...2222',
      content: 'Web3 Development Tutorial',
      timestamp: Date.now() - 3600000
    },
    {
      type: 'tip',
      amount: '0.005 ETH',
      from: '0x3333...4444',
      content: 'Music Production Tips',
      timestamp: Date.now() - 7200000
    }
  ]
};