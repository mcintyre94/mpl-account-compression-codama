import {
    Address,
    combineCodec,
    createDecoder,
    createEncoder,
    getAddressCodec,
    getArrayCodec,
    getStructCodec,
    getU8Codec,
    transformCodec,
    VariableSizeCodec,
    VariableSizeDecoder,
    VariableSizeEncoder,
} from "@solana/kit";
import {
    CompressionAccountType,
    ConcurrentMerkleTreeHeaderData,
    ConcurrentMerkleTreeHeaderDataArgs,
    getConcurrentMerkleTreeHeaderDataCodec,
    getConcurrentMerkleTreeHeaderDecoder,
} from "../generated";
import {
    ConcurrentMerkleTree,
    ConcurrentMerkleTreeArgs,
    getConcurrentMerkleTreeCodec,
} from "./concurrentMerkleTree";

export type MerkleTreeAccountData = {
    discriminator: CompressionAccountType;
    treeHeader: ConcurrentMerkleTreeHeaderData;
    tree: ConcurrentMerkleTree;
    canopy: Address[];
};

export type MerkleTreeAccountDataArgs = {
    treeHeader: ConcurrentMerkleTreeHeaderDataArgs;
    tree: ConcurrentMerkleTreeArgs;
    canopy: Address[];
};

export function getMerkleTreeAccountDataEncoder(): VariableSizeEncoder<MerkleTreeAccountDataArgs> {
    return createEncoder({
        write(value: MerkleTreeAccountDataArgs, bytes, offset) {
            switch (value.treeHeader.__kind) {
                case "V1":
                    return getMerkleTreeAccountDataV1Codec(
                        value.treeHeader.maxDepth,
                        value.treeHeader.maxBufferSize
                    ).write(value, bytes, offset);
                default:
                    throw new Error(
                        `Unknown MerkleTreeAccountData version: ${value.treeHeader.__kind}`
                    );
            }
        },
        getSizeFromValue(value: MerkleTreeAccountDataArgs): number {
            return getMerkleTreeSize(
                value.treeHeader.maxDepth,
                value.treeHeader.maxBufferSize,
                value.canopy.length
            );
        },
    });
}

export function getMerkleTreeAccountDataDecoder(): VariableSizeDecoder<MerkleTreeAccountData> {
    return createDecoder({
        read(bytes, offset) {
            const [{ header }] = getConcurrentMerkleTreeHeaderDecoder().read(
                bytes,
                offset
            );
            switch (header.__kind) {
                case "V1":
                    return getMerkleTreeAccountDataV1Codec(
                        header.maxDepth,
                        header.maxBufferSize
                    ).read(bytes, offset);
                default:
                    throw new Error(
                        `Unknown MerkleTreeAccountData version: ${header.__kind}`
                    );
            }
        },
    });
}

export function getMerkleTreeAccountDataCodec(): VariableSizeCodec<
    MerkleTreeAccountDataArgs,
    MerkleTreeAccountData
> {
    return combineCodec(
        getMerkleTreeAccountDataEncoder(),
        getMerkleTreeAccountDataDecoder()
    );
}

export function getMerkleTreeAccountDataV1Codec(
    maxDepth: number,
    maxBufferSize: number
): VariableSizeCodec<MerkleTreeAccountDataArgs, MerkleTreeAccountData> {
    return transformCodec(
        getStructCodec([
            ["discriminator", getU8Codec()],
            ["treeHeader", getConcurrentMerkleTreeHeaderDataCodec()],
            ["tree", getConcurrentMerkleTreeCodec(maxDepth, maxBufferSize)],
            ["canopy", getArrayCodec(getAddressCodec())],
        ]),
        (value: MerkleTreeAccountDataArgs) => ({
            ...value,
            discriminator: CompressionAccountType.ConcurrentMerkleTree,
        })
    );
}

export function getMerkleTreeSize(
    maxDepth: number,
    maxBufferSize: number,
    canopyDepth = 0
): number {
    const discriminatorSize = 1;
    const headerSize = getConcurrentMerkleTreeHeaderDataCodec().fixedSize;
    const treeSize = getConcurrentMerkleTreeCodec(
        maxDepth,
        maxBufferSize
    ).fixedSize;
    const canopySize = 32 * Math.max((1 << (canopyDepth + 1)) - 2, 0);
    return discriminatorSize + headerSize + treeSize + canopySize;
}
