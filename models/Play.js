import mongoose from 'mongoose';

const PlayerStateSchema = new mongoose.Schema({
  id: { type: String, required: true },
  position: { type: String, required: true },
  x: { type: Number, required: true },
  y: { type: Number, required: true },
  hasBall: { type: Boolean, default: false },
  action: { type: String, default: '' },
});

const BallStateSchema = new mongoose.Schema({
  x: { type: Number, required: true },
  y: { type: Number, required: true },
  holder: { type: String, default: null },
});

const PlayStepSchema = new mongoose.Schema({
  step: { type: Number, required: true },
  description: { type: String, required: true },
  players: [PlayerStateSchema],
  ball: BallStateSchema,
});

const PlaySchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    description: { type: String, required: true, trim: true },
    category: {
      type: String,
      enum: ['Set Play', 'Motion Offense', 'Pick & Roll', 'Inbound', 'Zone Defense', 'Fastbreak'],
      default: 'Set Play',
    },
    team: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Team',
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
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

const Play = mongoose.models.Play || mongoose.model('Play', PlaySchema);
export default Play;
