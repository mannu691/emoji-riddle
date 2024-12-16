import type { MenuItem } from "@devvit/public-api";

import { Service } from "../service/Service.js";
import { PostType, type PostId } from "../types.js";

export const revealAnswer: MenuItem = {
  label: "[Emoji-Riddle] Reveal Answer",
  location: "post",
  forUserType: "moderator",
  postFilter: 'currentApp',
  onPress: async (event, context) => {
    const service = new Service(context);
    const postId = event.targetId as PostId;
    const postType = await service.getPostType(postId);
    if (postType !== PostType.GAME) {
      context.ui.showToast("Unknown post type");
      return;
    }
    const data = await service.getGamePost(postId);
    context.ui.showToast(data.answer);
  },
};
