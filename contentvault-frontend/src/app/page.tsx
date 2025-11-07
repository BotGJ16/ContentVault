'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAccount } from 'wagmi';
import Hero from '@/components/Hero';
import Features from '@/components/Features';
import ContentGrid from '@/components/ContentGrid';
import LoadingSpinner from '@/components/LoadingSpinner';

export default function Home() {
  const { isConnected, isConnecting } = useAccount();
  const router = useRouter();

  useEffect(() => {
    if (isConnected) {
      router.push('/dashboard');
    }
  }, [isConnected, router]);

  if (isConnecting) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <Hero />
      <Features />
      <ContentGrid />
    </div>
  );
}