/**
 * NOTE: If you are getting import errors here, you need to clone the ER dex repository by running the setup-tools:
 * >>> npm run setup-er-tools
 */
const fetch = require("node-fetch");
import {
	CompactGameData,
	compactMove,
	CompactSpecie,
} from "../../../dex_repo/src/compactify";
import { MoveFlags } from "../../../sim/dex-moves";
import { SpeciesAbility } from "../../../sim/dex-species";
import { Ability as DexAbility } from "../../../dex_repo/src/abilities";
import { MoveData } from "../../../sim/dex-moves";
import { ModdedLearnsetData } from "../../../sim/dex-species";
import { SpeciesData } from "../../../sim/dex-species";
import { MoveTarget } from "../../../sim/dex-moves";
import { DexTableData, ModdedDex } from "../../../sim/dex";
import { toID } from "../../../sim/dex-data";

type StatIDExceptHP = "atk" | "def" | "spa" | "spd" | "spe";
type StatID = "hp" | StatIDExceptHP;
type StatsTable = { [stat in StatID]: number };

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

/**
 * Works with data from the elite redux online dex to parse and generate showdown data for moves, pokedex and learnsets.
 */
export class DexParser {
	showdownData: DexTableData;
	gameData?: CompactGameData;
	config: DexConfig;
	moves: { [id: string]: MoveData } = {};
	learnsets: { [pokemonid: string]: ModdedLearnsetData } = {};
	pokedex: { [speciesId: string]: SpeciesData } = {};

	constructor(config?: DexConfig) {
		const dex = new ModdedDex("gen8eliteredux");
		this.showdownData = dex.data;
		this.config = config ?? {
			dexDataUrl:
				"https://forwardfeed.github.io/ER-nextdex/static/js/data/gameDataV2.1.json",
			// TODO: Is this still valid for ER?
			learnsetGenPrefix: "7",
		};
	}

	async init() {
		this.gameData = await this.pullDexData();
		this.parseMoves();
		this.parsePokemon();
	}

	/**
	 * Load all dex data from the elite redux json file.
	 * @returns The online dex data.
	 */
	private async pullDexData(): Promise<CompactGameData> {
		const response = await fetch(this.config.dexDataUrl);
		return (await response.json()) as CompactGameData;
	}

	/**
	 * Load all move data from the elite redux json file.
	 */
	private parseMoves() {
		for (const move of this.gameData!.moves) {
			const id = this.getShowdownMoveId(move);
			if (id == "??????????") continue;
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

	/**
	 * Load all pokemon data from the elite redux json file.
	 */
	private parsePokemon() {
		const originalFormLookup: { [id: string]: CompactSpecie } = {};

		for (const pokemon of this.gameData!.species) {
			if (pokemon.name == "??????????") continue;
			if (pokemon.forms && pokemon.forms.length > 1) {
				for (const formIndex of pokemon.forms.slice(1)) {
					const original = this.gameData!.species[pokemon.forms[0]];
					if (formIndex < 0) continue;
					const form = this.gameData!.species[formIndex];
					if (form.name == "??????????") continue;
					const id = toID(form.name);
					originalFormLookup[id] = original;
				}
			}
		}

		for (const pokemon of this.gameData!.species) {
			const learnset = this.generateLearnset(pokemon);
			if (pokemon.name == "??????????") continue;

			const id = toID(pokemon.NAME.replace("SPECIES_", ""))
				.replace("alolan", "alola")
				.replace("galarian", "galar")
				.replace("♀", "f");
			this.learnsets[id] = { learnset: learnset };

			let showdownData: SpeciesData | undefined =
				this.showdownData.Pokedex[id];
			let weightKg = showdownData?.weightkg;
			let heightM = showdownData?.heightm;
			let color = showdownData?.color;

			if (showdownData == null) {
				const original = originalFormLookup[toID(pokemon.name)];

				if (original != null) {
					weightKg = this.showdownData.Pokedex[id]?.weightkg;
					heightM = this.showdownData.Pokedex[id]?.heightm;
					color = this.showdownData.Pokedex[id]?.color;
				} else {
					console.log(
						`FATAL: Cannot find showdown data for pokemon ${id} to fill in weightKg, heightM and color!`
					);
					weightKg = 100;
					heightM = 7;
					color = "black";
				}
			}

			this.pokedex[id] = {
				name: pokemon.name.replace(" ", "-"),
				num: pokemon.id,
				types: pokemon.stats.types.map(
					(index) => this.gameData!.typeT[index]
				),
				abilities: this.getAbilityData(pokemon),
				baseStats: this.getBaseStats(pokemon),
				eggGroups: this.getEggGroups(pokemon),
				// TODO: Can we prefill this value?
				weightkg: weightKg ?? 100,
				heightm: heightM ?? 7,
				color: color ?? "black",
				...this.getEvolutionData(pokemon),
				prevo: this.findPrevo(pokemon),
			};
		}
	}

	/**
	 * Lookup a given move definition by online dex id.
	 * @param id The id of the move.
	 * @returns The online dex move definition.
	 */
	private findMoveByID(id: number): compactMove {
		const move = this.gameData!.moves.find((move) => move.id == id);
		if (move == null)
			throw new Error(
				`FATAL: Failed to find dex move referenced by id ${id}!`
			);
		return move;
	}

	/**
	 * Generate the showdown learnset code fro a give move.
	 * @param parsedMove The parsed move from the dex data.
	 * @returns The showdown learnset code.
	 */
	private generateLearnsetCode(parsedMove: ParsedMove): string {
		const categoryCode = getCategoryCode(parsedMove.category);
		const level = parsedMove.level != null ? parsedMove.level : "";
		return `${this.config.learnsetGenPrefix}${categoryCode}${level}`;
	}

	/**
	 * Get the category from an online dex move.
	 * @param move The dex move.
	 * @returns The category as "Physical" | "Special" | "Status"
	 */
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
			case "USE_HIGHEST_OFFENSE":
			case "USE_HIGHEST_DAMAGE":
				/// Leave them as special. The move flag highestOffense will denote this.
				return "Special";
			case "HITS_DEF":
			case "HITS_SPDEF":
				/// We will set a move flag for this as well.
				return "Special";
			default:
				throw new Error(
					`FATAL: Unrecognized move split value ${category} for ${move.name}`
				);
		}
	}

	/**
	 * Map the type of the online dex move.
	 * @param move The dex move.
	 * @returns The showdown type string for the type.
	 */
	private getMoveType(move: compactMove): string {
		// TODO: Dex moves can have more than one type?
		// Showdown doesn't support this.
		return this.gameData!.typeT[move.types[0]];
	}

	/**
	 * Get the target of a given online dex move (single/double/ally/etc.).
	 * @param move The dex move.
	 * @returns The appropriate showdown MoveTarget.
	 */
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

	private getDefensiveStatOveride(
		move: compactMove
	): StatIDExceptHP | undefined {
		const category = this.gameData!.splitT[move.split];
		switch (category) {
			case "HITS_SPDEF":
				return "spd";
			case "HITS_DEF":
				return "def";
		}

		return undefined;
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
		const category = this.gameData!.splitT[move.split];

		return {
			overrideDefensiveStat: this.getDefensiveStatOveride(move),
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
				highestOffense: category == "USE_HIGHEST_OFFENSE" ? 1 : undefined,
				highestDamage: category == "USE_HIGHEST_DAMAGE" ? 1 : undefined,
			},
		};
	}

	/**
	 * Get the showdown move id from an online dex move.
	 * @param move The dex move.
	 * @returns The proper move id.
	 */
	private getShowdownMoveId(move: compactMove): string {
		return toID(move.NAME.replace("MOVE_", ""));
	}

	/**
	 * Create a learnset definition for a single pokemon from the online dex.
	 * @param pokemon The dex pokemon.
	 * @returns The showdown learnset for this pokemon.
	 */
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

	/**
	 * Get the showdown ability id from an online dex ability.
	 * @param ability The dex ability.
	 * @returns The showdown ability id.
	 */
	private getAbilityId(ability: DexAbility): string {
		return ability.name.toLowerCase();
	}

	/**
	 * Get the showdown ability data from an online dex pokemon.
	 * @param pokemon The dex pokemon.
	 * @returns The showdown ability definition.
	 */
	private getAbilityData(pokemon: CompactSpecie): SpeciesAbility {
		const dexAbilities = pokemon.stats.abis
			.map((index) => this.gameData!.abilities[index])
			.filter((ability) => ability.name != "-------")
			.map(this.getAbilityId);
		const dexInnates = pokemon.stats.inns
			.map((index) => this.gameData!.abilities[index])
			.filter((ability) => ability.name != "-------")
			.map(this.getAbilityId);
		return {
			0: this.formatAbility(dexAbilities[0]),
			1:
				dexAbilities.length >= 2
					? this.formatAbility(dexAbilities[1])
					: undefined,
			H:
				dexAbilities.length >= 3
					? this.formatAbility(dexAbilities[2])
					: undefined,
			S:
				dexAbilities.length >= 4
					? this.formatAbility(dexAbilities[3])
					: undefined,
			I1:
				dexInnates.length >= 1
					? this.formatAbility(dexInnates[0])
					: undefined,
			I2:
				dexInnates.length >= 2
					? this.formatAbility(dexInnates[1])
					: undefined,
			I3:
				dexInnates.length >= 3
					? this.formatAbility(dexInnates[2])
					: undefined,
		};
	}

	private formatAbility(ability: string): string {
		return ability
			.split(" ")
			.map(
				(word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
			)
			.join(" ");
	}
	/**
	 * Get the showdown base stats from an online dex pokemon.
	 * @param pokemon The dex pokemon.
	 * @returns The showdown stat definition.
	 */
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

	/**
	 * Get the showdown egg group id from an online egg name.
	 * @param dexGroup The dex egg group.
	 * @returns The showdown egg group.
	 */
	private getEggGroupId(dexGroup: string): string {
		let lower = dexGroup.replace("EGG_GROUP_", "").toLowerCase();
		return `${lower[0].toUpperCase()}${lower.substring(1)}`;
	}

	/**
	 * Get the showdown egg group ids from an online dex pokemon.
	 * @param pokemon The dex pokemon.
	 * @returns The showdown egg group list.
	 */
	private getEggGroups(pokemon: CompactSpecie): string[] {
		return pokemon.stats.eggG
			.map((index) => this.gameData!.eggT[index])
			.map(this.getEggGroupId);
	}

	private getEvolutionData(
		pokemon: CompactSpecie
	): Partial<SpeciesData> & { evos: string[] } {
		const evoItems = pokemon.evolutions
			.map((evo) => evo.rs)
			.filter((spec) => spec.startsWith("ITEM_"))
			.map((spec) => spec.replace("ITEM_", "").toLowerCase());
		const evoLevels = pokemon.evolutions
			.map((evolution) => evolution.rs)
			.filter((spec) => !spec.startsWith("ITEM_"))
			.filter((level) => level != null);
		let data = {
			evoLevel: evoLevels.length > 0 ? parseInt(evoLevels[0]) : undefined,
			evoItem: evoItems.length > 0 ? evoItems[0] : undefined,

			evos: pokemon.evolutions
				.map((evolution) => this.gameData!.species[evolution.in]?.name)
				.filter((value) => value != null),
		};

		// JSON can't specify undefined and nulls will make typescript complain, so just delete any undefined keys.
		if (data.evoLevel == null || isNaN(data.evoLevel)) {
			delete data.evoLevel;
		}

		if (data.evoItem == null) {
			delete data.evoItem;
		}

		return data;
	}

	private findPrevo(pokemon: CompactSpecie): string | undefined {
		const index = this.gameData!.species.findIndex(
			(species) => species.name == pokemon.name
		);

		return this.gameData!.species.find(
			(species) =>
				species.evolutions.find((evolution) => evolution.in == index) !=
				null
		)?.name;
	}
}

export async function loadDexParser(config?: DexConfig) {
	const parser = new DexParser(config);
	await parser.init();
	return parser;
}
