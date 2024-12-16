import { Devvit } from "@devvit/public-api";

export const newGamePinnedComment = Devvit.addSchedulerJob<{
  postId: string;
}>({
  name: "GAME_PINNED_TLDR_COMMENT",
  onRun: async (event, context) => {
    if (event.data) {
      try {
        const comment = await context.reddit.submitComment({
          id: event.data.postId,
          text: `🎉 **Emoji Riddle** is an exciting new game where players create riddles using emojis 🤔➡️❓, and others must guess the correct answer! \n✨ Built on Reddit's developer platform, the game lets users express their creativity through emoji puzzles. \n👉 To play, press "Guess" ✅ to submit your answer or "Create" ✍️ to make your own emoji riddle for others to solve. \n📩 Submit feedback!`,
        });
        await comment.distinguish(true);
      } catch (error) {
        console.error("Failed to submit TLDR comment:", error);
      }
    }
  },
});
