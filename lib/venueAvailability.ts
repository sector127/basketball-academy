import Event from '@/models/Event';
import type mongoose from 'mongoose';

// Helper function to check venue availability
export async function isVenueAvailable(
  venueId: string | mongoose.Types.ObjectId,
  startTime: Date | string,
  endTime: Date | string,
  eventId: string | mongoose.Types.ObjectId | null = null
): Promise<boolean> {
  // Find any overlapping events at the same venue
  const overlappingEvents = await Event.find({
    venue: venueId,
    _id: { $ne: eventId }, // Exclude current event if updating
    $or: [
      {
        startTime: { $lt: endTime },
        endTime: { $gt: startTime },
      },
      {
        startTime: { $lt: endTime },
        endTime: { $gt: startTime },
      },
    ],
  });

  return overlappingEvents.length === 0;
}
