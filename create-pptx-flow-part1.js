const pptxgen = require('pptxgenjs');
const fs = require('fs');
const path = require('path');

const OUTPUT_DIR = path.join(__dirname, 'dokumen');

// ─── Theme ───────────────────────────────────────────────────────────────────
const THEME = {
  primary:    '0D9488',
  primaryDark:'0F766E',
  primaryLight:'99F6E4',
  accent:     '14B8A6',
  dark:       '134E4A',
  bgLight:    'F0FDFA',
  bgWhite:    'FFFFFF',
  bgGray:     'F8FAFC',
  textDark:   '1E293B',
  textMid:    '475569',
  textLight:  '94A3B8',
  roleAdmin:     '7C3AED',
  roleKaryawan:  '2563EB',
  roleDokter:    '059669',
  roleKasir:     'D97706',
};

const W = 13.33;
const H = 7.5;
const HEADER_H = 0.75;
const FOOTER_H = 0.35;
const FOOTER_Y = H - FOOTER_H;
const CONTENT_TOP = HEADER_H + 0.28;
const CONTENT_BOTTOM = FOOTER_Y - 0.12;

const ROLE_COLORS = {
  admin:     { primary: THEME.roleAdmin,     light: 'EDE9FE', dark: '4C1D95', accent: '8B5CF6', name: 'Admin' },
  karyawan:  { primary: THEME.roleKaryawan, light: 'DBEAFE', dark: '1E3A8A', accent: '3B82F6', name: 'Karyawan' },
  dokter:    { primary: THEME.roleDokter,   light: 'D1FAE5', dark: '064E3B', accent: '10B981', name: 'Dokter' },
  kasir:     { primary: THEME.roleKasir,    light: 'FEF3C7', dark: '92400E', accent: 'F59E0B', name: 'Kasir' },
};

module.exports = { pptxgen, fs, path, OUTPUT_DIR, THEME, W, H, HEADER_H, FOOTER_H, FOOTER_Y, CONTENT_TOP, CONTENT_BOTTOM, CONTENT_H, ROLE_COLORS };
