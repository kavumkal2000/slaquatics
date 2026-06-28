type IntegrationEnv = Record<string, string | undefined>;

export function integrationStatus(env: IntegrationEnv = process.env) {
  const reviewLinksConfigured = Boolean(env.GOOGLE_REVIEW_URL || env.FACEBOOK_REVIEW_URL);
  const socialAutomationConfigured = Boolean(
    env.SOCIAL_AUTOMATION_WEBHOOK_URL ||
    env.SOCIAL_FACEBOOK_WEBHOOK_URL ||
    env.SOCIAL_INSTAGRAM_WEBHOOK_URL ||
    env.SOCIAL_X_WEBHOOK_URL ||
    env.SOCIAL_TIKTOK_WEBHOOK_URL
  );

  return {
    stripeConfigured: Boolean(env.STRIPE_SECRET_KEY),
    stripeWebhookConfigured: Boolean(env.STRIPE_WEBHOOK_SECRET),
    smsConfigured: Boolean(env.TWILIO_ACCOUNT_SID && env.TWILIO_AUTH_TOKEN && env.TWILIO_FROM_NUMBER),
    emailConfigured: Boolean(env.RESEND_API_KEY && env.RESEND_FROM_EMAIL),
    ownerUpdateConfigured: Boolean(env.OWNER_UPDATE_EMAILS || env.BOOKING_ALERT_EMAILS),
    ownerWeeklyDigestEnabled: !/^false$/i.test(env.OWNER_WEEKLY_DIGEST_ENABLED || 'true'),
    reviewLinksConfigured,
    autoSendReviewRequests: /^true$/i.test(env.AUTO_SEND_REVIEW_REQUESTS || 'false'),
    reviewChannel: String(env.REVIEW_REQUEST_CHANNEL || 'sms').toLowerCase() === 'email' ? 'email' : 'sms',
    socialAutomationConfigured
  };
}
