export default function Features() {
  const features = [
    {
      icon: '📱',
      title: 'Mobile First Design',
      description: 'Optimized for mobile creators and consumers with responsive design'
    },
    {
      icon: '⚡',
      title: 'Instant Uploads',
      description: 'Fast content uploads with Walrus distributed storage'
    },
    {
      icon: '🎯',
      title: 'Targeted Audience',
      description: 'AI-powered recommendations to reach the right audience'
    },
    {
      icon: '🔒',
      title: 'Privacy First',
      description: 'Complete privacy control with encryption and access management'
    },
    {
      icon: '💎',
      title: 'Premium Content',
      description: 'Support for various content types including 4K videos'
    },
    {
      icon: '🌐',
      title: 'Global Reach',
      description: 'Worldwide content delivery with Walrus CDN'
    }
  ];

  return (
    <section className="py-20 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold text-gray-900 mb-4">
            Why Choose ContentVault?
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Built for creators who want full control over their content and earnings
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <div key={index} className="card text-center hover:scale-105 transition-transform duration-200">
              <div className="text-4xl mb-4">{feature.icon}</div>
              <h3 className="text-xl font-semibold mb-3 text-gray-900">{feature.title}</h3>
              <p className="text-gray-600">{feature.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}