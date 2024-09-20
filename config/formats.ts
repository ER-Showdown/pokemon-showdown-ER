// Note: This is the list of formats
// The rules that formats use are stored in data/rulesets.ts
/*
If you want to add custom formats, create a file in this folder named: "custom-formats.ts"

Paste the following code into the file and add your desired formats and their sections between the brackets:
--------------------------------------------------------------------------------
// Note: This is the list of formats
// The rules that formats use are stored in data/rulesets.ts

export const Formats: FormatList = [
];
--------------------------------------------------------------------------------

If you specify a section that already exists, your format will be added to the bottom of that section.
New sections will be added to the bottom of the specified column.
The column value will be ignored for repeat sections.
*/

export const Formats: FormatList = [
	// S/V Singles
	///////////////////////////////////////////////////////////////////

	{
		section: "Elite Redux Singles",
	},
	{
		name: "Elite Redux OU",
		desc: `OU for Elite Redux`,
		mod: "gen8eliteredux",
		ruleset: ["Standard"],
		banlist: [
			"Uber",
			"AG",
			"King's Rock",
			"Baton Pass",
			"Shadow Tag",
			"Arena Trap",
			"Aeroblast",
			"Alakazite",
			"Blastoisinite",
			"Moody",
			"Power Construct",
		],
		debug: true,

		//ER Scripts
		onValidateSet(set) {
			const species = this.dex.species.get(set.species);
			const innateList = Object.keys(species.abilities)
				.filter((key) => key.includes("I"))
				.map((key) => species.abilities[key as "I1" | "I2" | "I3"]);
			for (const innateName of innateList) {
				//Checks if set ability is an innate, which is not allowed
				if (set.ability == innateName) {
					return [
						`${set.name} already has ${innateName} as Innate. Please select from Abilities`,
					];
				}

				//Checks if innate is banned
				const banReason = this.ruleTable.check(
					"ability:" + this.toID(innateName)
				);
				if (banReason) {
					return [`${set.name}'s ability ${innateName} is ${banReason}.`];
				}
			}
		},
		onBegin() {
			for (const pokemon of this.getAllPokemon()) {
				// if (pokemon.ability === this.toID(pokemon.species.abilities['S'])) {
				// 	continue;
				// }
				pokemon.m.innates = Object.keys(pokemon.species.abilities)
					.filter((key) => key.includes("I"))
					.map((key) =>
						this.toID(
							pokemon.species.abilities[key as "I1" | "I2" | "I3"]
						)
					)
					.filter((ability) => ability !== pokemon.ability);
			}
		},
		onBeforeSwitchIn(pokemon) {
			// Abilities that must be applied before both sides trigger onSwitchIn to correctly
			// handle switch-in ability-to-ability interactions, e.g. Intimidate counters
			//TODO: Update needBeforeSwitchInIDs for new abilities
			const neededBeforeSwitchInIDs = [
				"clearbody",
				"competitive",
				"contrary",
				"defiant",
				"fullmetalbody",
				"hypercutter",
				"innerfocus",
				"mirrorarmor",
				"oblivious",
				"owntempo",
				"rattled",
				"scrappy",
				"simple",
				"whitesmoke",
			];
			if (pokemon.m.innates) {
				for (const innate of pokemon.m.innates) {
					if (!neededBeforeSwitchInIDs.includes(innate)) continue;
					if (pokemon.hasAbility(innate)) continue;
					pokemon.addVolatile("ability:" + innate, pokemon);
				}
			}
		},
		onSwitchInPriority: 2,
		onSwitchIn(pokemon) {
			if (pokemon.m.innates) {
				for (const innate of pokemon.m.innates) {
					if (pokemon.hasAbility(innate)) continue;
					pokemon.addVolatile("ability:" + innate, pokemon);
				}
			}
		},
		onSwitchOut(pokemon) {
			for (const innate of Object.keys(pokemon.volatiles).filter((i) =>
				i.startsWith("ability:")
			)) {
				pokemon.removeVolatile(innate);
			}
		},
		onFaint(pokemon) {
			for (const innate of Object.keys(pokemon.volatiles).filter((i) =>
				i.startsWith("ability:")
			)) {
				const innateEffect = this.dex.conditions.get(innate) as Effect;
				this.singleEvent("End", innateEffect, null, pokemon);
			}
		},
		onAfterMega(pokemon) {
			//clear original pokemon innates
			for (const innate of Object.keys(pokemon.volatiles).filter((i) =>
				i.startsWith("ability:")
			)) {
				pokemon.removeVolatile(innate);
			}
			//initialize mega innates
			pokemon.m.innates = Object.keys(pokemon.species.abilities)
				.filter((key) => key.includes("I"))
				.map((key) =>
					this.toID(pokemon.species.abilities[key as "I1" | "I2" | "I3"])
				)
				.filter((ability) => ability !== pokemon.ability);

			//before switch in innate load
			const neededBeforeSwitchInIDs = [
				"clearbody",
				"competitive",
				"contrary",
				"defiant",
				"fullmetalbody",
				"hypercutter",
				"innerfocus",
				"mirrorarmor",
				"oblivious",
				"owntempo",
				"rattled",
				"scrappy",
				"simple",
				"whitesmoke",
			];
			if (pokemon.m.innates) {
				for (const innate of pokemon.m.innates) {
					if (!neededBeforeSwitchInIDs.includes(innate)) continue;
					if (pokemon.hasAbility(innate)) continue;
					pokemon.addVolatile("ability:" + innate, pokemon);
				}
			}
			//after switch in innate load
			if (pokemon.m.innates) {
				for (const innate of pokemon.m.innates) {
					if (pokemon.hasAbility(innate)) continue;
					pokemon.addVolatile("ability:" + innate, pokemon);
				}
			}
		},
	},
	{
		name: "Elite Redux Monotype OU",
		desc: `OU Monotype for Elite Redux`,
		mod: "gen8eliteredux",
		ruleset: ["Standard", "Force Monotype (ER)"],
		banlist: [
			"Uber",
			"AG",
			"King's Rock",
			"Baton Pass",
			"Shadow Tag",
			"Arena Trap",
			"Aeroblast",
			"Alakazite",
			"Blastoisinite",
			"Moody",
			"Power Construct",
		],
		debug: true,

		//ER Scripts
		onValidateSet(set) {
			const species = this.dex.species.get(set.species);
			const innateList = Object.keys(species.abilities)
				.filter((key) => key.includes("I"))
				.map((key) => species.abilities[key as "I1" | "I2" | "I3"]);
			for (const innateName of innateList) {
				//Checks if set ability is an innate, which is not allowed
				if (set.ability == innateName) {
					return [
						`${set.name} already has ${innateName} as Innate. Please select from Abilities`,
					];
				}

				//Checks if innate is banned
				const banReason = this.ruleTable.check(
					"ability:" + this.toID(innateName)
				);
				if (banReason) {
					return [`${set.name}'s ability ${innateName} is ${banReason}.`];
				}
			}
		},
		onBegin() {
			for (const pokemon of this.getAllPokemon()) {
				// if (pokemon.ability === this.toID(pokemon.species.abilities['S'])) {
				// 	continue;
				// }
				pokemon.m.innates = Object.keys(pokemon.species.abilities)
					.filter((key) => key.includes("I"))
					.map((key) =>
						this.toID(
							pokemon.species.abilities[key as "I1" | "I2" | "I3"]
						)
					)
					.filter((ability) => ability !== pokemon.ability);
			}
		},
		onBeforeSwitchIn(pokemon) {
			// Abilities that must be applied before both sides trigger onSwitchIn to correctly
			// handle switch-in ability-to-ability interactions, e.g. Intimidate counters
			//TODO: Update needBeforeSwitchInIDs for new abilities
			const neededBeforeSwitchInIDs = [
				"clearbody",
				"competitive",
				"contrary",
				"defiant",
				"fullmetalbody",
				"hypercutter",
				"innerfocus",
				"mirrorarmor",
				"oblivious",
				"owntempo",
				"rattled",
				"scrappy",
				"simple",
				"whitesmoke",
			];
			if (pokemon.m.innates) {
				for (const innate of pokemon.m.innates) {
					if (!neededBeforeSwitchInIDs.includes(innate)) continue;
					if (pokemon.hasAbility(innate)) continue;
					pokemon.addVolatile("ability:" + innate, pokemon);
				}
			}
		},
		onSwitchInPriority: 2,
		onSwitchIn(pokemon) {
			if (pokemon.m.innates) {
				for (const innate of pokemon.m.innates) {
					if (pokemon.hasAbility(innate)) continue;
					pokemon.addVolatile("ability:" + innate, pokemon);
				}
			}
		},
		onSwitchOut(pokemon) {
			for (const innate of Object.keys(pokemon.volatiles).filter((i) =>
				i.startsWith("ability:")
			)) {
				pokemon.removeVolatile(innate);
			}
		},
		onFaint(pokemon) {
			for (const innate of Object.keys(pokemon.volatiles).filter((i) =>
				i.startsWith("ability:")
			)) {
				const innateEffect = this.dex.conditions.get(innate) as Effect;
				this.singleEvent("End", innateEffect, null, pokemon);
			}
		},
		onAfterMega(pokemon) {
			//clear original pokemon innates
			for (const innate of Object.keys(pokemon.volatiles).filter((i) =>
				i.startsWith("ability:")
			)) {
				pokemon.removeVolatile(innate);
			}
			//initialize mega innates
			pokemon.m.innates = Object.keys(pokemon.species.abilities)
				.filter((key) => key.includes("I"))
				.map((key) =>
					this.toID(pokemon.species.abilities[key as "I1" | "I2" | "I3"])
				)
				.filter((ability) => ability !== pokemon.ability);

			//before switch in innate load
			const neededBeforeSwitchInIDs = [
				"clearbody",
				"competitive",
				"contrary",
				"defiant",
				"fullmetalbody",
				"hypercutter",
				"innerfocus",
				"mirrorarmor",
				"oblivious",
				"owntempo",
				"rattled",
				"scrappy",
				"simple",
				"whitesmoke",
			];
			if (pokemon.m.innates) {
				for (const innate of pokemon.m.innates) {
					if (!neededBeforeSwitchInIDs.includes(innate)) continue;
					if (pokemon.hasAbility(innate)) continue;
					pokemon.addVolatile("ability:" + innate, pokemon);
				}
			}
			//after switch in innate load
			if (pokemon.m.innates) {
				for (const innate of pokemon.m.innates) {
					if (pokemon.hasAbility(innate)) continue;
					pokemon.addVolatile("ability:" + innate, pokemon);
				}
			}
		},
	},
	{
		name: "Elite Redux UU",
		desc: `UU For Elite Redux`,
		mod: "gen8eliteredux",
		ruleset: ["Elite Redux OU"],
		banlist: ["OU", "UUBL"],
		//ER Scripts
		onValidateSet(set) {
			const species = this.dex.species.get(set.species);
			const innateList = Object.keys(species.abilities)
				.filter((key) => key.includes("I"))
				.map((key) => species.abilities[key as "I1" | "I2" | "I3"]);
			for (const innateName of innateList) {
				//Checks if set ability is an innate, which is not allowed
				if (set.ability == innateName) {
					return [
						`${set.name} already has ${innateName} as Innate. Please select from Abilities`,
					];
				}

				//Checks if innate is banned
				const banReason = this.ruleTable.check(
					"ability:" + this.toID(innateName)
				);
				if (banReason) {
					return [`${set.name}'s ability ${innateName} is ${banReason}.`];
				}
			}
		},
		onBegin() {
			for (const pokemon of this.getAllPokemon()) {
				// if (pokemon.ability === this.toID(pokemon.species.abilities['S'])) {
				// 	continue;
				// }
				pokemon.m.innates = Object.keys(pokemon.species.abilities)
					.filter((key) => key.includes("I"))
					.map((key) =>
						this.toID(
							pokemon.species.abilities[key as "I1" | "I2" | "I3"]
						)
					)
					.filter((ability) => ability !== pokemon.ability);
			}
		},
		onBeforeSwitchIn(pokemon) {
			// Abilities that must be applied before both sides trigger onSwitchIn to correctly
			// handle switch-in ability-to-ability interactions, e.g. Intimidate counters
			//TODO: Update needBeforeSwitchInIDs for new abilities
			const neededBeforeSwitchInIDs = [
				"clearbody",
				"competitive",
				"contrary",
				"defiant",
				"fullmetalbody",
				"hypercutter",
				"innerfocus",
				"mirrorarmor",
				"oblivious",
				"owntempo",
				"rattled",
				"scrappy",
				"simple",
				"whitesmoke",
			];
			if (pokemon.m.innates) {
				for (const innate of pokemon.m.innates) {
					if (!neededBeforeSwitchInIDs.includes(innate)) continue;
					if (pokemon.hasAbility(innate)) continue;
					pokemon.addVolatile("ability:" + innate, pokemon);
				}
			}
		},
		onSwitchInPriority: 2,
		onSwitchIn(pokemon) {
			if (pokemon.m.innates) {
				for (const innate of pokemon.m.innates) {
					if (pokemon.hasAbility(innate)) continue;
					pokemon.addVolatile("ability:" + innate, pokemon);
				}
			}
		},
		onSwitchOut(pokemon) {
			for (const innate of Object.keys(pokemon.volatiles).filter((i) =>
				i.startsWith("ability:")
			)) {
				pokemon.removeVolatile(innate);
			}
		},
		onFaint(pokemon) {
			for (const innate of Object.keys(pokemon.volatiles).filter((i) =>
				i.startsWith("ability:")
			)) {
				const innateEffect = this.dex.conditions.get(innate) as Effect;
				this.singleEvent("End", innateEffect, null, pokemon);
			}
		},
		onAfterMega(pokemon) {
			//clear original pokemon innates
			for (const innate of Object.keys(pokemon.volatiles).filter((i) =>
				i.startsWith("ability:")
			)) {
				pokemon.removeVolatile(innate);
			}
			//initialize mega innates
			pokemon.m.innates = Object.keys(pokemon.species.abilities)
				.filter((key) => key.includes("I"))
				.map((key) =>
					this.toID(pokemon.species.abilities[key as "I1" | "I2" | "I3"])
				)
				.filter((ability) => ability !== pokemon.ability);

			//before switch in innate load
			const neededBeforeSwitchInIDs = [
				"clearbody",
				"competitive",
				"contrary",
				"defiant",
				"fullmetalbody",
				"hypercutter",
				"innerfocus",
				"mirrorarmor",
				"oblivious",
				"owntempo",
				"rattled",
				"scrappy",
				"simple",
				"whitesmoke",
			];
			if (pokemon.m.innates) {
				for (const innate of pokemon.m.innates) {
					if (!neededBeforeSwitchInIDs.includes(innate)) continue;
					if (pokemon.hasAbility(innate)) continue;
					pokemon.addVolatile("ability:" + innate, pokemon);
				}
			}
			//after switch in innate load
			if (pokemon.m.innates) {
				for (const innate of pokemon.m.innates) {
					if (pokemon.hasAbility(innate)) continue;
					pokemon.addVolatile("ability:" + innate, pokemon);
				}
			}
		},
	},

	{
		name: "Elite Redux Ubers",
		desc: `Testing for ER Innates`,
		mod: "gen8eliteredux",
		ruleset: ["Standard"],
		banlist: ["AG", "King's Rock", "Baton Pass"],

		//ER Scripts
		onValidateSet(set) {
			const species = this.dex.species.get(set.species);
			const innateList = Object.keys(species.abilities)
				.filter((key) => key.includes("I"))
				.map((key) => species.abilities[key as "I1" | "I2" | "I3"]);
			for (const innateName of innateList) {
				//Checks if set ability is an innate, which is not allowed
				if (set.ability == innateName) {
					return [
						`${set.name} already has ${innateName} as Innate. Please select from Abilities`,
					];
				}

				//Checks if innate is banned
				const banReason = this.ruleTable.check(
					"ability:" + this.toID(innateName)
				);
				if (banReason) {
					return [`${set.name}'s ability ${innateName} is ${banReason}.`];
				}
			}
		},
		onBegin() {
			for (const pokemon of this.getAllPokemon()) {
				// if (pokemon.ability === this.toID(pokemon.species.abilities['S'])) {
				// 	continue;
				// }
				pokemon.m.innates = Object.keys(pokemon.species.abilities)
					.filter((key) => key.includes("I"))
					.map((key) =>
						this.toID(
							pokemon.species.abilities[key as "I1" | "I2" | "I3"]
						)
					)
					.filter((ability) => ability !== pokemon.ability);
			}
		},
		onBeforeSwitchIn(pokemon) {
			// Abilities that must be applied before both sides trigger onSwitchIn to correctly
			// handle switch-in ability-to-ability interactions, e.g. Intimidate counters
			//TODO: Update needBeforeSwitchInIDs for new abilities
			const neededBeforeSwitchInIDs = [
				"clearbody",
				"competitive",
				"contrary",
				"defiant",
				"fullmetalbody",
				"hypercutter",
				"innerfocus",
				"mirrorarmor",
				"oblivious",
				"owntempo",
				"rattled",
				"scrappy",
				"simple",
				"whitesmoke",
			];
			if (pokemon.m.innates) {
				for (const innate of pokemon.m.innates) {
					if (!neededBeforeSwitchInIDs.includes(innate)) continue;
					if (pokemon.hasAbility(innate)) continue;
					pokemon.addVolatile("ability:" + innate, pokemon);
				}
			}
		},
		onSwitchInPriority: 2,
		onSwitchIn(pokemon) {
			if (pokemon.m.innates) {
				for (const innate of pokemon.m.innates) {
					if (pokemon.hasAbility(innate)) continue;
					pokemon.addVolatile("ability:" + innate, pokemon);
				}
			}
		},
		onSwitchOut(pokemon) {
			for (const innate of Object.keys(pokemon.volatiles).filter((i) =>
				i.startsWith("ability:")
			)) {
				pokemon.removeVolatile(innate);
			}
		},
		onFaint(pokemon) {
			for (const innate of Object.keys(pokemon.volatiles).filter((i) =>
				i.startsWith("ability:")
			)) {
				const innateEffect = this.dex.conditions.get(innate) as Effect;
				this.singleEvent("End", innateEffect, null, pokemon);
			}
		},
		onAfterMega(pokemon) {
			//clear original pokemon innates
			for (const innate of Object.keys(pokemon.volatiles).filter((i) =>
				i.startsWith("ability:")
			)) {
				pokemon.removeVolatile(innate);
			}
			//initialize mega innates
			pokemon.m.innates = Object.keys(pokemon.species.abilities)
				.filter((key) => key.includes("I"))
				.map((key) =>
					this.toID(pokemon.species.abilities[key as "I1" | "I2" | "I3"])
				)
				.filter((ability) => ability !== pokemon.ability);

			//before switch in innate load
			const neededBeforeSwitchInIDs = [
				"clearbody",
				"competitive",
				"contrary",
				"defiant",
				"fullmetalbody",
				"hypercutter",
				"innerfocus",
				"mirrorarmor",
				"oblivious",
				"owntempo",
				"rattled",
				"scrappy",
				"simple",
				"whitesmoke",
			];
			if (pokemon.m.innates) {
				for (const innate of pokemon.m.innates) {
					if (!neededBeforeSwitchInIDs.includes(innate)) continue;
					if (pokemon.hasAbility(innate)) continue;
					pokemon.addVolatile("ability:" + innate, pokemon);
				}
			}
			//after switch in innate load
			if (pokemon.m.innates) {
				for (const innate of pokemon.m.innates) {
					if (pokemon.hasAbility(innate)) continue;
					pokemon.addVolatile("ability:" + innate, pokemon);
				}
			}
		},
	},
	{
		name: "Elite Redux AG",
		desc: `Testing for ER Innates`,
		mod: "gen8eliteredux",
		ruleset: ["Standard"],
		banlist: ["King's Rock", "Baton Pass"],

		//ER Scripts
		onValidateSet(set) {
			const species = this.dex.species.get(set.species);
			const innateList = Object.keys(species.abilities)
				.filter((key) => key.includes("I"))
				.map((key) => species.abilities[key as "I1" | "I2" | "I3"]);
			for (const innateName of innateList) {
				//Checks if set ability is an innate, which is not allowed
				if (set.ability == innateName) {
					return [
						`${set.name} already has ${innateName} as Innate. Please select from Abilities`,
					];
				}

				//Checks if innate is banned
				const banReason = this.ruleTable.check(
					"ability:" + this.toID(innateName)
				);
				if (banReason) {
					return [`${set.name}'s ability ${innateName} is ${banReason}.`];
				}
			}
		},
		onBegin() {
			for (const pokemon of this.getAllPokemon()) {
				// if (pokemon.ability === this.toID(pokemon.species.abilities['S'])) {
				// 	continue;
				// }
				pokemon.m.innates = Object.keys(pokemon.species.abilities)
					.filter((key) => key.includes("I"))
					.map((key) =>
						this.toID(
							pokemon.species.abilities[key as "I1" | "I2" | "I3"]
						)
					)
					.filter((ability) => ability !== pokemon.ability);
			}
		},
		onBeforeSwitchIn(pokemon) {
			// Abilities that must be applied before both sides trigger onSwitchIn to correctly
			// handle switch-in ability-to-ability interactions, e.g. Intimidate counters
			//TODO: Update needBeforeSwitchInIDs for new abilities
			const neededBeforeSwitchInIDs = [
				"clearbody",
				"competitive",
				"contrary",
				"defiant",
				"fullmetalbody",
				"hypercutter",
				"innerfocus",
				"mirrorarmor",
				"oblivious",
				"owntempo",
				"rattled",
				"scrappy",
				"simple",
				"whitesmoke",
			];
			if (pokemon.m.innates) {
				for (const innate of pokemon.m.innates) {
					if (!neededBeforeSwitchInIDs.includes(innate)) continue;
					if (pokemon.hasAbility(innate)) continue;
					pokemon.addVolatile("ability:" + innate, pokemon);
				}
			}
		},
		onSwitchInPriority: 2,
		onSwitchIn(pokemon) {
			if (pokemon.m.innates) {
				for (const innate of pokemon.m.innates) {
					if (pokemon.hasAbility(innate)) continue;
					pokemon.addVolatile("ability:" + innate, pokemon);
				}
			}
		},
		onSwitchOut(pokemon) {
			for (const innate of Object.keys(pokemon.volatiles).filter((i) =>
				i.startsWith("ability:")
			)) {
				pokemon.removeVolatile(innate);
			}
		},
		onFaint(pokemon) {
			for (const innate of Object.keys(pokemon.volatiles).filter((i) =>
				i.startsWith("ability:")
			)) {
				const innateEffect = this.dex.conditions.get(innate) as Effect;
				this.singleEvent("End", innateEffect, null, pokemon);
			}
		},
		onAfterMega(pokemon) {
			//clear original pokemon innates
			for (const innate of Object.keys(pokemon.volatiles).filter((i) =>
				i.startsWith("ability:")
			)) {
				pokemon.removeVolatile(innate);
			}
			//initialize mega innates
			pokemon.m.innates = Object.keys(pokemon.species.abilities)
				.filter((key) => key.includes("I"))
				.map((key) =>
					this.toID(pokemon.species.abilities[key as "I1" | "I2" | "I3"])
				)
				.filter((ability) => ability !== pokemon.ability);

			//before switch in innate load
			const neededBeforeSwitchInIDs = [
				"clearbody",
				"competitive",
				"contrary",
				"defiant",
				"fullmetalbody",
				"hypercutter",
				"innerfocus",
				"mirrorarmor",
				"oblivious",
				"owntempo",
				"rattled",
				"scrappy",
				"simple",
				"whitesmoke",
			];
			if (pokemon.m.innates) {
				for (const innate of pokemon.m.innates) {
					if (!neededBeforeSwitchInIDs.includes(innate)) continue;
					if (pokemon.hasAbility(innate)) continue;
					pokemon.addVolatile("ability:" + innate, pokemon);
				}
			}
			//after switch in innate load
			if (pokemon.m.innates) {
				for (const innate of pokemon.m.innates) {
					if (pokemon.hasAbility(innate)) continue;
					pokemon.addVolatile("ability:" + innate, pokemon);
				}
			}
		},
	},

	{
		section: "Elite Redux Doubles",
	},
	{
		name: "Elite Redux Doubles OU",

		mod: "gen8eliteredux",
		gameType: "doubles",
		ruleset: ["Standard Doubles"],
		banlist: ["DUber", "Shadow Tag", "Arena Trap"],

		//ER Scripts
		onValidateSet(set) {
			const species = this.dex.species.get(set.species);
			const innateList = Object.keys(species.abilities)
				.filter((key) => key.includes("I"))
				.map((key) => species.abilities[key as "I1" | "I2" | "I3"]);
			for (const innateName of innateList) {
				//Checks if set ability is an innate, which is not allowed
				if (set.ability == innateName) {
					return [
						`${set.name} already has ${innateName} as Innate. Please select from Abilities`,
					];
				}

				//Checks if innate is banned
				const banReason = this.ruleTable.check(
					"ability:" + this.toID(innateName)
				);
				if (banReason) {
					return [`${set.name}'s ability ${innateName} is ${banReason}.`];
				}
			}
		},
		onBegin() {
			for (const pokemon of this.getAllPokemon()) {
				// if (pokemon.ability === this.toID(pokemon.species.abilities['S'])) {
				// 	continue;
				// }
				pokemon.m.innates = Object.keys(pokemon.species.abilities)
					.filter((key) => key.includes("I"))
					.map((key) =>
						this.toID(
							pokemon.species.abilities[key as "I1" | "I2" | "I3"]
						)
					)
					.filter((ability) => ability !== pokemon.ability);
			}
		},
		onBeforeSwitchIn(pokemon) {
			// Abilities that must be applied before both sides trigger onSwitchIn to correctly
			// handle switch-in ability-to-ability interactions, e.g. Intimidate counters
			//TODO: Update needBeforeSwitchInIDs for new abilities
			const neededBeforeSwitchInIDs = [
				"clearbody",
				"competitive",
				"contrary",
				"defiant",
				"fullmetalbody",
				"hypercutter",
				"innerfocus",
				"mirrorarmor",
				"oblivious",
				"owntempo",
				"rattled",
				"scrappy",
				"simple",
				"whitesmoke",
			];
			if (pokemon.m.innates) {
				for (const innate of pokemon.m.innates) {
					if (!neededBeforeSwitchInIDs.includes(innate)) continue;
					if (pokemon.hasAbility(innate)) continue;
					pokemon.addVolatile("ability:" + innate, pokemon);
				}
			}
		},
		onSwitchInPriority: 2,
		onSwitchIn(pokemon) {
			if (pokemon.m.innates) {
				for (const innate of pokemon.m.innates) {
					if (pokemon.hasAbility(innate)) continue;
					pokemon.addVolatile("ability:" + innate, pokemon);
				}
			}
		},
		onSwitchOut(pokemon) {
			for (const innate of Object.keys(pokemon.volatiles).filter((i) =>
				i.startsWith("ability:")
			)) {
				pokemon.removeVolatile(innate);
			}
		},
		onFaint(pokemon) {
			for (const innate of Object.keys(pokemon.volatiles).filter((i) =>
				i.startsWith("ability:")
			)) {
				const innateEffect = this.dex.conditions.get(innate) as Effect;
				this.singleEvent("End", innateEffect, null, pokemon);
			}
		},
		onAfterMega(pokemon) {
			//clear original pokemon innates
			for (const innate of Object.keys(pokemon.volatiles).filter((i) =>
				i.startsWith("ability:")
			)) {
				pokemon.removeVolatile(innate);
			}
			//initialize mega innates
			pokemon.m.innates = Object.keys(pokemon.species.abilities)
				.filter((key) => key.includes("I"))
				.map((key) =>
					this.toID(pokemon.species.abilities[key as "I1" | "I2" | "I3"])
				)
				.filter((ability) => ability !== pokemon.ability);

			//before switch in innate load
			const neededBeforeSwitchInIDs = [
				"clearbody",
				"competitive",
				"contrary",
				"defiant",
				"fullmetalbody",
				"hypercutter",
				"innerfocus",
				"mirrorarmor",
				"oblivious",
				"owntempo",
				"rattled",
				"scrappy",
				"simple",
				"whitesmoke",
			];
			if (pokemon.m.innates) {
				for (const innate of pokemon.m.innates) {
					if (!neededBeforeSwitchInIDs.includes(innate)) continue;
					if (pokemon.hasAbility(innate)) continue;
					pokemon.addVolatile("ability:" + innate, pokemon);
				}
			}
			//after switch in innate load
			if (pokemon.m.innates) {
				for (const innate of pokemon.m.innates) {
					if (pokemon.hasAbility(innate)) continue;
					pokemon.addVolatile("ability:" + innate, pokemon);
				}
			}
		},
	},
	{
		name: "Elite Redux Monotype Doubles OU",

		mod: "gen8eliteredux",
		gameType: "doubles",
		ruleset: ["Standard Doubles", "Force Monotype (ER)"],
		banlist: ["DUber", "Shadow Tag", "Arena Trap"],
		//ER Scripts
		onValidateSet(set) {
			const species = this.dex.species.get(set.species);
			const innateList = Object.keys(species.abilities)
				.filter((key) => key.includes("I"))
				.map((key) => species.abilities[key as "I1" | "I2" | "I3"]);
			for (const innateName of innateList) {
				//Checks if set ability is an innate, which is not allowed
				if (set.ability == innateName) {
					return [
						`${set.name} already has ${innateName} as Innate. Please select from Abilities`,
					];
				}

				//Checks if innate is banned
				const banReason = this.ruleTable.check(
					"ability:" + this.toID(innateName)
				);
				if (banReason) {
					return [`${set.name}'s ability ${innateName} is ${banReason}.`];
				}
			}
			// const type = this.dex.types.get(this.ruleTable.valueRules.get('forcemonotype')!)
			// if (!species.types.map(this.toID).includes(type.id)) {
			// 	return [`${set.species} must have ${type.name} type.`];
			// }
		},
		onBegin() {
			for (const pokemon of this.getAllPokemon()) {
				// if (pokemon.ability === this.toID(pokemon.species.abilities['S'])) {
				// 	continue;
				// }
				pokemon.m.innates = Object.keys(pokemon.species.abilities)
					.filter((key) => key.includes("I"))
					.map((key) =>
						this.toID(
							pokemon.species.abilities[key as "I1" | "I2" | "I3"]
						)
					)
					.filter((ability) => ability !== pokemon.ability);
			}
		},
		onBeforeSwitchIn(pokemon) {
			// Abilities that must be applied before both sides trigger onSwitchIn to correctly
			// handle switch-in ability-to-ability interactions, e.g. Intimidate counters
			//TODO: Update needBeforeSwitchInIDs for new abilities
			const neededBeforeSwitchInIDs = [
				"clearbody",
				"competitive",
				"contrary",
				"defiant",
				"fullmetalbody",
				"hypercutter",
				"innerfocus",
				"mirrorarmor",
				"oblivious",
				"owntempo",
				"rattled",
				"scrappy",
				"simple",
				"whitesmoke",
			];
			if (pokemon.m.innates) {
				for (const innate of pokemon.m.innates) {
					if (!neededBeforeSwitchInIDs.includes(innate)) continue;
					if (pokemon.hasAbility(innate)) continue;
					pokemon.addVolatile("ability:" + innate, pokemon);
				}
			}
		},
		onSwitchInPriority: 2,
		onSwitchIn(pokemon) {
			if (pokemon.m.innates) {
				for (const innate of pokemon.m.innates) {
					if (pokemon.hasAbility(innate)) continue;
					pokemon.addVolatile("ability:" + innate, pokemon);
				}
			}
		},
		onSwitchOut(pokemon) {
			for (const innate of Object.keys(pokemon.volatiles).filter((i) =>
				i.startsWith("ability:")
			)) {
				pokemon.removeVolatile(innate);
			}
		},
		onFaint(pokemon) {
			for (const innate of Object.keys(pokemon.volatiles).filter((i) =>
				i.startsWith("ability:")
			)) {
				const innateEffect = this.dex.conditions.get(innate) as Effect;
				this.singleEvent("End", innateEffect, null, pokemon);
			}
		},
		onAfterMega(pokemon) {
			//clear original pokemon innates
			for (const innate of Object.keys(pokemon.volatiles).filter((i) =>
				i.startsWith("ability:")
			)) {
				pokemon.removeVolatile(innate);
			}
			//initialize mega innates
			pokemon.m.innates = Object.keys(pokemon.species.abilities)
				.filter((key) => key.includes("I"))
				.map((key) =>
					this.toID(pokemon.species.abilities[key as "I1" | "I2" | "I3"])
				)
				.filter((ability) => ability !== pokemon.ability);

			//before switch in innate load
			const neededBeforeSwitchInIDs = [
				"clearbody",
				"competitive",
				"contrary",
				"defiant",
				"fullmetalbody",
				"hypercutter",
				"innerfocus",
				"mirrorarmor",
				"oblivious",
				"owntempo",
				"rattled",
				"scrappy",
				"simple",
				"whitesmoke",
			];
			if (pokemon.m.innates) {
				for (const innate of pokemon.m.innates) {
					if (!neededBeforeSwitchInIDs.includes(innate)) continue;
					if (pokemon.hasAbility(innate)) continue;
					pokemon.addVolatile("ability:" + innate, pokemon);
				}
			}
			//after switch in innate load
			if (pokemon.m.innates) {
				for (const innate of pokemon.m.innates) {
					if (pokemon.hasAbility(innate)) continue;
					pokemon.addVolatile("ability:" + innate, pokemon);
				}
			}
		},
	},
	{
		name: "Elite Redux Doubles Ubers",

		mod: "gen8eliteredux",
		gameType: "doubles",
		ruleset: ["Standard Doubles", "!Gravity Sleep Clause"],

		//ER Scripts
		onValidateSet(set) {
			const species = this.dex.species.get(set.species);
			const innateList = Object.keys(species.abilities)
				.filter((key) => key.includes("I"))
				.map((key) => species.abilities[key as "I1" | "I2" | "I3"]);
			for (const innateName of innateList) {
				//Checks if set ability is an innate, which is not allowed
				if (set.ability == innateName) {
					return [
						`${set.name} already has ${innateName} as Innate. Please select from Abilities`,
					];
				}

				//Checks if innate is banned
				const banReason = this.ruleTable.check(
					"ability:" + this.toID(innateName)
				);
				if (banReason) {
					return [`${set.name}'s ability ${innateName} is ${banReason}.`];
				}
			}
		},
		onBegin() {
			for (const pokemon of this.getAllPokemon()) {
				// if (pokemon.ability === this.toID(pokemon.species.abilities['S'])) {
				// 	continue;
				// }
				pokemon.m.innates = Object.keys(pokemon.species.abilities)
					.filter((key) => key.includes("I"))
					.map((key) =>
						this.toID(
							pokemon.species.abilities[key as "I1" | "I2" | "I3"]
						)
					)
					.filter((ability) => ability !== pokemon.ability);
			}
		},
		onBeforeSwitchIn(pokemon) {
			// Abilities that must be applied before both sides trigger onSwitchIn to correctly
			// handle switch-in ability-to-ability interactions, e.g. Intimidate counters
			//TODO: Update needBeforeSwitchInIDs for new abilities
			const neededBeforeSwitchInIDs = [
				"clearbody",
				"competitive",
				"contrary",
				"defiant",
				"fullmetalbody",
				"hypercutter",
				"innerfocus",
				"mirrorarmor",
				"oblivious",
				"owntempo",
				"rattled",
				"scrappy",
				"simple",
				"whitesmoke",
			];
			if (pokemon.m.innates) {
				for (const innate of pokemon.m.innates) {
					if (!neededBeforeSwitchInIDs.includes(innate)) continue;
					if (pokemon.hasAbility(innate)) continue;
					pokemon.addVolatile("ability:" + innate, pokemon);
				}
			}
		},
		onSwitchInPriority: 2,
		onSwitchIn(pokemon) {
			if (pokemon.m.innates) {
				for (const innate of pokemon.m.innates) {
					if (pokemon.hasAbility(innate)) continue;
					pokemon.addVolatile("ability:" + innate, pokemon);
				}
			}
		},
		onSwitchOut(pokemon) {
			for (const innate of Object.keys(pokemon.volatiles).filter((i) =>
				i.startsWith("ability:")
			)) {
				pokemon.removeVolatile(innate);
			}
		},
		onFaint(pokemon) {
			for (const innate of Object.keys(pokemon.volatiles).filter((i) =>
				i.startsWith("ability:")
			)) {
				const innateEffect = this.dex.conditions.get(innate) as Effect;
				this.singleEvent("End", innateEffect, null, pokemon);
			}
		},
		onAfterMega(pokemon) {
			//clear original pokemon innates
			for (const innate of Object.keys(pokemon.volatiles).filter((i) =>
				i.startsWith("ability:")
			)) {
				pokemon.removeVolatile(innate);
			}
			//initialize mega innates
			pokemon.m.innates = Object.keys(pokemon.species.abilities)
				.filter((key) => key.includes("I"))
				.map((key) =>
					this.toID(pokemon.species.abilities[key as "I1" | "I2" | "I3"])
				)
				.filter((ability) => ability !== pokemon.ability);

			//before switch in innate load
			const neededBeforeSwitchInIDs = [
				"clearbody",
				"competitive",
				"contrary",
				"defiant",
				"fullmetalbody",
				"hypercutter",
				"innerfocus",
				"mirrorarmor",
				"oblivious",
				"owntempo",
				"rattled",
				"scrappy",
				"simple",
				"whitesmoke",
			];
			if (pokemon.m.innates) {
				for (const innate of pokemon.m.innates) {
					if (!neededBeforeSwitchInIDs.includes(innate)) continue;
					if (pokemon.hasAbility(innate)) continue;
					pokemon.addVolatile("ability:" + innate, pokemon);
				}
			}
			//after switch in innate load
			if (pokemon.m.innates) {
				for (const innate of pokemon.m.innates) {
					if (pokemon.hasAbility(innate)) continue;
					pokemon.addVolatile("ability:" + innate, pokemon);
				}
			}
		},
	},
	{
		name: "Elite Redux 2v2 Doubles",
		desc: `Double battle where you bring four Pok&eacute;mon to Team Preview and choose only two.`,
		mod: "gen8eliteredux",
		gameType: "doubles",
		ruleset: [
			"Picked Team Size = 2",
			"Max Team Size = 4",
			"Standard Doubles",
			"Accuracy Moves Clause",
			"Sleep Clause Mod",
			"Evasion Items Clause",
		],

		//ER Scripts
		onValidateSet(set) {
			const species = this.dex.species.get(set.species);
			const innateList = Object.keys(species.abilities)
				.filter((key) => key.includes("I"))
				.map((key) => species.abilities[key as "I1" | "I2" | "I3"]);
			for (const innateName of innateList) {
				//Checks if set ability is an innate, which is not allowed
				if (set.ability == innateName) {
					return [
						`${set.name} already has ${innateName} as Innate. Please select from Abilities`,
					];
				}

				//Checks if innate is banned
				const banReason = this.ruleTable.check(
					"ability:" + this.toID(innateName)
				);
				if (banReason) {
					return [`${set.name}'s ability ${innateName} is ${banReason}.`];
				}
			}
		},
		onBegin() {
			for (const pokemon of this.getAllPokemon()) {
				// if (pokemon.ability === this.toID(pokemon.species.abilities['S'])) {
				// 	continue;
				// }
				pokemon.m.innates = Object.keys(pokemon.species.abilities)
					.filter((key) => key.includes("I"))
					.map((key) =>
						this.toID(
							pokemon.species.abilities[key as "I1" | "I2" | "I3"]
						)
					)
					.filter((ability) => ability !== pokemon.ability);
			}
		},
		onBeforeSwitchIn(pokemon) {
			// Abilities that must be applied before both sides trigger onSwitchIn to correctly
			// handle switch-in ability-to-ability interactions, e.g. Intimidate counters
			//TODO: Update needBeforeSwitchInIDs for new abilities
			const neededBeforeSwitchInIDs = [
				"clearbody",
				"competitive",
				"contrary",
				"defiant",
				"fullmetalbody",
				"hypercutter",
				"innerfocus",
				"mirrorarmor",
				"oblivious",
				"owntempo",
				"rattled",
				"scrappy",
				"simple",
				"whitesmoke",
			];
			if (pokemon.m.innates) {
				for (const innate of pokemon.m.innates) {
					if (!neededBeforeSwitchInIDs.includes(innate)) continue;
					if (pokemon.hasAbility(innate)) continue;
					pokemon.addVolatile("ability:" + innate, pokemon);
				}
			}
		},
		onSwitchInPriority: 2,
		onSwitchIn(pokemon) {
			if (pokemon.m.innates) {
				for (const innate of pokemon.m.innates) {
					if (pokemon.hasAbility(innate)) continue;
					pokemon.addVolatile("ability:" + innate, pokemon);
				}
			}
		},
		onSwitchOut(pokemon) {
			for (const innate of Object.keys(pokemon.volatiles).filter((i) =>
				i.startsWith("ability:")
			)) {
				pokemon.removeVolatile(innate);
			}
		},
		onFaint(pokemon) {
			for (const innate of Object.keys(pokemon.volatiles).filter((i) =>
				i.startsWith("ability:")
			)) {
				const innateEffect = this.dex.conditions.get(innate) as Effect;
				this.singleEvent("End", innateEffect, null, pokemon);
			}
		},
		onAfterMega(pokemon) {
			//clear original pokemon innates
			for (const innate of Object.keys(pokemon.volatiles).filter((i) =>
				i.startsWith("ability:")
			)) {
				pokemon.removeVolatile(innate);
			}
			//initialize mega innates
			pokemon.m.innates = Object.keys(pokemon.species.abilities)
				.filter((key) => key.includes("I"))
				.map((key) =>
					this.toID(pokemon.species.abilities[key as "I1" | "I2" | "I3"])
				)
				.filter((ability) => ability !== pokemon.ability);

			//before switch in innate load
			const neededBeforeSwitchInIDs = [
				"clearbody",
				"competitive",
				"contrary",
				"defiant",
				"fullmetalbody",
				"hypercutter",
				"innerfocus",
				"mirrorarmor",
				"oblivious",
				"owntempo",
				"rattled",
				"scrappy",
				"simple",
				"whitesmoke",
			];
			if (pokemon.m.innates) {
				for (const innate of pokemon.m.innates) {
					if (!neededBeforeSwitchInIDs.includes(innate)) continue;
					if (pokemon.hasAbility(innate)) continue;
					pokemon.addVolatile("ability:" + innate, pokemon);
				}
			}
			//after switch in innate load
			if (pokemon.m.innates) {
				for (const innate of pokemon.m.innates) {
					if (pokemon.hasAbility(innate)) continue;
					pokemon.addVolatile("ability:" + innate, pokemon);
				}
			}
		},
	},
];
