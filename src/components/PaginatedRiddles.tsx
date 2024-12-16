import { Devvit, useState } from '@devvit/public-api';

import Settings from '../settings.json' assert { type: "json" };
import type { CollectionData } from '../types.js';
import { StyledButton } from './StyledButton.js';
import { Riddles } from './Riddles.js';

interface PaginatedRiddlesProps {
  riddles:
  | {
    postId: string;
    riddle: string;
  }[]
  | CollectionData[]
  | null;
  tileSize: number;
  riddlesPerRow: number;
  ctaButtonEl: JSX.Element;
}

const DEFAULT_TILE_SIZE = 88;

export const PaginatedRiddles: Devvit.BlockComponent<PaginatedRiddlesProps> = ({
  tileSize = DEFAULT_TILE_SIZE,
  riddles,
  riddlesPerRow,
  ctaButtonEl,
}) => {
  if (riddles?.length === 0) {
    return null;
  }

  const rowsPerPage = 3;
  const [paginationOffset, setPaginationOffset] = useState(0);

  // Use context dimensions unless max riddles per row is specified
  const rows = riddles ? Math.ceil(riddles.length / riddlesPerRow) : 0;
  const hasOverflow = paginationOffset + rowsPerPage < rows;

  const gridWidth = riddlesPerRow * (tileSize + 4) + (riddlesPerRow - 1) * 8;
  const cutOffWidth = gridWidth;

  return (
    <vstack grow width="100%" alignment="center">
      <spacer height="24px" />

      <Riddles
        riddles={riddles}
        tileSize={tileSize}
        rowsPerPage={rowsPerPage}
        riddlesPerRow={riddlesPerRow}
        paginationOffset={paginationOffset}
      ></Riddles>

      {hasOverflow && (
        <vstack width={`${cutOffWidth}px`} height="4px" backgroundColor={Settings.theme.tertiary} />
      )}

      <spacer grow />

      {/* Footer */}
      <hstack gap="small" width={`${gridWidth}px`} alignment="center">
        {ctaButtonEl}
        {(hasOverflow || paginationOffset > 0) && <spacer grow />}
        {paginationOffset > 0 && (
          <StyledButton
            leadingIcon="arrow-up"
            onPress={() => setPaginationOffset((x) => x - rowsPerPage)}
            width="32px"
            height="32px"
          />
        )}
        {hasOverflow && (
          <StyledButton
            leadingIcon="arrow-down"
            onPress={() => setPaginationOffset((x) => x + rowsPerPage)}
            width="32px"
            height="32px"
          />
        )}
      </hstack>

      <spacer height="20px" />
    </vstack>
  );
};
