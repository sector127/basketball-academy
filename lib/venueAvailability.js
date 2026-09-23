import Event from "@/models/Event";

// Helper function to check venue availability
export async function isVenueAvailable(venueId, startTime, endTime, eventId = null) {
    // Find any overlapping events at the same venue
    const overlappingEvents = await Event.find({
        venue: venueId,
        _id: {$ne: eventId}, // Exclude current event if updating
        $or: [
            {
                startTime: {$lt: endTime},
                endTime: {$gt: startTime}
            },
            {
                startTime: {$lt: endTime},
                endTime: {$gt: startTime}
            }
        ]
    });

    return overlappingEvents.length === 0;
}
