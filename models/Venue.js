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
    },
    capacity: {
        type: Number,
        default: null,
    },
    description: {
        type: String,
        default: '',
    },
    type: {
        type: String,
        enum: ['indoor', 'outdoor', 'training_facility'],
        default: 'indoor',
    },
    isActive: {
        type: Boolean,
        default: true,
    }
}, {
    timestamps: true
})

const Venue = mongoose.models.Venue || mongoose.model('Venue', VenueSchema);

export default Venue;