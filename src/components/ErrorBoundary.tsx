import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RotateCcw } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('VinylStream Uncaught runtime error:', error, errorInfo);
  }

  private handleReload = () => {
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#070509] text-[#FFF0F5] flex flex-col items-center justify-center p-6 text-center font-courier">
          <div className="max-w-md w-full p-8 rounded-3xl bg-neutral-900/90 border border-pink-500/30 shadow-2xl backdrop-blur-xl space-y-5">
            <div className="w-16 h-16 mx-auto rounded-2xl bg-pink-500/20 border border-pink-500/40 flex items-center justify-center text-pink-500">
              <AlertTriangle className="w-8 h-8" />
            </div>
            
            <h2 className="font-alegreya text-2xl font-bold text-white">
              Vinyl Turntable Stalled
            </h2>
            
            <p className="text-xs text-neutral-400 font-normal leading-relaxed">
              An unexpected needle bounce occurred during playback. Press the button below to reset the stylus and platter.
            </p>

            {this.state.error && (
              <pre className="text-[10px] text-left p-3 rounded-xl bg-black/60 border border-white/10 text-pink-300 overflow-x-auto max-h-32">
                {this.state.error.message}
              </pre>
            )}

            <button
              onClick={this.handleReload}
              className="w-full py-3 px-6 rounded-2xl bg-gradient-to-r from-[#FF2D75] to-[#E02667] text-white font-bold text-sm tracking-wider uppercase flex items-center justify-center gap-2 hover:opacity-95 active:scale-95 transition-all shadow-lg shadow-pink-500/20"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Reset Turntable &amp; Reload</span>
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
