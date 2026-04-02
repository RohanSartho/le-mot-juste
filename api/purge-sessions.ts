import type { VercelRequest, VercelResponse } from '@vercel/node'
import { initializeApp, getApps, cert } from 'firebase-admin/app'
import { getFirestore } from 'firebase-admin/firestore'

// Lazy-init Firebase Admin (safe for multiple cold starts in serverless)
function getAdminDb() {
  if (!getApps().length) {
    const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT ?? '{}')
    initializeApp({ credential: cert(serviceAccount) })
  }
  return getFirestore()
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Allow Vercel Cron (GET with cron header) and manual POST with secret
  const cronHeader = req.headers['x-vercel-cron']
  const authHeader = req.headers['authorization']
  const cronSecret = process.env.CRON_SECRET

  const isCron = !!cronHeader
  const isAuthorized = cronSecret && authHeader === `Bearer ${cronSecret}`

  if (!isCron && !isAuthorized) {
    return res.status(401).json({ error: 'Unauthorized' })
  }

  try {
    const db = getAdminDb()

    // Sessions expire 2h after creation, so expires_at < (now - 22h) means session is 24h+ old
    const cutoff = new Date(Date.now() - 22 * 60 * 60 * 1000).toISOString()

    const snap = await db
      .collection('game_sessions')
      .where('expires_at', '<', cutoff)
      .get()

    if (snap.empty) {
      return res.status(200).json({ deleted: 0, message: 'Nothing to purge' })
    }

    // Firestore batch limit is 500 — chunk if needed
    const CHUNK = 500
    let deleted = 0
    for (let i = 0; i < snap.docs.length; i += CHUNK) {
      const batch = db.batch()
      snap.docs.slice(i, i + CHUNK).forEach(doc => batch.delete(doc.ref))
      await batch.commit()
      deleted += Math.min(CHUNK, snap.docs.length - i)
    }

    console.log(`[purge-sessions] Deleted ${deleted} sessions older than 24h`)
    return res.status(200).json({ deleted })
  } catch (err) {
    console.error('[purge-sessions] Error:', err)
    return res.status(500).json({ error: 'Purge failed', detail: String(err) })
  }
}
