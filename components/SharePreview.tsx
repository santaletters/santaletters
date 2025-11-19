// This component provides a static HTML page for social media sharing
// Access it at: /share-preview
export function SharePreview() {
  return (
    <html lang="en">
      <head>
        <meta charSet="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>Santa's Official Letter - Personalized Letters from Santa</title>
        
        {/* Primary Meta Tags */}
        <meta name="title" content="Santa's Official Letter - Personalized Letters from Santa" />
        <meta name="description" content="Get a personalized letter from Santa sent directly to your child! Choose from Silver, Gold, or Platinum packages with authentic North Pole postmark. Order now for Christmas magic!" />
        
        {/* Open Graph / Facebook / Telegram */}
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://www.santascertifiedletter.com/" />
        <meta property="og:title" content="Santa's Official Letter - Personalized Letters from Santa" />
        <meta property="og:description" content="Get a personalized letter from Santa sent directly to your child! Choose from Silver, Gold, or Platinum packages with authentic North Pole postmark. Order now for Christmas magic!" />
        <meta property="og:image" content="https://images.unsplash.com/photo-1607448496717-ba99a17d3ac3?w=1200&h=630&fit=crop" />
        <meta property="og:image:width" content="1200" />
        <meta property="og:image:height" content="630" />
        <meta property="og:site_name" content="Santa's Official Letter" />
        
        {/* Twitter */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="Santa's Official Letter - Personalized Letters from Santa" />
        <meta name="twitter:description" content="Get a personalized letter from Santa sent directly to your child! Choose from Silver, Gold, or Platinum packages with authentic North Pole postmark. Order now for Christmas magic!" />
        <meta name="twitter:image" content="https://images.unsplash.com/photo-1607448496717-ba99a17d3ac3?w=1200&h=630&fit=crop" />
        
        <style>{`
          body {
            margin: 0;
            padding: 0;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif;
            background: linear-gradient(135deg, #1e3a8a 0%, #7c3aed 100%);
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            color: white;
          }
          .container {
            text-align: center;
            padding: 2rem;
          }
          h1 {
            font-size: 2.5rem;
            margin-bottom: 1rem;
            font-weight: 700;
          }
          p {
            font-size: 1.2rem;
            margin-bottom: 2rem;
            opacity: 0.9;
          }
          .spinner {
            width: 50px;
            height: 50px;
            border: 5px solid rgba(255, 255, 255, 0.3);
            border-top-color: white;
            border-radius: 50%;
            animation: spin 1s linear infinite;
            margin: 0 auto;
          }
          @keyframes spin {
            to { transform: rotate(360deg); }
          }
        `}</style>
      </head>
      <body>
        <div className="container">
          <h1>🎅 Santa's Official Letter</h1>
          <p>Redirecting you to our magical letter shop...</p>
          <div className="spinner"></div>
        </div>
        
        <script dangerouslySetInnerHTML={{
          __html: `
            setTimeout(function() {
              window.location.href = 'https://www.santascertifiedletter.com/';
            }, 1000);
          `
        }} />
      </body>
    </html>
  );
}
