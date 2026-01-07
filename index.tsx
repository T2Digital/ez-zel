
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

const rootElement = document.getElementById('root');
if (!rootElement) throw new Error("Root element not found");

const root = ReactDOM.createRoot(rootElement);

// Simple Error Boundary Fallback for production crashes
class ErrorBoundary extends React.Component<{children: React.ReactNode}, {hasError: boolean, error: any}> {
  constructor(props: any) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  static getDerivedStateFromError(error: any) { return { hasError: true, error }; }
  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: '40px', color: 'white', textAlign: 'center', background: '#000', height: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', fontFamily: 'Cairo' }}>
          <h1 style={{ color: '#ef4444' }}>⚠️ حدث خطأ في تشغيل الظل</h1>
          <p style={{ opacity: 0.5, marginTop: '10px' }}>{this.state.error?.message || 'خطأ غير معروف'}</p>
          <button onClick={() => window.location.reload()} style={{ marginTop: '20px', padding: '10px 20px', background: 'white', color: 'black', borderRadius: '10px', fontWeight: 'bold' }}>إعادة المحاولة</button>
        </div>
      );
    }
    return this.props.children;
  }
}

root.render(
  <React.StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </React.StrictMode>
);