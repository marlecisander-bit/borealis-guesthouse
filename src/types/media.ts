export type MediaPlacement = 'home_hero' | 'gallery' | 'room' | 'experience' | 'transfer' | 'about_hero';

export interface MediaAsset {
  id: string;
  property_id: string;
  file_path: string;
  filename?: string | null;
  mime_type?: string | null;
  storage_bucket?: string;
  alt_text: string | null;
  title: string | null;
  file_type: string | null;
  size_bytes: number | null;
  placement: MediaPlacement;
  related_slug: string | null;
  display_order: number;
  is_published: boolean;
  caption?: string | null;
  status?: 'draft' | 'published' | 'archived';
  is_visible?: boolean;
  sort_order?: number;
  created_at: string;
  updated_at?: string;
  width?: number | null;
  height?: number | null;
  focal_x?: number | null;
  focal_y?: number | null;
}

export interface AdminMediaAsset extends MediaAsset {
  publicUrl: string;
  referencedByPublishedContent: boolean;
}
