import { Request, Response } from 'express';
import { SystemSetting } from '../models/SystemSetting';
import { getIO } from '../services/socketService';
import { translateToTamil, translateToEnglish } from '../utils/translate';

// ─── ANNOUNCEMENT HELPERS ────────────────────────────────────────────────────

/**
 * Returns the currently active announcement object, or null if none is active.
 */
export const getActiveAnnouncementValue = async (): Promise<{ text: string; published_at: string } | null> => {
  try {
    const setting = await SystemSetting.findOne({ key: 'active_announcement' });
    if (!setting || !setting.value?.is_active) return null;
    return setting.value;
  } catch {
    return null;
  }
};

/**
 * GET /admin/announcement  — returns current active announcement (admin view, includes status)
 * GET /patient/announcement — same endpoint, same data
 */
export const getAnnouncement = async (req: Request, res: Response) => {
  try {
    const setting = await SystemSetting.findOne({ key: 'active_announcement' });
    if (!setting || !setting.value?.is_active) {
      return res.status(200).json({ is_active: false, text: '', text_en: '', text_ta: '', published_at: null });
    }

    const val = setting.value;

    // Ensure text_en is populated from legacy text field
    if (!val.text_en && val.text) {
      val.text_en = val.text;
    }

    // Clean up bad translations: if text_ta is the same as English, it means
    // a failed translation stored English as Tamil — clear it so frontend can re-translate
    if (val.text_ta && (val.text_ta === val.text_en || val.text_ta === val.text)) {
      val.text_ta = '';
    }

    // Persist cleanup
    await SystemSetting.findOneAndUpdate(
      { key: 'active_announcement' },
      { value: val },
      { new: true }
    );

    return res.status(200).json(val);
  } catch (error: any) {
    console.error('Get Announcement Error:', error);
    return res.status(500).json({ message: 'Error retrieving announcement.' });
  }
};

/**
 * POST /admin/announcement/publish  — publish or update active announcement
 * Body: { text_en: string, text_ta?: string } OR legacy { text: string }
 */
export const publishAnnouncement = async (req: Request, res: Response) => {
  try {
    const { text, text_en, text_ta } = req.body;

    // Support both old { text } and new { text_en, text_ta } payload
    const englishText = (text_en || text || '').trim();
    let tamilText = (text_ta || '').trim();

    if (!englishText && !tamilText) {
      return res.status(400).json({ message: 'At least one language announcement text is required.' });
    }

    // Auto-translate if only one language is provided
    let finalEnglish = englishText;
    let finalTamil = tamilText;

    if (englishText && !tamilText) {
      finalTamil = await translateToTamil(englishText);
    } else if (tamilText && !englishText) {
      finalEnglish = await translateToEnglish(tamilText);
    }

    const announcementValue = {
      is_active: true,
      text: finalEnglish || finalTamil,  // backward-compat fallback
      text_en: finalEnglish,
      text_ta: finalTamil,
      published_at: new Date().toISOString(),
    };

    await SystemSetting.findOneAndUpdate(
      { key: 'active_announcement' },
      { value: announcementValue },
      { upsert: true, new: true }
    );

    // Broadcast to ALL connected clients (patients + admin)
    try {
      const io = getIO();
      io.emit('announcement_updated', announcementValue);
    } catch (e) {
      console.warn('Socket emit warning (announcement):', e);
    }

    return res.status(200).json({
      message: 'Announcement published successfully.',
      announcement: announcementValue,
    });
  } catch (error: any) {
    console.error('Publish Announcement Error:', error);
    return res.status(500).json({ message: 'Error publishing announcement.' });
  }
};

/**
 * POST /admin/announcement/end  — deactivate the current announcement
 */
export const endAnnouncement = async (req: Request, res: Response) => {
  try {
    const announcementValue = {
      is_active: false,
      text: '',
      text_en: '',
      text_ta: '',
      published_at: null,
    };

    await SystemSetting.findOneAndUpdate(
      { key: 'active_announcement' },
      { value: announcementValue },
      { upsert: true, new: true }
    );

    // Broadcast to ALL clients so patient dashboards clear immediately
    try {
      const io = getIO();
      io.emit('announcement_updated', announcementValue);
    } catch (e) {
      console.warn('Socket emit warning (end announcement):', e);
    }

    return res.status(200).json({ message: 'Announcement ended successfully.', announcement: announcementValue });
  } catch (error: any) {
    console.error('End Announcement Error:', error);
    return res.status(500).json({ message: 'Error ending announcement.' });
  }
};

export const getOrderingLockedStatus = async (): Promise<boolean> => {
  try {
    const setting = await SystemSetting.findOne({ key: 'is_ordering_locked' });
    return setting ? Boolean(setting.value) : false;
  } catch (err) {
    console.error('Error reading ordering lock setting:', err);
    return false;
  }
};

export const getSystemStatus = async (req: Request, res: Response) => {
  try {
    const is_ordering_locked = await getOrderingLockedStatus();
    return res.status(200).json({ is_ordering_locked });
  } catch (error: any) {
    console.error('Get System Status Error:', error);
    return res.status(500).json({ message: 'Error retrieving system status.' });
  }
};

export const toggleOrderingLock = async (req: Request, res: Response) => {
  try {
    const { is_ordering_locked } = req.body;

    let targetValue: boolean;
    if (typeof is_ordering_locked === 'boolean') {
      targetValue = is_ordering_locked;
    } else {
      const current = await getOrderingLockedStatus();
      targetValue = !current;
    }

    await SystemSetting.findOneAndUpdate(
      { key: 'is_ordering_locked' },
      { value: targetValue },
      { upsert: true, new: true }
    );

    // Broadcast to all socket clients (patients & admins)
    try {
      const io = getIO();
      io.emit('ordering_status_changed', { is_ordering_locked: targetValue });
    } catch (e) {
      console.warn('Socket emit warning:', e);
    }

    return res.status(200).json({
      message: `Ordering has been ${targetValue ? 'LOCKED (Closed)' : 'UNLOCKED (Open)'}.`,
      is_ordering_locked: targetValue,
    });
  } catch (error: any) {
    console.error('Toggle Ordering Lock Error:', error);
    return res.status(500).json({ message: 'Error updating ordering lock status.' });
  }
};
