
import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface Props {
  children: ReactNode;
  language?: 'ar' | 'en';
}

interface State {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      const isAr = this.props.language === 'ar';
      return (
        <div className="min-h-[400px] flex flex-col items-center justify-center p-8 text-center bg-white dark:bg-slate-900 rounded-3xl border-2 border-dashed border-slate-200 dark:border-slate-800">
          <div className="p-4 bg-rose-50 dark:bg-rose-900/20 rounded-2xl text-rose-600 mb-4">
            <AlertTriangle className="w-10 h-10" />
          </div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-2">
            {isAr ? 'عذراً، حدث خطأ في عرض البيانات' : 'Sorry, an error occurred while displaying data'}
          </h2>
          <p className="text-slate-500 dark:text-slate-400 text-sm max-w-md mb-6">
            {isAr 
              ? 'حدث خطأ غير متوقع أثناء معالجة معلومات التأشيرة. يرجى المحاولة مرة أخرى أو تغيير وجهة البحث.' 
              : 'An unexpected error occurred while processing visa information. Please try again or change your search destination.'}
          </p>
          <button
            onClick={() => window.location.reload()}
            className="flex items-center gap-2 px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold transition-all active:scale-95 shadow-lg shadow-emerald-500/20"
          >
            <RefreshCw className="w-4 h-4" />
            {isAr ? 'إعادة تحميل الصفحة' : 'Reload Page'}
          </button>
          {process.env.NODE_ENV === 'development' && (
            <pre className="mt-8 p-4 bg-slate-100 dark:bg-slate-800 rounded-lg text-left text-[10px] overflow-auto max-w-full text-rose-500">
              {this.state.error?.toString()}
            </pre>
          )}
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
