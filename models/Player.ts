import mongoose, { Schema, type Model, type Types } from 'mongoose';
import './Team';

export type PlayerPosition =
  | 'Point Guard'
  | 'Shooting Guard'
  | 'Small Forward'
  | 'Power Forward'
  | 'Center';

export type GuardianRelationship = 'Mother' | 'Father' | 'Other';

export type InjuryStatus = 'Healthy' | 'Questionable' | 'Doubtful' | 'Out - Injured';

export interface IPlayer {
  profilePicture?: string;
  name: string;
  lastname: string;
  dateOfBirth: Date;
  height: number;
  position: PlayerPosition;
  jerseyNum: number;
  team?: Types.ObjectId;
  tel: string;
  address: string;
  guardian: GuardianRelationship;
  guardianTel: string;
  createdAt?: Date;
  isActive: boolean;
  isFirstTeam: boolean;
  injuryStatus: InjuryStatus;
  injuryNotes?: string;
  age?: number;
}

const PlayerSchema = new Schema<IPlayer>(
  {
    profilePicture: {
      type: String,
      default: '/uploads/default-profile-picture.jpg',
    },
    name: {
      type: String,
      required: true,
    },
    lastname: {
      type: String,
      required: true,
    },
    dateOfBirth: {
      type: Date,
      required: true,
    },
    height: {
      type: Number,
      required: true,
    },
    position: {
      type: String,
      enum: ['Point Guard', 'Shooting Guard', 'Small Forward', 'Power Forward', 'Center'],
      required: true,
    },
    jerseyNum: {
      type: Number,
      required: true,
    },
    team: {
      type: Schema.Types.ObjectId,
      ref: 'Team',
    },
    tel: {
      type: String,
      required: true,
      validate: {
        validator: function (v: string): boolean {
          return /^\+\d{1,15}$/.test(v);
        },
        message: '{VALUE} is not a valid phone number.',
      },
    },
    address: { type: String, required: true },
    guardian: {
      type: String,
      enum: ['Mother', 'Father', 'Other'],
      required: true,
    },
    guardianTel: {
      type: String,
      required: true,
      validate: {
        validator: function (v: string): boolean {
          return /^\+\d{1,15}$/.test(v);
        },
        message: '{VALUE} is not a valid phone number.',
      },
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    isFirstTeam: {
      type: Boolean,
      default: false,
    },
    injuryStatus: {
      type: String,
      enum: ['Healthy', 'Questionable', 'Doubtful', 'Out - Injured'],
      default: 'Healthy',
    },
    injuryNotes: {
      type: String,
      default: '',
    },
  },
  {
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Accept phone numbers as people type them ("+995 599 00-00-00") and store them
// in a canonical form ("+995599000000") so they pass validation and compare cleanly
PlayerSchema.pre('validate', function (next) {
  const fields = ['tel', 'guardianTel'] as const;
  for (const field of fields) {
    const val = this[field];
    if (typeof val === 'string') {
      this[field] = val.replace(/[\s\-().]/g, '');
    }
  }
  next();
});

// One starter per position per team. With five positions this also caps the
// starting five, and the database enforces it even for simultaneous requests.
PlayerSchema.index(
  { team: 1, position: 1 },
  { unique: true, partialFilterExpression: { isFirstTeam: true }, name: 'one_starter_per_position' }
);

// Virtual for player's age
PlayerSchema.virtual('age').get(function (this: IPlayer) {
  if (!this.dateOfBirth) return undefined;
  return Math.floor((new Date().getTime() - new Date(this.dateOfBirth).getTime()) / (365.25 * 24 * 60 * 60 * 1000));
});

const Player: Model<IPlayer> =
  (mongoose.models.Player as Model<IPlayer>) || mongoose.model<IPlayer>('Player', PlayerSchema);

export default Player;
