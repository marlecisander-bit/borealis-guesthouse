-- Ensure every booking status change is reflected by the inventory reservation
-- rows used by the central availability engine. This is safe to rerun and also
-- repairs reservations created before the synchronization trigger existed.

CREATE OR REPLACE FUNCTION public.sync_booking_reservation_status()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path=public
AS $$
BEGIN
  UPDATE public.room_reservations
  SET booking_status=NEW.booking_status,
      hold_expires_at=NEW.hold_expires_at
  WHERE booking_id=NEW.id;
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS sync_booking_reservation_status ON public.bookings;
CREATE TRIGGER sync_booking_reservation_status
AFTER UPDATE OF booking_status,hold_expires_at ON public.bookings
FOR EACH ROW EXECUTE FUNCTION public.sync_booking_reservation_status();

-- Repair any booking/reservation mismatch that could keep cancelled dates
-- unavailable. Cancelled and completed reservations remain as history but no
-- longer participate in availability calculations or exclusion constraints.
UPDATE public.room_reservations reservation
SET booking_status=booking.booking_status,
    hold_expires_at=booking.hold_expires_at
FROM public.bookings booking
WHERE booking.id=reservation.booking_id
  AND (
    reservation.booking_status IS DISTINCT FROM booking.booking_status
    OR reservation.hold_expires_at IS DISTINCT FROM booking.hold_expires_at
  );

-- Migration 029 normally provides this trigger. Reassert it here so existing
-- package line items also reflect cancellation immediately.
CREATE OR REPLACE FUNCTION public.sync_booking_item_status()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path=public
AS $$
DECLARE next_item_status TEXT;
BEGIN
  next_item_status:=CASE NEW.booking_status
    WHEN 'held' THEN 'held'
    WHEN 'cancelled' THEN 'cancelled'
    WHEN 'completed' THEN 'completed'
    WHEN 'pending' THEN 'pending'
    WHEN 'awaiting_payment' THEN 'pending'
    ELSE 'confirmed'
  END;
  UPDATE public.booking_items
  SET item_status=next_item_status,updated_at=NOW()
  WHERE booking_id=NEW.id AND item_status IS DISTINCT FROM next_item_status;
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS sync_booking_item_status ON public.bookings;
CREATE TRIGGER sync_booking_item_status
AFTER UPDATE OF booking_status ON public.bookings
FOR EACH ROW EXECUTE FUNCTION public.sync_booking_item_status();

-- Backfill line-item status for bookings cancelled before this migration.
UPDATE public.booking_items item
SET item_status=CASE booking.booking_status
      WHEN 'held' THEN 'held'
      WHEN 'cancelled' THEN 'cancelled'
      WHEN 'completed' THEN 'completed'
      WHEN 'pending' THEN 'pending'
      WHEN 'awaiting_payment' THEN 'pending'
      ELSE 'confirmed'
    END,
    updated_at=NOW()
FROM public.bookings booking
WHERE booking.id=item.booking_id
  AND item.item_status IS DISTINCT FROM CASE booking.booking_status
    WHEN 'held' THEN 'held'
    WHEN 'cancelled' THEN 'cancelled'
    WHEN 'completed' THEN 'completed'
    WHEN 'pending' THEN 'pending'
    WHEN 'awaiting_payment' THEN 'pending'
    ELSE 'confirmed'
  END;
