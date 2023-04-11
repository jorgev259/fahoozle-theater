import tmi from 'tmi.js'
import { ApiClient } from '@twurple/api'
import { ClientCredentialsAuthProvider } from '@twurple/auth'
import { useEffect } from 'react'
import { useDispatch } from 'react-redux'
import { updateChat, handleMessage, updateViewers } from '../slices/chat'

const queryParams = new URLSearchParams(window.location.search)
export const username = queryParams.get('username')

const authProvider = new ClientCredentialsAuthProvider('eow24ls2r2t4ot6cmtbix4rdy6yxch', 'mcvglpvjqcjxxfeao371dg6j23nmr8')

export const apiClient = new ApiClient({ authProvider })
export const chatClient = new tmi.Client({ channels: [username] })

export default function Chat () {
  const dispatch = useDispatch()

  useEffect(() => {
    if (username) {
      apiClient.users.getUserByName(username)
        .then(async user => {
          setInterval(async () => {
            const stream = await user.getStream()
            if (stream) dispatch(updateViewers(stream.viewers))
          }, 5 * 1000)
        })

      chatClient.on('connected', () => {
        dispatch(updateChat(true))
        console.log('Chat bot connected')
      })

      chatClient.on('disconnected', () => {
        dispatch(updateChat(false))
        console.log('Chat bot disconnected')
      })

      chatClient.connect()
    }

    chatClient.on('chat', (_, user, message, self) => {
      if (self) return
      dispatch(handleMessage({ username: user['user-id'], color: user.color }))
    })
  }, [])

  return null
}
