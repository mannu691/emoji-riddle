import type { Context } from '@devvit/public-api';
import { Devvit, useState } from '@devvit/public-api';

import { Service } from '../service/Service.js';
import type {
  GamePostData,
  GameSettings,
  PinnedPostData,
  PostId,
  UserData,
} from '../types.js';
import { PostType } from '../types.js';
import { PinnedPost } from './PinnedPost/PinnedPost.js';
import { GamePost } from './GamePost/GamePost.js';
import Settings from '../settings.json' assert { type: "json" };
/*
 * Page Router
 *
 * This is the post type router and the main entry point for the custom post.
 * It handles the initial data loading and routing to the correct page based on the post type.
 */

export const Router: Devvit.CustomPostComponent = (context: Context) => {
  const postId = context.postId as PostId;
  const service = new Service(context);
  function getPostData(
    postType: PostType,
    postId: PostId
  ): Promise<GamePostData | PinnedPostData> {
    switch (postType) {
      case PostType.PINNED:
        return service.getPinnedPost(postId);
      case PostType.GAME:
      default:
        return service.getGamePost(postId);
    }
  }

  const [data] = useState<{
    gameSettings: GameSettings;
    postData: GamePostData | PinnedPostData;
    postType: PostType;
    userData: UserData | null;
    username: string | null;
  }>(async () => {
    // First batch
    const [postType, username] = await Promise.all([service.getPostType(postId), service.getUsernameWithCache(context.userId)]);

    // Second batch
    const [postData, gameSettings, userData] = await Promise.all([
      getPostData(postType, postId),
      service.getGameSettings(),
      service.getUser(username, postId),
    ]);

    return {
      gameSettings,
      postData,
      postType,
      userData,
      username,
    };
  });

  const postTypes: Record<PostType, JSX.Element> = {
    game: (
      <GamePost
        postData={data.postData as GamePostData}
        username={data.username}
        gameSettings={data.gameSettings}
        userData={data.userData}
      />
    ),
    // collection: <CollectionPost collection={data.postData as CollectionPostData} />,
    pinned: (
      <PinnedPost
        postData={data.postData as PinnedPostData}
        userData={data.userData}
        username={data.username}
        gameSettings={data.gameSettings}
      />
    ),
  };

  /*
   * Return the custom post unit
   */

  return (
    <zstack width="100%" height="100%" alignment="center middle">
      <image
        imageHeight={1024}
        imageWidth={2048}
        height="100%"
        width="100%"
        url="background.png"
        description="Emoji Yellow background"
        resizeMode="cover"
      />
      <vstack height="92%" width="90%" backgroundColor={Settings.theme.primary} cornerRadius="medium" maxWidth="580px" grow></vstack>
      <vstack height="89%" width="85%" backgroundColor="#faf0f0" cornerRadius="medium" alignment="center" maxWidth="560px" grow>
        {postTypes[data.postType] || (
          <vstack alignment="center middle" grow>
            <text>Error: Unknown post type</text>
          </vstack>
        )}
      </vstack>

    </zstack>
  );
};
