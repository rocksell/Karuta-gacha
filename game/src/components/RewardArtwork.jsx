import { getRewardDetails } from '../lib/gachaRewards'

const RewardArtwork = ({ card, className = '' }) => {
  const reward = getRewardDetails(card)
  if (!reward) return null

  if (reward.isLegacy) {
    return (
      <div className={`reward-artwork is-legacy ${className}`.trim()}>
        <img className="reward-art-legacy" src={reward.artPath} alt={reward.name} />
      </div>
    )
  }

  return (
    <div className={`reward-artwork rarity-${reward.rarity} ${className}`.trim()}>
      <img
        className="reward-art-underlay"
        src={`/UnderImage${reward.rarity}Star.png`}
        style={reward.underlayFilter ? { filter: reward.underlayFilter } : undefined}
        alt=""
        aria-hidden="true"
      />
      <img className="reward-art-image" src={reward.artPath} alt={reward.name} />
    </div>
  )
}

export default RewardArtwork
