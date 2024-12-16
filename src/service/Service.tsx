import {
  Post,
  RedditAPIClient,
  RedisClient,
  Scheduler,
  SettingsClient,
  ZRangeOptions,
} from '@devvit/public-api';
import { Devvit } from '@devvit/public-api';

import { GuessScreenSkeleton } from '../posts/GamePost/GuessScreenSkeleton.js';
import Settings from '../settings.json' assert { type: "json" };
import {
  CommentId,
  GamePostData,
  GameSettings,
  PinnedPostData,
  PostGuesses,
  PostId,
  PostType,
  ScoreBoardEntry,
  UserData,
} from '../types.js';
import { getLevelByScore } from '../utils.js';

// Service that handles the backbone logic for the application
// This service is responsible for:
// * Storing and fetching post data for riddles
// * Storing and fetching the score board
// * Storing and fetching user settings
// * Storing and fetching game settings

export class Service {
  readonly redis: RedisClient;
  readonly reddit?: RedditAPIClient;
  readonly scheduler?: Scheduler;
  readonly settings?: SettingsClient;

  constructor(context: { redis: RedisClient; reddit?: RedditAPIClient; scheduler?: Scheduler; settings?: SettingsClient }) {
    this.redis = context.redis;
    this.reddit = context.reddit;
    this.scheduler = context.scheduler;
    this.settings = context.settings;

  }

  readonly tags = {
    scores: 'default',
  };

  readonly keys = {
    gameSettings: 'game-settings',
    guessComments: (postId: PostId) => `guess-comments:${postId}`,
    postData: (postId: PostId) => `post:${postId}`,
    postGuesses: (postId: PostId) => `guesses:${postId}`,
    postSkipped: (postId: PostId) => `skipped:${postId}`,
    postSolved: (postId: PostId) => `solved:${postId}`,
    postUserGuessCounter: (postId: PostId) => `user-guess-counter:${postId}`,
    scores: `scores:${this.tags.scores}`,
    userData: (username: string) => `users:${username}`,
    userRiddles: (username: string) => `user-riddles:${username}`,
    wordRiddles: (word: string) => `word-riddles:${word}`,
  };

  /*
   * Submit Guess
   */

  async submitGuess(event: {
    postData: GamePostData;
    username: string;
    guess: string;
    createComment: boolean;
  }): Promise<number> {
    if (!this.reddit || !this.scheduler) {
      console.error('Reddit API client or Scheduler not available in Service');
      return 0;
    }

    const [comment, guessCount] = await Promise.all([
      event.createComment
        ? this.reddit.submitComment({
          id: event.postData.postId,
          text: `I guessed  **${event.guess}**`,
        })
        : Promise.resolve(undefined),
      this.redis.zIncrBy(this.keys.postGuesses(event.postData.postId), event.guess, 1),
    ]);

    const isCorrect = event.postData.answer.toLowerCase() === event.guess.toLowerCase();
    const isFirstSolve = isCorrect && guessCount === 1;
    const userPoints = isCorrect
      ? isFirstSolve
        ? Settings.guesserRewardForSolve + Settings.guesserRewardForFirstSolve
        : Settings.guesserRewardForSolve
      : 0;

    const promises: Promise<unknown>[] = [
      // Increment the user's guess count
      this.redis.zIncrBy(this.keys.postUserGuessCounter(event.postData.postId), event.username, 1),
    ];

    // Save guess comment
    if (comment) {
      promises.push(this.saveGuessComment(event.postData.postId, event.guess, comment.id));
    }

    if (isCorrect) {
      // Persist that the user has solved the post and give points to riddler and guesser
      promises.push(
        this.redis.zAdd(this.keys.postSolved(event.postData.postId), {
          member: event.username,
          score: Date.now(),
        }),
        this.incrementUserScore(
          event.postData.authorUsername,
          Settings.authorRewardForCorrectGuess
        ),
        this.incrementUserScore(event.username, userPoints)
      );
    }

    // Comment to credit the first solver
    if (isFirstSolve) {
      const in5Min = new Date(Date.now() + 5 * 60 * 1000);
      promises.push(
        this.scheduler.runJob({
          name: 'FIRST_SOLVER_COMMENT',
          data: {
            postId: event.postData.postId,
            username: event.username,
          },
          runAt: in5Min,
        })
      );
    }

    await Promise.all(promises);
    return userPoints;
  }

  /*
   * Post User Guess Counter
   * A sorted set with the number of guesses made by each player
   * - Member: Username
   * - Score: Number of guesses made
   */

  async getPlayerCount(postId: PostId): Promise<number> {
    const key = this.keys.postUserGuessCounter(postId);
    return await this.redis.zCard(key);
  }

  /*
   * Post Guess Comments
   * A hash map of guesses with the commentIds backing them.
   */

  async getGuessComments(postId: PostId): Promise<{ [guess: string]: string[] }> {
    const key = this.keys.guessComments(postId);
    const data = await this.redis.hGetAll(key);
    // TODO: Update this so it doesn't blow up at scale
    const parsedData: { [guess: string]: CommentId[] } = {};
    Object.entries(data).forEach(([guess, commentId]) => {
      if (!parsedData[guess]) {
        parsedData[guess] = [];
      }
      parsedData[guess].push(commentId as CommentId);
    });

    return parsedData;
  }

  async getGuessComment(postId: PostId, commentId: CommentId): Promise<string | undefined> {
    const key = this.keys.guessComments(postId);
    return await this.redis.hGet(key, commentId);
  }

  async saveGuessComment(postId: PostId, guess: string, commentId: string): Promise<void> {
    await this.redis.hSet(this.keys.guessComments(postId), { [guess]: commentId });
  }

  async removeGuessComment(postId: PostId, commentId: CommentId): Promise<void> {
    const key = this.keys.guessComments(postId);
    await this.redis.hDel(key, [commentId]);
  }

  /*
   * Scores
   *
   * A sorted set for the in-game points and scoreboard unit
   * - Member: Username
   * - Score: Number of points currently held
   */

  async getScores(maxLength: number = 10): Promise<ScoreBoardEntry[]> {
    const options: ZRangeOptions = { reverse: true, by: 'rank' };
    return await this.redis.zRange(this.keys.scores, 0, maxLength - 1, options);
  }

  async getUserScore(username: string | null): Promise<{
    rank: number;
    score: number;
  }> {
    const defaultValue = { rank: -1, score: 0 };
    if (!username) return defaultValue;
    try {
      const [rank, score] = await Promise.all([
        this.redis.zRank(this.keys.scores, username),
        // TODO: Remove .zScore when .zRank supports the WITHSCORE option
        this.redis.zScore(this.keys.scores, username),
      ]);
      return {
        rank: rank === undefined ? -1 : rank,
        score: score === undefined ? 0 : score,
      };
    } catch (error) {
      if (error) {
        console.error('Error fetching user score board entry', error);
      }
      return defaultValue;
    }
  }

  async incrementUserScore(username: string, amount: number): Promise<number> {
    if (this.scheduler === undefined) {
      console.error('Scheduler not available in Service');
      return 0;
    }
    const key = this.keys.scores;
    const prevScore = (await this.redis.zScore(key, username)) ?? 0;
    const nextScore = await this.redis.zIncrBy(key, username, amount);
    const prevLevel = getLevelByScore(prevScore);
    const nextLevel = getLevelByScore(nextScore);
    if (nextLevel.rank > prevLevel.rank) {
      await this.scheduler.runJob({
        name: 'USER_LEVEL_UP',
        data: {
          username,
          score: nextScore,
          prevLevel,
          nextLevel,
        },
        runAt: new Date(),
      });
    }

    return nextScore;
  }

  /*
   * Post Guesses
   *
   * A sorted set that tracks how many times each guess has been made:
   * - Member: Guess
   * - Score: Count
   */
  //TODO FIGURE Out what does what here
  async getPostGuesses(postId: PostId): Promise<PostGuesses> {
    const key = this.keys.postGuesses(postId);
    const data = await this.redis.zRange(key, 0, -1);

    const parsedData: PostGuesses = {
      guesses: {},
      wordCount: 0,
      guessCount: 0,
    };

    data.forEach((value) => {
      const { member: guess, score: count } = value;
      parsedData.guesses[guess] = count;
      parsedData.guessCount += count;
      parsedData.wordCount += 1;
    });

    return parsedData;
  }

  /*
   * User Riddles
   *
   * All shared riddles are stored in a sorted set for each player:
   * - Member: Post ID
   * - Score: Unix epoch time
   */

  async getUserRiddles(
    username: string,
    options?: {
      min?: number;
      max?: number;
    }
  ): Promise<PostId[]> {
    try {
      const key = this.keys.userRiddles(username);
      const start = options?.min ?? 0;
      const stop = options?.max ?? -1;
      const data = await this.redis.zRange(key, start, stop, {
        reverse: true,
        by: 'rank',
      });
      if (!data || data === undefined) return [];
      return data.map((value) => value.member as PostId);
    } catch (error) {
      if (error) {
        console.error('Error fetching user riddles:', error);
      }
      return [];
    }
  }

  /*
   * Post data
   */

  async getPostType(postId: PostId) {
    const key = this.keys.postData(postId);
    const postType = await this.redis.hGet(key, 'postType');
    const defaultPostType = 'game';
    return (postType ?? defaultPostType) as PostType;
  }

  /*
   * Game Post data
   */

  async getGamePost(postId: PostId): Promise<GamePostData> {
    const [postData, solvedCount, skippedCount] = await Promise.all([
      // TODO: Use hMGet to only fetch needed fields when available
      this.redis.hGetAll(this.keys.postData(postId)),
      this.redis.zCard(this.keys.postSolved(postId)),
      this.redis.zCard(this.keys.postSkipped(postId)),
    ]);
    return {
      postId: postId,
      postType: postData.postType as PostType,
      authorUsername: postData.authorUsername,
      riddle: postData.riddle,
      answer: postData.answer,
      category: postData.category ?? "Riddle",
      date: parseInt(postData.date),
      solves: solvedCount,
      skips: skippedCount,
    };
  }

  async getGamePosts(postIds: PostId[]): Promise<Pick<GamePostData, 'postId' | 'riddle'>[]> {
    return await Promise.all(
      postIds.map(async (postId) => {
        const key = this.keys.postData(postId);
        const riddle = await this.redis.hGet(key, 'riddle');
        return {
          postId,
          riddle: riddle ?? "",
        };
      })
    );
  }

  async updateGamePostPreview(
    postId: PostId,
    game: GamePostData,
    playerCount: number,
  ): Promise<void> {
    const post = await this.reddit?.getPostById(postId);
    try {
      await post?.setCustomPostPreview(() => (
        <GuessScreenSkeleton
          riddle={game.riddle}
          playerCount={playerCount}
        />
      ));
    } catch (error) {
      console.error('Failed updating riddle preview', error);
    }
  }

  /*
   * Skip Post
   */

  async skipPost(postId: PostId, username: string): Promise<void> {
    const key = this.keys.postSkipped(postId);
    await this.redis.zAdd(key, {
      member: username,
      score: Date.now(),
    });
  }

  /*
   * Handle riddle submissions
   */

  async submitRiddle(data: {
    postId: PostId;
    riddle: string;
    category: string;
    answer: string;
    authorUsername: string;
    subreddit: string;
  }): Promise<void> {
    if (!this.scheduler || !this.reddit) {
      console.error('submitRiddle: Scheduler/Reddit API client not available');
      return;
    }
    const key = this.keys.postData(data.postId);
    await Promise.all([
      // Save post object
      this.redis.hSet(key, {
        postId: data.postId,
        riddle: data.riddle,
        answer: data.answer,
        category: data.category,
        authorUsername: data.authorUsername,
        date: Date.now().toString(),
        postType: PostType.GAME,
      }),

      // Save the post to the user's riddles
      this.redis.zAdd(this.keys.userRiddles(data.authorUsername), {
        member: data.postId,
        score: Date.now(),
      }),

      // Save the post to the word's riddles
      this.redis.zAdd(this.keys.wordRiddles(data.answer), {
        member: data.postId,
        score: Date.now(),
      }),

      // Schedule a job to pin the TLDR comment
      this.scheduler.runJob({
        name: 'GAME_PINNED_TLDR_COMMENT',
        data: { postId: data.postId },
        runAt: new Date(Date.now()),
      }),
      // Give points to the user for posting
      this.incrementUserScore(data.authorUsername, Settings.authorRewardForSubmit),
    ]);
  }

  /*
   * Game settings
   */

  async storeGameSettings(settings: { [field: string]: string }): Promise<void> {
    const key = this.keys.gameSettings;
    await this.redis.hSet(key, settings);
  }

  async getGameSettings(): Promise<GameSettings> {
    const key = this.keys.gameSettings;
    const settings = (await this.redis.hGetAll(key));
    let riddleCategories = (await this.settings?.get<string>("riddleCategories"))?.split(",") ?? Settings.defaultRiddleCategories;
    return { ...settings, riddleCategories: riddleCategories } as GameSettings;
  }


  /*
   * Pinned Post
   */

  async savePinnedPost(postId: PostId): Promise<void> {
    const key = this.keys.postData(postId);
    await this.redis.hSet(key, {
      postId,
      postType: PostType.PINNED,
    });
  }

  async getPinnedPost(postId: PostId): Promise<PinnedPostData> {
    const key = this.keys.postData(postId);
    const postType = await this.redis.hGet(key, 'postType');
    return {
      postId,
      postType: postType as PostType ?? PostType.PINNED,
    };
  }

  /*
   * User Data and State Persistence
   */

  async saveUserData(
    username: string,
    data: { [field: string]: string | number | boolean }
  ): Promise<void> {
    const key = this.keys.userData(username);
    const stringConfig = Object.fromEntries(
      Object.entries(data).map(([key, value]) => [key, String(value)])
    );
    await this.redis.hSet(key, stringConfig);
  }

  async getUser(username: string | null, postId: PostId): Promise<UserData | null> {
    if (!username) return null;
    const data = await this.redis.hGetAll(this.keys.userData(username));
    const solved = !!(await this.redis.zScore(this.keys.postSolved(postId), username));
    const skipped = !!(await this.redis.zScore(this.keys.postSkipped(postId), username));
    const guessCount =
      (await this.redis.zScore(this.keys.postUserGuessCounter(postId), username)) ?? 0;

    const user = await this.getUserScore(username);
    const level = getLevelByScore(user.score);
    const parsedData: UserData = {
      score: user.score,
      levelRank: data.levelRank ? parseInt(data.levelRank) : level.rank,
      levelName: data.levelName ?? level.name,
      solved,
      skipped,
      guessCount,
    };
    return parsedData;
  }
  async getUsernameWithCache(userId: string | undefined) {
    if (!userId || !this.redis || !this.reddit) return null; // Return early if no userId
    const cacheKey = 'cache:userId-username';
    const cache = await this.redis.hGet(cacheKey, userId);
    if (cache) {
      return cache;
    } else {
      const user = await this.reddit.getUserById(userId);
      if (user) {
        await this.redis.hSet(cacheKey, {
          [userId]: user.username,
        });
        return user.username;
      }
    }
    return null;
  };
}
