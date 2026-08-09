import FraudEvent from '../models/FraudEvent.js';
import User from '../models/User.js';
import Proposal from '../models/Proposal.js';
import { predictFraudRiskTF } from './tfjsService.js';

// In-memory request tracking map for fast real-time middleware evaluation
const userActivityMap = new Map();
const WINDOW_MS = 60_000; // 1 minute window

/**
 * Records activity and evaluates fraud risk for a request or action.
 * 
 * @param {Object} req - Express request object
 * @param {Object} options
 * @param {string} options.eventType - Type of event ('rapid_requests', 'excessive_proposals', 'suspicious_project', 'failed_payments')
 * @param {string} [options.reason] - Human readable reason
 * @param {Object} [options.additionalMetadata]
 */
export async function evaluateAndRecordFraud(req, options = {}) {
  const userId = req.user?.id || req.user?._id;
  const ipAddress = req.ip || req.headers['x-forwarded-for'] || '127.0.0.1';
  const eventType = options.eventType || 'rapid_requests';
  
  const now = Date.now();
  const trackingKey = userId ? `user_${userId}` : `ip_${ipAddress}`;

  let activity = userActivityMap.get(trackingKey) || {
    count: 0,
    start: now,
    proposalsCount: 0,
    paymentFailures: 0,
  };

  if (now - activity.start > WINDOW_MS) {
    activity = { count: 1, start: now, proposalsCount: 0, paymentFailures: 0 };
  } else {
    activity.count += 1;
  }

  if (eventType === 'excessive_proposals') activity.proposalsCount += 1;
  if (eventType === 'failed_payments') activity.paymentFailures += 1;

  userActivityMap.set(trackingKey, activity);

  // Retrieve user details if authenticated
  let dbUser = null;
  let accountAgeDays = 30;
  if (userId) {
    dbUser = await User.findById(userId).catch(() => null);
    if (dbUser?.createdAt) {
      accountAgeDays = Math.max(0, Math.floor((now - new Date(dbUser.createdAt).getTime()) / (1000 * 60 * 60 * 24)));
    }
  }

  // Detect suspicious keywords in request body if available
  const bodyString = JSON.stringify(req.body || {}).toLowerCase();
  const suspiciousKeywords = ['script', 'select *', 'drop table', 'bypassed', 'free money', 'crack', 'exploit'];
  const hasSuspiciousKeywords = suspiciousKeywords.some(kw => bodyString.includes(kw));

  // Run TensorFlow.js Machine Learning Fraud Risk Model
  const tfResult = await predictFraudRiskTF({
    requestRate: activity.count,
    proposalsLastHour: activity.proposalsCount,
    paymentFailures: activity.paymentFailures,
    accountAgeDays,
    keywordRiskScore: hasSuspiciousKeywords ? 1 : 0,
  });

  const reasons = [];
  if (activity.count > 45) {
    reasons.push(`${activity.count} HTTP requests in 60 seconds (rapid repeated requests)`);
  }
  if (activity.proposalsCount > 4) {
    reasons.push(`${activity.proposalsCount} proposals submitted in brief time window`);
  }
  if (activity.paymentFailures > 1) {
    reasons.push(`Multiple failed transaction attempts recorded (${activity.paymentFailures})`);
  }
  if (hasSuspiciousKeywords) {
    reasons.push('Suspicious or malicious keywords detected in request payload');
  }
  if (options.reason) {
    reasons.push(options.reason);
  }
  if (reasons.length === 0) {
    reasons.push(`Suspicious pattern detected for activity: ${eventType}`);
  }

  // Persist FraudEvent in MongoDB if risk score indicates non-trivial risk (>= 35) or explicitly requested
  if (tfResult.mlRiskScore >= 35 || options.forcePersist) {
    try {
      const fraudDoc = await FraudEvent.create({
        user: userId || null,
        userName: dbUser?.name || req.body?.name || 'Anonymous User',
        userEmail: dbUser?.email || req.body?.email || '',
        ipAddress,
        eventType,
        riskScore: tfResult.mlRiskScore,
        riskLevel: tfResult.riskLevel,
        reasons,
        mlConfidence: tfResult.mlConfidence,
        metadata: {
          path: req.originalUrl || req.path,
          method: req.method,
          requestCount: activity.count,
          ...options.additionalMetadata,
        },
        status: 'open',
      });

      // Flag user in DB if risk score is high/critical
      if (dbUser && tfResult.mlRiskScore >= 60 && !dbUser.isFlagged) {
        dbUser.isFlagged = true;
        dbUser.status = 'flagged';
        await dbUser.save();
      }

      return {
        fraudAlert: true,
        riskScore: tfResult.mlRiskScore,
        riskLevel: tfResult.riskLevel,
        reasons,
        eventId: fraudDoc._id,
      };
    } catch (err) {
      console.error('[fraudDetectionService] Failed to save FraudEvent to MongoDB:', err.message);
    }
  }

  return {
    fraudAlert: tfResult.mlRiskScore >= 50,
    riskScore: tfResult.mlRiskScore,
    riskLevel: tfResult.riskLevel,
    reasons,
  };
}

/**
 * Retrieves list of all fraud events stored in MongoDB for the Admin Dashboard.
 */
export async function getStoredFraudAlerts() {
  try {
    const events = await FraudEvent.find()
      .populate('user', 'name email status isFlagged')
      .sort({ createdAt: -1 })
      .limit(100);

    return events.map((ev) => ({
      id: ev._id,
      _id: ev._id,
      userId: ev.user?._id || ev.user,
      user: ev.user?.name || ev.userName || 'Anonymous User',
      userEmail: ev.user?.email || ev.userEmail || '',
      type: ev.eventType?.replace('_', ' ').toUpperCase() || 'SUSPICIOUS ACTIVITY',
      eventType: ev.eventType,
      severity: ev.riskLevel.toLowerCase(),
      riskLevel: ev.riskLevel,
      riskScore: ev.riskScore,
      reasons: ev.reasons || [],
      mlConfidence: ev.mlConfidence || 0.85,
      ipAddress: ev.ipAddress,
      timestamp: ev.createdAt,
      status: ev.status,
      metadata: ev.metadata,
    }));
  } catch (err) {
    console.error('[fraudDetectionService] getStoredFraudAlerts error:', err.message);
    return [];
  }
}

export default { evaluateAndRecordFraud, getStoredFraudAlerts };
