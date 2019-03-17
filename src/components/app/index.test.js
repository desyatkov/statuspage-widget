/* eslint-env node, jest */

import { h } from "preact";
import render from "preact-render-to-string";
import App from "../app";

describe("Hello logic", () => {
  it("should be able to run tests", () => {
    expect(1 + 2).toEqual(3);
  });
});

describe("Hello Snapshot", () => {
  it("should render header with content", () => {
    const tree = render(<App />);
    expect(tree).toMatchSnapshot();
  });
});
