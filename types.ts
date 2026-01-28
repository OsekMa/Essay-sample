
export interface EssayTopic {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  keywords: string[];
}

export interface LiteraryWork {
  id: string;
  slug: string;
  title: string;
  author: string;
  description: string;
  topics: EssayTopic[];
}

export interface EssayCategory {
  id: string;
  slug: string;
  title: string;
  description: string;
  works: LiteraryWork[];
}

export interface BreadcrumbItem {
  label: string;
  path: string;
}
