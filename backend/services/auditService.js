import { AuditLog } from '../models/AuditLog.js';

/**
 * Service to record immutable audit log entries
 */
export async function logAuditEvent({
  user = null,
  userRole = null,
  userEmail = null,
  action,
  entity,
  entityId = null,
  ipAddress = null,
  userAgent = null,
  metadata = {},
}, session = null) {
  try {
    // Ensure sensitive secrets are stripped from metadata
    const sanitizedMetadata = { ...metadata };
    delete sanitizedMetadata.password;
    delete sanitizedMetadata.token;
    delete sanitizedMetadata.secret;

    const logEntry = new AuditLog({
      user: user?._id || user,
      userRole: userRole || user?.role,
      userEmail: userEmail || user?.email,
      action,
      entity,
      entityId: entityId ? String(entityId) : null,
      ipAddress,
      userAgent,
      metadata: sanitizedMetadata,
      timestamp: new Date(),
    });

    await logEntry.save(session ? { session } : undefined);
    return logEntry;
  } catch (error) {
    console.error('[AUDIT LOG ERROR] Failed to record audit entry:', error.message);
    // Non-blocking: audit failure should not crash main request pipeline
    return null;
  }
}
