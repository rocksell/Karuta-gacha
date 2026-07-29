import { usePlayerData } from '../context/PlayerDataContext'

// Hardcoded card pool
const cardPool = {
  '3': ['Card A', 'Card B', 'Card C', 'Card G', 'Card H', 'Card I', 'Card J', 'Card K'],
  '4': ['Card D', 'Card E'],
  '5': ['Card F'],
}

const GachaPage = ({ setPage }) => {
  const {
    resources,
    gachaProgress,
    updateResources,
    updateGachaProgress,
    addCardToCollection,
  } = usePlayerData()

  const generateReward = (pity) => {
    const getRate = (pity) => {
      if (pity >= 90) return { '5': 1, '4': 0, '3': 0 }
      if (pity >= 74) {
        const fiveStarRate = 0.01 + (pity - 73) * 0.06
        return {
          '5': fiveStarRate,
          '4': (1 - fiveStarRate) * 0.08,
          '3': (1 - fiveStarRate) * 0.91,
        }
      }
      return { '5': 0.01, '4': 0.08, '3': 0.91 }
    }

    const rates = getRate(pity)
    const rand = Math.random()
    let cumulative = 0

    for (const rarity in rates) {
      cumulative += rates[rarity]
      if (rand < cumulative) {
        const pool = cardPool[rarity]
        const card = pool[Math.floor(Math.random() * pool.length)]
        return { card_id: card, rarity: parseInt(rarity) }
      }
    }
  }

  const handleWish = async (amount) => {
    if (!resources || !gachaProgress) {
      alert('Player data not loaded yet!')
      return
    }

    const cost = amount * 160
    if (resources.crystals < cost) {
      alert('Not enough crystals!')
      return
    }

    let currentPity = gachaProgress.current_pity
    let newTotalWishes = gachaProgress.total_wishes
    const rewards = []
    let fiveStarGuaranteed = gachaProgress.guaranteed_featured;

    for (let i = 0; i < amount; i++) {
      currentPity++
      newTotalWishes++
      const reward = generateReward(currentPity)

      if (reward.rarity === 5) {
        currentPity = 0
        // featured character logic to be added here
      }
      rewards.push({
        ...reward,
        obtained_at: new Date()
      })
    }

    // Update player resources
    await updateResources({ crystals: resources.crystals - cost })

    // Add cards to collection
    await addCardToCollection(rewards)

    // Update pity
    await updateGachaProgress({
      current_pity: currentPity,
      total_wishes: newTotalWishes,
    })

    // Show rewards
    alert(`You got: ${rewards.map((r) => `${r.card_id} (${r.rarity} star)`).join(', ')}`)
  }

  return (
    <div>
      <h2>Gacha</h2>
      <p>Crystals: {resources?.crystals}</p>
      <p>Pity: {gachaProgress?.current_pity}</p>
      <button onClick={() => handleWish(1)}>Wish x1</button>
      <button onClick={() => handleWish(10)}>Wish x10</button>
      <button onClick={() => setPage('achievements')}>Achievements</button>
    </div>
  )
}

export default GachaPage
