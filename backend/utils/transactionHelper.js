import mongoose from 'mongoose';

/**
 * Executes an operation within a MongoDB transaction.
 * Gracefully detects replica set capability, supports rollbacks on error,
 * and falls back cleanly if running in a standalone deployment without replica sets.
 *
 * @param {Function} operationFn - Function receiving (session) and returning a Promise
 * @returns {Promise<any>}
 */
export async function runInTransaction(operationFn) {
  const topologyType = mongoose.connection?.client?.topology?.description?.type || '';
  const supportsTransactions =
    topologyType.includes('ReplicaSet') ||
    topologyType === 'ReplicaSetWithPrimary' ||
    topologyType === 'Sharded';

  if (!supportsTransactions) {
    // Graceful fallback for non-replica set standalone instances
    return await operationFn(null);
  }

  const session = await mongoose.startSession();
  try {
    session.startTransaction();
    const result = await operationFn(session);
    await session.commitTransaction();
    return result;
  } catch (error) {
    if (session.inTransaction()) {
      try {
        await session.abortTransaction();
      } catch (abortErr) {
        console.error('[TRANSACTION] Error during transaction abort:', abortErr.message);
      }
    }
    throw error;
  } finally {
    session.endSession();
  }
}
