import { useEffect, useState } from 'react';

/**
 * TrackdeskDebug Component
 * Shows real-time status of Trackdesk pixel loading
 * Remove this component in production!
 */
export function TrackdeskDebug() {
  const [status, setStatus] = useState({
    scriptLoaded: false,
    functionAvailable: false,
    clickFired: false,
    error: null as string | null
  });

  useEffect(() => {
    // Check if script loaded
    const checkScript = () => {
      const scriptExists = document.querySelector('script[src*="trackdesk.com"]');
      setStatus(prev => ({ ...prev, scriptLoaded: !!scriptExists }));
    };

    // Check if trackdesk function is available
    const checkFunction = () => {
      const funcAvailable = typeof (window as any).trackdesk === 'function';
      setStatus(prev => ({ ...prev, functionAvailable: funcAvailable }));
    };

    // Initial checks
    checkScript();
    
    // Wait for script to load
    const timer = setTimeout(() => {
      checkFunction();
      
      // Try to fire click event and see if it works
      try {
        if (typeof (window as any).trackdesk === 'function') {
          (window as any).trackdesk('directwebinteractive', 'click');
          setStatus(prev => ({ ...prev, clickFired: true }));
        }
      } catch (error) {
        setStatus(prev => ({ 
          ...prev, 
          error: error instanceof Error ? error.message : 'Unknown error' 
        }));
      }
    }, 2000);

    return () => clearTimeout(timer);
  }, []);

  // Only show in development
  if (process.env.NODE_ENV === 'production') {
    return null;
  }

  return (
    <div 
      className="fixed bottom-4 right-4 bg-black/90 text-white p-4 rounded-lg shadow-lg z-50 max-w-sm"
      style={{ fontSize: '12px' }}
    >
      <div className="font-bold mb-2">🔍 Trackdesk Debug</div>
      
      <div className="space-y-1">
        <div className="flex items-center gap-2">
          <span>{status.scriptLoaded ? '✅' : '❌'}</span>
          <span>Script Loaded</span>
        </div>
        
        <div className="flex items-center gap-2">
          <span>{status.functionAvailable ? '✅' : '❌'}</span>
          <span>Function Available</span>
        </div>
        
        <div className="flex items-center gap-2">
          <span>{status.clickFired ? '✅' : '❌'}</span>
          <span>Click Event Fired</span>
        </div>
      </div>

      {status.error && (
        <div className="mt-2 p-2 bg-red-500/20 rounded text-red-200 text-xs">
          Error: {status.error}
        </div>
      )}

      <div className="mt-3 pt-2 border-t border-white/20 text-xs opacity-60">
        Check browser console for details
      </div>

      <div className="mt-2 text-xs opacity-60">
        Current URL: {window.location.hostname}
      </div>
    </div>
  );
}
