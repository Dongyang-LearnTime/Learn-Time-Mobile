import type { ImageSourcePropType } from 'react-native';

const tierImages: Record<string, ImageSourcePropType> = {
  BICYCLE: require('../../assets/gamification/Bicycle.png'),
  CAR: require('../../assets/gamification/Car.png'),
  HELICOPTER: require('../../assets/gamification/Helicopter.png'),
  AIRPLANE: require('../../assets/gamification/Plain.png'),
  SPACESHIP: require('../../assets/gamification/SpaceShip.png'),
};

const badgeImages: Record<string, ImageSourcePropType> = {
  FIRST_STEP: require('../../assets/gamification/FirstPlan.png'),
  DILIGENT_PLANNER: require('../../assets/gamification/30Days.png'),
  EXCELLENT_STRATEGIST: require('../../assets/gamification/90Days.png'),
  TRUE_J_MBTI: require('../../assets/gamification/180Days.png'),
  HUMAN_GPT: require('../../assets/gamification/Quiz10Time.png'),
  TRIPITAKA_COREANA: require('../../assets/gamification/Notes80.png'),
  EARLY_BIRD: require('../../assets/gamification/MorningFirstTime.png'),
  MIRACLE_MORNING_ADDICT: require('../../assets/gamification/MorningFiveTime.png'),
};

const tierAliases: Record<string, string> = {
  자전거: 'BICYCLE',
  자동차: 'CAR',
  헬리콥터: 'HELICOPTER',
  비행기: 'AIRPLANE',
  우주선: 'SPACESHIP',
};

export function getTierImage(tierName: string): ImageSourcePropType {
  const normalized = tierName?.trim().toUpperCase() ?? '';
  const key = tierAliases[tierName] ?? tierAliases[normalized]
    ?? Object.keys(tierImages).find((item) => normalized.includes(item))
    ?? 'BICYCLE';
  return tierImages[key] ?? tierImages.BICYCLE!;
}

export function getBadgeImage(badgeType: string): ImageSourcePropType {
  return badgeImages[badgeType?.trim().toUpperCase()] ?? badgeImages.FIRST_STEP!;
}
