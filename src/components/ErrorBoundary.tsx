import React from 'react';

type Props = { children: React.ReactNode };
type State = { hasError: boolean };

export default class ErrorBoundary extends React.Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: unknown, info: React.ErrorInfo) {
    console.error('Unhandled render error:', error, info.componentStack);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-brand-black flex items-center justify-center px-6">
          <div className="flex flex-col items-center gap-4 text-center max-w-sm">
            <p className="text-lg font-black uppercase tracking-tight text-white">
              Something went wrong
            </p>
            <p className="text-sm text-gray-400">
              Try refreshing the page. If the problem persists, come back later.
            </p>
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="mt-2 px-5 py-2.5 rounded-xl bg-brand-accent text-brand-black font-bold uppercase text-xs tracking-widest"
            >
              Reload
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
