import { Context, Devvit, useForm, type FormOnSubmitEvent } from "@devvit/public-api";

import { Service } from "../service/Service.js";
import { GuessScreenSkeleton } from "../posts/GamePost/GuessScreenSkeleton.js";
import { GameSettings } from "../types.js";
const reg = /[\p{Emoji_Presentation},\+,\-,=,\s]+(?=\p{Emoji_Presentation})[\p{Emoji_Presentation},\+,\-,=,\s]+/gu;
export const createGamePostForm = (context: Context, username: string | null, gameSettings: GameSettings) => useForm(
  {
    title: "Create a new Emoji Riddle",
    description:
      "Craft your own emoji riddle and challenge others to guess the answer! ",
    fields: [
      {
        type: 'select',
        name: 'category',
        label: 'Riddle Category',
        defaultValue: [gameSettings.riddleCategories[0]],
        placeholder: "Riddle",
        helpText:
          "Affects post title like : 'What is this? {Riddle Category}'",
        required: true,
        options: gameSettings.riddleCategories.map(v => { return { label: v, value: v } })
      },
      {
        type: "string",
        name: "riddle",
        label: "Riddle",
        placeholder: "Your Amazing ridddle",
        helpText: "Emojis , spaces , [+,=,-] are Allowed",
        required: true,
      },
      {
        type: "string",
        name: "answer",
        label: "Answer",
        placeholder: "Answer to your riddle",
        helpText: "keep it simple, spaces are allowed",
        required: true,
      },

    ],
    acceptLabel: "Save",
    cancelLabel: "Cancel",
  },
  async (values) => {
    const service = new Service(context);
    if (!username) {
      context.ui.showToast('Please log in to post');
      return;
    }
    // Add a temporary lock key to prevent duplicate posting.
    // This lock will expire after 5 seconds.
    // If the lock is already set return early.
    const lockKey = `locked:${username}`;
    const locked = await context.redis.get(lockKey);
    if (locked === 'true') return;
    const lockoutPeriod = 5000; // 5 seconds
    await context.redis.set(lockKey, 'true', {
      nx: true,
      expiration: new Date(Date.now() + lockoutPeriod),
    });

    if (!gameSettings.riddleCategories.includes(values.category[0])) {
      context.ui.showToast('Riddle Category not allowed');
      return;
    }
    if (values.category.length > 20) {
      context.ui.showToast('Your Riddle is Too Lengthy!');
      return;
    }
    if (reg.test(values.category[0])) {
      context.ui.showToast('Your Riddle is invalid!');
      return;
    }

    // The back-end is configured to run this app's submitPost calls as the user
    const post = await context.reddit.submitPost({
      title: `What is this? ${values.category}`,
      subredditName: gameSettings.subredditName,
      preview: (
        <GuessScreenSkeleton
          riddle={values.riddle}
        />
      ),
    });

    service.submitRiddle({
      postId: post.id,
      riddle: values.riddle,
      category: values.category[0],
      answer: values.answer,
      authorUsername: username,
      subreddit: gameSettings.subredditName,
    });
    context.ui.navigateTo(post);
  }
);

