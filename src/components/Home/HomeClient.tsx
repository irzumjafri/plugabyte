'use client';

import { useRef, useState } from 'react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import type { ScopingChatHandle } from '@/components/ScopingChat/ScopingChat';
import type { BuildTypeId } from '@/lib/estimator';
import LandingSection from './LandingSection';
import HomeSections from './HomeSections';

interface Props {
  initialType?: BuildTypeId | null;
  /** Arrive with the conversation already open (…/?chat=1 or ?type=…). */
  initialOpen?: boolean;
}

export default function HomeClient({ initialType, initialOpen = false }: Props) {
  const chatRef = useRef<ScopingChatHandle>(null);
  // Both deep links are search params rather than a hash, so the server sees
  // them too and the first render already matches — a hash would only be known
  // on the client and would have to open the modal after hydration.
  const [chatOpen, setChatOpen] = useState(initialOpen || Boolean(initialType));

  return (
    <>
      <Navbar onGetStarted={() => setChatOpen(true)} />
      <main>
        <LandingSection
          chatRef={chatRef}
          initialType={initialType}
          chatOpen={chatOpen}
          onOpenChat={() => setChatOpen(true)}
          onCloseChat={() => setChatOpen(false)}
        />
        <HomeSections />
      </main>
      <Footer />
    </>
  );
}
