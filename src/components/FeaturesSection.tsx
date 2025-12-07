import React from 'react';

const FeaturesSection: React.FC = () => {
  const features = [
    {
      title: "Cell-Level Version Control",
      description: "Track every single edit. Know exactly who changed a cell, when, and why.",
      icon: "🕒"
    },
    {
      title: "Semantic Diffs",
      description: "Understand changes instantly with human-readable diffs like 'Formula changed from SUM to AVERAGE'.",
      icon: "📝"
    },
    {
      title: "Real-time Collaboration",
      description: "Work together on the same spreadsheet at the same time without locking the file.",
      icon: "👥"
    },
    {
      title: "AI-Powered Assistance",
      description: "Get instant explanations for complex formulas and automatic error detection.",
      icon: <img src="/assets/LandingIcons/ai_assistant.gif" alt="AI Assistant" className="w-12 h-12 object-contain" />
    },
    {
      title: "Hybrid Sync",
      description: "Edit offline and sync changes seamlessly when you're back online.",
      icon: "🔄"
    }
  ];

  // Duplicate features for seamless scrolling
  const allFeatures = [...features, ...features];

  return (
    <section className="py-20 relative z-10 overflow-hidden">
      <div className="max-w-7xl mx-auto px-6 mb-16">
        <div className="text-center">
          <h2 className="text-4xl font-bold text-[#051747] mb-4">
            Powerful features for modern teams
          </h2>
          <p className="text-xl text-[#535F80] max-w-3xl mx-auto">
            Everything you need to manage your spreadsheets with the power of version control
          </p>
        </div>
      </div>

      {/* Marquee Container - Full Width */}
      <div className="relative w-full overflow-hidden group">
        {/* Scrolling Track */}
        <div className="flex gap-40 w-max animate-scroll-right group-hover:[animation-play-state:paused]">
          {allFeatures.map((feature, index) => (
            <div key={index} className="group/card relative w-[350px] flex-shrink-0">
              {/* Tilted Dark Background */}
              <div
                className="absolute inset-0 bg-[#0D2440] rounded-2xl transform rotate-3 translate-y-2 translate-x-2 -z-10 transition-transform duration-300 group-hover/card:rotate-6"
              ></div>

              <div
                className="hover-card-blue border-2 border-sapphire-900/30 p-8 rounded-2xl h-full shadow-[0_25px_50px_-12px_rgba(0,0,0,0.5)] hover:shadow-[0_25px_50px_-12px_rgba(0,0,0,0.5)] hover:-translate-y-6"
              >
                <div className="text-4xl mb-6 bg-sapphire-50 w-16 h-16 rounded-2xl flex items-center justify-center border border-sapphire-50 group-hover/card:scale-110 transition-transform shadow-sm">{feature.icon}</div>
                <h3 className="text-xl font-bold mb-3">
                  {feature.title}
                </h3>
                <p className="leading-relaxed">
                  {feature.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default FeaturesSection;