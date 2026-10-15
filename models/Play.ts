import mongoose, { Schema, type Model, type Types } from 'mongoose';

export type PlayCategory =
  | 'Set Play'
  | 'Motion Offense'
  | 'Pick & Roll'
  | 'Inbound'
  | 'Zone Defense'
  | 'Fastbreak';

export interface IPlayerState {
  id: string;
  position: string;
  x: number;
  y: number;
  hasBall: boolean;
  action?: string;
}

export interface IBallState {
  x: number;
  y: number;
  holder?: string | null;
}

export interface IPlayStep {
  step: number;
  description: string;
  players: IPlayerState[];
  ball?: IBallState;
}

export interface IPlay {
  name: string;
  description: string;
  category: PlayCategory;
  team?: Types.ObjectId;
  createdBy?: Types.ObjectId;
  isCustom: boolean;
  steps: IPlayStep[];
  createdAt?: Date;
  updatedAt?: Date;
}

const PlayerStateSchema = new Schema<IPlayerState>({
  id: { type: String, required: true },
  position: { type: String, required: true },
  x: { type: Number, required: true },
  y: { type: Number, required: true },
  hasBall: { type: Boolean, default: false },
  action: { type: String, default: '' },
});

const BallStateSchema = new Schema<IBallState>({
  x: { type: Number, required: true },
  y: { type: Number, required: true },
  holder: { type: String, default: null },
});

const PlayStepSchema = new Schema<IPlayStep>({
  step: { type: Number, required: true },
  description: { type: String, required: true },
  players: [PlayerStateSchema],
  ball: BallStateSchema,
});

const PlaySchema = new Schema<IPlay>(
  {
    name: { type: String, required: true, trim: true },
    description: { type: String, required: true, trim: true },
    category: {
      type: String,
      enum: ['Set Play', 'Motion Offense', 'Pick & Roll', 'Inbound', 'Zone Defense', 'Fastbreak'],
      default: 'Set Play',
    },
    team: {
      type: Schema.Types.ObjectId,
      ref: 'Team',
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    isCustom: {
      type: Boolean,
      default: true,
    },
    steps: [PlayStepSchema],
  },
  { timestamps: true }
);

const Play: Model<IPlay> =
  (mongoose.models.Play as Model<IPlay>) || mongoose.model<IPlay>('Play', PlaySchema);

export default Play;
