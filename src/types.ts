import { type FlairTextColor } from "@devvit/public-api";

/*
 * ID Identifiers
 */

export type CommentId = `t1_${string}`;
export type UserId = `t2_${string}`;
export type PostId = `t3_${string}`;
export type SubredditId = `t5_${string}`;

export type GameSettings = {
  subredditName: string;
  riddleCategories: string[];
};

export enum PostType {
  GAME = "game",
  // COLLECTION = "collection",
  PINNED = "pinned",
}

// Base post data
export type PostData = {
  postId: PostId;
  postType: PostType;
};

// Game post
export type GamePostData = PostData & {
  category: string;
  riddle: string;
  answer: string;
  authorUsername: string;
  date: number;
  solves: number;
  skips: number;
};

// Collections
export type CollectionData = Pick<
  GamePostData,
  "postId" | "riddle" | "authorUsername"
>;

// export type CollectionPostData = PostData & {
//   data: CollectionData[];
//   timeframe: string;
// };

// Pinned post
export type PinnedPostData = PostData;

export type PostGuesses = {
  guesses: { [guess: string]: number };
  wordCount: number;
  guessCount: number;
  playerCount?: number;
};

export type UserData = {
  score: number;
  solved: boolean; // Has the user solved this post?
  skipped: boolean; // Has the user skipped this post?
  levelRank: number;
  levelName: string;
  guessCount: number;
};

/*
 * Progression
 */

export type Level = {
  rank: number;
  name: string;
  min: number;
  max: number;
  backgroundColor: string;
  textColor: FlairTextColor;
  extraTime: number;
};

export type ScoreBoardEntry = {
  member: string;
  score: number;
  description?: string;
};
