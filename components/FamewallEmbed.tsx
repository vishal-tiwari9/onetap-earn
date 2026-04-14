"use client";

import { useEffect } from "react";

export default function FamewallEmbed() {
  useEffect(() => {
    // Load Famewall script dynamically
    const script = document.createElement("script");
    script.src = "https://embed.famewall.io/singleFrame.js";
    script.async = true;
    script.defer = true;
    document.body.appendChild(script);

    return () => {
      // Cleanup (optional)
      const existingScript = document.querySelector('script[src="https://embed.famewall.io/singleFrame.js"]');
      if (existingScript) existingScript.remove();
    };
  }, []);

  return (
    <div className="w-full my-8">
       
      <div 
        className="famewall-share-embed" 
        data-src="vishaltiwari" 
        data-uuid="0adc30f5-9344-4b9b-a12a-46f1091bc974" 
        style={{ width: "100%" }}
      />
    </div>
  );
}