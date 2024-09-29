"use strict";

const assert = require("./../../assert");
const common = require("./../../common");

let battle;

describe("Sharing is Caring", function () {
	afterEach(function () {
		battle.destroy();
	});

	const er = common.mod("gen8eliteredux");

	it(`opposing fearmonger should lower their stats as well, and not break the battle sim`, function () {
		battle = er.createBattle({ formatid: "elitereduxdoublesou@@@!teampreview", gameType: "doubles"}, [
			[
				{
					species: "Gholdengo",
					ability: "sharingiscaring",
					moves: ["sleeptalk"],
				},
				{
					species: "Mew",
					moves: ["sleeptalk"],
				}
			],
			[
				{
					species: "Roaring Moon",
					ability: "fearmonger",
					moves: ["swordsdance"],
				},
				{
					species: "Miltank",
					moves: ["sleeptalk"]
				},
			],
		]);

		const gholdengo = battle.p1.active[0];
		const mew = battle.p1.active[1];
		const roaringmoon = battle.p2.active[0];
		const miltank = battle.p2.active[1];

		assert.statStage(gholdengo, "atk", -2);
		assert.statStage(gholdengo, "spa", -2);

		/// Mew gets hit by roaring moon's fearmonger and gholdengo's sharing is caring stat drops.
		assert.statStage(mew, "atk", -2);
		assert.statStage(mew, "spa", -2);

		assert.statStage(roaringmoon, "atk", -2);
		assert.statStage(roaringmoon, "spa", -2);

		assert.statStage(miltank, "atk", -2);
		assert.statStage(miltank, "spa", -2);

		battle.makeChoices("move sleeptalk, move sleeptalk", "move swordsdance, move sleeptalk");

		assert.statStage(roaringmoon, "atk", 0);
		assert.statStage(gholdengo, "atk", 0);
		assert.statStage(mew, "atk", 0);
		assert.statStage(miltank, "atk", 0);
	
	});
});
