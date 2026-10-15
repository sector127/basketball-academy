import mongoose, { Schema, type Model, type Types } from 'mongoose';

export type GameStatus = 'scheduled' | 'in_progress' | 'completed' | 'cancelled';

export interface IPeriodScore {
  period: number;
  homeScore: number;
  awayScore: number;
}

export interface IPlayerBoxScore {
  player: Types.ObjectId;
  minutesPlayed: number;
  points: number;
  assists: number;
  rebounds: number;
  steals: number;
  blocks: number;
  turnovers: number;
  fouls: number;
}

export interface IGameResult {
  event: Types.ObjectId;
  homeTeamScore: number;
  awayTeamScore: number;
  periodScores: IPeriodScore[];
  boxScores: IPlayerBoxScore[];
  status: GameStatus;
  createdAt?: Date;
  updatedAt?: Date;
}

const PeriodScoreSchema = new Schema<IPeriodScore>({
  period: {
    type: Number,
    required: true,
  },
  homeScore: {
    type: Number,
    default: 0,
  },
  awayScore: {
    type: Number,
    default: 0,
  },
});

const PlayerBoxScoreSchema = new Schema<IPlayerBoxScore>({
  player: {
    type: Schema.Types.ObjectId,
    ref: 'Player',
    required: true,
  },
  minutesPlayed: { type: Number, default: 0 },
  points: { type: Number, default: 0 },
  assists: { type: Number, default: 0 },
  rebounds: { type: Number, default: 0 },
  steals: { type: Number, default: 0 },
  blocks: { type: Number, default: 0 },
  turnovers: { type: Number, default: 0 },
  fouls: { type: Number, default: 0 },
});

const GameResultSchema = new Schema<IGameResult>(
  {
    event: {
      type: Schema.Types.ObjectId,
      ref: 'Event',
      required: true,
      unique: true,
    },
    homeTeamScore: {
      type: Number,
      default: 0,
    },
    awayTeamScore: {
      type: Number,
      default: 0,
    },
    periodScores: [PeriodScoreSchema],
    boxScores: [PlayerBoxScoreSchema],
    status: {
      type: String,
      enum: ['scheduled', 'in_progress', 'completed', 'cancelled'],
      default: 'scheduled',
    },
  },
  {
    timestamps: true,
  }
);

// Update total scores when period scores change
GameResultSchema.pre('save', function (next) {
  if (this.periodScores && this.periodScores.length > 0) {
    this.homeTeamScore = this.periodScores.reduce((sum, period) => sum + (period.homeScore || 0), 0);
    this.awayTeamScore = this.periodScores.reduce((sum, period) => sum + (period.awayScore || 0), 0);
  }
  next();
});

const GameResult: Model<IGameResult> =
  (mongoose.models.GameResult as Model<IGameResult>) ||
  mongoose.model<IGameResult>('GameResult', GameResultSchema);

export default GameResult;
