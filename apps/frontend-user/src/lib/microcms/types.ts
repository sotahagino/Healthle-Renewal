export type MicroCMSImage = {
  url: string;
  height: number;
  width: number;
};

export type Category = {
  id: string;
  title: string;
  slug: string;
  description?: string;
  parent_category?: Category;
  createdAt: string;
  updatedAt: string;
  publishedAt: string;
  revisedAt: string;
};

export type Tag = {
  id: string;
  title: string;
  slug: string;
  type: 'symptom' | 'cause' | 'solution';
  description?: string;
  createdAt: string;
  updatedAt: string;
  publishedAt: string;
  revisedAt: string;
};

export type FaqItem = {
  fieldId: string;
  question: string;
  answer: string;
};

export type ReferenceItem = {
  fieldId: string;
  title: string;
  url?: string;
  date?: string;
};

export type Author = {
  id: string;
  name: string;
  slug: string;
  profile: string;
  avatar?: MicroCMSImage;
  role?: string;
  specialties?: string[];
  qualification?: string;
  social?: {
    twitter?: string;
    facebook?: string;
    instagram?: string;
    linkedin?: string;
  };
  articles?: Article[];
  createdAt: string;
  updatedAt: string;
  publishedAt: string;
  revisedAt: string;
};

export type Article = {
  id: string;
  title: string;
  description: string;
  content: string;
  eyecatch?: {
    url: string;
    height: number;
    width: number;
  };
  category: {
    id: string;
    title: string;
    slug: string;
  };
  tags?: {
    id: string;
    title: string;
    slug: string;
    type?: string;
  }[];
  author: Author;
  faq?: FaqItem[];
  references?: ReferenceItem[];
  publishedAt: string;
  updatedAt: string;
  slug: string;
}; 