import { css } from "styled-components";

export const textShorten = (numLines: number = 1) => css`
  white-space: normal;
  text-overflow: ellipsis;
  overflow: hidden;

  @supports (-webkit-line-clamp: ${numLines}) {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: initial;
    display: -webkit-box;
    -webkit-line-clamp: ${numLines};
    -webkit-box-orient: vertical;
  }
`;