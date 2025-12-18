
import React, { ErrorInfo, ReactNode } from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import * as serviceWorkerRegistration from './serviceWorkerRegistration';

// Aggressively prevent non-critical errors from crashing the app
const ignoreNetworkErrors = (error: any) => {
    const message = error?.message || error?.toString() || '';
    const lowerMsg = message.toLowerCase();
    
    return lowerMsg.includes('connack') || 
           lowerMsg.includes('timeout') || 
           lowerMsg.includes('mqtt') || 
           lowerMsg.includes('offline') ||
           lowerMsg.includes('client is disconnecting') ||
           lowerMsg.includes('closed') ||
           lowerMsg.includes('connection refused') ||
           lowerMsg.includes('network error') ||
           lowerMsg.includes('rejectionhandled') ||
           lowerMsg.includes('supported sources') ||
           lowerMsg.includes('media') ||
           lowerMsg.includes('play()') ||
           lowerMsg.includes('ns_error_dom_media_metadata_err') ||
           lowerMsg.includes('circular structure') ||
           lowerMsg.includes('json.stringify') ||
           lowerMsg.includes('fiber');
};

window.addEventListener('unhandledrejection', (event) => {
  const reason = event.reason;
  if (ignoreNetworkErrors(reason)) {
    event.preventDefault();
    event.stopImmediatePropagation();
  }
});

window.addEventListener('error', (event) => {
    const error = event.error || event.message;
    if (ignoreNetworkErrors(error)) {
        event.preventDefault();
        event.stopImmediatePropagation();
    }
}, true); // Use capture to catch media errors which don't bubble

interface ErrorBoundaryProps {
  children?: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  public state: ErrorBoundaryState = {
    hasError: false,
    error: null
  };

  public static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    if (ignoreNetworkErrors(error)) {
        return { hasError: false, error: null };
    }
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    if (ignoreNetworkErrors(error)) {
        (this as any).setState({ hasError: false, error: null });
        return;
    }
    console.error("Uncaught error:", error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      if (this.state.error && ignoreNetworkErrors(this.state.error)) {
          (this as any).setState({ hasError: false, error: null });
          return (this as any).props.children;
      }

      return (
        <div style={{ padding: '20px', fontFamily: 'sans-serif', textAlign: 'center', marginTop: '50px' }}>
          <h1 style={{ color: '#ef4444' }}>Opa! Algo deu errado.</h1>
          <p>Tente recarregar a página.</p>
          <details style={{ marginTop: '20px', textAlign: 'left', background: '#f1f5f9', padding: '10px', borderRadius: '8px' }}>
            <summary style={{ cursor: 'pointer', fontWeight: 'bold' }}>Ver detalhes do erro</summary>
            <pre style={{ marginTop: '10px', fontSize: '12px', overflowX: 'auto' }}>
              {this.state.error?.toString()}
            </pre>
          </details>
          <button 
            onClick={() => {
                localStorage.clear();
                window.location.reload();
            }}
            style={{ marginTop: '20px', padding: '10px 20px', background: '#3b82f6', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer' }}
          >
            Limpar Dados e Recarregar
          </button>
        </div>
      );
    }

    return (this as any).props.children;
  }
}

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <ErrorBoundary>
    <App />
  </ErrorBoundary>
);

serviceWorkerRegistration.register();
