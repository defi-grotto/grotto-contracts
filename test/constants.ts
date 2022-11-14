export const CREATOR_PERCENTAGE = 20;
export const PLATFORM_PERCENTAGE = 1;

export const getPercentage = (amount: number, percentage: number) => {
    return (amount * percentage) / 100;
};

export const LOTTO_BETS: Array<number> = [0, 100, 200];
