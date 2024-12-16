import { Devvit } from '@devvit/public-api';

import type { CollectionData } from '../types.js';
interface PaginatedRiddlesProps {
  riddles:
  | {
    postId: string;
    riddle: string;
  }[]
  | CollectionData[]
  | null;

  rowsPerPage: number;
  riddlesPerRow: number;
  paginationOffset: number;
}

export const Riddles: Devvit.BlockComponent<PaginatedRiddlesProps> = (
  { riddles, rowsPerPage, riddlesPerRow, paginationOffset },
  context
) => {
  if (riddles?.length === 0) {
    return null;
  }

  const riddlesByPage = (riddles ?? [])
    .slice(paginationOffset * riddlesPerRow, (paginationOffset + rowsPerPage + 1) * riddlesPerRow)
    .map((riddle) => (
      <vstack onPress={async () =>
        context.reddit.getPostById(riddle.postId).then((post) => {
          if (!post) {
            context.ui.showToast('Post not found');
            return;
          }
          return context.ui.navigateTo(post);
        })
      } border='thick' borderColor='#e0e0e0' cornerRadius='medium' padding='small' alignment='center middle'>
        <text color="black" alignment="center" overflow="ellipsis" weight="bold" size="xxlarge">{riddle.riddle}</text>
      </vstack>
    ));

  const riddleRows = [];
  for (let i = 0; i < riddlesByPage.length; i += riddlesPerRow) {
    const elements = riddlesByPage.slice(i, i + riddlesPerRow);
    riddleRows.push(<hstack gap="small">{elements}</hstack>);
  }

  return (
    <vstack grow gap="small">
      {riddleRows.slice(paginationOffset, paginationOffset + rowsPerPage + 1)}
    </vstack>
  );
};
