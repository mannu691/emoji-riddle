import type { Context } from '@devvit/public-api';
import { Devvit, useAsync } from '@devvit/public-api';

import { Service } from '../service/Service.js';
import Settings from '../settings.json' assert { type: "json" };
import { PostId } from '../types.js';
import { PaginatedRiddles } from './PaginatedRiddles.js';
import { PixelText } from './PixelText.js';
import { StyledButton } from './StyledButton.js';

interface MyRiddlesPageProps {
  username: string | null;
  onClose: () => void;
  onCreate: () => void;
}

export const MyRiddlesPage = (props: MyRiddlesPageProps, context: Context): JSX.Element => {
  const loadingState = (
    <vstack grow alignment="center middle">
      <PixelText color={Settings.theme.secondary}>Loading ...</PixelText>
    </vstack>
  );

  if (!props.username) {
    return loadingState;
  }

  const service = new Service(context);
  const tileSize = 88;
  const { data, loading } = useAsync<
    {
      postId: PostId;
      riddle: string;
    }[]
  >(async () => {
    if (!props.username) return [];
    const postIds = await service.getUserRiddles(props.username);
    return await service.getGamePosts(postIds);
  });

  const minWidth = 128;
  const width = Math.max(minWidth, context.dimensions?.width || 0);
  const riddlesPerRow = width ? Math.floor((width - 48) / (tileSize + 12)) : 3;

  const emptyState = (
    <vstack grow alignment="center middle">
      <PixelText scale={3}>make riddles</PixelText>
      <spacer height="4px" />
      <PixelText scale={3}>for others</PixelText>
      <spacer height="16px" />
      <PixelText color={Settings.theme.secondary}>Earn points if they</PixelText>
      <spacer height="4px" />
      <PixelText color={Settings.theme.secondary}>guess correctly!</PixelText>
      <spacer height="48px" />
      <StyledButton label="MAKE RIDDLE" onPress={() => props.onCreate()} width="176px" />
    </vstack>
  );

  return (
    <vstack width="100%" height="100%">
      <spacer height="24px" />

      {/* Header */}
      <hstack width="100%" alignment="middle">
        <spacer width="24px" />
        <PixelText scale={2.5} color={Settings.theme.primary}>
          My riddles
        </PixelText>
        <spacer grow />
        <StyledButton
          label="x"
          width="32px"
          height="32px"
          onPress={props.onClose}
        />
        <spacer width="20px" />
      </hstack>

      {/* Loading state */}
      {loading && loadingState}

      {/* Empty state */}
      {(data?.length === 0 || data === undefined) && emptyState}

      {/* Riddle tiles */}
      {data && !loading && (
        <PaginatedRiddles
          riddles={data}
          riddlesPerRow={riddlesPerRow}
          tileSize={tileSize}
          ctaButtonEl={
            <StyledButton
              leadingIcon="+"
              label="CREATE"
              onPress={() => props.onCreate()}
              width="128px"
              height="32px"
            />
          }
        />
      )}
    </vstack>
  );
};
