import mongoose, { Schema, type Model, type Types } from 'mongoose';

export interface ITeam {
  name: string;
  description: string;
  coach: Types.ObjectId;
  assistantCoach?: Types.ObjectId;
}

const TeamSchema = new Schema<ITeam>({
  name: {
    type: String,
    required: true,
  },
  description: {
    type: String,
    required: true,
  },
  coach: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  assistantCoach: {
    type: Schema.Types.ObjectId,
    ref: 'User',
  },
});

const Team: Model<ITeam> =
  (mongoose.models.Team as Model<ITeam>) || mongoose.model<ITeam>('Team', TeamSchema);

export default Team;
