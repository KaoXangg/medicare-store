import { query } from '../config/db.js';

const DEFAULTS = {
  page_contact_hero: 'https://images.unsplash.com/photo-1587351021753-97b9bfaa702e?auto=format&fit=crop&w=1920&h=820&q=90',
  page_contact_side: 'https://images.unsplash.com/photo-1631217868264-e5b90bb7e133?auto=format&fit=crop&w=1200&h=900&q=90',
  page_about_hero: 'https://images.unsplash.com/photo-1579684385127-1ef15d508118?auto=format&fit=crop&w=1920&h=900&q=90',
  page_about_team: 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?auto=format&fit=crop&w=1200&h=900&q=90',
  page_about_lab: 'https://images.unsplash.com/photo-1530026405186-ed1f139313f3?auto=format&fit=crop&w=1200&h=800&q=90',
  page_returnPolicy_hero: 'https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?auto=format&fit=crop&w=1920&h=820&q=90',
  page_warranty_hero: 'https://images.unsplash.com/photo-1584982751601-97dcc096659c?auto=format&fit=crop&w=1920&h=820&q=90',
};

const PAGE_META = [
  { page: 'contact', slot: 'hero', label: 'Liên hệ — Ảnh banner' },
  { page: 'contact', slot: 'side', label: 'Liên hệ — Ảnh phụ' },
  { page: 'about', slot: 'hero', label: 'Giới thiệu — Banner' },
  { page: 'about', slot: 'team', label: 'Giới thiệu — Đội ngũ' },
  { page: 'about', slot: 'lab', label: 'Giới thiệu — Thiết bị' },
  { page: 'returnPolicy', slot: 'hero', label: 'Chính sách đổi trả — Banner' },
  { page: 'warranty', slot: 'hero', label: 'Bảo hành — Banner' },
];

const settingKey = (page, slot) => `page_${page}_${slot}`;

async function readSetting(key) {
  try {
    const result = await query(
      'SELECT SettingValue FROM SiteSettings WHERE SettingKey = @key',
      { key }
    );
    return result.recordset[0]?.SettingValue || DEFAULTS[key] || null;
  } catch {
    return DEFAULTS[key] || null;
  }
}

async function writeSetting(key, value) {
  await query(
    `INSERT INTO SiteSettings (SettingKey, SettingValue, UpdatedAt)
     VALUES (@key, @value, GETUTCDATE())
     ON CONFLICT (SettingKey) DO UPDATE SET SettingValue = EXCLUDED.SettingValue, UpdatedAt = GETUTCDATE()`,
    { key, value }
  );
}

export const getPageImages = async (req, res, next) => {
  try {
    const [contactHero, contactSide, aboutHero, aboutTeam, aboutLab, returnPolicyHero, warrantyHero] = await Promise.all([
      readSetting('page_contact_hero'),
      readSetting('page_contact_side'),
      readSetting('page_about_hero'),
      readSetting('page_about_team'),
      readSetting('page_about_lab'),
      readSetting('page_returnPolicy_hero'),
      readSetting('page_warranty_hero'),
    ]);
    res.json({
      success: true,
      data: {
        contact: { hero: contactHero, side: contactSide },
        about: { hero: aboutHero, team: aboutTeam, lab: aboutLab },
        returnPolicy: { hero: returnPolicyHero },
        warranty: { hero: warrantyHero },
      },
    });
  } catch (err) {
    next(err);
  }
};

export const getPageImagesAdmin = async (req, res, next) => {
  try {
    const images = await getPageImagesData();
    res.json({
      success: true,
      data: {
        images,
        meta: PAGE_META,
      },
    });
  } catch (err) {
    next(err);
  }
};

async function getPageImagesData() {
  const entries = await Promise.all(
    PAGE_META.map(async (m) => ({
      ...m,
      key: settingKey(m.page, m.slot),
      url: await readSetting(settingKey(m.page, m.slot)),
      defaultUrl: DEFAULTS[settingKey(m.page, m.slot)],
    }))
  );
  return entries;
}

export const updatePageImage = async (req, res, next) => {
  try {
    const { page, slot } = req.params;
    const key = settingKey(page, slot);
    if (!DEFAULTS[key] && !PAGE_META.some((m) => m.page === page && m.slot === slot)) {
      return res.status(400).json({ success: false, message: 'Ảnh trang không hợp lệ' });
    }

    let imageUrl = null;
    if (req.body?.imageUrl?.trim()) {
      const u = req.body.imageUrl.trim();
      if (/^https?:\/\//i.test(u) || u.startsWith('/uploads/')) imageUrl = u;
    }
    if (req.file) imageUrl = `/uploads/pages/${req.file.filename}`;
    if (!imageUrl) {
      return res.status(400).json({ success: false, message: 'Cần URL ảnh hoặc file upload' });
    }

    await writeSetting(key, imageUrl);
    res.json({ success: true, data: { page, slot, url: imageUrl }, message: 'Đã cập nhật ảnh trang' });
  } catch (err) {
    next(err);
  }
};