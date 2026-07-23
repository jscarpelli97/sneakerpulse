/**
 * Portfolio / Wardrobe account vault.
 * Prefers cloud sync when DATABASE_URL is configured; otherwise device-local.
 */
export {
  cloudAvailable,
  getAccount,
  getSession,
  loginAccount,
  logoutAccount,
  newClosetItemId,
  newFitId,
  newFitPieceId,
  newHoldingId,
  registerAccount,
  resetCloudCache,
  restoreSession,
  saveCloset,
  saveFits,
  saveHoldings,
  updateUsername,
} from "@/lib/portfolio/cloudVault";
