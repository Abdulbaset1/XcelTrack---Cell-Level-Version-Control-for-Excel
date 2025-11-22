import React from 'react';

const FeaturesSection: React.FC = () => {
  const features = [
    {
      title: "Version History",
      description: "Complete audit trail of every change made to your spreadsheets",
      icon: "🕒"
    },
    {
      title: "Branching & Merging",
      description: "Create branches for experiments and merge them safely",
      icon: "🌿"
    },
    {
      title: "Real-time Collaboration",
      description: "Multiple users can work on the same spreadsheet simultaneously",
      icon: "👥"
    },
    {
      title: "Conflict Resolution",
      description: "Smart tools to resolve conflicts when multiple people edit the same cells",
      icon: "⚡"
    },
    {
      title: "API Access",
      description: "Integrate XcelTrack with your existing tools and workflows",
      icon: "🔌"
    },
    {
      title: "Enterprise Security",
      description: "Bank-grade security with encryption and access controls",
      icon: "🔒"
    }
  ];

  return (
    <section className="py-20 bg-white">
      <div className="max-w-7xl mx-auto px-6">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold text-gray-900 mb-4">
            Powerful features for modern teams
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Everything you need to manage your spreadsheets with the power of version control
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <div key={index} className="bg-gray-50 p-6 rounded-lg hover:shadow-lg transition-shadow">
              <div className="text-3xl mb-4">{feature.icon}</div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                {feature.title}
              </h3>
              <p className="text-gray-600">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default FeaturesSection;