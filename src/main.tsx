/*
 * Jobs
 */

import './jobs/firstSolveComment.js';
import './jobs/newGamePinnedComment.js';
import './jobs/userLeveledUp.js';

import { Devvit } from '@devvit/public-api';

import { Router } from './posts/Router.js';

/*
 * Menu Actions
 */

// import { createTopWeeklyGamePost } from './actions/createTopWeeklyGamePost.js';
import { installGame } from './actions/installGame.js';
import { newPinnedPost } from './actions/newPinnedPost.js';
import { revealAnswer } from './actions/revealAnswer.js';
import { updateGamePostPreview } from './actions/updateGamePostPreview.js';

/*
 * Triggers
 */
import { appUpgrade } from './triggers/appUpgrade.js';
import { commentDelete } from './triggers/commentDelete.js';
import { installSettings } from './forms/installSettings.js';

/*
 * Plugins
 */

Devvit.configure({
  redditAPI: true,
  redis: true,
  media: true,
});

/*
 * Custom Post
 */

Devvit.addCustomPostType({
  name: 'Emoji-Riddle',
  description: 'Riddle, Guess, Fun!',
  height: 'tall',
  render: Router,
});

/*
 * Settings
 */
Devvit.addSettings(installSettings);

/*
 * Menu Actions
 */

// Subreddit
Devvit.addMenuItem(installGame);
// Devvit.addMenuItem(createTopWeeklyGamePost);
Devvit.addMenuItem(newPinnedPost);

// Posts
Devvit.addMenuItem(updateGamePostPreview);
Devvit.addMenuItem(revealAnswer);

/*
 * Triggers
 */

Devvit.addTrigger(appUpgrade);
Devvit.addTrigger(commentDelete);

export default Devvit;
