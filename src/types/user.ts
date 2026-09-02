export interface UserBadgeResponse {
  badgeType: string;
  displayName: string;
  description: string;
  acquiredAt: string;
}

export interface UserSummaryResponse {
  point: number;
  tierName: string;
  badges: UserBadgeResponse[];
  nextMinPoint: number;
}
