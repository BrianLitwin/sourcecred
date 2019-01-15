
import React from "react";
import {shallow} from "enzyme";
import {TableRow, PaddingRow, style, setTrBackground} from "./TableRow";
import {StyleSheetTestUtils} from "aphrodite/no-important";


require("../../webutil/testUtil").configureEnzyme();

// https://github.com/Khan/aphrodite/issues/62

beforeEach(() => {
  StyleSheetTestUtils.suppressStyleInjection();
});

afterEach(() => {
  StyleSheetTestUtils.clearBufferAndResumeStyleInjection();
});

describe("explorer/pagerankTable/TableRow", () => {

  function tableAtDepth(depth) {
    return shallow(
      <TableRow
        depth={depth}
        indent={1}
        showPadding={false}
        description={<span data-test-description={true} />}
        connectionProportion={0.5}
        cred={133.7}
        children={<div data-test-children={true} />}
      />
    );
  }

  it("sets correct aphrodite className and background color at depth 0 on hover", () => {

    const trStyle = tableAtDepth(0).find("tr").props().className
    const aphroditeStyle = style.trHover
    expect(trStyle).toEqual(aphroditeStyle._name)
    expect(aphroditeStyle._definition[':hover'].backgroundColor).toBe("#F5F8FA")
  })

  it("sets correct aphrodite className and background color at depth 1", () => {

    const trStyle = tableAtDepth(1).find("tr").props().className
    const bgColor = `hsla(150,100%,28%,${1 - 0.9 ** 1})`
    const aphroditeStyle = setTrBackground(bgColor)
    expect(trStyle).toBe(aphroditeStyle._name)
    expect(aphroditeStyle._definition.backgroundColor).toBe(bgColor)
  })
})
