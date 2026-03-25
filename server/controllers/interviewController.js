const mongoose  = require('mongoose');
const Interview = require('../models/Interview');
const ai        = require('../services/aiService');

const validId = id => mongoose.Types.ObjectId.isValid(id);

exports.startInterview = async (req, res) => {
  try {
    const { role, difficulty, experience, totalQuestions = 5 } = req.body;
    if (!role || !difficulty || !experience)
      return res.status(400).json({ message: 'Role, difficulty and experience are required.' });
    if (!['beginner','intermediate','advanced'].includes(difficulty))
      return res.status(400).json({ message: 'Difficulty must be beginner, intermediate or advanced.' });

    const count     = Math.min(Math.max(parseInt(totalQuestions)||5, 1), 10);
    const questions = await ai.generateQuestions(role, difficulty, experience, count);
    if (!questions?.length) return res.status(500).json({ message: 'Failed to generate questions.' });

    const interview = await new Interview({
      userId: req.user._id,
      role: role.trim(), difficulty, experience: experience.trim(),
      totalQuestions: questions.length, status: 'in-progress', currentQuestionIndex: 0,
      qaHistory: questions.map((q,i) => ({
        questionNumber: i+1, question: q.question, questionType: 'main',
        answer:'', feedback:'', scores:{technical:0,communication:0,confidence:0,overall:0}
      }))
    }).save();

    res.status(201).json({
      interviewId: interview._id,
      totalQuestions: interview.totalQuestions,
      currentQuestion: { questionNumber:1, question: interview.qaHistory[0].question, isLastQuestion: interview.totalQuestions===1 }
    });
  } catch(e) { console.error('startInterview:', e); res.status(500).json({ message: 'Failed to start interview.', error: e.message }); }
};

exports.submitAnswer = async (req, res) => {
  try {
    const { interviewId, answer } = req.body;
    if (!interviewId || !answer?.trim()) return res.status(400).json({ message: 'interviewId and answer required.' });
    if (!validId(interviewId)) return res.status(400).json({ message: 'Invalid interview ID.' });

    const iv = await Interview.findOne({ _id: interviewId, userId: req.user._id });
    if (!iv) return res.status(404).json({ message: 'Interview not found.' });
    if (iv.status !== 'in-progress') return res.status(400).json({ message: 'Interview already completed.' });

    const idx = iv.currentQuestionIndex;
    if (idx >= iv.qaHistory.length) return res.status(400).json({ message: 'All questions already answered.' });

    const evaluation = await ai.evaluateAnswer(iv.qaHistory[idx].question, answer.trim(), iv.role, iv.difficulty);
    iv.qaHistory[idx].answer = answer.trim();
    iv.qaHistory[idx].feedback = evaluation.feedback;
    iv.qaHistory[idx].scores = evaluation.scores;
    iv.qaHistory[idx].answeredAt = new Date();
    iv.markModified('qaHistory');
    iv.currentQuestionIndex += 1;

    const isLast = iv.currentQuestionIndex >= iv.totalQuestions;
    let nextQuestion=null, finalReport=null;

    if (isLast) {
      iv.status='completed'; iv.completedAt=new Date();
      const report = await ai.generateFinalReport(iv.role, iv.difficulty, iv.qaHistory.map(q=>q.toObject?q.toObject():q));
      iv.finalReport=report; finalReport=report;
    } else {
      const nq = iv.qaHistory[iv.currentQuestionIndex];
      nextQuestion = { questionNumber: iv.currentQuestionIndex+1, question: nq.question, isLastQuestion: iv.currentQuestionIndex+1>=iv.totalQuestions };
    }

    await iv.save();
    res.json({ feedback: evaluation.feedback, scores: evaluation.scores, followUpQuestion: evaluation.followUpQuestion, isComplete: isLast, nextQuestion, finalReport, progress: { current: idx+1, total: iv.totalQuestions } });
  } catch(e) { console.error('submitAnswer:', e); res.status(500).json({ message: 'Failed to evaluate answer.', error: e.message }); }
};

exports.getResult = async (req, res) => {
  try {
    const { interviewId } = req.params;
    if (!validId(interviewId)) return res.status(400).json({ message: 'Invalid ID.' });
    const iv = await Interview.findOne({ _id: interviewId, userId: req.user._id });
    if (!iv) return res.status(404).json({ message: 'Interview not found.' });
    res.json({ interview: iv });
  } catch(e) { res.status(500).json({ message: 'Failed to fetch result.' }); }
};

exports.getHistory = async (req, res) => {
  try {
    const page  = Math.max(1, parseInt(req.query.page)||1);
    const limit = Math.min(50, parseInt(req.query.limit)||10);
    const [interviews, total] = await Promise.all([
      Interview.find({ userId: req.user._id }).sort({ createdAt:-1 }).skip((page-1)*limit).limit(limit)
        .select('role difficulty experience status finalReport startedAt completedAt totalQuestions'),
      Interview.countDocuments({ userId: req.user._id })
    ]);
    res.json({ interviews, pagination: { page, limit, total, totalPages: Math.ceil(total/limit) } });
  } catch(e) { res.status(500).json({ message: 'Failed to fetch history.' }); }
};

exports.deleteInterview = async (req, res) => {
  try {
    const { interviewId } = req.params;
    if (!validId(interviewId)) return res.status(400).json({ message: 'Invalid ID.' });
    const deleted = await Interview.findOneAndDelete({ _id: interviewId, userId: req.user._id });
    if (!deleted) return res.status(404).json({ message: 'Interview not found.' });
    res.json({ message: 'Interview deleted.' });
  } catch(e) { res.status(500).json({ message: 'Failed to delete.' }); }
};
