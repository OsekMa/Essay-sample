
import { EssayCategory } from './types';

export const ESSAY_CATEGORIES: EssayCategory[] = [
  {
    id: 'literature',
    slug: 'literature',
    title: 'Literature',
    description: 'Explore our vast collection of literature essay examples covering classics and contemporary works.',
    works: [
      {
        id: 'the-great-gatsby',
        slug: 'the-great-gatsby',
        title: 'The Great Gatsby',
        author: 'F. Scott Fitzgerald',
        description: 'Analysis of wealth, class, and the elusive American Dream in Fitzgerald\'s masterpiece.',
        topics: [
          {
            id: 'symbolism-of-green-light',
            slug: 'symbolism-of-green-light',
            title: 'Symbolism of the Green Light in The Great Gatsby Essay',
            excerpt: 'The green light at the end of Daisy\'s dock is one of the most significant symbols in literature...',
            keywords: ['Green Light', 'Gatsby Symbolism', 'American Dream']
          },
          {
            id: 'the-american-dream-failure',
            slug: 'the-american-dream-failure',
            title: 'The Corruption of the American Dream in Gatsby',
            excerpt: 'How Jay Gatsby\'s pursuit of Daisy represents the moral decay of 1920s America...',
            keywords: ['American Dream', 'Moral Decay', 'Jay Gatsby']
          }
        ]
      },
      {
        id: '1984',
        slug: '1984',
        title: '1984',
        author: 'George Orwell',
        description: 'Dystopian themes of surveillance, power, and the manipulation of truth.',
        topics: [
          {
            id: 'totalitarianism-and-control',
            slug: 'totalitarianism-and-control',
            title: 'Totalitarianism and Control in George Orwell\'s 1984',
            excerpt: 'An exploration of how Big Brother maintains absolute power through thought control...',
            keywords: ['Totalitarianism', 'Surveillance', 'Big Brother']
          }
        ]
      }
    ]
  },
  {
    id: 'history',
    slug: 'history',
    title: 'History',
    description: 'Historical analysis essays from ancient civilizations to modern political movements.',
    works: []
  }
];
