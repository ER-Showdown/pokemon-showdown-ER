import fetch from "node-fetch";

import { DexParser } from "./dex-parser";

async function main() {
	const parser = new DexParser();
	await parser.init();
}

main().then(() => process.exit(0));
