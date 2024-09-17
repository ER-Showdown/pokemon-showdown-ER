import { execSync } from "child_process";
import fs from "fs";

const config = {
	dexGithub: "https://github.com/ForwardFeed/ER-nextdex.git",
	repoLocation: "dex_repo",
	dexBranch: "main",
};

function cloneDexRepo() {
	if (!fs.existsSync(config.repoLocation)) {
		execSync(`git clone ${config.dexGithub} ${config.repoLocation}`);
	}

	execSync(`git -C ${config.repoLocation} checkout ${config.dexBranch}`);
	execSync(`git -C ${config.repoLocation} pull`);
}

async function main() {
	cloneDexRepo();
}

main().then(() => process.exit(0));
