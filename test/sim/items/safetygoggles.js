'use strict';

const assert = require('./../../assert');
const common = require('./../../common');

let battle;

describe('Safety Goggles', function () {
	afterEach(function () {
		battle.destroy();
	});

	it(`should be revealed if Terrain is also active`, function () {
		battle = common.createBattle([[
			{species: 'tapukoko', ability: 'electrosurge', item: 'safetygoggles', moves: ['sleeptalk']},
		], [
			{species: 'amoonguss', moves: ['spore']},
		]]);
		battle.makeChoices();
		assert(battle.log.some(line => line.includes('|item: Safety Goggles|')));
	});

	it(`should be revealed if the move would have missed`, function () {
		battle = common.createBattle({forceRandomChance: false}, [[
			{species: 'yveltal', item: 'safetygoggles', moves: ['sleeptalk']},
		], [
			{species: 'venusaur', moves: ['sleeppowder']},
		]]);

		battle.makeChoices();
		assert(battle.log.some(line => line.includes('|item: Safety Goggles|')));
	});
});
