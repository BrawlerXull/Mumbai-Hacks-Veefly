"use client"
import { Search, Menu, User, ArrowRight } from 'lucide-react';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import FactCarousel from './factCorosol';

interface AnalysisResult {
  authenticity_category?: string;
  authenticity_score?: number;
  report?: string;
  key_claims?: Array<{ claim: string }>;
  error?: string;
}

export default function VeritasFactCheck() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
  const [loading, setLoading] = useState(false);

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

  const handleAnalyze = async () => {
    if (!searchQuery.trim()) return;
    setLoading(true);
    setAnalysisResult(null);

    try {
      const formData = new FormData();
      formData.append("text", searchQuery);
      const res = await fetch("http://localhost:8000/analyze", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      setAnalysisResult(data);
    } catch (err) {
      console.error(err);
      setAnalysisResult({ error: "Failed to fetch analysis" });
    } finally {
      setLoading(false);
    }
  };

  const navigateToAnalyze = () => {
    router.push('/analyze');
  };

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
        <div className="text-center mb-8">
          <h1 className="text-6xl font-bold mb-6 tracking-tight">
            <span className="text-white">Fact Check</span>
            <br />
            <span className="text-white">Misinformation</span>
            <Search className="inline-block w-12 h-12 text-blue-500 ml-3 mb-2" />
          </h1>

          {/* Call to Action Buttons */}
          <div className="flex items-center justify-center gap-4 mb-8">
            <button
              onClick={navigateToAnalyze}
              className="group flex items-center gap-2 px-8 py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-full transition-all font-semibold shadow-lg hover:shadow-blue-600/50"
            >
              <span>Start Analysis</span>
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </button>
            <button
              onClick={navigateToAnalyze}
              className="px-8 py-4 bg-transparent hover:bg-white/5 text-white border-2 border-gray-700 hover:border-gray-600 rounded-full transition-all font-semibold"
            >
              Learn More
            </button>
          </div>

          <div className="relative max-w-2xl mx-auto">
            <input
              type="text"
              placeholder="Type here"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleAnalyze()}
              className="w-full px-8 py-5 bg-[#1a1a1a] rounded-full text-gray-300 placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-600 border border-gray-800"
            />
            <button
              onClick={handleAnalyze}
              className="absolute right-6 top-1/2 transform -translate-y-1/2 text-blue-500 hover:text-blue-400"
            >
              <Search className="w-6 h-6" />
            </button>
          </div>

          {/* Analysis Result */}
          <div className="mt-6 max-w-2xl mx-auto text-left">
            {loading && <p className="text-gray-400">Analyzing...</p>}
            {analysisResult && !analysisResult.error && (
              <div className="bg-[#151515] mt-4 p-5 rounded-xl border border-gray-800">
                <p className="text-gray-200 font-semibold mb-1">Authenticity:</p>
                <p className="text-emerald-400 mb-2">
                  {analysisResult.authenticity_category || "N/A"} | Score: {analysisResult.authenticity_score?.toFixed(2) || "N/A"}
                </p>
                <p className="text-gray-400 mb-2">Summary: {analysisResult.report || "No summary"}</p>
                <div>
                  <p className="text-gray-400 font-semibold mb-1">Key Claims:</p>
                  <ul className="list-disc pl-5 text-gray-300">
                    {analysisResult.key_claims?.map((c, i) => (
                      <li key={i}>{c.claim}</li>
                    )) || <li>N/A</li>}
                  </ul>
                </div>
              </div>
            )}
            {analysisResult?.error && (
              <p className="text-red-500 mt-4">{analysisResult.error}</p>
            )}
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
        <FactCarousel />
      </main>
    </div>
  );
}