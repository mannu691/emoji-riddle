import type { Context } from '@devvit/public-api';
import { Devvit, useAsync, useForm, useState } from '@devvit/public-api';

import { LoadingState } from '../../components/LoadingState.js';
import { PixelText } from '../../components/PixelText.js';
import { Service } from '../../service/Service.js';
import Settings from '../../settings.json' assert { type: "json" };
import type { GamePostData, PostGuesses, UserData } from '../../types.js';
import { StyledButton } from '../../components/StyledButton.js';
import { LoadingStateSpinner } from '../../components/LoadingStateSpinner.js';

interface GuessScreenProps {
  postData: GamePostData;
  userData: UserData | null;
  username: string | null;
  onGuess: (guess: string, userWantsToComment: boolean) => Promise<void>;
  onSkip: () => void;
  feedback: boolean | null;
}

export const GuessScreen = (props: GuessScreenProps, context: Context): JSX.Element => {
  const service = new Service(context);

  const { data, loading } = useAsync<PostGuesses>(async () => {
    const empty = { playerCount: 0, wordCount: 0, guessCount: 0, guesses: {} };
    if (!props.username) return empty;
    try {
      const players = await service.getPlayerCount(props.postData.postId);
      const metadata = await service.getPostGuesses(props.postData.postId);
      metadata.playerCount = players;
      return metadata;
    } catch (error) {
      if (error) {
        console.error('Error loading riddle meta data', error);
      }
      return empty;
    }
  });

  const [guessCount, setGuessCount] = useState(props.userData?.guessCount ?? 0);

  if (loading || data === null) return <LoadingStateSpinner />;

  const playerCount = data.playerCount ?? 0;

  // Guess the word form
  const guessForm = useForm(
    {
      title: 'Guess the riddle',
      description: "If you're right, you'll earn 1 point.",
      acceptLabel: 'Submit Guess',
      fields: [
        {
          type: 'string',
          name: 'guess',
          label: 'Word',
          required: true,
        },
        {
          type: 'boolean',
          name: 'comment',
          label: 'Leave a comment (optional)',
          defaultValue: false,
        },
      ],
    },
    async (values) => {
      setGuessCount((c) => c + 1);
      const guess = values.guess.trim().toLowerCase();
      const userWantsToComment = values.comment;
      await props.onGuess(guess, userWantsToComment);
    }
  );

  // Give up form
  const giveUpForm = useForm(
    {
      title: 'Giving up already?',
      description:
        "You'll see the answer and lose your chance to earn points. Ready to call it quits?",
      acceptLabel: 'I Give Up',
      cancelLabel: 'Back',
      fields: [],
    },
    async () => {
      if (!props.postData.postId || !props.username) {
        return;
      }
      await service.skipPost(props.postData.postId, props.username);
      props.onSkip();
    }
  );

  return (

      <vstack height="100%" width="100%" alignment="center">
        <zstack width="100%" backgroundColor={Settings.theme.primary} padding="medium" alignment="center" >
          <PixelText scale={2} color="white">GUESS THE EMOJI</PixelText>
        </zstack>

        <vstack width="100%" height="300px" padding="small" alignment="middle center">
          <zstack alignment="center middle" width="100%" height="100%">
            <text color="black" alignment="center" overflow="ellipsis" wrap weight="bold" size="xxlarge">{props.postData.riddle}</text>
            {props.feedback === false && (
              <image
                url={'feedback-incorrect.png'}
                imageHeight={512}
                imageWidth={512}
                height="256px"
                width="256px"
              />
            )}
          </zstack>

          {/* Experimetal Big Text  */}
          {/* <image
          imageHeight={300}
          imageWidth={100}
          width="100%"
          url={`data:image/svg+xml;charset=UTF-8,
        <svg>
          <text x="50%" y="50%" font-family="Arial" text-anchor="middle" font-size="32" fill="black">
            ${"🐱🆚🐭+🐱🆚🐭+🐱🆚"}
          </text>
        </svg>
        `}
        /> */}
        </vstack>
        <StyledButton scale={3} onPress={() => context.ui.showForm(guessForm)} width="80%" label='GUESS' />
        <spacer height="10px" />
        <PixelText color={Settings.theme.secondary}>
          {playerCount > 0
            ? `${playerCount.toLocaleString()} have solved`
            : 'Make the first guess!'}
        </PixelText>
        <spacer height="10px" />
        {guessCount > 1 ? (<vstack width="100%" onPress={() => context.ui.showForm(giveUpForm)} alignment='center'>
          <PixelText color='black'>
            GIVE UP
          </PixelText>
        </vstack>) : null}
      </vstack>
    
  );
};
