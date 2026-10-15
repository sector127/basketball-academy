import mongoose, { Schema, type Model } from 'mongoose';

export interface ICoach {
  name: string;
  lastname: string;
  position: string;
}

const CoachSchema = new Schema<ICoach>({
  name: {
    type: String,
    required: true,
  },
  lastname: {
    type: String,
    required: true,
  },
  position: {
    type: String,
    required: true,
  },
});

const Coach: Model<ICoach> =
  (mongoose.models.Coach as Model<ICoach>) || mongoose.model<ICoach>('Coach', CoachSchema);

export default Coach;
