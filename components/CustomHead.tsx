import { Helmet } from 'react-helmet-async';

interface CustomHeadProps {
  title?: string;
  description?: string;
  image?: string;
}

export function CustomHead({ 
  title = "Santa's Official Letter - Personalized Letters from Santa",
  description = "Make your child's Christmas magical with a personalized letter from Santa, delivered straight from the North Pole!",
  image = "https://images.unsplash.com/photo-1512389142860-9c449e58a543?w=1200&h=630&fit=crop"
}: CustomHeadProps) {
  const url = typeof window !== 'undefined' ? window.location.href : '';

  return (
    <Helmet>
      {/* Basic Meta Tags */}
      <title>{title}</title>
      <meta name="description" content={description} />
      
      {/* Open Graph Meta Tags */}
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content={image} />
      <meta property="og:url" content={url} />
      <meta property="og:type" content="website" />
      
      {/* Twitter Card Meta Tags */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={title} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={image} />
      
      {/* Trackdesk Click Tracking Pixel - Hardcoded in Head */}
      {/* Trackdesk tracker begin */}
      <script async src="https://cdn.trackdesk.com/tracking.js"></script>
      <script>{`
        (function(t,d,k){(t[k]=t[k]||[]).push(d);t[d]=t[d]||t[k].f||function(){(t[d].q=t[d].q||[]).push(arguments)}})(window,"trackdesk","TrackdeskObject");
        trackdesk("directwebinteractive", "click");
      `}</script>
      {/* Trackdesk tracker end */}
    </Helmet>
  );
}