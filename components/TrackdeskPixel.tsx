import { useEffect } from 'react';

export function TrackdeskPixel() {
  useEffect(() => {
    // Capture Trackdesk CID from URL and store it
    const urlParams = new URLSearchParams(window.location.search);
    const cid = urlParams.get('cid');
    
    if (cid) {
      // Store CID in sessionStorage for conversion tracking
      sessionStorage.setItem('trackdesk_cid', cid);
      console.log('✅ Trackdesk CID captured:', cid);
    } else {
      // Check if we already have a CID stored
      const storedCid = sessionStorage.getItem('trackdesk_cid');
      if (storedCid) {
        console.log('📊 Trackdesk CID (from session):', storedCid);
      } else {
        console.log('⚠️ No Trackdesk CID found in URL or session');
      }
    }
  }, []);

  return null;
}