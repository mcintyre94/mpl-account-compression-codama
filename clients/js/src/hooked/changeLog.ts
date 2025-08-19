import {
    Address,
    fixCodecSize,
    FixedSizeCodec,
    getAddressCodec,
    getArrayCodec,
    getStructCodec,
    getU32Codec,
} from "@solana/kit";

export type ChangeLog = {
    root: Address;
    pathNodes: Address[];
    index: number;
};

export type ChangeLogArgs = ChangeLog;

export function getChangeLogCodec(maxDepth: number): FixedSizeCodec<ChangeLog> {
    return getStructCodec([
        ["root", getAddressCodec()],
        ["pathNodes", getArrayCodec(getAddressCodec(), { size: maxDepth })],
        ["index", fixCodecSize(getU32Codec(), 8)],
    ]);
}
