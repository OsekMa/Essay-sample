
import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { ESSAY_CATEGORIES } from '../constants';
import Breadcrumbs from '../components/Breadcrumbs';

const Level2_Category: React.FC = () => {
  const { categorySlug } = useParams<{ categorySlug: string }>();
  const category = ESSAY_CATEGORIES.find(c => c.slug === categorySlug);

  if (!category) return <div className="text-center py-20 text-slate-500">Category not found</div>;

  return (
    <div className="animate-fade-in">
      <Breadcrumbs items={[{ label: category.title, path: `/essay-example/${category.slug}` }]} />
      
      <div className="mb-12">
        <h1 className="text-4xl font-bold serif mb-4">{category.title} Essay Examples</h1>
        <p className="text-slate-600 max-w-3xl">
          Dive into our comprehensive database of {category.title.toLowerCase()} essay topics. From Shakespeare to contemporary prose, find the perfect inspiration for your English Literature paper.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {category.works.map((work) => (
          <Link 
            key={work.id} 
            to={`/essay-example/${category.slug}/${work.slug}`}
            className="flex flex-col sm:flex-row bg-white border border-slate-200 rounded-xl overflow-hidden hover:shadow-lg transition-shadow group"
          >
            <div className="w-full sm:w-40 h-48 sm:h-auto bg-slate-100 flex items-center justify-center p-4">
               <div className="bg-white p-2 shadow-md w-24 h-32 flex flex-col items-center justify-center text-center border">
                  <span className="text-[10px] font-bold uppercase text-slate-400">Literature</span>
                  <span className="text-xs font-bold leading-tight my-1">{work.title}</span>
                  <div className="w-4 h-0.5 bg-blue-600"></div>
               </div>
            </div>
            <div className="p-6 flex-grow">
              <h3 className="text-xl font-bold mb-1 group-hover:text-blue-600 transition-colors">{work.title} Essay Topics</h3>
              <p className="text-sm text-slate-500 mb-3">by {work.author}</p>
              <p className="text-slate-600 text-sm mb-4 line-clamp-2">{work.description}</p>
              <div className="flex gap-2">
                <span className="bg-blue-50 text-blue-600 text-[10px] px-2 py-1 rounded-full font-bold uppercase">
                  {work.topics.length} Examples
                </span>
              </div>
            </div>
          </Link>
        ))}
      </div>

      <div className="mt-16 bg-blue-50 p-8 rounded-2xl flex flex-col md:flex-row items-center gap-8 border border-blue-100">
        <div className="flex-grow">
          <h2 className="text-2xl font-bold mb-2">Need a Specific {category.title} Topic?</h2>
          <p className="text-slate-600">Our AI can suggest unique angles and thesis statements for any {category.title.toLowerCase()} work in our catalog.</p>
        </div>
        <button className="bg-white text-blue-600 border border-blue-200 px-6 py-3 rounded-lg font-bold hover:bg-blue-600 hover:text-white transition whitespace-nowrap">
          Generate Topic Ideas
        </button>
      </div>
    </div>
  );
};

export default Level2_Category;
