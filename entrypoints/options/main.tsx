import React from 'react';
import ReactDOM from 'react-dom/client';
import { ThemeProvider } from 'next-themes'
import '@/assets/tailwind.css'
import { Toaster } from "@/components/ui/sonner";
import PromptManager from './components/PromptManager';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
      <Toaster />
      <PromptManager />
    </ThemeProvider>
  </React.StrictMode>,
);
