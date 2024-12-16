import { Devvit } from '@devvit/public-api';

import { PixelText } from '../../components/PixelText.js';
import Settings from '../../settings.json' assert { type: "json" };
import { GamePostData } from '../../types.js';
import { StyledButton } from '../../components/StyledButton.js';

interface GuessScreenSkeletonProps {
  riddle: string;
  playerCount?: number;
}

export const GuessScreenSkeleton = (props: GuessScreenSkeletonProps): JSX.Element => {
  const { playerCount = 0 } = props;
  return (
    <blocks height="tall">
      <zstack width="100%" height="100%" alignment="center middle">
        <image
          imageHeight={1024}
          imageWidth={2048}
          height="100%"
          width="100%"
          url="background.png"
          description="Emoji Yellow background"
          resizeMode="cover"
        />
        <vstack height="92%" width="90%" backgroundColor={Settings.theme.primary} cornerRadius="medium" maxWidth="580px" grow></vstack>
        <vstack height="89%" width="85%" backgroundColor="#faf0f0" cornerRadius="medium" alignment="center" maxWidth="560px" grow>
          <zstack width="100%" backgroundColor={Settings.theme.primary} padding="medium" alignment="center" >
            <PixelText scale={2} color="white">GUESS THE EMOJI</PixelText>
          </zstack>
          <vstack width="100%" height="300px" padding="small" alignment="middle center">
            <text color="black" alignment="center" overflow="ellipsis" wrap weight="bold" size="xxlarge">{props.riddle}</text>
          </vstack>
          <StyledButton scale={3} width="80%" label='LOADING....' />
          <spacer height="10px" />
          <PixelText color={Settings.theme.secondary}>
            {playerCount > 0
              ? `${playerCount.toLocaleString()} have solved`
              : 'Make the first guess!'}
          </PixelText>
        </vstack>
      </zstack>
    </blocks>
  );
};
