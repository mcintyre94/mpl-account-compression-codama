import { accountNode, assertIsNode, bottomUpTransformerVisitor, bytesTypeNode, createFromRoot, definedTypeLinkNode, programNode, rootNodeVisitor, structFieldTypeNode, structTypeNode } from "codama";
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
    }
  ])
)

/*
kinobi.update(
  new k.TransformNodesVisitor([
    {
      // Use extra "proof" arg as remaining accounts.
      selector: (node) =>
        k.isInstructionNode(node) &&
        [
          "verifyLeaf",
        ].includes(node.name),
      transformer: (node) => {
        k.assertInstructionNode(node);
        return k.instructionNode({
          ...node,
          remainingAccounts: k.remainingAccountsFromArg("proof"),
          argDefaults: {
            ...node.argDefaults,
            proof: k.valueDefault(k.vList([])),
          },
          extraArgs: k.instructionExtraArgsNode({
            ...node.extraArgs,
            struct: k.structTypeNode([
              ...node.extraArgs.struct.fields,
              k.structFieldTypeNode({
                name: "proof",
                child: k.arrayTypeNode(k.publicKeyTypeNode()),
              }),
            ]),
          }),
        });
      },
    },
  ])
);
*/

// Render tree.
writeFileSync(
  path.join("trees", "codama.json"),
  JSON.stringify(JSON.parse(codama.getJson()), null, 2)
);
