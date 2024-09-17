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
import { SpeciesAbility } from "../../../sim/dex-species";
import { Ability as DexAbility } from "../../../dex_repo/src/abilities";

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
		this.parseMoves();
		this.parsePokemon();
	}

	private parseMoves() {
		for (const move of this.gameData!.moves) {
			const id = this.getShowdownMoveId(move);
			this.moves[id] = {
				...this.getMoveFlags(move),
				name: move.name,
				basePower: move.pwr,
				accuracy: move.acc,
				pp: move.pp,
				category: this.getMoveCategory(move),
				type: this.getMoveType(move),
				priority: move.prio,
				target: this.getMoveTarget(move),
			};
		}
	}

	private parsePokemon() {
		for (const pokemon of this.gameData!.species) {
			const learnset = this.generateLearnset(pokemon);
			const id = pokemon.name.toLowerCase();
			this.learnsets[id] = learnset;
			this.pokedex[id] = {
				name: pokemon.name,
				types: pokemon.stats.types.map(
					(index) => this.gameData!.typeT[index]
				),
				num: pokemon.id,
				abilities: this.getAbilityData(pokemon),
				baseStats: this.getBaseStats(pokemon),
				eggGroups: this.getEggGroups(pokemon),
				// TODO: Can we prefill this value?
				weightkg: 0,
			};
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

	/**
	 * Parse the move flags from the ER dex data structure.
	 * Returns a partial of move data object because not all move flag related fields are stored on the move flags object.
	 * @param move The dex move object.
	 * @returns The partial with all populated fields from the dex flags.
	 */
	private getMoveFlags(
		move: compactMove
	): Partial<MoveData> & { flags: MoveFlags } {
		// TODO: dmg 2x in air flag
		// TODO: dmg in air flag
		// TODO: dmg underwater flag
		// TODO: dmg underground flag
		// TODO: dmg ungrounded ignore type if flying flag
		// TODO: kings rock affected flag

		const flagData = move.flags.map((flag) =>
			this.gameData!.flagsT[flag].toLowerCase()
		);
		return {
			breaksProtect: flagData.includes("protect affected"),
			critRatio: flagData.includes("high crit") ? 2 : undefined,
			willCrit: flagData.includes("always_crit") ? true : undefined,
			// TODO: validate sheer force flag implementation
			secondary: flagData.includes("sheer force boost") ? {} : undefined,
			multihit: flagData.includes("two strikes") ? 2 : undefined,
			// TODO: Hardcoded recoil value of 1/3. needs updated.
			recoil: flagData.includes("reckless boost") ? [1, 3] : undefined,
			ignoreDefensive: flagData.includes("stat stages ignored")
				? true
				: undefined,
			ignoreAbility: flagData.includes("target ability ignored")
				? true
				: undefined,
			/// For protection moves (protect, kingsshield, etc) the id of the move is set as the volatileStatus.
			/// TODO: Validate all protect moves come across okay.
			volatileStatus: flagData.includes("protection move")
				? this.getShowdownMoveId(move)
				: undefined,
			flags: {
				contact: flagData.includes("makes contact") ? 1 : undefined,
				/// If protect affected, we set it to undefined and check that in the higher level move definition.
				/// that's because showdown requires us to set the `breaksProtect` property on the main move def.s
				protect: flagData.includes("protect affected") ? undefined : 1,
				mirror: flagData.includes("mirror move affected") ? 1 : undefined,

				punch: flagData.includes("iron fist") ? 1 : undefined,
				slicing: flagData.includes("keen edge boost") ? 1 : undefined,
				snatch: flagData.includes("snatch affected") ? 1 : undefined,
				dance: flagData.includes("dance") ? 1 : undefined,
				field: flagData.includes("field based") ? 1 : undefined,
				reflectable: flagData.includes("magic coat affected")
					? 1
					: undefined,
				kick: flagData.includes("striker boost") ? 1 : undefined,
				bite: flagData.includes("strong jaw boost") ? 1 : undefined,
				sound: flagData.includes("sound") ? 1 : undefined,
				pulse: flagData.includes("mega launcher boost") ? 1 : undefined,
				bullet: flagData.includes("ballistic") ? 1 : undefined,
				weather: flagData.includes("weather based") ? 1 : undefined,
				powder: flagData.includes("powder") ? 1 : undefined,
				bone: flagData.includes("bone based") ? 1 : undefined,
				defrost: flagData.includes("thaw user") ? 1 : undefined,
				bypasssub: flagData.includes("hit in substitute") ? 1 : undefined,
			},
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

	private getAbilityId(ability: DexAbility): string {
		return ability.name.toLowerCase();
	}

	private getAbilityData(pokemon: CompactSpecie): SpeciesAbility {
		const dexAbilities = pokemon.stats.abis
			.map((index) => this.gameData!.abilities[index])
			.map(this.getAbilityId);
		const dexInnates = pokemon.stats.inns
			.map((index) => this.gameData!.abilities[index])
			.map(this.getAbilityId);
		return {
			0: dexAbilities[0],
			1: dexAbilities.length >= 2 ? dexAbilities[1] : undefined,
			H: dexAbilities.length >= 3 ? dexAbilities[2] : undefined,
			S: dexAbilities.length >= 4 ? dexAbilities[3] : undefined,
			I1: dexInnates.length >= 1 ? dexInnates[0] : undefined,
			I2: dexInnates.length >= 2 ? dexInnates[1] : undefined,
			I3: dexInnates.length >= 3 ? dexInnates[2] : undefined,
		};
	}

	private getBaseStats(pokemon: CompactSpecie): StatsTable {
		const base = pokemon.stats.base;
		return {
			hp: base[0],
			atk: base[1],
			def: base[2],
			spa: base[3],
			spd: base[4],
			spe: base[5],
		};
	}

	private getEggGroupId(dexGroup: string): string {
		let lower = dexGroup.replace("EGG_GROUP_", "").toLowerCase();
		return `${lower[0].toUpperCase()}${lower.substring(1)}`;
	}

	private getEggGroups(pokemon: CompactSpecie): string[] {
		return pokemon.stats.eggG
			.map((index) => this.gameData!.eggT[index])
			.map(this.getEggGroupId);
	}
}

export async function loadDexParser(config?: DexConfig) {
	const parser = new DexParser(config);
	await parser.init();
	return parser;
}
