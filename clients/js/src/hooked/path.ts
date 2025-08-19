import {
    Address,
    FixedSizeCodec,
    getAddressCodec,
    getArrayCodec,
    getStructCodec,
    getU32Codec,
    transformCodec,
} from "@solana/kit";

export type Path = {
    proof: Address[];
    leaf: Address;
    index: number;
};

export type PathArgs = Path;

export function getPathCodec(maxDepth: number): FixedSizeCodec<PathArgs, Path> {
    return transformCodec(
        getStructCodec([
            ["proof", getArrayCodec(getAddressCodec(), { size: maxDepth })],
            ["leaf", getAddressCodec()],
            ["index", getU32Codec()],
            ["padding", getU32Codec()],
        ]),
        (path) => ({ ...path, padding: 0 }),
        (pathWithPadding) => {
            const { padding, ...path } = pathWithPadding;
            return path;
        }
    );
}
