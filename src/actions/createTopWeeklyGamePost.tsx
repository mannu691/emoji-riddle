// import type { MenuItem } from '@devvit/public-api';
// import { Devvit } from '@devvit/public-api';

// import { LoadingState } from '../components/LoadingState.js';
// import { Service } from '../service/Service.js';

// export const createTopWeeklyGamePost: MenuItem = {
//   label: '[Emoji-Riddle] Create Top Weekly riddles post',
//   location: 'subreddit',
//   forUserType: 'moderator',
//   onPress: async (_event, context) => {
//     const service = new Service(context);

//     const subreddit = await context.reddit.getCurrentSubreddit();

//     // Get subreddit top posts and store the details
//     const topPosts = await context.reddit
//       .getTopPosts({
//         subredditName: subreddit.name,
//         timeframe: 'week',
//         limit: 20,
//         pageSize: 20,
//       })
//       .all();

//     const collectionPostData = await service.getPostDataFromSubredditPosts(topPosts, 4);

//     if (collectionPostData.length === 0) {
//       throw 'No posts found';
//     }

//     const post = await context.reddit.submitPost({
//       title: 'Top Riddles from the last week',
//       subredditName: subreddit.name,
//       preview: <LoadingState />,
//     });

//     const postData = {
//       postId: post.id,
//       data: collectionPostData,
//       timeframe: 'week',
//       postType: 'collection',
//     };

//     await service.storeCollectionPostData(postData);

//     // Create comment with the featured artists
//     let commentText = `Riddle by:`;
//     collectionPostData.forEach((riddle) => {
//       commentText = `${commentText}\n* u/${riddle.authorUsername}`;
//     });
//     const comment = await context.reddit.submitComment({
//       id: post.id,
//       text: commentText,
//     });
//     await comment.distinguish(true);

//     context.ui.showToast('Top Weekly Riddle Post Created');
//     context.ui.navigateTo(post);
//   },
// };
