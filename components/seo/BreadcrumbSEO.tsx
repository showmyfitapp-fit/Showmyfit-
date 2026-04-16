import React from 'react';

interface BreadcrumbItem {
  name: string;
  url: string;
  position: number;
}

interface BreadcrumbSEOProps {
  items: BreadcrumbItem[];
}

const BreadcrumbSEO: React.FC<BreadcrumbSEOProps> = ({ items }) => {
  React.useEffect(() => {
    const structuredData = {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      "itemListElement": items.map(item => ({
        "@type": "ListItem",
        "position": item.position,
        "name": item.name,
        "item": item.url
      }))
    };

    // Remove existing breadcrumb structured data
    const existingScript = document.querySelector('script[data-breadcrumb-seo]');
    if (existingScript) {
      existingScript.remove();
    }

    // Add new structured data
    const script = document.createElement('script');
    script.type = 'application/ld+json';
    script.setAttribute('data-breadcrumb-seo', 'true');
    script.textContent = JSON.stringify(structuredData);
    document.head.appendChild(script);

    return () => {
      if (script.parentNode) {
        script.parentNode.removeChild(script);
      }
    };
  }, [items]);

  return null; // This component doesn't render anything
};

export default BreadcrumbSEO;
