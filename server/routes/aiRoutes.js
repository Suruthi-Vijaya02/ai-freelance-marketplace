import express from 'express';
import { suggestProposal, suggestBio, parseResume, matchSkills } from '../controllers/aiController.js';
import { optionalAuthMiddleware } from '../middleware/optionalAuthMiddleware.js';

const router = express.Router();

router.post('/suggest-proposal', optionalAuthMiddleware, suggestProposal);
router.post('/suggest-bio', optionalAuthMiddleware, suggestBio);
router.post('/parse-resume', optionalAuthMiddleware, parseResume);
router.post('/match-skills', optionalAuthMiddleware, matchSkills);

export default router;
