export type ArticleStatus='draft'|'published'|'archived';
export type BlockType='rich_text'|'heading'|'image'|'gallery'|'quote'|'info'|'faq'|'cta'|'related_experience'|'related_transfer'|'related_room';
export interface ArticleBlock{id:string;type:BlockType;heading?:string;text?:string;mediaId?:string;mediaIds?:string[];caption?:string;quote?:string;attribution?:string;items?:{question:string;answer:string}[];label?:string;href?:string;relatedId?:string}
export interface EditorialOption{id:string;label:string;url?:string}
export interface ExploreCategory{id:string;title:string;slug:string;description:string;status:ArticleStatus;sortOrder:number}
export interface AdminArticle{id:string;title:string;slug:string;subtitle:string;excerpt:string;categoryId:string;heroMediaId:string;imageUrl:string;galleryMediaIds:string[];status:ArticleStatus;featured:boolean;publishDate:string;author:string;sortOrder:number;blocks:ArticleBlock[];relatedArticleIds:string[];relatedExperienceIds:string[];relatedTransferIds:string[];seoTitle:string;seoDescription:string;ogMediaId:string;canonicalOverride:string;noindex:boolean;updatedAt:string}
export interface ArticleEditorData{categories:ExploreCategory[];media:EditorialOption[];articles:EditorialOption[];experiences:EditorialOption[];transfers:EditorialOption[];rooms:EditorialOption[]}
export interface ExploreFormState{ok:boolean;message:string;id?:string;errors?:Record<string,string>}
