
import React from 'react';
import { Link } from 'react-router-dom';
import { ESSAY_CATEGORIES } from '../constants';

const Level1_Home: React.FC = () => {
  return (
    <div className="animate-fade-in">
      <div className="text-center mb-16">
        <h1 className="text-4xl md:text-5xl font-bold serif mb-6">Free Essay Examples for Students</h1>
        <p className="text-lg text-slate-600 max-w-2xl mx-auto">
          Access high-quality academic papers, research topics, and literature analysis to jumpstart your writing process.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {ESSAY_CATEGORIES.map((cat) => (
          <Link 
            key={cat.id} 
            to={`/essay-example/${cat.slug}`}
            className="group bg-white p-8 rounded-2xl border border-slate-200 hover:border-blue-400 hover:shadow-xl transition-all duration-300"
          >
            <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-lg flex items-center justify-center mb-6 group-hover:bg-blue-600 group-hover:text-white transition-colors">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
            </div>
            <h2 className="text-xl font-bold mb-3">{cat.title} Essay Examples</h2>
            <p className="text-slate-500 text-sm leading-relaxed mb-4">{cat.description}</p>
            <span className="text-blue-600 text-sm font-semibold flex items-center gap-1 group-hover:translate-x-1 transition-transform">
              Browse Topics <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" /></svg>
            </span>
          </Link>
        ))}
      </div>

      <section className="mt-20 bg-slate-900 text-white rounded-3xl p-8 md:p-12 text-center">
        <h2 className="text-3xl font-bold mb-6">Can't find your topic?</h2>
        <p className="text-slate-400 mb-8 max-w-xl mx-auto">Use our AI assistant to generate custom outlines, research questions, and literature summaries in seconds.</p>
        <button className="bg-blue-600 hover:bg-blue-500 text-white px-8 py-4 rounded-xl font-bold transition">
          Ask AI Assistant
        </button>
      </section>
    </div>
  );
};

export default Level1_Home;
