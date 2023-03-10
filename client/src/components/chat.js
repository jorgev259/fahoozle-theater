import tmi from 'tmi.js'
import { ApiClient } from '@twurple/api'
import { ClientCredentialsAuthProvider } from '@twurple/auth'
import EventEmmiter from 'eventemitter3'

const queryParams = new URLSearchParams(window.location.search)
const username = queryParams.get('username')

const authProvider = new ClientCredentialsAuthProvider('eow24ls2r2t4ot6cmtbix4rdy6yxch', 'mcvglpvjqcjxxfeao371dg6j23nmr8')
export const apiClient = new ApiClient({ authProvider })
export const emitter = new EventEmmiter()

export const chatClient = new tmi.Client({ channels: [username] })

if (username) {
  apiClient.users.getUserByName(username)
    .then(async user => {
      setInterval(async () => {
        const stream = await user.getStream()
        if (stream) emitter.emit('viewers', stream.viewers)
      }, 5 * 1000)
    })

  chatClient.on('connected', () => {
    console.log('Chat bot connected')
  })

  chatClient.on('disconnected', () => {
    console.log('Chat bot disconnected')
  })

  chatClient.connect()
}
