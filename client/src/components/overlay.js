import { useState } from 'react'
import { chatClient } from './chat'

import styles from '../styles/Overlay.module.scss'

export default function Overlay () {
  const [connected, setConnected] = useState(false)

  chatClient.on('connected', () => setConnected(true))
  chatClient.on('disconnected', () => setConnected(false))

  return connected
    ? null
    : (
    <div id={styles.root}>
      <div>Connecting....</div>
    </div>
      )
}
