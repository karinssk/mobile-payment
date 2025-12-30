const Omise = require('omise');

// Initialize Omise with keys
const omise = Omise({
  publicKey: process.env.OMISE_PUBLIC_KEY,
  secretKey: process.env.OMISE_SECRET_KEY,
});

/**
 * Create a payment source (PromptPay)
 * @param {number} amount - Amount in THB (will be converted to satang)
 * @param {string} type - Payment type (e.g., 'promptpay')
 */
const createSource = async (amount, type = 'promptpay') => {
  try {
    const source = await omise.sources.create({
      type: type,
      amount: Math.round(amount * 100), // Convert to satang
      currency: 'thb',
    });
    return { success: true, source };
  } catch (error) {
    console.error('Omise create source error:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Create a charge with source
 * @param {number} amount - Amount in THB
 * @param {string} sourceId - Source ID from createSource
 * @param {string} description - Payment description
 */
const createCharge = async (amount, sourceId, description = 'Payment') => {
  try {
    const charge = await omise.charges.create({
      amount: Math.round(amount * 100), // Convert to satang
      currency: 'thb',
      source: sourceId,
      description: description,
    });
    return { success: true, charge };
  } catch (error) {
    console.error('Omise create charge error:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Get charge status
 * @param {string} chargeId - Charge ID
 */
const getCharge = async (chargeId) => {
  try {
    const charge = await omise.charges.retrieve(chargeId);
    return { success: true, charge };
  } catch (error) {
    console.error('Omise get charge error:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Create PromptPay QR for payment
 * @param {number} amount - Amount in THB
 * @param {string} description - Payment description
 * @returns {Promise<{success: boolean, qrCodeUrl?: string, chargeId?: string, error?: string}>}
 */
const createPromptPayQR = async (amount, description = 'ชำระค่างวด') => {
  try {
    // Create source
    const sourceResult = await createSource(amount, 'promptpay');
    if (!sourceResult.success) {
      return { success: false, error: sourceResult.error };
    }

    // Create charge with source
    const chargeResult = await createCharge(amount, sourceResult.source.id, description);
    if (!chargeResult.success) {
      return { success: false, error: chargeResult.error };
    }

    const charge = chargeResult.charge;
    
    // Get the scannable code (QR Code image URL)
    const qrCodeUrl = charge.source?.scannable_code?.image?.download_uri;
    
    return {
      success: true,
      chargeId: charge.id,
      qrCodeUrl: qrCodeUrl,
      expiresAt: charge.source?.scannable_code?.expires_at,
    };
  } catch (error) {
    console.error('Create PromptPay QR error:', error);
    return { success: false, error: error.message };
  }
};

module.exports = {
  omise,
  createSource,
  createCharge,
  getCharge,
  createPromptPayQR,
};
