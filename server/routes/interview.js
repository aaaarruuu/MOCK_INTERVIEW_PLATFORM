const router = require('express').Router();
const c      = require('../controllers/interviewController');
const auth   = require('../middleware/auth');

router.use(auth);
router.post('/start',              c.startInterview);
router.post('/answer',             c.submitAnswer);
router.get('/history',             c.getHistory);
router.get('/result/:interviewId', c.getResult);
router.delete('/:interviewId',     c.deleteInterview);

module.exports = router;
