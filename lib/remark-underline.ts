import type { Root } from "mdast";

type Node = {
  type: string;
  value?: string;
  children?: Node[];
  data?: { hName?: string };
};

// Recognize only a bare <u> pair. Never interpret arbitrary HTML or attributes.
export function remarkUnderline() {
  return (tree: Root) => {
    function visit(node: Node) {
      const children = node.children;
      if (!children) return;
      children.forEach(visit);
      for (let start = 0; start < children.length; start++) {
        if (children[start].type !== "html" || children[start].value !== "<u>")
          continue;
        let depth = 1;
        for (let end = start + 1; end < children.length; end++) {
          const child = children[end];
          if (child.type !== "html") continue;
          if (child.value === "<u>") depth++;
          if (child.value !== "</u>" || --depth !== 0) continue;
          const underline: Node = {
            type: "emphasis",
            data: { hName: "u" },
            children: children.slice(start + 1, end),
          };
          visit(underline);
          children.splice(start, end - start + 1, underline);
          break;
        }
      }
    }
    visit(tree);
  };
}
