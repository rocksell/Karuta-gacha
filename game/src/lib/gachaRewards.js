const OMAMORI_UNDERLAY_FILTERS = {
  art: 'hue-rotate(145deg) saturate(1.35) brightness(1.02)',
  health: 'hue-rotate(-105deg) saturate(1.45) brightness(1.04)',
  learning: 'hue-rotate(65deg) saturate(1.3) brightness(1.02)',
  money: 'hue-rotate(-48deg) saturate(1.55) brightness(1.06)',
  travel: 'hue-rotate(25deg) saturate(1.25) brightness(1.02)',
}

const SLIME_UNDERLAY_FILTERS = {
  anemo: 'hue-rotate(15deg) saturate(1.25) brightness(1.04)',
  cryo: 'hue-rotate(48deg) saturate(1.2) brightness(1.1)',
  dendro: 'hue-rotate(-12deg) saturate(1.35) brightness(1.01)',
  electro: 'hue-rotate(135deg) saturate(1.55) brightness(1.02)',
  geo: 'hue-rotate(-52deg) saturate(1.55) brightness(1.04)',
  hydro: 'hue-rotate(78deg) saturate(1.45) brightness(1.02)',
  pyro: 'hue-rotate(-112deg) saturate(1.65) brightness(1.04)',
}

const SLIME_NAMES = {
  anemo: 'Анемо',
  cryo: 'Крио',
  dendro: 'Дэндро',
  electro: 'Электро',
  geo: 'Гео',
  hydro: 'Гидро',
  pyro: 'Пиро',
}

const REWARD_CATALOG = {
  3: [
    ...['art', 'health', 'learning', 'money', 'travel'].map(id => ({
      id,
      type: 'omamori',
      typeLabel: 'Омамори',
      collectionLabel: 'Omamori',
      name: {
        art: 'Талисман искусства',
        health: 'Талисман здоровья',
        learning: 'Талисман знаний',
        money: 'Талисман богатства',
        travel: 'Талисман путешествий',
      }[id],
      artPath: `/3stars/omamori/${id}.png`,
      underlayFilter: OMAMORI_UNDERLAY_FILTERS[id],
    })),
    ...['anemo', 'cryo', 'dendro', 'electro', 'geo', 'hydro', 'pyro'].map(id => ({
      id,
      type: 'slimes',
      typeLabel: 'Слайм',
      collectionLabel: 'Slimes',
      name: `${SLIME_NAMES[id]} слайм`,
      artPath: `/3stars/slimes/${id}.png`,
      underlayFilter: SLIME_UNDERLAY_FILTERS[id],
    })),
  ],
  4: [
    { id: 'candy', type: 'candy', typeLabel: 'Candy', collectionLabel: 'Candy', name: 'Вкусняшка', artPath: '/4star/candy/candy.png' },
    { id: 'chibi', type: 'chibi', typeLabel: 'Chibi', collectionLabel: 'Chibi', name: 'Чиби-герой', artPath: '/4star/chibi/chibi.png' },
    {
      id: 'laser',
      type: 'laser',
      typeLabel: 'Гравировка',
      collectionLabel: 'Гравировка',
      name: 'Гравировка',
      description: 'Вы можете выбрать предмет и рисунок для гравировки',
      artPath: '/4star/laser/laser.png',
    },
  ],
  5: [
    { id: 'win', type: 'win', typeLabel: 'Летний сезон', collectionLabel: 'Летний сезон', name: 'Победный арт', artPath: '/5%20star/win.png' },
  ],
}

const hashString = value => [...value].reduce((hash, char) => ((hash * 31) + char.charCodeAt(0)) >>> 0, 0)

export const getRandomReward = (rarity, { excludedTypes = [] } = {}) => {
  const availableRewards = REWARD_CATALOG[rarity].filter(reward => !excludedTypes.includes(reward.type))
  const rewards = availableRewards.length > 0 ? availableRewards : REWARD_CATALOG[rarity]
  const types = [...new Set(rewards.map(reward => reward.type))]
  const selectedType = types[Math.floor(Math.random() * types.length)]
  const rewardsOfType = rewards.filter(reward => reward.type === selectedType)
  const reward = rewardsOfType[Math.floor(Math.random() * rewardsOfType.length)]
  return {
    ...reward,
    rarity,
    cardId: `reward-${rarity}-${reward.type}-${reward.id}`,
  }
}

export const getRewardDetails = card => {
  if (!card?.card_id) return null

  if (card.card_id.startsWith('poem-')) {
    const number = Number(card.card_id.replace('poem-', ''))
    return {
      rarity: card.rarity,
      cardId: card.card_id,
      id: String(number).padStart(3, '0'),
      type: 'karuta',
      typeLabel: 'Классическая карута',
      name: `Поэма № ${String(number).padStart(3, '0')}`,
      artPath: `/cards/${String(number).padStart(3, '0')}.png`,
      backPath: `/cards/${String(number).padStart(3, '0')}.png`,
      isLegacy: true,
    }
  }

  const [, rarityValue, type, ...idParts] = card.card_id.split('-')
  const rarity = Number(rarityValue)
  const id = idParts.join('-')
  const reward = REWARD_CATALOG[rarity]?.find(item => item.type === type && item.id === id)
  if (!reward) return null

  const backNumber = (hashString(card.card_id) % 100) + 1
  return {
    ...reward,
    rarity,
    cardId: card.card_id,
    backPath: `/cards/${String(backNumber).padStart(3, '0')}.png`,
    isLegacy: false,
  }
}

export const isGachaCard = card => Boolean(getRewardDetails(card))

export const isArtReward = card => card?.card_id?.startsWith('reward-') && Boolean(getRewardDetails(card))
