import type { Context } from '@devvit/public-api';
import { Devvit, useInterval, useState } from '@devvit/public-api';
import { Service } from '../../service/Service.js';
import Settings from '../../settings.json' assert { type: "json" };
import type { GamePostData, GameSettings, UserData } from '../../types.js';
import { GuessScreen } from './GuessScreen.js';
import { ResultsScreen } from './ResultsScreen.js';
import { createGamePostForm } from '../../forms/createGamePostForm.js';
import { PixelText } from '../../components/PixelText.js';

interface GamePostProps {
  postData: GamePostData;
  userData: UserData | null;
  username: string | null;
  gameSettings: GameSettings;
}

export const GamePost = (props: GamePostProps, context: Context): JSX.Element => {
  const service = new Service(context);
  const isAuthor = props.postData.authorUsername === props.username;
  const isSolved = !!props.userData?.solved;
  const isSkipped = !!props.userData?.skipped;

  const [currentStep, setCurrentStep] = useState<string>(
    isAuthor || isSolved || isSkipped ? 'Results' : 'Prompt'
  );

  const [pointsEarned, setPointsEarned] = useState(0);

  // Guess feedback
  const [feedback, setFeedback] = useState<boolean | null>(null);
  const [feedbackDuration, setFeedbackDuration] = useState(Settings.feedbackDuration);
  const timer = useInterval(() => {
    if (feedbackDuration > 1) {
      setFeedbackDuration(feedbackDuration - 1);
    } else {
      setFeedback(null);
      timer.stop();
      setFeedbackDuration(Settings.feedbackDuration);
    }
  }, 100);
  const creareRiddleForm = createGamePostForm(context, props.username, props.gameSettings);

  async function onGuessHandler(guess: string, createComment: boolean): Promise<void> {
    if (!props.postData || !props.username) {
      return;
    }
    const userGuessedCorrectly = guess.toLowerCase() === props.postData.answer.toLowerCase();

    // Give user feedback on their guess
    setFeedback(userGuessedCorrectly);
    timer.start();

    // Submit guess to the server
    const points = await service.submitGuess({
      postData: props.postData,
      username: props.username,
      guess,
      createComment,
    });

    // If user guessed correctly, move to results step
    if (userGuessedCorrectly) {
      setPointsEarned(points);
      setCurrentStep('Results');
    }
  }

  function onSkipHandler(): void {
    setCurrentStep('Results');
  }

  // Steps map
  const steps: Record<string, JSX.Element> = {
    Prompt: (
      <GuessScreen {...props} feedback={feedback} onGuess={onGuessHandler} onSkip={onSkipHandler} />
    ),
    Results: (
      <ResultsScreen
        {...props}
        feedback={feedback}
        pointsEarned={pointsEarned}
        onCreate={() => context.ui.showForm(creareRiddleForm)}
      />
    ),
  };
  return steps[currentStep] || (<text>Error: Step not found</text>);
};
