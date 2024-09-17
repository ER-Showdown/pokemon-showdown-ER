import { execSync } from "child_process";

const config = {
	dexGithub: "https://github.com/ForwardFeed/ER-nextdex.git",
}

function cloneDexRepo() {
	execSync(`git clone ${config.dexGithub} dex_repo`);
}

async function main() {
	cloneDexRepo();
}

main().then(() => process.exit(0));
