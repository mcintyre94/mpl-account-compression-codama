import { createFromRoot, rootNodeVisitor } from "codama";
import mplAccountCompressionIdl from "./idls/mpl_account_compression.json" with { type: "json" };
import mplNoopIdl from "./idls/mpl_noop.json" with { type: "json" };
import { rootNodeFromAnchor, type AnchorIdl }  from "@codama/nodes-from-anchor";
import path from "node:path";
import { writeFileSync } from "node:fs";

const codama = createFromRoot(rootNodeFromAnchor(mplAccountCompressionIdl as AnchorIdl));

// Add the program from mpl_noop as an additional program.
const codamaNoopRoot = rootNodeFromAnchor(mplNoopIdl as AnchorIdl);

codama.update(
  rootNodeVisitor((node) => ({
    ...node,
    additionalPrograms: [...node.additionalPrograms, codamaNoopRoot.program],
  }))
);

// Render tree.
writeFileSync(
  path.join("trees", "codama.json"),
  JSON.stringify(JSON.parse(codama.getJson()), null, 2)
);
