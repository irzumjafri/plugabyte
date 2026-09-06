'use client';

import { useRef } from 'react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import type { ScopingChatHandle } from '@/components/ScopingChat/ScopingChat';
import type { BuildTypeId } from '@/lib/estimator';
import LandingSection from './LandingSection';
import HomeSections from './HomeSections';

interface Props {
  initialType?: BuildTypeId | null;
}

export default function HomeClient({ initialType }: Props) {
  const chatRef = useRef<ScopingChatHandle>(null);

  const handleStartHere = (id: BuildTypeId) => {
    chatRef.current?.selectType(id);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <>
      <Navbar onGetStarted={() => { chatRef.current?.focusInput(); window.scrollTo({ top: 0, behavior: 'smooth' }); }} />
      <main>
        <LandingSection chatRef={chatRef} initialType={initialType} />
        <HomeSections onStartHere={handleStartHere} />
      </main>
      <Footer />
    </>
  );
}
