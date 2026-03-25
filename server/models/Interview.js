const mongoose = require('mongoose');

const qaSchema = new mongoose.Schema({
  questionNumber: { type: Number, required: true },
  question:       { type: String, required: true },
  questionType:   { type: String, enum: ['main','followup'], default: 'main' },
  answer:         { type: String, default: '' },
  feedback:       { type: String, default: '' },
  scores: {
    technical:     { type: Number, min:0, max:10, default:0 },
    communication: { type: Number, min:0, max:10, default:0 },
    confidence:    { type: Number, min:0, max:10, default:0 },
    overall:       { type: Number, min:0, max:10, default:0 }
  },
  answeredAt: { type: Date }
});

const interviewSchema = new mongoose.Schema({
  userId:               { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  role:                 { type: String, required: true, trim: true },
  difficulty:           { type: String, enum: ['beginner','intermediate','advanced'], required: true },
  experience:           { type: String, required: true },
  totalQuestions:       { type: Number, default: 5 },
  status:               { type: String, enum: ['in-progress','completed','abandoned'], default: 'in-progress' },
  currentQuestionIndex: { type: Number, default: 0 },
  qaHistory:            [qaSchema],
  finalReport: {
    overallScore: { type: Number, min:0, max:100 },
    strengths:    [String],
    weaknesses:   [String],
    suggestions:  [String],
    summary:      { type: String }
  },
  startedAt:   { type: Date, default: Date.now },
  completedAt: { type: Date }
}, { timestamps: true });

module.exports = mongoose.model('Interview', interviewSchema);
