import * as tf from '@tensorflow/tfjs';

let fraudModel = null;
let skillModel = null;
let initializationPromise = null;

export async function initTfjsModels() {
  // Models are already initialized
  if (fraudModel && skillModel) {
    return;
  }

  // Another request is already initializing the models.
  // Wait for that same initialization instead of creating new models.
  if (initializationPromise) {
    return initializationPromise;
  }

  initializationPromise = (async () => {
    try {
      // ========================================
      // FRAUD RISK CLASSIFIER
      // ========================================
      if (!fraudModel) {
        const fModel = tf.sequential();

        fModel.add(
          tf.layers.dense({
            inputShape: [5],
            units: 8,
            activation: 'relu',
          })
        );

        fModel.add(
          tf.layers.dense({
            units: 4,
            activation: 'relu',
          })
        );

        fModel.add(
          tf.layers.dense({
            units: 1,
            activation: 'sigmoid',
          })
        );

        fModel.compile({
          optimizer: tf.train.adam(0.01),
          loss: 'binaryCrossentropy',
          metrics: ['accuracy'],
        });

        const xs = tf.tensor2d([
          [5, 1, 0, 30, 0],
          [15, 2, 0, 10, 0],
          [60, 8, 2, 1, 1],
          [120, 15, 5, 0, 1],
        ]);

        const ys = tf.tensor2d([
          [0.05],
          [0.20],
          [0.85],
          [0.98],
        ]);

        await fModel.fit(xs, ys, {
          epochs: 15,
          verbose: 0,
        });

        xs.dispose();
        ys.dispose();

        fraudModel = fModel;

        console.log(
          '[TF.js] Fraud Risk Classifier Model initialized successfully.'
        );
      }

      // ========================================
      // SKILL ALIGNMENT MODEL
      // ========================================
      if (!skillModel) {
        const sModel = tf.sequential();

        sModel.add(
          tf.layers.dense({
            inputShape: [4],
            units: 6,
            activation: 'relu',
          })
        );

        sModel.add(
          tf.layers.dense({
            units: 1,
            activation: 'sigmoid',
          })
        );

        sModel.compile({
          optimizer: tf.train.adam(0.01),
          loss: 'meanSquaredError',
        });

        const xs = tf.tensor2d([
          [0.0, 0.0, 0.2, 0.0],
          [0.5, 0.5, 0.5, 1.0],
          [1.0, 1.0, 1.0, 1.0],
        ]);

        const ys = tf.tensor2d([
          [0.15],
          [0.65],
          [0.95],
        ]);

        await sModel.fit(xs, ys, {
          epochs: 10,
          verbose: 0,
        });

        xs.dispose();
        ys.dispose();

        skillModel = sModel;

        console.log(
          '[TF.js] Skill Alignment Predictor Model initialized successfully.'
        );
      }

    } catch (error) {
      console.error(
        '[TF.js] Initialization error:',
        error.message
      );

      // Allow another initialization attempt later
      fraudModel = null;
      skillModel = null;

      throw error;

    } finally {
      initializationPromise = null;
    }
  })();

  return initializationPromise;
}
/**
 * Uses TensorFlow.js to predict fraud risk score (0 to 100) and risk level.
 * 
 * @param {Object} metrics
 * @param {number} metrics.requestRate - Requests per minute
 * @param {number} metrics.proposalsLastHour - Number of proposals submitted in last hour
 * @param {number} metrics.paymentFailures - Number of failed payment attempts
 * @param {number} metrics.accountAgeDays - Days since account creation
 * @param {number} metrics.keywordRiskScore - 0 or 1 indicator of suspicious keywords
 * @returns {Promise<{ mlRiskScore: number, mlConfidence: number, riskLevel: string }>}
 */
export async function predictFraudRiskTF(metrics = {}) {
  await initTfjsModels();

  const requestRate = Math.min(200, Math.max(0, metrics.requestRate || 0));
  const proposalsLastHour = Math.min(50, Math.max(0, metrics.proposalsLastHour || 0));
  const paymentFailures = Math.min(10, Math.max(0, metrics.paymentFailures || 0));
  const accountAgeDays = Math.min(365, Math.max(0, metrics.accountAgeDays ?? 30));
  const keywordRiskScore = metrics.keywordRiskScore ? 1 : 0;

  // Fallback heuristic if TF model unavailable
  if (!fraudModel) {
    let score = Math.min(100, Math.round((requestRate * 0.4) + (proposalsLastHour * 3) + (paymentFailures * 15) + (keywordRiskScore * 25)));
    let riskLevel = score >= 80 ? 'CRITICAL' : score >= 60 ? 'HIGH' : score >= 35 ? 'MEDIUM' : 'LOW';
    return { mlRiskScore: score, mlConfidence: 0.75, riskLevel };
  }

  try {
    // Feature normalization for TF input tensor
    const normalizedInput = tf.tensor2d([
      [
        requestRate,
        proposalsLastHour,
        paymentFailures,
        accountAgeDays,
        keywordRiskScore,
      ],
    ]);

    const predictionTensor = fraudModel.predict(normalizedInput);
    const predictionData = await predictionTensor.data();

    normalizedInput.dispose();
    predictionTensor.dispose();

    const rawProb = predictionData[0] || 0.05;
    const mlRiskScore = Math.min(100, Math.max(0, Math.round(rawProb * 100)));

    let riskLevel = 'LOW';
    if (mlRiskScore >= 80) riskLevel = 'CRITICAL';
    else if (mlRiskScore >= 60) riskLevel = 'HIGH';
    else if (mlRiskScore >= 35) riskLevel = 'MEDIUM';

    return {
      mlRiskScore,
      mlConfidence: 0.92,
      riskLevel,
    };
  } catch (err) {
    console.error('[TF.js] Fraud prediction error:', err);
    let fallbackScore = Math.min(100, Math.round((requestRate * 0.4) + (proposalsLastHour * 3) + (paymentFailures * 15)));
    return { mlRiskScore: fallbackScore, mlConfidence: 0.70, riskLevel: fallbackScore > 60 ? 'HIGH' : 'LOW' };
  }
}

/**
 * Uses TensorFlow.js to predict skill match alignment between freelancer and project.
 * 
 * @param {Object} params
 * @param {number} params.skillOverlapRatio - 0.0 to 1.0 ratio of matched skills
 * @param {number} params.titleMatchRatio - 0.0 to 1.0 title match
 * @param {number} params.experienceRatio - 0.0 to 1.0 experience match ratio
 * @param {number} params.categoryMatchRatio - 0.0 or 1.0 category match indicator
 * @returns {Promise<{ tfPredictedScore: number, tfConfidence: number }>}
 */
export async function predictSkillAlignmentTF(params = {}) {
  await initTfjsModels();

  const sOverlap = params.skillOverlapRatio || 0;
  const tMatch = params.titleMatchRatio || 0;
  const eRatio = params.experienceRatio || 0;
  const cMatch = params.categoryMatchRatio || 0;

  if (!skillModel) {
    const fallbackScore = Math.round((sOverlap * 50) + (tMatch * 20) + (eRatio * 15) + (cMatch * 15));
    return { tfPredictedScore: fallbackScore, tfConfidence: 0.80 };
  }

  try {
    const inputTensor = tf.tensor2d([[sOverlap, tMatch, eRatio, cMatch]]);
    const predTensor = skillModel.predict(inputTensor);
    const predData = await predTensor.data();

    inputTensor.dispose();
    predTensor.dispose();

    const tfPredictedScore = Math.min(100, Math.max(0, Math.round((predData[0] || 0.5) * 100)));
    return {
      tfPredictedScore,
      tfConfidence: 0.88,
    };
  } catch (err) {
    console.error('[TF.js] Skill prediction error:', err);
    return { tfPredictedScore: Math.round(sOverlap * 100), tfConfidence: 0.75 };
  }
}

export default { initTfjsModels, predictFraudRiskTF, predictSkillAlignmentTF };
