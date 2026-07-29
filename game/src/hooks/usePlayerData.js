import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from './useAuth'

export const usePlayerData = () => {
  const { user } = useAuth()
  const [player, setPlayer] = useState(null)
  const [resources, setResources] = useState(null)
  const [gachaProgress, setGachaProgress] = useState(null)
  const [collection, setCollection] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (user) {
      const getPlayerData = async () => {
        setLoading(true)
        const { data: playerData, error: playerError } = await supabase
          .from('players')
          .select('*')
          .eq('id', user.id)
          .single()

        const { data: resourcesData, error: resourcesError } = await supabase
          .from('player_resources')
          .select('*')
          .eq('player_id', user.id)
          .single()

        const { data: gachaProgressData, error: gachaProgressError } =
          await supabase
            .from('gacha_progress')
            .select('*')
            .eq('player_id', user.id)
            .single()

        const { data: collectionData, error: collectionError } =
          await supabase.from('collections').select('*').eq('player_id', user.id)

        if (playerError) console.error(playerError)
        if (resourcesError) console.error(resourcesError)
        if (gachaProgressError) console.error(gachaProgressError)
        if (collectionError) console.error(collectionError)

        setPlayer(playerData)
        setResources(resourcesData)
        setGachaProgress(gachaProgressData)
        setCollection(collectionData)
        setLoading(false)
      }

      getPlayerData()
    }
  }, [user])

  const updateResources = async (newResources) => {
    const { data, error } = await supabase
      .from('player_resources')
      .update(newResources)
      .eq('player_id', user.id)
    if (error) console.error(error)
    return data
  }

  const updateGachaProgress = async (newProgress) => {
    const { data, error } = await supabase
      .from('gacha_progress')
      .update(newProgress)
      .eq('player_id', user.id)
    if (error) console.error(error)
    return data
  }

  const addCardToCollection = async (card) => {
    const { data, error } = await supabase.from('collections').insert(card)
    if (error) console.error(error)
    return data
  }

  return {
    player,
    resources,
    gachaProgress,
    collection,
    loading,
    updateResources,
    updateGachaProgress,
    addCardToCollection,
  }
}
