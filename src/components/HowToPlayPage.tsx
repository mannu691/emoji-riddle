import type { Context } from '@devvit/public-api';
import { Devvit } from '@devvit/public-api';

import { PixelText } from './PixelText.js';
import Settings from '../settings.json' assert { type: "json" };
import { StyledButton } from './StyledButton.js';

interface HowToPlayPageProps {
  onClose: () => void;
}

export const HowToPlayPage = (props: HowToPlayPageProps, _context: Context): JSX.Element => (
  <vstack width="100%" height="100%">
    <spacer height="24px" />

    {/* Header */}
    <hstack width="100%" alignment="middle">
      <spacer width="24px" />
      <PixelText scale={2.5} color={Settings.theme.primary}>
        How to play
      </PixelText>
      <spacer grow />
      <StyledButton
        appearance="primary"
        label="x"
        width="32px"
        height="32px"
        onPress={props.onClose}
      />
      <spacer width="20px" />
    </hstack>
    <spacer height="20px" />

    <hstack grow>
      <spacer width="16px" />
      <vstack width="100%" height="100%">
          <hstack grow>
            <vstack grow backgroundColor="white">
              <spacer height="4px" />
              <vstack grow alignment="center middle">
                <PixelText scale={3}>Create riddles</PixelText>
                <spacer height="4px" />
                <PixelText scale={3}>for others</PixelText>
                <spacer height="16px" />
                <PixelText color={Settings.theme.secondary}>Earn points if they</PixelText>
                <spacer height="4px" />
                <PixelText color={Settings.theme.secondary}>guess correctly!</PixelText>
              </vstack>
              <spacer height="4px" />
            </vstack>
            <spacer width="4px" />
          </hstack>
          <spacer height="4px" />
        </vstack>
      <spacer width="16px" />
    </hstack>

    <spacer height="20px" />
  </vstack>
);
