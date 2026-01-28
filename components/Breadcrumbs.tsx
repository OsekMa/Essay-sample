
import React from 'react';
import { Link } from 'react-router-dom';
import { BreadcrumbItem } from '../types';

interface BreadcrumbsProps {
  items: BreadcrumbItem[];
}

const Breadcrumbs: React.FC<BreadcrumbsProps> = ({ items }) => {
  return (
    <nav className="flex mb-6 text-sm text-slate-500 overflow-x-auto whitespace-nowrap pb-2">
      <Link to="/essay-example" className="hover:text-blue-600">Essay Examples</Link>
      {items.map((item, index) => (
        <React.Fragment key={item.path}>
          <span className="mx-2">/</span>
          {index === items.length - 1 ? (
            <span className="text-slate-900 font-medium truncate max-w-[200px] md:max-w-none">{item.label}</span>
          ) : (
            <Link to={item.path} className="hover:text-blue-600 truncate max-w-[150px] md:max-w-none">{item.label}</Link>
          )}
        </React.Fragment>
      ))}
    </nav>
  );
};

export default Breadcrumbs;
