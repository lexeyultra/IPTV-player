import { Component } from "react";
import type { ErrorInfo, ReactNode } from "react";

interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { hasError: false, error: null };

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("ErrorBoundary caught:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#0A111F] text-white flex flex-col items-center justify-center p-8 text-center">
          <div className="max-w-md">
            <div className="text-6xl mb-6">⚠️</div>
            <h1 className="text-2xl font-bold mb-4">Произошла ошибка</h1>
            <p className="text-slate-400 mb-6">
              Приложение столкнулось с непредвиденной ошибкой.
            </p>
            <button
              onClick={() => {
                this.setState({ hasError: false, error: null });
                window.location.reload();
              }}
              className="px-6 py-3 bg-blue-600 hover:bg-blue-500 rounded-lg font-medium transition-colors cursor-pointer"
            >
              Перезагрузить приложение
            </button>
            {this.state.error && (
              <details className="mt-6 text-left">
                <summary className="text-slate-500 text-sm cursor-pointer hover:text-slate-400">
                  Технические детали
                </summary>
                <pre className="mt-2 text-xs text-slate-600 bg-slate-900 p-4 rounded-lg overflow-auto">
                  {this.state.error.message}
                  {"\n"}
                  {this.state.error.stack}
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
