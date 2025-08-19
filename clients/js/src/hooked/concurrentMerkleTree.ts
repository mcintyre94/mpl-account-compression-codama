import {
    getAddressEncoder,
    getArrayCodec,
    getStructCodec,
    getU64Codec,
    ReadonlyUint8Array,
} from "@solana/kit";
import { ChangeLog, ChangeLogArgs, getChangeLogCodec } from "./changeLog";
import { getPathCodec, Path, PathArgs } from "./path";

export type ConcurrentMerkleTree = {
    sequenceNumber: bigint;
    activeIndex: bigint;
    bufferSize: bigint;
    changeLogs: ChangeLog[];
    rightMostPath: Path;
};

export type ConcurrentMerkleTreeArgs = {
    sequenceNumber: bigint | number;
    activeIndex: bigint | number;
    bufferSize: bigint | number;
    changeLogs: ChangeLogArgs[];
    rightMostPath: PathArgs;
};

export function getConcurrentMerkleTreeCodec(
    maxDepth: number,
    maxBufferSize: number
) {
    return getStructCodec([
        ["sequenceNumber", getU64Codec()],
        ["activeIndex", getU64Codec()],
        ["bufferSize", getU64Codec()],
        [
            "changeLogs",
            getArrayCodec(getChangeLogCodec(maxDepth), { size: maxBufferSize }),
        ],
        ["rightMostPath", getPathCodec(maxDepth)],
    ]);
}

export function getCurrentRoot(
    tree: Pick<ConcurrentMerkleTreeArgs, "changeLogs" | "activeIndex">
): ReadonlyUint8Array {
    return getAddressEncoder().encode(
        tree.changeLogs[Number(tree.activeIndex)].root
    );
}
