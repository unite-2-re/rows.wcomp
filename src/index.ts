export * from "./$core$/FlexLike";
import FlexLike, { preInit } from "./$core$/FlexLike";
export default FlexLike;

// @ts-ignore
import { loadBlobStyle } from "/externals/lib/dom.js";

//
loadBlobStyle(preInit);
