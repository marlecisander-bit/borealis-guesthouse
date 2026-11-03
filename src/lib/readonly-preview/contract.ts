// Reviewed public-reader projections; extend only after source review. No wildcard selects.
export const projections: Record<string, readonly string[]> = {
  "amenities": [
    "id,name,icon"
  ],
  "cms_documents": [
    "id,data"
  ],
  "experience_images": [
    "experience_id,media_asset_id,sort_order,is_cover,media_assets!inner(file_path,status,is_visible)"
  ],
  "experiences": [
    "id,name,slug",
    "id,slug,name,short_description,full_description,duration_label,max_capacity,minimum_quantity,maximum_quantity,price,currency,pricing_type,meeting_point,included_items,important_notes,booking_notice,availability_mode,is_featured,bookable,book_independently"
  ],
  "gallery_items": [
    "id,title,category,sort_order,media_assets!inner(id,file_path,alt_text,filename,status,is_visible)"
  ],
  "homepage_section_links": [
    "section_id,entity_type,entity_id,sort_order"
  ],
  "homepage_sections": [
    "id,section_key,title,subtitle,body,eyebrow,cta_label,cta_link,background_media_id,settings,status,is_visible,sort_order",
    "property_id,title,subtitle,eyebrow,cta_label,cta_link,background_media_id,settings,is_visible,sort_order"
  ],
  "languages": [
    "id,code,label,native_name,icon_reference,enabled,is_default,sort_order"
  ],
  "media_assets": [
    "file_path",
    "file_path,storage_bucket",
    "file_path,storage_bucket,alt_text",
    "id,alt_text,filename,file_path",
    "id,file_path"
  ],
  "navigation_items": [
    "id,label,href"
  ],
  "page_seo": [
    "id,slug,seo_title,meta_description,og_title,og_description,og_image_id,canonical_override,noindex"
  ],
  "pricing_rules": [
    "id,room_type_id,start_date,end_date,nights,active,status"
  ],
  "properties": [
    "address_line,location,google_maps_url,phone,whatsapp,email,instagram_url,facebook_url",
    "id",
    "id,currency",
    "id,name,description,location,address_line"
  ],
  "rates": [
    "room_type_id,base_price,currency,status,is_visible,active"
  ],
  "reviews": [
    "id,author_name,origin,quote,status,is_visible,sort_order"
  ],
  "room_images": [
    "room_type_id,sort_order,is_featured,media_assets(file_path)"
  ],
  "room_type_amenities": [
    "room_type_id,amenity_id"
  ],
  "room_types": [
    "id,name,slug",
    "id,slug,name,short_description,long_description,capacity,max_adults,max_children,max_infants,max_total_occupancy,min_adults,infants_count_toward_capacity,bed_configuration,size_sqm,view_type,is_featured"
  ],
  "seasonal_rate_periods": [
    "id,name,start_date,end_date,nightly_price,currency,active,status"
  ],
  "seasonal_rate_room_types": [
    "period_id,room_type_id"
  ],
  "seo_metadata": [
    "entity_id,title,meta_description",
    "entity_id,title,meta_description,og_image_id,canonical_override,noindex,status",
    "entity_id,title,meta_description,og_title,og_description,canonical_override,noindex",
    "title,meta_description"
  ],
  "site_settings": [
    "setting_key,value_number",
    "setting_key,value_text,value_boolean,media_asset_id",
    "setting_key,value_text,value_number,value_boolean,media_asset_id"
  ],
  "tourism_articles": [
    "id,slug,title,subtitle,excerpt,description,category_id,hero_media_id,gallery_media_ids,content_blocks,author_name,published_at,is_featured,related_article_ids,related_experience_ids,related_transfer_ids",
    "id,title,slug"
  ],
  "tourism_categories": [
    "id,title,slug"
  ],
  "transfer_images": [
    "transfer_route_id,media_asset_id,sort_order"
  ],
  "transfer_routes": [
    "id,origin,destination,slug",
    "id,origin,destination,slug,short_description,description,full_description,cover_media_id,duration_label,duration_minutes,capacity,service_type,price,currency,price_type,booking_notice,active,is_featured,bookable,availability_mode,available_days,window_start,window_end"
  ],
  "translations": [
    "entity_id,language_id,field_name,translated_value",
    "language_id,entity_id,field_name,translated_value",
    "language_id,field_name,translated_value"
  ]
};
export const publicAssets: readonly string[] = ["/borealis-placeholder.svg", "/brand/borealis-logo-dark.svg", "/brand/borealis-logo-light.svg", "/brand/borealis-logo.svg", "/file.svg", "/globe.svg", "/next.svg", "/vercel.svg", "/window.svg"];
