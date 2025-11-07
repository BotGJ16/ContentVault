'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAccount } from 'wagmi';
import { ConnectButton } from '@web3modal/react';
import { toast } from 'react-toastify';

export default function Hero() {
  const [isLoading, setIsLoading] = useState(false);
  const { isConnected } = useAccount();
  const router = useRouter();

  const handleGetStarted = () => {
    if (isConnected) {
      setIsLoading(true);
      router.push('/dashboard');
    } else {
      toast.info('Please connect your wallet first');
    }
  };

  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary-50 via-white to-secondary-50" />
      
      {/* Animated background elements */}
      <div className="absolute inset-0">
        <div className="absolute top-20 left-10 w-72 h-72 bg-primary-200 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-pulse" />
        <div className="absolute bottom-20 right-10 w-72 h-72 bg-secondary-200 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-pulse delay-1000" />
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-72 h-72 bg-accent-200 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-pulse delay-2000" />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          {/* Main heading */}
          <h1 className="text-5xl md:text-7xl font-bold mb-6">
            <span className="text-gradient">ContentVault</span>
          </h1>
          
          {/* Subtitle */}
          <p className="text-xl md:text-2xl text-gray-600 mb-8 max-w-3xl mx-auto">
            The future of content creation is decentralized. 
            <span className="font-semibold text-primary-600">Monetize directly</span> with 
            <span className="font-semibold text-secondary-600">Walrus storage</span> and 
            <span className="font-semibold text-accent-600">blockchain payments</span>.
          </p>

          {/* Key features */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12 max-w-4xl mx-auto">
            <div className="card text-center">
              <div className="text-3xl mb-3">🔐</div>
              <h3 className="font-semibold text-lg mb-2">Encrypted Storage</h3>
              <p className="text-gray-600">End-to-end encryption with creator-controlled keys</p>
            </div>
            <div className="card text-center">
              <div className="text-3xl mb-3">💰</div>
              <h3 className="font-semibold text-lg mb-2">Direct Payments</h3>
              <p className="text-gray-600">95% to creators, no intermediaries</p>
            </div>
            <div className="card text-center">
              <div className="text-3xl mb-3">🤖</div>
              <h3 className="font-semibold text-lg mb-2">AI Recommendations</h3>
              <p className="text-gray-600">Smart content discovery and curation</p>
            </div>
          </div>

          {/* CTA Section */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            {!isConnected ? (
              <ConnectButton />
            ) : (
              <button
                onClick={handleGetStarted}
                disabled={isLoading}
                className="btn-primary text-lg px-8 py-3 rounded-xl font-semibold"
              >
                {isLoading ? (
                  <div className="flex items-center gap-2">
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Loading...
                  </div>
                ) : (
                  'Start Creating'
                )}
              </button>
            )}
            
            <button
              onClick={() => window.open('https://docs.contentvault.io', '_blank')}
              className="btn-secondary text-lg px-8 py-3 rounded-xl font-semibold"
            >
              Learn More
            </button>
          </div>

          {/* Stats */}
          <div className="mt-16 grid grid-cols-2 md:grid-cols-4 gap-8 max-w-2xl mx-auto">
            <div className="text-center">
              <div className="text-2xl font-bold text-primary-600">10K+</div>
              <div className="text-gray-600">Creators</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-secondary-600">50K+</div>
              <div className="text-gray-600">Content Pieces</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-accent-600">$2M+</div>
              <div className="text-gray-600">Creator Earnings</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-primary-600">99.9%</div>
              <div className="text-gray-600">Uptime</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}