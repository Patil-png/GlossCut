/**
 * DM Sans (body) + Syne (display titles only).
 * Font families must match useFonts in App.jsx.
 */

const LH_HEADING = 1.4;
const LH_BODY = 1.6;
const TRACK_HEADING = -0.02;

export const Typography = {
  FONT_REG: { fontFamily: 'PlusJakartaSans_400Regular' },
  FONT_MED: { fontFamily: 'PlusJakartaSans_500Medium' },
  FONT_BOLD: { fontFamily: 'PlusJakartaSans_700Bold' },
  /** Use where “black” weight was used — Plus Jakarta 800 max */
  FONT_BLACK: { fontFamily: 'PlusJakartaSans_800ExtraBold' },
  FONT_SEMI: { fontFamily: 'PlusJakartaSans_600SemiBold' },

  FONT_DISPLAY: { fontFamily: 'PlusJakartaSans_800ExtraBold' },
  FONT_SCREEN_TITLE: { fontFamily: 'PlusJakartaSans_700Bold' },

  DISPLAY_TITLE: {
    fontFamily: 'PlusJakartaSans_800ExtraBold',
    fontSize: 28,
    lineHeight: 28 * LH_HEADING,
    letterSpacing: TRACK_HEADING,
    color: '#1A1A1A'
  },
  SCREEN_TITLE: {
    fontFamily: 'PlusJakartaSans_700Bold',
    fontSize: 22,
    lineHeight: 22 * LH_HEADING,
    letterSpacing: TRACK_HEADING,
    color: '#1A1A1A'
  },
  APP_BAR_TITLE: {
    fontFamily: 'PlusJakartaSans_700Bold',
    fontSize: 18,
    lineHeight: 18 * LH_HEADING,
    letterSpacing: TRACK_HEADING,
    color: '#1A1A1A'
  },
  SECTION_HEADER: {
    fontFamily: 'PlusJakartaSans_700Bold',
    fontSize: 19,
    lineHeight: 19 * LH_HEADING,
    letterSpacing: -0.4,
    color: '#050505'
  },
  CARD_TITLE: {
    fontFamily: 'PlusJakartaSans_700Bold',
    fontSize: 14,
    lineHeight: 14 * LH_HEADING,
    letterSpacing: TRACK_HEADING,
    color: '#1A1A1A'
  },
  TAG_BADGE: {
    fontFamily: 'PlusJakartaSans_700Bold',
    fontSize: 10,
    lineHeight: 10 * LH_HEADING,
    color: '#606058'
  },
  BODY: {
    fontFamily: 'PlusJakartaSans_400Regular',
    fontSize: 13,
    lineHeight: 13 * LH_BODY,
    letterSpacing: 0,
    color: '#606058'
  },
  SMALL_LABEL: {
    fontFamily: 'PlusJakartaSans_500Medium',
    fontSize: 11,
    lineHeight: 11 * LH_BODY,
    color: '#A0A09A'
  },
  MICRO_LABEL: {
    fontFamily: 'PlusJakartaSans_500Medium',
    fontSize: 9,
    lineHeight: 9 * LH_BODY,
    color: '#B0AFA8'
  },
  PRICE_NUMBER: {
    fontFamily: 'PlusJakartaSans_700Bold',
    fontSize: 17,
    lineHeight: 17 * LH_HEADING,
    color: '#1A1A1A'
  },
  STAT_LARGE: {
    fontFamily: 'PlusJakartaSans_700Bold',
    fontSize: 22,
    lineHeight: 22 * LH_HEADING,
    color: '#1A1A1A'
  },
  BUTTON: {
    fontFamily: 'PlusJakartaSans_700Bold',
    fontSize: 14,
    lineHeight: 14 * LH_HEADING,
    color: '#FFFFFF'
  },
  PLACEHOLDER: {
    fontFamily: 'PlusJakartaSans_400Regular',
    fontSize: 13,
    lineHeight: 13 * LH_BODY,
    color: '#B0AFA8'
  },
  HERO: {
    fontFamily: 'PlusJakartaSans_800ExtraBold',
    fontSize: 28,
    letterSpacing: TRACK_HEADING,
    color: '#1A1A1A'
  },
  CTA: {
    fontFamily: 'PlusJakartaSans_700Bold',
    fontSize: 14
  },
  META: {
    fontFamily: 'PlusJakartaSans_500Medium',
    fontSize: 10,
    color: '#A0A09A'
  },
  NUMBER: {
    fontFamily: 'PlusJakartaSans_700Bold',
    letterSpacing: -0.02,
    color: '#1A1A1A'
  },
  FONT_SIZE_SUBTITLE: 15
};
