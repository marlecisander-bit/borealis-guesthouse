// Database type definitions for Borealis
export interface Property {
  id: string
  name: string
  description: string
  location: string
  check_in_time: string
  check_out_time: string
  currency: string
  created_at: string
  updated_at: string
}

export interface RoomType {
  id: string
  property_id: string
  name: string
  description: string
  capacity: number
  beds: number
  size_sqm: number
  created_at: string
  updated_at: string
}

export interface Room {
  id: string
  property_id: string
  room_type_id: string
  room_number: string
  view?: string
  is_available: boolean
  created_at: string
  updated_at: string
}

export interface Amenity {
  id: string
  property_id: string
  name: string
  icon?: string
  created_at: string
  updated_at: string
}

export interface RoomAmenity {
  room_id: string
  amenity_id: string
}

export interface Rate {
  id: string
  property_id: string
  room_type_id: string
  base_price: number
  currency: string
  created_at: string
  updated_at: string
}

export interface RateRule {
  id: string
  rate_id: string
  name: string
  rule_type: 'seasonal' | 'discount' | 'minimum_stay'
  start_date?: string
  end_date?: string
  multiplier?: number
  discount_percent?: number
  minimum_nights?: number
  created_at: string
  updated_at: string
}

export interface Availability {
  id: string
  room_id: string
  date: string
  is_available: boolean
  booked_count: number
  capacity: number
  created_at: string
  updated_at: string
}

export interface Guest {
  id: string
  email: string
  first_name: string
  last_name: string
  phone?: string
  country?: string
  created_at: string
  updated_at: string
}

export interface Booking {
  id: string
  property_id: string
  guest_id: string
  check_in: string
  check_out: string
  status: 'pending' | 'confirmed' | 'checked_in' | 'completed' | 'cancelled'
  total_amount: number
  currency: string
  payment_status: 'pending' | 'paid' | 'failed'
  notes?: string
  created_at: string
  updated_at: string
}

export interface BookingItem {
  id: string
  booking_id: string
  item_type: 'room' | 'experience' | 'transfer'
  item_id: string
  quantity: number
  unit_price: number
  total_price: number
}

export interface Experience {
  id: string
  property_id: string
  name: string
  description: string
  price: number
  currency: string
  duration_minutes: number
  max_capacity: number
  created_at: string
  updated_at: string
}

export interface Transfer {
  id: string
  property_id: string
  route_name: string
  description: string
  price: number
  currency: string
  capacity: number
  created_at: string
  updated_at: string
}

export interface MediaAsset {
  id: string
  property_id: string
  file_path: string
  alt_text?: string
  title?: string
  file_type: string
  size_bytes: number
  created_at: string
  updated_at: string
}

export interface Page {
  id: string
  property_id: string
  slug: string
  title: string
  content?: string
  is_published: boolean
  seo_title?: string
  seo_description?: string
  created_at: string
  updated_at: string
}

export interface AdminUser {
  id: string
  email: string
  role: 'owner' | 'manager' | 'staff'
  property_id: string
  created_at: string
  updated_at: string
}

export interface Settings {
  id: string
  property_id: string
  key: string
  value: string
  created_at: string
  updated_at: string
}
