import React from 'react';
import ReactDOM from 'react-dom/client';
import CredentialForm from "./components/CredentialForm";
import '@/assets/tailwind.css'
import { Toaster } from "@/components/ui/sonner";

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <Toaster />
    <CredentialForm />
  </React.StrictMode>,
);
