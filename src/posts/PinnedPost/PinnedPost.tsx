import { Context, Devvit, useAsync, useState } from '@devvit/public-api';

import { HowToPlayPage } from '../../components/HowToPlayPage.js';
import { LeaderboardPage } from '../../components/LeaderboardPage.js';
import { LevelPage } from '../../components/LevelPage.js';
import { LoadingState } from '../../components/LoadingState.js';
import { MyRiddlesPage } from '../../components/MyRiddlesPage.js';
import { PixelSymbol } from '../../components/PixelSymbol.js';
import { PixelText } from '../../components/PixelText.js';
import { ProgressBar } from '../../components/ProgressBar.js';
import { StyledButton } from '../../components/StyledButton.js';
import { Service } from '../../service/Service.js';
import Settings from '../../settings.json' assert { type: "json" };
import type { GameSettings, PostData, UserData } from '../../types.js';
import { getLevelByScore } from '../../utils.js';
import { createGamePostForm } from '../../forms/createGamePostForm.js';
import { LoadingStateSpinner } from '../../components/LoadingStateSpinner.js';

interface PinnedPostProps {
  postData: PostData;
  userData: UserData | null;
  username: string | null;
  gameSettings: GameSettings;
}

export const PinnedPost = (props: PinnedPostProps, context: Context): JSX.Element => {
  const service = new Service(context);
  const [page, setPage] = useState('menu');
  const buttonWidth = '256px';
  const buttonHeight = '48px';
  const createRiddleForm = createGamePostForm(context, props.username, props.gameSettings);
  const { data: user, loading } = useAsync<{
    rank: number;
    score: number;
  }>(async () => {
    return await service.getUserScore(props.username);
  });

  if (user === null || loading) {
    return <LoadingStateSpinner />;
  }

  const level = getLevelByScore(user?.score ?? 0);

  const percentage = Math.round(
    Math.min(100, Math.max(0, (((user?.score ?? 0) - level.min) / (level.max - level.min)) * 100))
  );
  const openCreateRiddleForm = () => {
    const service = new Service(context);
    if (!props.username) {
      context.ui.showToast('Please log in to post');
      return;
    }
    context.ui.showForm(createRiddleForm);
  }

  const Menu = (
    <vstack width="100%" height="100%" alignment="center middle">
      <spacer grow />
      {/* Logo */}
      <image
        url={`logo.png`}
        imageHeight={128}
        imageWidth={128}
        width="90px"
        height="90px"
        description="Emoji-Riddle Logo"
      />
      <spacer height="16px" />

      {/* Wordmark */}
      <PixelText scale={4}>Emoji Riddle</PixelText>

      <spacer grow />

      {/* Menu */}
      <vstack alignment="center middle" gap="small">
        <StyledButton
          width={buttonWidth}
          height={buttonHeight}
          onPress={openCreateRiddleForm}
          leadingIcon="+"
          label="CREATE"
        />
        <StyledButton
          appearance='secondary'
          width={buttonWidth}
          height={buttonHeight}
          onPress={() => setPage('my-riddles')}
          label="MY RIDDLES"
        />
        <StyledButton
          appearance='secondary'
          width={buttonWidth}
          height={buttonHeight}
          onPress={() => setPage('leaderboard')}
          label="LEADERBOARD"
        />
        <StyledButton
          appearance='secondary'
          width={buttonWidth}
          height={buttonHeight}
          onPress={() => setPage('how-to-play')}
          label="HOW TO PLAY"
        />
      </vstack>
      <spacer grow />

      {/* Experience Bar */}
      <vstack alignment="center middle" onPress={() => setPage('level')}>
        <hstack>
          <spacer width="20px" />
          <PixelText scale={2}>{`Level ${props.userData?.levelRank ?? 1}`}</PixelText>
          <spacer width="8px" />
          <PixelSymbol type="arrow-right" scale={2} color={Settings.theme.tertiary} />
        </hstack>
        <spacer height="8px" />

        <ProgressBar percentage={percentage} width={256} />
      </vstack>

      <spacer grow />
    </vstack>
  );

  const onClose = (): void => {
    setPage('menu');
  };
  const pages: Record<string, JSX.Element> = {
    'menu': Menu,
    'my-riddles': <MyRiddlesPage {...props} onClose={onClose} onCreate={openCreateRiddleForm} />,
    'leaderboard': <LeaderboardPage {...props} onClose={onClose} />,
    'how-to-play': <HowToPlayPage onClose={onClose} />,
    level: (
      <LevelPage {...props} user={user} percentage={percentage} level={level} onClose={onClose} />
    ),
  };
  return pages[page] || Menu;
};
