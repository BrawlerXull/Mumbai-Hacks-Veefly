"use client"
import { Search, Menu, User } from 'lucide-react';
import { useState } from 'react';

export default function VeritasFactCheck() {
  const [searchQuery, setSearchQuery] = useState('');

const criticalAlerts = [
  {
    id: 1,
    claim: 'A viral post claims toxic chemicals have contaminated municipal drinking water.',
    status: 'verified',
    description: 'Authorities confirmed the contamination was minor and fully contained. No public health risk remains.'
  },
  {
    id: 2,
    claim: 'Social media reports suggest that schools across the city will be closed for two weeks.',
    status: 'false',
    description: 'The Education Department verified that no shutdown has been announced and classes will continue normally.'
  },
  {
    id: 3,
    claim: 'A circulating video claims a major bridge is at risk of collapsing due to structural failure.',
    status: 'verified',
    description: 'Engineers confirmed damage to the structure and advised restricted usage until repairs are completed.'
  }
];


const latestFactChecks = [
  {
    id: 1,
    claim: 'Groundwater quality near the Yamuna reportedly shows major improvement after recent cleanup drives.',
    sources: 12,
    status: 'verified',
    bgColor: 'from-gray-700 to-gray-800',
    icon: 'https://a57.foxnews.com/livenews.foxnews.com/images/2025/11/640/360/dea0dcb2cef8e33934e0364a999cfedd.jpg?tl=1&ve=1'
  },
  {
    id: 2,
    claim: 'A circulated report claims that the government has approved universal free healthcare coverage.',
    sources: 24,
    status: 'verified',
    bgColor: 'from-purple-900 to-purple-950',
    icon: 'https://a57.foxnews.com/livenews.foxnews.com/images/2025/11/640/360/d848e381f7f59367546ce5d5f175fde2.jpg?tl=1&ve=1'
  },
  {
    id: 3,
    claim: 'A photo going viral alleges that a foreign leader secretly arrived in India for an unannounced meeting.',
    sources: 34,
    status: 'verified',
    bgColor: 'from-blue-900 to-blue-950',
    icon: 'https://media.assettype.com/bloombergquint%2F2025-10-11%2Febkyjssz%2FDonald-Trump-fingers.jpg?auto=format%2Ccompress&fmt=avif&mode=crop&ar=16%3A9&q=60&w=2400'
  },
  {
    id: 4,
    claim: 'Online posts claim that a celebrity was arrested during a late-night police raid.',
    sources: 43,
    status: 'verified',
    bgColor: 'from-gray-700 to-gray-800',
    icon: 'https://akm-img-a-in.tosshub.com/indiatoday/images/story/202511/orry-264432142-16x9_0.jpg?VersionId=n0MN3V6mrS8hrsufKDBuKrphSBl9933V&size=690:388'
  }
];


  return (
    <div className="min-h-screen bg-[#0a0a0a]">
      {/* Header */}
      <header className="flex items-center justify-between px-8 py-6">
        <div className="flex items-center gap-2">
          <div className="text-3xl font-bold">
            <span className="text-blue-500">V</span>
            <span className="text-white">eritas</span>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <button className="p-2.5 bg-blue-600/20 hover:bg-blue-600/30 rounded-lg transition">
            <User className="w-5 h-5 text-blue-400" />
          </button>
          <button className="p-2.5 bg-blue-600/20 hover:bg-blue-600/30 rounded-lg transition">
            <Menu className="w-6 h-6 text-blue-400" />
          </button>
        </div>
      </header>

      {/* Hero Section */}
      <main className="max-w-7xl mx-auto px-8 pt-20 pb-16">
        <div className="text-center mb-20">
          <h1 className="text-6xl font-bold mb-10 tracking-tight">
            <span className="text-white">Fact Check</span>
            <br />
            <span className="text-white">Misinformation</span>
            <Search className="inline-block w-12 h-12 text-blue-500 ml-3 mb-2" />
          </h1>
          
          <div className="relative max-w-2xl mx-auto">
            <input
              type="text"
              placeholder="Type here"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-8 py-5 bg-[#1a1a1a] rounded-full text-gray-300 placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-600 border border-gray-800"
            />
            <button className="absolute right-6 top-1/2 transform -translate-y-1/2 text-blue-500 hover:text-blue-400">
              <Search className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Critical Public Alerts */}
        <section className="mb-20">
          <h2 className="text-lg font-normal text-gray-400 mb-6">Critical public alerts</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {criticalAlerts.map((alert) => (
              <div
                key={alert.id}
                className="bg-[#151515] rounded-2xl p-7 relative border border-gray-800 hover:border-gray-700 transition"
              >
                <div className={`absolute top-6 right-6 text-xs font-medium px-3 py-1.5 rounded-full flex items-center gap-1.5 ${
                  alert.status === 'verified' 
                    ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' 
                    : 'bg-red-500/10 text-red-400 border border-red-500/20'
                }`}>
                  <span>{alert.status === 'verified' ? '✓' : '✗'}</span>
                  <span>{alert.status === 'verified' ? 'Verified' : 'False'}</span>
                </div>
                <h3 className="text-base font-normal mb-4 pr-24 text-gray-200">
                  Claim : "{alert.claim}"
                </h3>
                <p className="text-gray-500 text-sm leading-relaxed">
                  {alert.description}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* Latest Fact Checks */}
        <section>
          <h2 className="text-lg font-normal text-gray-400 mb-6">Latest fact checks</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {latestFactChecks.map((check) => (
              <div
                key={check.id}
                className="bg-[#151515] rounded-2xl overflow-hidden border border-gray-800 hover:border-gray-700 transition cursor-pointer group"
              >
                <div className={`h-48  ${check.bgColor} flex items-center justify-center text-6xl`}>
                  <img src={check.icon} className=' h-full w-auto' alt="" />
                </div>
                <div className="p-5">
                  <p className="text-sm text-gray-300 mb-5 line-clamp-2 leading-relaxed">
                    Claim : "{check.claim}"
                  </p>
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <div className="flex -space-x-2">
                        <div className="w-5 h-5 rounded-full bg-red-500 border-2 border-[#151515]"></div>
                        <div className="w-5 h-5 rounded-full bg-yellow-500 border-2 border-[#151515]"></div>
                        <div className="w-5 h-5 rounded-full bg-green-500 border-2 border-[#151515]"></div>
                      </div>
                      <span className="text-gray-500">{check.sources} Sources</span>
                    </div>
                    <span className="text-emerald-400 font-medium flex items-center gap-1">
                      <span>✓</span>
                      <span>Verified</span>
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}