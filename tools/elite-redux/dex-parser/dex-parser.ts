/**
 * NOTE: If you are getting import errors here, you need to clone the ER dex repository by running the setup-tools:
 * >>> npm run setup-er-tools
 */
import {
	CompactGameData,
	compactMove,
	CompactSpecie,
} from "../../../dex_repo/src/compactify";
import { MoveFlags } from "../../../sim/dex-moves";

export interface DexConfig {
	dexDataUrl: string;
	/**
	 * Currently it appears that all elite redux learnsets use a prefix for gen 7 of "7"
	 * If you don't need to overwrite this, don't.
	 */
	learnsetGenPrefix?: string;
}

/**
 * - M = TM/HM
 * - T = tutor
 * - L = start or level-up, 3rd char+ is the level
 * - R = restricted (special moves like Rotom moves)
 * - E = egg
 * - D = Dream World, only 5D is valid
 * - S = event, 3rd char+ is the index in .eventData
 * - V = Virtual Console or Let's Go transfer, only 7V/8V is valid
 * - C = NOT A REAL SOURCE, see note, only 3C/4C is valid
 */
export type MoveCategory =
	| "tm/hm"
	| "tutor"
	| "level-up"
	| "egg"
	| "dream-world"
	| "event"
	| "virtual-console"
	| "not-real";

export type LearnDefinition = { [moveId: string]: string[] };

function getCategoryCode(category: MoveCategory) {
	switch (category) {
		case "level-up":
			return "L";
		case "tm/hm":
			return "M";
		case "tutor":
			return "T";
		case "egg":
			return "E";
		case "dream-world":
			return "D";
		case "event":
			return "S";
		case "not-real":
			return "C";
		case "virtual-console":
			return "V";
	}
}

export interface ParsedMove {
	category: MoveCategory;
	move: compactMove;
	level?: number;
}

export class DexParser {
	gameData?: CompactGameData;
	config: DexConfig;
	moves: { [id: string]: MoveData } = {};
	learnsets: { [pokemonid: string]: LearnsetData } = {};
	pokedex: { [speciesId: string]: SpeciesData } = {};

	constructor(config?: DexConfig) {
		this.config = config ?? {
			dexDataUrl:
				"https://forwardfeed.github.io/ER-nextdex/static/js/data/gameDataVBeta2.1.json",
			// TODO: Is this still valid for ER?
			learnsetGenPrefix: "7",
		};
	}

	private async pullDexData(): Promise<CompactGameData> {
		const response = await fetch(this.config.dexDataUrl);
		return (await response.json()) as CompactGameData;
	}

	async init() {
		this.gameData = await this.pullDexData();
		this.parsePokemon();
	}

	private parseMoves() {
		for (const move of this.gameData!.moves) {
			const id = this.getShowdownMoveId(move);
			const split = this.gameData!.splitT[move.split];
			let category: "Physical" | "Special" | "Status";
			const flags = this.getMoveFlags(move);

			const showdownMove: MoveData = {
				name: move.name,
				basePower: move.pwr,
				accuracy: move.acc,
				pp: move.pp,
				category: this.getMoveCategory(move),
				type: this.getMoveType(move),
				priority: move.prio,
				target: this.getMoveTarget(move),
				flags: flags,
				breaksProtect: flags.protect == undefined,
			};
		}
	}

	private parsePokemon() {
		for (const pokemon of this.gameData!.species) {
			const learnset = this.generateLearnset(pokemon);
		}
	}

	findMoveByID(id: number): compactMove {
		const move = this.gameData!.moves.find((move) => move.id == id);
		if (move == null)
			throw new Error(
				`FATAL: Failed to find dex move referenced by id ${id}!`
			);
		return move;
	}

	private generateLearnsetCode(parsedMove: ParsedMove): string {
		const categoryCode = getCategoryCode(parsedMove.category);
		return `${this.config.learnsetGenPrefix}${categoryCode}${parsedMove.level}`;
	}

	private getMoveCategory(
		move: compactMove
	): "Physical" | "Special" | "Status" {
		const category = this.gameData!.splitT[move.split];
		switch (category) {
			case "PHYSICAL":
				return "Physical";
			case "SPECIAL":
				return "Special";
			case "STATUS":
				return "Status";
			default:
				throw new Error(
					`FATAL: Unrecognized move split value ${category} for ${move.name}`
				);
		}
	}

	private getMoveType(move: compactMove): string {
		// TODO: Dex moves can have more than one type?
		// Showdown doesn't support this.
		return this.gameData!.typeT[move.types[0]];
	}

	private getMoveTarget(move: compactMove): MoveTarget {
		const target = this.gameData!.targetT[move.target];
		switch (target) {
			case "SELECTED":
				return "any";
			case "BOTH":
				return "allAdjacentFoes";
			case "USER":
				return "self";
			case "RANDOM":
				return "randomNormal";
			case "FOES_AND_ALLY":
				return "allAdjacent";
			case "DEPENDS":
				/// TODO: What does DEPENDS mean?
				return "scripted";
			case "ALL_BATTLERS":
				return "all";
			case "OPPONENTS_FIELD":
				return "foeSide";
			case "ALLY":
				return "adjacentAlly";
		}

		throw new Error(
			`FATAL: Cannot parse dex target flag from ${target} for ${move.name}`
		);
	}

	private getMoveFlags(move: compactMove): MoveFlags {
		const flagData = move.flags.map((flag) =>
			this.gameData!.flagsT[flag].toLowerCase()
		);
		return {
			contact: flagData.includes("makes contact") ? 1 : undefined,
			/// If protect affected, we set it to undefined and check that in the higher level move definition.
			/// that's because showdown requires us to set the `breaksProtect` property on the main move def.s
			protect: flagData.includes("protect affected") ? undefined : 1,
			field: flagData.includes("field based") ? 1 : undefined,
			kick: flagData.includes("striker boost") ? 1 : undefined,
		};
	}

	private getShowdownMoveId(move: compactMove): string {
		return move.NAME.toLowerCase().replace("MOVE_", "").replace("_", "");
	}

	private generateLearnset(pokemon: CompactSpecie): LearnDefinition {
		const parsed: ParsedMove[] = [];

		for (const levelUpMove of pokemon.levelUpMoves) {
			const move = this.findMoveByID(levelUpMove.id);
			const level = levelUpMove.lv;
			parsed.push({
				move: move,
				category: "level-up",
				level: level,
			});
		}

		for (const eggMove of pokemon.eggMoves) {
			const move = this.findMoveByID(eggMove);
			parsed.push({
				move: move,
				category: "egg",
			});
		}

		for (const tmMove of pokemon.TMHMMoves) {
			const move = this.findMoveByID(tmMove);
			parsed.push({
				move: move,
				category: "tm/hm",
			});
		}

		for (const tutorMove of pokemon.tutor) {
			const move = this.findMoveByID(tutorMove);
			parsed.push({
				move: move,
				category: "tutor",
			});
		}

		const learnset: LearnDefinition = {};

		for (const parsedMove of parsed) {
			learnset[this.getShowdownMoveId(parsedMove.move)] = [
				this.generateLearnsetCode(parsedMove),
			];
		}

		return learnset;
	}
}

export async function loadDexParser(config?: DexConfig) {
	const parser = new DexParser(config);
	await parser.init();
	return parser;
}
