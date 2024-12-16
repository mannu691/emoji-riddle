import { Devvit } from "@devvit/public-api";
export const firstSolveComment = Devvit.addSchedulerJob({
  name: "FIRST_SOLVER_COMMENT",
  onRun: async (
    event: {
      data: {
        postId: string;
        username: string;
      };
    },
    context
  ) => {
    if (event.data) {
      try {
        await context.reddit.submitComment({
          id: event.data.postId,
          text: `u/${event.data.username} has cracked the riddle first!`,
        });
      } catch (error) {
        console.error("Failed to submit comment:", error);
      }
    }
  },
});
