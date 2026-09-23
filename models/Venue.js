import mongoose from "mongoose";

const GeoSchema = new mongoose.Schema({
    type: {
        type: String,
        default: "Point",
    },
    coordinates: {
        type: [Number],
        required: true,
        index: "2dsphere"
    }
})

const VenueSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
    },
    location: GeoSchema,
    address: {
        type: String,
        required: true,
    }
})

const Venue = mongoose.models.Venue || mongoose.model('Venue', VenueSchema);

export default Venue;