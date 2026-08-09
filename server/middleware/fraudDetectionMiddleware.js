import { evaluateAndRecordFraud } from '../services/fraudDetectionService.js';

export async function fraudDetectionMiddleware(req, res, next) {
  try {
    // Check negative budget or price inputs
    if (req.body?.price != null && Number(req.body.price) < 0) {
      await evaluateAndRecordFraud(req, {
        eventType: 'failed_payments',
        reason: `Negative price input attempted (${req.body.price})`,
        forcePersist: true,
      });
      return res.status(400).json({
        message: 'Invalid transaction amount',
        fraudAlert: true,
      });
    }

    if (req.body?.budget != null && Number(req.body.budget) < 0) {
      await evaluateAndRecordFraud(req, {
        eventType: 'suspicious_project',
        reason: `Negative project budget attempted (${req.body.budget})`,
        forcePersist: true,
      });
      return res.status(400).json({
        message: 'Invalid project budget',
        fraudAlert: true,
      });
    }

    // Evaluate risk and log to MongoDB if high activity or anomaly detected
    const fraudResult = await evaluateAndRecordFraud(req);

    if (fraudResult.riskScore >= 90) {
      return res.status(429).json({
        message: 'Suspicious activity detected — request blocked',
        fraudAlert: true,
        riskScore: fraudResult.riskScore,
        riskLevel: fraudResult.riskLevel,
        reasons: fraudResult.reasons,
      });
    }

    return next();
  } catch (error) {
    console.error('[fraudDetectionMiddleware] Error in fraud middleware:', error);
    return next();
  }
}

