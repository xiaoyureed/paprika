import React from 'react';
import ReactDOM from 'react-dom/client';
import '@/assets/tailwind.css'
import { Toaster } from "@/components/ui/sonner";
import PromptManager from './components/PromptManager';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <Toaster />
    <PromptManager />
  </React.StrictMode>,
);
