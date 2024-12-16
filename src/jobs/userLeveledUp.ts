import { Devvit } from "@devvit/public-api";

import { Service } from "../service/Service.js";
import type { Level } from "../types.js";

export const userLeveledUp = Devvit.addSchedulerJob({
  name: "USER_LEVEL_UP",
  onRun: async (
    event: {
      data: {
        username: string;
        score: number;
        prevLevel: Level;
        nextLevel: Level;
      };
    },
    context
  ) => {
    if (event.data) {
      try {
        const service = new Service(context);
        const gameSettings = await service.getGameSettings();

        await Promise.all([
          context.reddit.sendPrivateMessage({
            to: event.data.username,
            subject: `🎉 Emoji Riddle Level ${event.data.nextLevel.rank} Unlocked! 🎉`,
            text: `**Well done, Riddle Genius!** 🧠✨
    
    You've just leveled up to **Level ${event.data.nextLevel.rank}: ${event.data.nextLevel.name}!** 🎉
    Your riddle-solving skills have taken you to new heights, and now you're ready for even more challenges!

    Here's what you can enjoy as a Level ${event.data.nextLevel.rank} player:
    - A fresh **${event.data.nextLevel.name}** flair to show off your riddle prowess! 🌟
    - more perks comming soon...  
    
    Keep the fun going, visit r/${gameSettings.subredditName}, and share your new flair with the community! 🧩 Let’s keep solving and creating those emoji puzzles! 🎨
    `,
          }),
          context.reddit.setUserFlair({
            subredditName: gameSettings.subredditName,
            username: event.data.username,
            text: event.data.nextLevel.name,
            backgroundColor: event.data.nextLevel.backgroundColor,
            textColor: event.data.nextLevel.textColor,
          }),
          service.saveUserData(event.data.username, {
            levelRank: event.data.nextLevel.rank,
            levelName: event.data.nextLevel.name,
          }),
        ]);
      } catch (error) {
        console.error(
          `Failed to process level up for ${event.data.username}`,
          error
        );
      }
    }
  },
});
