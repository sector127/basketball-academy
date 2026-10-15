import mongoose, { Schema, type Model } from 'mongoose';

export type VenueType = 'indoor' | 'outdoor' | 'training_facility';

export interface IGeoPoint {
  type: string;
  coordinates: [number, number] | number[];
}

export interface IVenue {
  name: string;
  location?: IGeoPoint;
  address: string;
  capacity?: number | null;
  description?: string;
  type: VenueType;
  isActive: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

const GeoSchema = new Schema<IGeoPoint>({
  type: {
    type: String,
    default: 'Point',
  },
  coordinates: {
    type: [Number],
    required: true,
    index: '2dsphere',
  },
});

const VenueSchema = new Schema<IVenue>(
  {
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
    },
  },
  {
    timestamps: true,
  }
);

const Venue: Model<IVenue> =
  (mongoose.models.Venue as Model<IVenue>) || mongoose.model<IVenue>('Venue', VenueSchema);

export default Venue;
