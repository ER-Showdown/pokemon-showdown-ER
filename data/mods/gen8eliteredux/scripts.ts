import { Dex, toID } from "../../../sim/dex";

export const Scripts: ModdedBattleScriptsData = {
	gen: 8,
	init(this: ModdedDex) {},
	actions: {
		inherit: true,
		canMegaEvo(pokemon: Pokemon) {
			let species = pokemon.baseSpecies;
			let altForme =
				species.otherFormes && this.dex.species.get(species.otherFormes[0]);
			const item = pokemon.getItem();

			//Necrozma Check
			if (
				["Necrozma-Dusk-Mane", "Necrozma-Dawn-Wings"].some(
					(a) => a === species.name
				)
			) {
				species = this.dex.species.get(species.name);
				altForme =
					species.otherFormes &&
					this.dex.species.get(species.otherFormes[0]);
			}

			// Mega Rayquaza
			if (
				(this.battle.gen <= 7 ||
					this.battle.ruleTable.has("+pokemontag:past") ||
					this.battle.format.mod.includes("redux")) &&
				altForme?.isMega &&
				altForme?.requiredMove &&
				pokemon.baseMoves.includes(toID(altForme.requiredMove)) &&
				!item.zMove
			) {
				return altForme.name;
			}
			// a hacked-in Megazard X can mega evolve into Megazard Y, but not into Megazard X
			if (
				item.megaEvolves === species.baseSpecies &&
				item.megaStone !== species.name
			) {
				return item.megaStone;
			}
			return null;
		},
		modifyDamage(baseDamage, pokemon, target, move, suppressMessages) {
			const tr = this.battle.trunc;
			if (!move.type) move.type = "???";
			const type = move.type;

			baseDamage += 2;

			// multi-target modifier (doubles only)
			if (move.spreadHit) {
				// multi-target modifier (doubles only)
				const spreadModifier =
					move.spreadModifier ||
					(this.battle.gameType === "freeforall" ? 0.5 : 0.75);
				this.battle.debug("Spread modifier: " + spreadModifier);
				baseDamage = this.battle.modify(baseDamage, spreadModifier);
			} else if (move.multihitType === "parentalbond" && move.hit > 1) {
				// Parental Bond modifier
				const bondModifier = this.battle.gen > 6 ? 0.25 : 0.5;
				this.battle.debug(`Parental Bond modifier: ${bondModifier}`);
				baseDamage = this.battle.modify(baseDamage, bondModifier);
			}

			// weather modifier
			baseDamage = this.battle.runEvent(
				"WeatherModifyDamage",
				pokemon,
				target,
				move,
				baseDamage
			);

			// crit - not a modifier
			const isCrit = target.getMoveHitData(move).crit;
			if (isCrit) {
				baseDamage = tr(
					baseDamage *
						(move.critModifier || (this.battle.gen >= 6 ? 1.5 : 2))
				);
			}

			// random factor - also not a modifier
			baseDamage = this.battle.randomizer(baseDamage);

			// STAB
			if (move.forceSTAB || (type !== "???" && pokemon.hasType(type))) {
				// The "???" type never gets STAB
				// Not even if you Roost in Gen 4 and somehow manage to use
				// Struggle in the same turn.
				// (On second thought, it might be easier to get a MissingNo.)
				baseDamage = this.battle.modify(baseDamage, move.stab || 1.5);
			}
			// types
			let typeMod = target.runEffectiveness(move);
			typeMod = this.battle.clampIntRange(typeMod, -6, 6);
			target.getMoveHitData(move).typeMod = typeMod;
			if (typeMod > 0) {
				if (!suppressMessages) this.battle.add("-supereffective", target);

				for (let i = 0; i < typeMod; i++) {
					baseDamage *= 2;
				}
			}
			if (typeMod < 0) {
				if (!suppressMessages) this.battle.add("-resisted", target);

				for (let i = 0; i > typeMod; i--) {
					baseDamage = tr(baseDamage / 2);
				}
			}

			if (isCrit && !suppressMessages) this.battle.add("-crit", target);

			// Generation 5, but nothing later, sets damage to 1 before the final damage modifiers
			if (this.battle.gen === 5 && !baseDamage) baseDamage = 1;

			// Final modifier. Modifiers that modify damage after min damage check, such as Life Orb.
			baseDamage = this.battle.runEvent(
				"ModifyDamage",
				pokemon,
				target,
				move,
				baseDamage
			);

			if (
				move.isZOrMaxPowered &&
				target.getMoveHitData(move).zBrokeProtect
			) {
				baseDamage = this.battle.modify(baseDamage, 0.25);
				this.battle.add("-zbroken", target);
			}

			// Generation 6-7 moves the check for minimum 1 damage after the final modifier...
			if (this.battle.gen !== 5 && !baseDamage) return 1;

			// ...but 16-bit truncation happens even later, and can truncate to 0
			return tr(baseDamage, 16);
		},
	},
	field: {
		suppressingWeather() {
			for (const pokemon of this.battle.getAllActive()) {
				if (
					pokemon &&
					!pokemon.fainted &&
					!pokemon.ignoringAbility() &&
					(pokemon.getAbility().suppressWeather ||
						pokemon.m.innates?.some(
							(k: string) =>
								this.battle.dex.abilities.get(k).suppressWeather
						))
				) {
					return true;
				}
			}
			return false;
		},
		suppressingTerrain() {
			for (const pokemon of this!.battle!.getAllActive()) {
				if (
					pokemon &&
					!pokemon.fainted &&
					!pokemon.ignoringAbility() &&
					(pokemon.getAbility().suppressTerrain ||
						pokemon.m.innates?.some(
							(k: string) =>
								this.battle.dex.abilities.get(k).suppressTerrain
						))
				) {
					return true;
				}
			}
			return false;
		},
	},
	pokemon: {
		ignoringAbility() {
			// Check if any active pokemon have the ability Neutralizing Gas
			let neutralizinggas = false;
			for (const pokemon of this.battle.getAllActive()) {
				// can't use hasAbility because it would lead to infinite recursion
				if (
					(pokemon.ability === ("neutralizinggas" as ID) ||
						pokemon.m.innates?.some(
							(k: string) => k === "neutralizinggas"
						)) &&
					!pokemon.volatiles["gastroacid"] &&
					!pokemon.abilityState.ending
				) {
					neutralizinggas = true;
					break;
				}
			}

			return !!(
				(this.battle.gen >= 5 && !this.isActive) ||
				((this.volatiles["gastroacid"] ||
					(neutralizinggas &&
						(this.ability !== ("neutralizinggas" as ID) ||
							this.m.innates?.some(
								(k: string) => k === "neutralizinggas"
							)))) &&
					!this.getAbility().isPermanent)
			);
		},
		hasAbility(ability) {
			if (this.ignoringAbility()) return false;
			if (Array.isArray(ability))
				return ability.some((abil) => this.hasAbility(abil));
			ability = this.battle.toID(ability);
			return (
				this.ability === ability || !!this.volatiles["ability:" + ability]
			);
		},
		transformInto(pokemon, effect) {
			const species = pokemon.species;
			if (
				pokemon.fainted ||
				this.illusion ||
				pokemon.illusion ||
				(pokemon.volatiles["substitute"] && this.battle.gen >= 5) ||
				(pokemon.transformed && this.battle.gen >= 2) ||
				(this.transformed && this.battle.gen >= 5) ||
				species.name === "Eternatus-Eternamax"
			) {
				return false;
			}

			if (!this.setSpecies(species, effect, true)) return false;

			this.transformed = true;
			this.weighthg = pokemon.weighthg;

			const types = pokemon.getTypes(true, true);
			this.setType(
				pokemon.volatiles["roost"]
					? pokemon.volatiles["roost"].typeWas
					: types,
				true
			);
			this.addedType = pokemon.addedType;
			this.knownType = this.isAlly(pokemon) && pokemon.knownType;
			this.apparentType = pokemon.apparentType;

			let statName: StatIDExceptHP;
			for (statName in this.storedStats) {
				this.storedStats[statName] = pokemon.storedStats[statName];
				if (this.modifiedStats)
					this.modifiedStats[statName] = pokemon.modifiedStats![statName]; // Gen 1: Copy modified stats.
			}
			this.moveSlots = [];
			this.set.ivs = this.battle.gen >= 5 ? this.set.ivs : pokemon.set.ivs;
			this.hpType = this.battle.gen >= 5 ? this.hpType : pokemon.hpType;
			this.hpPower = this.battle.gen >= 5 ? this.hpPower : pokemon.hpPower;
			this.timesAttacked = pokemon.timesAttacked;
			for (const moveSlot of pokemon.moveSlots) {
				let moveName = moveSlot.move;
				if (moveSlot.id === "hiddenpower") {
					moveName = "Hidden Power " + this.hpType;
				}
				this.moveSlots.push({
					move: moveName,
					id: moveSlot.id,
					pp: moveSlot.maxpp === 1 ? 1 : 5,
					maxpp:
						this.battle.gen >= 5
							? moveSlot.maxpp === 1
								? 1
								: 5
							: moveSlot.maxpp,
					target: moveSlot.target,
					disabled: false,
					used: false,
					virtual: true,
				});
			}
			let boostName: BoostID;
			for (boostName in pokemon.boosts) {
				this.boosts[boostName] = pokemon.boosts[boostName];
			}
			if (this.battle.gen >= 6) {
				const volatilesToCopy = [
					"focusenergy",
					"gmaxchistrike",
					"laserfocus",
				];
				for (const volatile of volatilesToCopy) {
					if (pokemon.volatiles[volatile]) {
						this.addVolatile(volatile);
						if (volatile === "gmaxchistrike")
							this.volatiles[volatile].layers =
								pokemon.volatiles[volatile].layers;
					} else {
						this.removeVolatile(volatile);
					}
				}
			}
			if (effect) {
				this.battle.add(
					"-transform",
					this,
					pokemon,
					"[from] " + effect.fullname
				);
			} else {
				this.battle.add("-transform", this, pokemon);
			}
			if (this.terastallized && this.terastallized !== this.apparentType) {
				this.battle.add(
					"-start",
					this,
					"typechange",
					this.terastallized,
					"[silent]"
				);
				this.apparentType = this.terastallized;
			}
			if (this.battle.gen > 2) {
				this.setAbility(pokemon.ability, this, true);
				if (this.m.innates) {
					for (const innate of this.m.innates) {
						this.removeVolatile("ability:" + innate);
					}
				}
				if (pokemon.m.innates) {
					for (const innate of pokemon.m.innates) {
						this.addVolatile("ability:" + innate, this);
					}
				}
			}

			// Change formes based on held items (for Transform)
			// Only ever relevant in Generation 4 since Generation 3 didn't have item-based forme changes
			if (this.battle.gen === 4) {
				if (this.species.num === 487) {
					// Giratina formes
					if (
						this.species.name === "Giratina" &&
						this.item === "griseousorb"
					) {
						this.formeChange("Giratina-Origin");
					} else if (
						this.species.name === "Giratina-Origin" &&
						this.item !== "griseousorb"
					) {
						this.formeChange("Giratina");
					}
				}
				if (this.species.num === 493) {
					// Arceus formes
					const item = this.getItem();
					const targetForme = item?.onPlate
						? "Arceus-" + item.onPlate
						: "Arceus";
					if (this.species.name !== targetForme) {
						this.formeChange(targetForme);
					}
				}
			}

			return true;
		},
		/**
		 * Changes this Pokemon's forme to match the given speciesId (or species).
		 * This function handles all changes to stats, ability, type, species, etc.
		 * as well as sending all relevant messages sent to the client.
		 */

		formeChange(speciesId, source, isPermanent, message) {
			if (!source) source = this.battle.effect;

			const rawSpecies = this.battle.dex.species.get(speciesId);

			const species = this.setSpecies(rawSpecies, source);
			if (!species) return false;

			if (this.battle.gen <= 2) return true;

			// The species the opponent sees
			const apparentSpecies = this.illusion
				? this.illusion.species.name
				: species.baseSpecies;
			if (isPermanent) {
				this.baseSpecies = rawSpecies;
				this.details =
					species.name +
					(this.level === 100 ? "" : ", L" + this.level) +
					(this.gender === "" ? "" : ", " + this.gender) +
					(this.set.shiny ? ", shiny" : "");
				this.battle.add(
					"detailschange",
					this,
					(this.illusion || this).details
				);
				if (source.effectType === "Item") {
					if (source.zMove) {
						this.battle.add(
							"-burst",
							this,
							apparentSpecies,
							species.requiredItem
						);
						this.moveThisTurnResult = true; // Ultra Burst counts as an action for Truant
					} else if (source.onPrimal) {
						if (this.illusion) {
							this.ability = "";
							this.battle.add("-primal", this.illusion);
						} else {
							this.battle.add("-primal", this);
						}
					} else {
						this.battle.add(
							"-mega",
							this,
							apparentSpecies,
							species.requiredItem
						);
						this.moveThisTurnResult = true; // Mega Evolution counts as an action for Truant
					}
				} else if (source.effectType === "Status") {
					// Shaymin-Sky -> Shaymin
					this.battle.add("-formechange", this, species.name, message);
				}
			} else {
				if (source.effectType === "Ability") {
					this.battle.add(
						"-formechange",
						this,
						species.name,
						message,
						`[from] ability: ${source.name}`
					);
				} else {
					this.battle.add(
						"-formechange",
						this,
						this.illusion ? this.illusion.species.name : species.name,
						message
					);
				}
			}
			if (
				isPermanent &&
				![
					"disguise",
					"iceface",
					"ability:disguise",
					"ability:iceface",
				].includes(source.id)
			) {
				if (this.illusion) {
					this.ability = ""; // Don't allow Illusion to wear off
				}

				if (isPermanent && !["disguise", "iceface"].includes(source.id)) {
					if (this.illusion) {
						this.ability = ""; // Don't allow Illusion to wear off
					}

					let abilityKey: keyof typeof rawSpecies.abilities;
					const baseSpecies = this.battle.dex.species.get(
						rawSpecies.baseSpecies
					);
					let abilitySlot;

					for (abilityKey in baseSpecies.abilities) {
						if (
							this.battle.dex.abilities.getByID(this.baseAbility)
								.name ===
							this.battle.dex.abilities.get(
								baseSpecies.abilities[abilityKey]
							).name
						) {
							if (!(abilityKey as string).includes("I"))
								abilitySlot = abilityKey;
						}
					}
					if (species.abilities[abilitySlot as string] === undefined)
						abilitySlot = "0";
					this.setAbility(
						species.abilities[abilitySlot as string],
						null,
						true
					);
					this.baseAbility = this.ability;
				}
			}
			if (this.terastallized && this.terastallized !== this.apparentType) {
				this.battle.add(
					"-start",
					this,
					"typechange",
					this.terastallized,
					"[silent]"
				);
				this.apparentType = this.terastallized;
			}
			return true;
		},
	},
};
