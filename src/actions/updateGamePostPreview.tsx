import type { MenuItem } from '@devvit/public-api';

import { Service } from '../service/Service.js';
import { PostType, type PostId } from '../types.js';

export const updateGamePostPreview: MenuItem = {
  label: '[Emoji-Riddle] Update Riddle preview',
  location: 'post',
  forUserType: 'moderator',
  postFilter: 'currentApp',
  onPress: async (event, context) => {
    const service = new Service(context);
    const postId = event.targetId as PostId;
    const postType = await service.getPostType(postId);
    if (postType !== PostType.GAME) {
      context.ui.showToast('Not a riddle post');
      return;
    }

    const [game, playerCount, user] = await Promise.all([
      service.getGamePost(postId),
      service.getPlayerCount(postId),
      context.reddit.getCurrentUser(),
    ]);

    if (game.authorUsername !== user?.username) {
      context.ui.showToast('Not the author');
      return;
    }

    await service.updateGamePostPreview(
      postId,
      game,
      playerCount,
    );
    context.ui.showToast('Updated Post Preview');
  },
};
