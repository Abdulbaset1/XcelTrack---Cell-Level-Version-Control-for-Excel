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
      icon: "🤖"
    },
    {
      title: "Hybrid Sync",
      description: "Edit offline and sync changes seamlessly when you're back online.",
      icon: "🔄"
    }
  ];

  return (
    <section className="py-20 relative z-10">
      <div className="max-w-7xl mx-auto px-6">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold text-white mb-4">
            Powerful features for modern teams
          </h2>
          <p className="text-xl text-blue-100 max-w-3xl mx-auto">
            Everything you need to manage your spreadsheets with the power of version control
          </p>
        </div>

        <div className="flex flex-wrap justify-center gap-8">
          {features.map((feature, index) => (
            <div key={index} className="group relative w-full md:w-[calc(50%-1rem)] lg:w-[calc((100%-4rem)/3)]">
              <div className="absolute inset-0 bg-gradient-to-br from-blue-500/20 to-purple-500/20 rounded-2xl blur-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              <div className="relative bg-[rgba(255,255,255,0.05)] backdrop-blur-lg border border-white/10 p-8 rounded-2xl hover:border-blue-500/40 transition-all hover:-translate-y-1 h-full">
                <div className="text-4xl mb-6 bg-white/5 w-16 h-16 rounded-2xl flex items-center justify-center border border-white/10 group-hover:scale-110 transition-transform shadow-lg">{feature.icon}</div>
                <h3 className="text-xl font-bold text-white mb-3">
                  {feature.title}
                </h3>
                <p className="text-blue-100 leading-relaxed">
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