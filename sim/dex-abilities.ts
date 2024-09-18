import {PokemonEventMethods} from './dex-conditions';
import {BasicEffect, toID} from './dex-data';

interface AbilityEventMethods {
	onCheckShow?: (this: Battle, pokemon: Pokemon) => void;
	onEnd?: (this: Battle, target: Pokemon & Side & Field) => void;
	onPreStart?: (this: Battle, pokemon: Pokemon) => void;
	/**
	 * This is called when the pokemon switches in and this ability activates.
	 * You should handle any "on switch" effects here.
	 * @param this The battle instance.
	 * @param target The pokemon that's activating this ability.
	 * @returns void. Manipulate the battle instance to cause side effects.
	 */
	onStart?: (this: Battle, target: Pokemon) => void;
}

export interface AbilityData extends Partial<Ability>, AbilityEventMethods, PokemonEventMethods {
	name: string;
}

export type ModdedAbilityData = AbilityData | Partial<AbilityData> & {inherit: true};

export class Ability extends BasicEffect implements Readonly<BasicEffect> {
	declare readonly effectType: 'Ability';

	/** Rating from -1 Detrimental to +5 Essential; see `data/abilities.ts` for details. */
	readonly rating: number;
	readonly suppressWeather: boolean;
	readonly suppressTerrain: boolean
	readonly suppressRoom: boolean
	declare readonly condition?: ConditionData;
	declare readonly isPermanent?: boolean;
	declare readonly isBreakable?: boolean;

	constructor(data: AnyObject) {
		super(data);

		this.fullname = `ability: ${this.name}`;
		this.effectType = 'Ability';
		this.suppressWeather = !!data.suppressWeather;
		this.suppressTerrain = !!data.suppressTerain;
		this.suppressRoom = !!data.suppressRoom;

		this.rating = data.rating || 0;

		if (!this.gen) {
			if (this.num >= 268) {
				this.gen = 9;
			} else if (this.num >= 234) {
				this.gen = 8;
			} else if (this.num >= 192) {
				this.gen = 7;
			} else if (this.num >= 165) {
				this.gen = 6;
			} else if (this.num >= 124) {
				this.gen = 5;
			} else if (this.num >= 77) {
				this.gen = 4;
			} else if (this.num >= 1) {
				this.gen = 3;
			}
		}
	}
}

export class DexAbilities {
	readonly dex: ModdedDex;
	readonly abilityCache = new Map<ID, Ability>();
	allCache: readonly Ability[] | null = null;

	constructor(dex: ModdedDex) {
		this.dex = dex;
	}

	get(name: string | Ability = ''): Ability {
		if (name && typeof name !== 'string') return name;

		const id = toID(name);
		return this.getByID(id);
	}

	getByID(id: ID): Ability {
		let ability = this.abilityCache.get(id);
		if (ability) return ability;

		if (this.dex.data.Aliases.hasOwnProperty(id)) {
			ability = this.get(this.dex.data.Aliases[id]);
		} else if (id && this.dex.data.Abilities.hasOwnProperty(id)) {
			const abilityData = this.dex.data.Abilities[id] as any;
			const abilityTextData = this.dex.getDescs('Abilities', id, abilityData);
			ability = new Ability({
				name: id,
				...abilityData,
				...abilityTextData,
			});
			if (ability.gen > this.dex.gen) {
				(ability as any).isNonstandard = 'Future';
			}
			if (this.dex.currentMod === 'gen7letsgo' && ability.id !== 'noability') {
				(ability as any).isNonstandard = 'Past';
			}
			if ((this.dex.currentMod === 'gen7letsgo' || this.dex.gen <= 2) && ability.id === 'noability') {
				(ability as any).isNonstandard = null;
			}
		} else {
			ability = new Ability({
				id, name: id, exists: false,
			});
		}

		if (ability.exists) this.abilityCache.set(id, ability);
		return ability;
	}

	all(): readonly Ability[] {
		if (this.allCache) return this.allCache;
		const abilities = [];
		for (const id in this.dex.data.Abilities) {
			abilities.push(this.getByID(id as ID));
		}
		this.allCache = abilities;
		return this.allCache;
	}
}
