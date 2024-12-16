import type { Context } from '@devvit/public-api';
import { Devvit, useAsync } from '@devvit/public-api';


import { LoadingState } from '../../components/LoadingState.js';
import { PixelText } from '../../components/PixelText.js';
import { PointsToast } from '../../components/PointsToast.js';
import { Service } from '../../service/Service.js';
import Settings from '../../settings.json' assert { type: "json" };
import type { GamePostData } from '../../types.js';
import { abbreviateNumber, capitalize, obfuscateString } from '../../utils.js';
import { StyledButton } from '../../components/StyledButton.js';
import { LoadingStateSpinner } from '../../components/LoadingStateSpinner.js';

function includesCaseInsensitive(array: string[], target: string): boolean {
  return array.some((item) => item.toLowerCase() === target.toLowerCase());
}

interface ResultsScreenProps {
  postData: GamePostData;
  username: string | null;
  feedback: boolean | null;
  pointsEarned?: number;
  onCreate: () => void;
}

export const ResultsScreen = (props: ResultsScreenProps, context: Context): JSX.Element => {
  const service = new Service(context);
  const rowCount = 6;
  const rowHeight: Devvit.Blocks.SizeString = `${100 / rowCount}%`;

  const { data, loading } = useAsync<{
    guesses: { [guess: string]: number };
    wordCount: number;
    guessCount: number;
    playerCount: number;
    comments: { [guess: string]: string[] };
  }>(async () => {
    const empty = { playerCount: 0, wordCount: 0, guessCount: 0, guesses: {}, comments: {} };
    if (!props.username) return empty;
    try {
      const playerCount = await service.getPlayerCount(props.postData.postId);
      const guesses = await service.getPostGuesses(props.postData.postId);
      const comments = await service.getGuessComments(props.postData.postId);
      return {
        playerCount,
        wordCount: guesses.wordCount,
        guessCount: guesses.guessCount,
        guesses: guesses.guesses,
        comments,
      };
    } catch (error) {
      if (error) {
        console.error('Error loading riddle meta data', error);
      }
      return empty;
    }
  });

  if (loading || data === null) return <LoadingStateSpinner />;

  // Top N guesses (or whatever is available)
  const topGuesses = Object.entries(data.guesses)
    .sort((a, b) => b[1] - a[1])
    .slice(0, rowCount)
    .map(([word, count]) => {
      const percentage = Math.round((count / data.guessCount) * 100);
      return (
        <zstack
          height={rowHeight}
          width="100%"
          alignment="top start"
          backgroundColor="rgba(255, 255, 255, 0.2)"
          onPress={async () => {
            if (!data.comments[word]) return;
            const comment = await context.reddit.getCommentById(data.comments[word][0]);
            context.ui.navigateTo(comment);
          }}
        >
          {/* Progress Bar */}
          <hstack width={`${percentage}%`} height="100%" backgroundColor="#ede0be" />
          {/* Guess */}
          <hstack height="100%" width="100%" alignment="start middle">
            <spacer width="12px" />
            <PixelText
              color={Settings.theme.primary}
              scale={2}
            >
              {capitalize(word)}
            </PixelText>
          </hstack>
          {/* Metadata */}
          <hstack height="100%" width="100%" alignment="end middle">
            <PixelText scale={1.5} color={Settings.theme.secondary}>
              {count.toString()}
            </PixelText>
            <spacer width="12px" />
            <PixelText scale={2} color={Settings.theme.primary}>
              {`${percentage}%`}
            </PixelText>
            <spacer width="12px" />
          </hstack>
        </zstack>
      );
    });

  // Add placeholder rows if there are less guesses than rowCount
  const placeholderRows = Array.from({ length: rowCount - topGuesses.length }).map(
    (_value, _index) => (
      <zstack height={rowHeight} width="100%" backgroundColor="rgba(255, 255, 255, 0.2)" />
    )
  );

  return (

    <zstack height="100%" width="100%" alignment="center middle">
      <vstack height="100%" width="100%" alignment="center middle">
        <spacer height="12px" />

        {/* Header */}
        <vstack gap="medium" alignment="center middle">
          <text color="black" alignment="center" overflow="ellipsis" weight="bold" size="xxlarge">{props.postData.riddle}</text>
          <hstack gap="small" alignment="start middle">
            <PixelText scale={2}>{props.postData.answer}</PixelText>
            <PixelText scale={2} color={Settings.theme.secondary}>:</PixelText>
            <PixelText scale={2} color={Settings.theme.secondary}>
              {`u/${props.postData.authorUsername}`}
            </PixelText>
          </hstack>
        </vstack>
        <spacer height="24px" />

        {/* List */}
        <hstack width="100%" grow>
          <spacer width="20px" />
          <vstack grow gap="small">
            {topGuesses}
            {placeholderRows}
          </vstack>
          <spacer width="20px" />
        </hstack>
        <spacer height="24px" />

        {/* Metadata */}
        <hstack alignment="middle center">
          <PixelText
            scale={1.5}
            color={Settings.theme.secondary}
          >{`${abbreviateNumber(data.playerCount)} player${data.playerCount === 1 ? '' : 's'}`}</PixelText>
          <spacer width="12px" />
          <PixelText scale={1.5} color={Settings.theme.tertiary}>
            •
          </PixelText>
          <spacer width="12px" />
          <PixelText
            scale={1.5}
            color={Settings.theme.secondary}
          >{`${abbreviateNumber(data?.guessCount)} guess${data.guessCount === 1 ? '' : 'es'}`}</PixelText>
        </hstack>

        <spacer height="14px" />

        {/* Call to action */}
        <StyledButton width="80%" label="CREATE RIDDLE" onPress={() => props.onCreate()} />
        <spacer height="16px" />
      </vstack>

      {/* Feedback */}
      {props.feedback === true && (
        <PointsToast value={props.pointsEarned ?? Settings.guesserRewardForSolve} />
      )}
    </zstack>
  );
};