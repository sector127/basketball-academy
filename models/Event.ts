import mongoose, { Schema, type Model, type Types } from 'mongoose';
import './GameResult';

export type EventType = 'practice' | 'individualTraining' | 'game';
export type AttendanceStatus = 'present' | 'absent' | 'excused' | 'injured';

export interface IAttendanceRecord {
  player: Types.ObjectId;
  status: AttendanceStatus;
  notes?: string;
}

export interface IRecurrenceRule {
  daysOfWeek?: number[];
  seasonEndDate?: Date;
  frequencyPerWeek?: number;
}

export interface IEvent {
  eventType: EventType;
  title: string;
  description?: string;
  startTime: Date;
  endTime: Date;
  isAwayGame: boolean;
  venue?: Types.ObjectId;
  location?: string;
  team?: Types.ObjectId;
  opponent?: string;
  players: Types.ObjectId[];
  attendance: IAttendanceRecord[];
  isRecurring: boolean;
  recurringGroupId?: string | null;
  recurrenceRule?: IRecurrenceRule;
  createdAt?: Date;
  updatedAt?: Date;
}

const EventSchema = new Schema<IEvent>(
  {
    eventType: {
      type: String,
      enum: ['practice', 'individualTraining', 'game'],
      required: true,
    },
    title: {
      type: String,
      required: true,
    },
    description: String,
    startTime: {
      type: Date,
      required: true,
    },
    endTime: {
      type: Date,
      required: true,
    },
    isAwayGame: {
      type: Boolean,
      default: false,
    },
    venue: {
      type: Schema.Types.ObjectId,
      ref: 'Venue',
      required: function (this: IEvent) {
        return !this.isAwayGame;
      },
    },
    location: {
      type: String,
      required: function (this: IEvent) {
        return this.isAwayGame;
      },
    },
    team: {
      type: Schema.Types.ObjectId,
      ref: 'Team',
    },
    opponent: {
      type: String,
      required: function (this: IEvent) {
        return this.eventType === 'game';
      },
    },
    players: [
      {
        type: Schema.Types.ObjectId,
        ref: 'Player',
      },
    ],
    attendance: [
      {
        player: {
          type: Schema.Types.ObjectId,
          ref: 'Player',
          required: true,
        },
        status: {
          type: String,
          enum: ['present', 'absent', 'excused', 'injured'],
          default: 'present',
        },
        notes: { type: String, default: '' },
      },
    ],
    isRecurring: {
      type: Boolean,
      default: false,
    },
    recurringGroupId: {
      type: String,
      index: true,
      default: null,
    },
    recurrenceRule: {
      daysOfWeek: [{ type: Number }],
      seasonEndDate: { type: Date },
      frequencyPerWeek: { type: Number },
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Virtual populate for game result
EventSchema.virtual('gameResult', {
  ref: 'GameResult',
  localField: '_id',
  foreignField: 'event',
  justOne: true,
});

if (mongoose.models.Event) {
  delete mongoose.models.Event;
}
const Event: Model<IEvent> = mongoose.model<IEvent>('Event', EventSchema);

export default Event;
