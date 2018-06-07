// @flow

import type {NodeAddress, EdgeAddress} from "./_address";
import {
  assertNodeAddress,
  assertEdgeAddress,
  edgeAddress,
  edgeAppend,
  edgeHasPrefix,
  edgeToString,
  nodeAddress,
  nodeAppend,
  nodeHasPrefix,
  nodeToString,
  toParts,
} from "./_address";

describe("core/address", () => {
  function throwOnNullOrUndefined(f) {
    [null, undefined].forEach((bad) => {
      it(`${f.name} throws on ${String(bad)}`, () => {
        // $ExpectFlowError
        expect(() => f(bad)).toThrow(String(bad));
      });
    });
  }

  function checkAddressFactory(f) {
    describe(f.name, () => {
      throwOnNullOrUndefined(f);
      [null, undefined].forEach((bad) => {
        it(`throws on parts containing ${String(bad)}`, () => {
          // $ExpectFlowError
          expect(() => f(["foo", bad])).toThrow(String(bad));
        });
      });
      describe("composes to identity with toParts", () => {
        function checkIdentity(name, example) {
          it(name, () => {
            expect(toParts(f(example))).toEqual(example);
          });
        }
        checkIdentity("on a simple example", ["an", "example"]);
        describe("with an empty component", () => {
          checkIdentity("at the start", ["", "example"]);
          checkIdentity("in the middle", ["example", "", "foo"]);
          checkIdentity("at the end", ["example", "", "foo", ""]);
        });
        checkIdentity("with an empty array", []);
      });
    });
  }
  checkAddressFactory(nodeAddress);
  checkAddressFactory(edgeAddress);

  describe("toParts", () => {
    throwOnNullOrUndefined(toParts);
    it("throws on malformed address", () => {
      // $ExpectFlowError
      expect(() => toParts("zookomoobo")).toThrow(/expected .*Address/);
    });
    it("throws on fake (slash-separated) node address", () => {
      // $ExpectFlowError
      expect(() => toParts("N/bad/stuff\0")).toThrow();
    });
    it("throws on fake (slash-separated) edge address", () => {
      // $ExpectFlowError
      expect(() => toParts("E/bad/stuff\0")).toThrow();
    });
  });

  describe("node and edge addresses are distinct", () => {
    it("at a type level", () => {
      // $ExpectFlowError
      const _unused_edgeAddress: EdgeAddress = nodeAddress([]);
      // $ExpectFlowError
      const _unused_nodeAddress: NodeAddress = edgeAddress([]);
    });
    describe("at a value level", () => {
      it("base address", () => {
        expect(nodeAddress([])).not.toEqual(edgeAddress([]));
      });
      it("normal address", () => {
        expect(nodeAddress(["foo"])).not.toEqual(edgeAddress(["foo"]));
      });
    });
  });

  function checkAppend<
    Good: NodeAddress | EdgeAddress,
    Bad: NodeAddress | EdgeAddress
  >(
    f: (Good, ...string[]) => Good,
    goodConstructor: (string[]) => Good,
    badConstructor: (string[]) => Bad
  ) {
    describe(f.name, () => {
      describe("errors on", () => {
        [null, undefined].forEach((bad) => {
          it(`${String(bad)} base input`, () => {
            // $ExpectFlowError
            expect(() => f(bad, "foo")).toThrow(String(bad));
          });
          it(`${String(bad)} component`, () => {
            // $ExpectFlowError
            expect(() => f(goodConstructor(["foo"]), bad)).toThrow(String(bad));
          });
        });
        it("malformed base", () => {
          // $ExpectFlowError
          expect(() => f("foo", "foo")).toThrow("bad address");
        });
        it("base of wrong kind", () => {
          // $ExpectFlowError
          expect(() => f(badConstructor(["foo"]), "foo")).toThrow(
            /expected.*Address/
          );
        });
        it("invalid component", () => {
          expect(() => f(goodConstructor(["foo"]), "foo\0oo"));
        });
      });

      describe("works on", () => {
        function check(
          description: string,
          baseComponents: string[],
          ...components: string[]
        ) {
          test(description, () => {
            const base = goodConstructor(baseComponents);
            const expectedParts = [...baseComponents, ...components];
            expect(toParts(f(base, ...components))).toEqual(expectedParts);
          });
        }
        check("the base address with no extra component", []);
        check("the base address with empty component", [], "");
        check("the base address with nonempty component", [], "a");
        check("the base address with lots of components", [], "a", "b");

        check("a longer address with no extra component", ["a", ""]);
        check("a longer address with empty component", ["a", ""], "");
        check("a longer address with nonempty component", ["a", ""], "b");
        check("a longer address with lots of components", ["a", ""], "b", "c");
      });
    });
  }
  checkAppend(nodeAppend, nodeAddress, edgeAddress);
  checkAppend(edgeAppend, edgeAddress, nodeAddress);

  function checkToString<
    Good: NodeAddress | EdgeAddress,
    Bad: NodeAddress | EdgeAddress
  >(
    f: (Good) => string,
    kind: "NodeAddress" | "EdgeAddress",
    goodConstructor: (string[]) => Good,
    badConstructor: (string[]) => Bad
  ) {
    describe(f.name, () => {
      describe("errors on", () => {
        [null, undefined].forEach((bad) => {
          it(`${String(bad)} base input`, () => {
            // $ExpectFlowError
            expect(() => f(bad)).toThrow(String(bad));
          });
        });
        it("wrong kind", () => {
          // $ExpectFlowError
          expect(() => f(badConstructor(["foo"]))).toThrow(`expected ${kind}`);
        });
      });

      describe("works on", () => {
        const camelKind = kind.charAt(0).toLowerCase() + kind.substring(1);
        test("the empty address", () => {
          expect(f(goodConstructor([]))).toEqual(`${camelKind}([])`);
        });
        test("the address with one empty component", () => {
          expect(f(goodConstructor([""]))).toEqual(`${camelKind}([""])`);
        });
        test("a normal address", () => {
          expect(f(goodConstructor(["one", "", "two"]))).toEqual(
            `${camelKind}(["one","","two"])`
          );
        });
      });
    });
  }
  checkToString(nodeToString, "NodeAddress", nodeAddress, edgeAddress);
  checkToString(edgeToString, "EdgeAddress", edgeAddress, nodeAddress);

  function checkHasPrefix<
    Good: NodeAddress | EdgeAddress,
    Bad: NodeAddress | EdgeAddress
  >(
    hasPrefix: (Good, Good) => boolean,
    kind: "NodeAddress" | "EdgeAddress",
    goodConstructor: (string[]) => Good,
    badConstructor: (string[]) => Bad
  ) {
    describe(hasPrefix.name, () => {
      describe("errors on", () => {
        [null, undefined].forEach((bad) => {
          it(`${String(bad)} base input`, () => {
            // $ExpectFlowError
            expect(() => hasPrefix(bad)).toThrow(String(bad));
          });
        });
        it("wrong kind", () => {
          // $ExpectFlowError
          expect(() => hasPrefix(badConstructor(["foo"]))).toThrow(
            `expected ${kind}`
          );
        });
      });

      const address = goodConstructor;
      it("accepts the empty prefix of non-empty input", () => {
        expect(hasPrefix(address(["foo", "bar"]), address([]))).toBe(true);
      });
      it("accepts the empty prefix of empty input", () => {
        expect(hasPrefix(address([]), address([]))).toBe(true);
      });
      it("rejects a non-empty prefix of empty input", () => {
        expect(hasPrefix(address([]), address(["foo", "bar"]))).toBe(false);
      });
      it("accepts a normal input", () => {
        expect(
          hasPrefix(address(["foo", "bar", "baz"]), address(["foo", "bar"]))
        ).toBe(true);
      });
      it("accepts that an address is a prefix of itself", () => {
        expect(
          hasPrefix(address(["foo", "bar"]), address(["foo", "bar"]))
        ).toBe(true);
      });
      it("accepts inputs with empty components", () => {
        expect(
          hasPrefix(
            address(["foo", "", "bar", "", "baz"]),
            address(["foo", "", "bar", ""])
          )
        ).toBe(true);
      });
      it("rejects inputs with no nontrivial common prefix", () => {
        expect(
          hasPrefix(address(["foo", "bar", "baz"]), address(["bar", "foo"]))
        ).toBe(false);
      });
      it("rejects inputs with insufficiently long common prefix", () => {
        expect(
          hasPrefix(address(["foo", "bar", "baz"]), address(["foo", "quux"]))
        ).toBe(false);
      });
      it("rejects when the putative prefix is a proper infix", () => {
        expect(
          hasPrefix(address(["foo", "bar", "baz"]), address(["bar"]))
        ).toBe(false);
      });
      it("rejects when the putative prefix is a proper suffix", () => {
        expect(
          hasPrefix(address(["foo", "bar", "baz"]), address(["bar", "baz"]))
        ).toBe(false);
      });
      it("rejects when the arguments are reversed", () => {
        expect(
          hasPrefix(address(["foo", "bar"]), address(["foo", "bar", "baz"]))
        ).toBe(false);
      });
      it("rejects when the last component is truncated", () => {
        expect(
          hasPrefix(address(["foo", "bar", "baz"]), address(["foo", "ba"]))
        ).toBe(false);
      });
      it("rejects when two components have been concatenated", () => {
        expect(
          hasPrefix(address(["foo", "bar", "baz"]), address(["foobar", "baz"]))
        ).toBe(false);
      });
      it("rejects an extra empty component in the middle of the base", () => {
        expect(
          hasPrefix(address(["foo", "", "baz"]), address(["foo", "baz"]))
        ).toBe(false);
      });
      it("rejects an extra empty component in the middle of the prefix", () => {
        expect(
          hasPrefix(address(["foo", "baz"]), address(["foo", "", "baz"]))
        ).toBe(false);
      });
      it("rejects an extra empty component at the end of the prefix", () => {
        expect(
          hasPrefix(address(["foo", "baz"]), address(["foo", "baz", ""]))
        ).toBe(false);
      });
    });
  }
  checkHasPrefix(nodeHasPrefix, "NodeAddress", nodeAddress, edgeAddress);
  checkHasPrefix(edgeHasPrefix, "EdgeAddress", edgeAddress, nodeAddress);

  describe("type assertions", () => {
    function checkAssertion(f, good, bad, badMsg) {
      describe(f.name, () => {
        it("does not error on the right type of address", () => {
          // Technically, the below invocation isn't an error; but no need to
          // persuade Flow of this, as we already check that Node/Edge
          // addresses are handled correctly by flow in a different test case.
          f((good: any));
        });
        throwOnNullOrUndefined(f);
        it("errors on the wrong type of address", () => {
          // $ExpectFlowError
          expect(() => f(bad)).toThrow(badMsg);
        });
        it("errors on non-address", () => {
          it("errors on the wrong type of address with a custom message", () => {
            // $ExpectFlowError
            expect(() => f(bad, "widget")).toThrow(
              new RegExp("widget:.*" + badMsg)
            );
          });
          // $ExpectFlowError
          expect(() => f("foomulous")).toThrow("bad address:");
        });
      });
    }
    checkAssertion(
      assertNodeAddress,
      nodeAddress([]),
      edgeAddress([]),
      "got EdgeAddress"
    );
    checkAssertion(
      assertEdgeAddress,
      edgeAddress([]),
      nodeAddress([]),
      "got NodeAddress"
    );
  });
});