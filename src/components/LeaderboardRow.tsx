import { Devvit } from '@devvit/public-api';

import Settings from '../settings.json' assert { type: "json" };
import { PixelSymbol } from './PixelSymbol.js';
import { PixelText } from './PixelText.js';

export type LeaderboardRowProps = {
  rank: number;
  name: string;
  height: Devvit.Blocks.SizeString;
  score: number;
  onPress?: () => void;
};

export const LeaderboardRow = (props: LeaderboardRowProps): JSX.Element => {
  const { rank, name, height, score, onPress } = props;

  return (
    <zstack height={height} width={'100%'} onPress={onPress}>
      {/* Name and rank */}
      <hstack width="100%" height="100%" alignment="start middle">
        <spacer width="12px" />
        <PixelText color={Settings.theme.tertiary}>{`${rank}.`}</PixelText>
        <spacer width="8px" />
        <PixelText color={Settings.theme.primary}>{name}</PixelText>
      </hstack>

      {/* Score */}
      {/* May overlap especially long names on narrow screens */}
      <hstack width="100%" height="100%" alignment="end middle">
        {/* Background to cover long names */}
        <hstack backgroundColor="#ede0be" height="100%" alignment="middle">
          <spacer width="8px" />
          <PixelText color={Settings.theme.primary}>{score.toLocaleString()}</PixelText>
          <spacer width="8px" />
          <PixelSymbol color={Settings.theme.primary} type="star" />
          <spacer width="8px" />
        </hstack>
        <spacer width="16px" />
      </hstack>
    </zstack>
  );
};
