import { accountNode, argumentValueNode, assertIsNode, bottomUpTransformerVisitor, bytesTypeNode, createFromRoot, definedTypeLinkNode, getLastNodeFromPath, instructionNode, instructionRemainingAccountsNode, isNode, programNode, rootNodeVisitor, structFieldTypeNode, structTypeNode } from "codama";
import mplAccountCompressionIdl from "./idls/mpl_account_compression.json" with { type: "json" };
import mplNoopIdl from "./idls/mpl_noop.json" with { type: "json" };
import { rootNodeFromAnchor, type AnchorIdl } from "@codama/nodes-from-anchor";
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

codama.update(
  bottomUpTransformerVisitor([
    // Add nodes to the mplAccountCompression program.
    {
      select: '[programNode]mplAccountCompression',
      transform: (node) => {
        assertIsNode(node, 'programNode');
        return programNode({
          ...node,
          accounts: [
            ...node.accounts,
            accountNode({
              name: "merkleTree",
              data: structTypeNode([
                structFieldTypeNode({
                  name: "discriminator",
                  type: definedTypeLinkNode("compressionAccountType"),
                }),
                structFieldTypeNode({
                  name: "treeHeader",
                  type: definedTypeLinkNode("concurrentMerkleTreeHeaderData"),
                }),
                structFieldTypeNode({
                  name: "serializedTree",
                  type: bytesTypeNode(),
                }),
              ])
            })
          ]
        })
      }
    },
    // // Use extra "proof" arg as remaining accounts.
    {
      select: '[instructionNode]verifyLeaf',
      transform: (node) => {
        assertIsNode(node, 'instructionNode');
        return instructionNode({
          ...node,
          remainingAccounts: [
            instructionRemainingAccountsNode(argumentValueNode("proof"), {
              isOptional: true,
            }),
          ],
        })
      }
    }
  ])
)

// Render tree.
writeFileSync(
  path.join("trees", "codama.json"),
  JSON.stringify(JSON.parse(codama.getJson()), null, 2)
);
