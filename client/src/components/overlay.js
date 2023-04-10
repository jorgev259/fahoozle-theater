import { useSelector } from 'react-redux'

import styles from '../styles/Overlay.module.scss'

export default function Overlay () {
  const connected = useSelector(state => state.chat.connected)

  return (
    <div id={styles.root}>
      {!connected ? <div>Connecting....</div> : null}
    </div>
  )
}
