import express from 'express';
import { testGemini } from '../controllers/geminiController.js';
import { suggestProposal, suggestBio, parseResume, matchSkills } from '../controllers/aiController.js';
import { optionalAuthMiddleware } from '../middleware/optionalAuthMiddleware.js';

const router = express.Router();

router.get('/test', testGemini);
router.post('/suggest-proposal', optionalAuthMiddleware, suggestProposal);
router.post('/suggest-bio', optionalAuthMiddleware, suggestBio);
router.post('/parse-resume', optionalAuthMiddleware, parseResume);
router.post('/match-skills', optionalAuthMiddleware, matchSkills);

export default router;