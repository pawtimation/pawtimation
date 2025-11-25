import React from 'react';

export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    this.setState({
      error,
      errorInfo
    });
    console.error('Error caught by boundary:', error, errorInfo);
  }

  handleReport = () => {
    const { error, errorInfo } = this.state;
    const route = window.location.hash || window.location.pathname;
    const stack = error?.stack || 'No stack trace available';
    
    const subject = encodeURIComponent('Error Report - Pawtimation');
    const body = encodeURIComponent(
      `Route: ${route}\n\nError: ${error?.message}\n\nStack Trace:\n${stack}\n\nComponent Stack:\n${errorInfo?.componentStack || 'Not available'}`
    );
    
    window.location.href = `mailto:hello@pawtimation.co.uk?subject=${subject}&body=${body}`;
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
    window.location.hash = '#/';
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center p-4">
          <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center">
            <div className="w-16 h-16 mx-auto mb-4 bg-slate-100 rounded-full flex items-center justify-center">
              <svg className="w-8 h-8 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-slate-800 mb-2">
              Oops! Something went wrong
            </h1>
            <p className="text-slate-600 mb-6">
              We're sorry for the inconvenience. The error has been logged and we'll look into it.
            </p>
            
            <div className="flex flex-col gap-3">
              <button
                onClick={this.handleReset}
                className="w-full px-6 py-3 bg-brand-teal text-white rounded-lg hover:bg-brand-teal/90 transition-colors font-medium"
              >
                Return to Home
              </button>
              <button
                onClick={this.handleReport}
                className="w-full px-6 py-3 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors font-medium"
              >
                Report this issue
              </button>
            </div>

            {import.meta.env.DEV && this.state.error && (
              <details className="mt-6 text-left">
                <summary className="cursor-pointer text-sm font-medium text-slate-600 hover:text-slate-800">
                  Error Details (dev only)
                </summary>
                <pre className="mt-2 text-xs bg-slate-100 p-3 rounded overflow-auto text-red-600">
                  {this.state.error.toString()}
                  {this.state.errorInfo?.componentStack}
                </pre>
              </details>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
