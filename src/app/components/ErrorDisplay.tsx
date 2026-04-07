"use client";

interface ErrorDisplayProps {
  error: string;
  onRetry?: () => void;
  className?: string;
}

export function ErrorDisplay({ error, onRetry, className = "" }: ErrorDisplayProps) {
  const getErrorType = (error: string) => {
    const lowerError = error.toLowerCase();
    
    if (lowerError.includes('credit') || lowerError.includes('budget') || lowerError.includes('insufficient')) {
      return {
        type: 'credits',
        icon: (
          <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
          </svg>
        ),
        title: 'Insufficient Apify Credits',
        description: 'Your Apify account has run out of credits. Please check your billing and add more credits to continue searching.',
        bgColor: 'bg-red-50',
        borderColor: 'border-red-200',
        textColor: 'text-red-800'
      };
    }
    
    if (lowerError.includes('no results') || lowerError.includes('not found') || lowerError.includes('empty')) {
      return {
        type: 'no-results',
        icon: (
          <svg className="w-8 h-8 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        ),
        title: 'No Results Found',
        description: 'No creators found for this search term. Try using different keywords, hashtags, or adjust your filters.',
        bgColor: 'bg-orange-50',
        borderColor: 'border-orange-200',
        textColor: 'text-orange-800'
      };
    }
    
    if (lowerError.includes('timeout') || lowerError.includes('timed out')) {
      return {
        type: 'timeout',
        icon: (
          <svg className="w-8 h-8 text-yellow-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        ),
        title: 'Search Timed Out',
        description: 'The search took too long to complete. This sometimes happens with large searches. Please try again with more specific keywords.',
        bgColor: 'bg-yellow-50',
        borderColor: 'border-yellow-200',
        textColor: 'text-yellow-800'
      };
    }
    
    if (lowerError.includes('network') || lowerError.includes('connection')) {
      return {
        type: 'network',
        icon: (
          <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.111 16.404a5.5 5.5 0 017.778 0M12 20h.01m-7.08-7.071c3.904-3.905 10.236-3.905 14.141 0M1.394 9.393c5.857-5.857 15.355-5.857 21.213 0" />
          </svg>
        ),
        title: 'Connection Error',
        description: 'Unable to connect to the search service. Please check your internet connection and try again.',
        bgColor: 'bg-red-50',
        borderColor: 'border-red-200',
        textColor: 'text-red-800'
      };
    }
    
    // Generic error
    return {
      type: 'generic',
      icon: (
        <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      title: 'Search Failed',
      description: 'An unexpected error occurred. Please try again or contact support if the problem persists.',
      bgColor: 'bg-red-50',
      borderColor: 'border-red-200',
      textColor: 'text-red-800'
    };
  };

  const errorInfo = getErrorType(error);

  return (
    <div className={`rounded-lg p-6 ${errorInfo.bgColor} border ${errorInfo.borderColor} ${className}`}>
      <div className="flex items-start">
        <div className="flex-shrink-0">
          {errorInfo.icon}
        </div>
        <div className="ml-3 flex-1">
          <h3 className={`text-sm font-medium ${errorInfo.textColor}`}>
            {errorInfo.title}
          </h3>
          <div className={`mt-2 text-sm ${errorInfo.textColor}`}>
            <p>{errorInfo.description}</p>
            {error && error !== errorInfo.title && (
              <details className="mt-2">
                <summary className="cursor-pointer text-xs opacity-75 hover:opacity-100">
                  Technical details
                </summary>
                <pre className="mt-1 text-xs bg-black/5 p-2 rounded overflow-x-auto">
                  {error}
                </pre>
              </details>
            )}
          </div>
          {onRetry && (
            <div className="mt-4">
              <button
                onClick={onRetry}
                className={`inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 ${
                  errorInfo.type === 'credits' 
                    ? 'text-red-700 bg-red-100 hover:bg-red-200 focus:ring-red-500' 
                    : 'text-gray-700 bg-white border-gray-300 hover:bg-gray-50 focus:ring-blue-500'
                }`}
              >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                Try Again
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}