
import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { ESSAY_CATEGORIES } from '../constants';
import Breadcrumbs from '../components/Breadcrumbs';

const Level3_Work: React.FC = () => {
  const { categorySlug, workSlug } = useParams<{ categorySlug: string; workSlug: string }>();
  const category = ESSAY_CATEGORIES.find(c => c.slug === categorySlug);
  const work = category?.works.find(w => w.slug === workSlug);

  if (!work || !category) return <div className="text-center py-20 text-slate-500">Work not found</div>;

  return (
    <div className="animate-fade-in">
      <Breadcrumbs items={[
        { label: category.title, path: `/essay-example/${category.slug}` },
        { label: work.title, path: `/essay-example/${category.slug}/${work.slug}` }
      ]} />
      
      <div className="bg-white border rounded-3xl overflow-hidden mb-12 shadow-sm">
        <div className="bg-slate-900 text-white p-8 md:p-12 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-blue-600/20 blur-3xl rounded-full translate-x-1/2 -translate-y-1/2"></div>
          <div className="relative z-10">
            <span className="bg-blue-600 text-white text-xs font-bold px-3 py-1 rounded-full uppercase tracking-widest mb-4 inline-block">Study Guide</span>
            <h1 className="text-4xl md:text-5xl font-bold serif mb-4">{work.title} Essay Topics & Examples</h1>
            <p className="text-slate-300 text-lg max-w-2xl">
              Master your assignment with our curated collection of {work.title} essay examples. We cover everything from major themes to character analysis and symbolism.
            </p>
          </div>
        </div>
        
        <div className="p-8 grid grid-cols-1 md:grid-cols-3 gap-8 border-b">
           <div className="flex items-center gap-4">
             <div className="w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center text-slate-500">
               <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
             </div>
             <div>
               <p className="text-xs text-slate-400 uppercase font-bold tracking-tighter">Author</p>
               <p className="font-semibold">{work.author}</p>
             </div>
           </div>
           <div className="flex items-center gap-4">
             <div className="w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center text-slate-500">
               <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
             </div>
             <div>
               <p className="text-xs text-slate-400 uppercase font-bold tracking-tighter">Topics</p>
               <p className="font-semibold">{work.topics.length} Expert Samples</p>
             </div>
           </div>
           <div className="flex items-center gap-4">
             <div className="w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center text-slate-500">
               <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
             </div>
             <div>
               <p className="text-xs text-slate-400 uppercase font-bold tracking-tighter">AI Ready</p>
               <p className="font-semibold">Interactive Analysis</p>
             </div>
           </div>
        </div>
      </div>

      <div className="space-y-6">
        <h2 className="text-2xl font-bold mb-8 flex items-center gap-2">
          Featured {work.title} Essay Examples
          <div className="h-0.5 flex-grow bg-slate-100 ml-4"></div>
        </h2>
        
        {work.topics.map((topic) => (
          <div key={topic.id} className="bg-white border rounded-2xl p-6 hover:shadow-md transition-shadow">
            <h3 className="text-xl font-bold mb-3 hover:text-blue-600 transition-colors">
              <Link to={`/essay-example/${category.slug}/${work.slug}/${topic.slug}`}>
                {topic.title}
              </Link>
            </h3>
            <p className="text-slate-600 mb-4 line-clamp-2">{topic.excerpt}</p>
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="flex gap-2">
                {topic.keywords.map(kw => (
                  <span key={kw} className="text-xs bg-slate-100 text-slate-600 px-3 py-1 rounded-full">#{kw}</span>
                ))}
              </div>
              <Link 
                to={`/essay-example/${category.slug}/${work.slug}/${topic.slug}`}
                className="text-blue-600 font-bold text-sm flex items-center gap-1"
              >
                Read Full Example <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 8l4 4m0 0l-4 4m4-4H3" /></svg>
              </Link>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Level3_Work;
