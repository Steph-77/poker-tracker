import { createRoot } from 'react-dom/client'
import { ErrorBoundary } from "react-error-boundary";
import { ChakraProvider } from '@chakra-ui/react'
import "@github/spark/spark"

import App from './App.tsx'
import { ErrorFallback } from './ErrorFallback.tsx'
import { Toaster } from './components/ui/toaster'
import { system } from './theme'

import "./main.css"
import "./index.css"

createRoot(document.getElementById('root')!).render(
  <ErrorBoundary FallbackComponent={ErrorFallback}>
    <ChakraProvider value={system}>
      <App />
      <Toaster />
    </ChakraProvider>
   </ErrorBoundary>
)
