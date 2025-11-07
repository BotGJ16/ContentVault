'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { mockContent } from '@/utils/mockData';

interface ContentItem {
  id: string;
  title: string;
  creator: string;
  type: 'image' | 'video' | 'audio' | 'document';
  thumbnail: string;
  price: number;
  isPremium: boolean;
}

export default function ContentGrid() {
  const [content, setContent] = useState<ContentItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Simulate loading content
    setTimeout(() => {
      setContent(mockContent);
      setLoading(false);
    }, 1000);
  }, []);

  const getContentIcon = (type: string) => {
    switch (type) {
      case 'image':
        return '🖼️';
      case 'video':
        return '🎥';
      case 'audio':
        return '🎵';
      case 'document':
        return '📄';
      default:
        return '📦';
    }
  };

  if (loading) {
    return (
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Featured Content</h2>
            <p className="text-gray-600">Discover amazing content from our creators</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="card animate-pulse">
                <div className="bg-gray-200 h-48 rounded-lg mb-4" />
                <div className="bg-gray-200 h-4 rounded mb-2" />
                <div className="bg-gray-200 h-4 rounded w-3/4" />
              </div>
            ))}
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="py-20 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">Featured Content</h2>
          <p className="text-gray-600">Discover amazing content from our creators</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {content.map((item) => (
            <div key={item.id} className="card group cursor-pointer hover:shadow-lg transition-all duration-300">
              <div className="relative mb-4">
                {item.thumbnail ? (
                  <Image
                    src={item.thumbnail}
                    alt={item.title}
                    width={300}
                    height={200}
                    className="w-full h-48 object-cover rounded-lg"
                  />
                ) : (
                  <div className="w-full h-48 bg-gradient-to-br from-primary-100 to-secondary-100 rounded-lg flex items-center justify-center text-4xl">
                    {getContentIcon(item.type)}
                  </div>
                )}
                {item.isPremium && (
                  <div className="absolute top-2 right-2 bg-yellow-400 text-yellow-900 px-2 py-1 rounded-full text-xs font-semibold">
                    Premium
                  </div>
                )}
              </div>
              
              <h3 className="font-semibold text-lg mb-2 text-gray-900 group-hover:text-primary-600 transition-colors">
                {item.title}
              </h3>
              
              <p className="text-gray-600 text-sm mb-3">by {item.creator}</p>
              
              <div className="flex items-center justify-between">
                <span className="text-lg font-bold text-primary-600">
                  {item.price > 0 ? `${item.price} ETH` : 'Free'}
                </span>
                <span className="text-xs text-gray-500 capitalize">{item.type}</span>
              </div>
            </div>
          ))}
        </div>

        <div className="text-center mt-12">
          <button className="btn-primary px-8 py-3 rounded-xl font-semibold">
            View All Content
          </button>
        </div>
      </div>
    </section>
  );
}