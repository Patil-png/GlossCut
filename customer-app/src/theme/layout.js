import { StyleSheet } from 'react-native';

/** Hairline / “0.5px” border — use Platform or 0.5 where supported */
export const BORDER_THIN = 0.5;

export const Layout = {
  screenPadding: 20,
  cardPadding: 16,
  sectionGap: 24,
  cardGap: 10,
  tagGap: 6,
  iconNav: 22,
  iconCard: 18,
  avatar: 38,

  radiusTag: 8,
  radiusInput: 14,
  radiusButton: 14,
  radiusCard: 20,
  radiusSheet: 28,
  searchPill: 50,

  noShadow: {
    shadowColor: 'transparent',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0,
    shadowRadius: 0,
    elevation: 0,
  },
};

export const hairline = StyleSheet.hairlineWidth;
