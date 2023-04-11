import { Stage, Layer, Image, Group } from 'react-konva'
import useImage from 'use-image'

import Overlay from './components/overlay'
import startChat from './components/chat'
import { rowsInfo } from './utils/constants'
import useImageWrapper from './utils/useImage'

import './styles/App.scss'
import { useDispatch, useSelector } from 'react-redux'
import { useEffect, useRef } from 'react'
import { animated, Spring } from '@react-spring/konva'
import { leaveSeat, stopTalk } from './slices/chat'

startChat()

export default function App () {
  const [screenImage] = useImageWrapper('/img/screen.png')
  const [rowsImage] = useImageWrapper('/img/rows.png')

  return (
    <>
      <Overlay />
      <Stage width={1920} height={1080}>
        <Layer>
          <Image image={screenImage} />
        </Layer>
        <Layer>
          {rowsInfo.map((info, index) => <Row key={index} index={index} info={info}/>)}
        </Layer>
        <Layer>
          <Image image={rowsImage} />
        </Layer>
      </Stage>
    </>
  )
}

function Row (props) {
  const { info, index } = props
  const { offset = {}, start, end, image = true } = info

  const [rowsImage] = useImageWrapper(`/img/rows${index}.png`)
  const seatList = useSelector(state => Object.keys(state.chat.seats).filter(k => k >= start && k <= end))

  return (
  <>
  <Group x={offset.x} y ={offset.y}>
    {seatList.map(seatNumber => <Seat key={seatNumber} seatNumber={seatNumber} rowInfo={info}/>)}
  </Group>
  {image ? <Image image={rowsImage} /> : null}
</>
  )
}

const colorReplaceFn = color => {
  function colorReplaceFilter (imageData) {
    if (!color) return

    const nPixels = imageData.data.length
    for (let i = 0; i < nPixels - 4; i += 4) {
      const isTransparent = imageData.data[i + 3] === 0
      if (!isTransparent) {
        const rgbdata = [255, 0, 0]

        imageData.data[i] = rgbdata[0]
        imageData.data[i + 1] = rgbdata[1]
        imageData.data[i + 2] = rgbdata[2]
      }
    }
  }

  return colorReplaceFilter
}

function Seat (props) {
  const { seatNumber, rowInfo = {} } = props

  const dispatch = useDispatch()

  const [viewerImage] = useImageWrapper('/img/viewer.png')
  const viewerImageRef = useRef()

  const timeoutRef = useRef(null)
  const inactivityRef = useRef(null)

  const talking = useSelector(state => state.chat.seats[seatNumber]?.talking)
  const lastMessage = useSelector(state => state.chat.seats[seatNumber]?.lastMessage)
  const color = useSelector(state => state.chat.seats[seatNumber]?.color)
  const emotes = useSelector(state => state.chat.seats[seatNumber]?.emotes)

  useEffect(() => {
    if (talking) {
      clearTimeout(timeoutRef.current)
      clearTimeout(inactivityRef.current)

      timeoutRef.current = setTimeout(() => dispatch(stopTalk({ seatNumber })), (/* incoming.emotes.length > 0 ? 3 * incoming.emotes.length : */ 4) * 1000)
      inactivityRef.current = setTimeout(() => dispatch(leaveSeat({ seatNumber })), 5 * 60 * 1000)
    }
  }, [talking, lastMessage])

  const { viewer, start: rowStart, offset, max } = rowInfo
  const { width, height, seatStep } = viewer
  const index = seatNumber - rowStart

  const targetX = 0 + (index * seatStep)
  const entranceLeft = index <= Math.floor(max / 2)
  const startX = entranceLeft ? -offset.x - (width / 2) : 1920 + (width / 2)
  const duration = (entranceLeft ? offset.x + targetX : (max - index) * seatStep) * 3.6

  return (
    <>
      <Spring native from={{ x: startX }} to={{ x: targetX }} config={{ duration }}>
        {slideProps => (
          /* {<Spring native loop={true} from={{ y: 0 }} to={occupied ? [{ y: -20 }, { y: -5 }] : { y: 0 }} config={{ easing: easings.easeInOutSine }} duration={25}>
            {bounceProps => ( */
              <animated.Group {...slideProps} /* {...bounceProps} */>
                    <Group>
                    <Image ref={viewerImageRef} image={viewerImage} width={width} height={height} filters={[colorReplaceFn(color)]} />
                    {talking ? <Bubble emote={emotes[0]} /> : null }
                  </Group>
                          </animated.Group>
          /*  )}
          </Spring> */
        )}
      </Spring>
    </>
  )
}

function Bubble (props) {
  const { emote } = props
  const [talkBaseImage] = useImageWrapper('/img/talkBase.png')
  const [talkDotsImage] = useImageWrapper('/img/talkDots.png')
  const [emoteImage] = useImage(`https://static-cdn.jtvnw.net/emoticons/v2/${emote || '25'}/static/dark/2.0`)

  return (
    <Group x={25} y={-20} offsetX={48} offsetY={48} >
      <Image image={talkBaseImage}/>
      {emote ? <Image image={emoteImage} height={30} x={18} y={18} rotation={15}/> : <Image image={talkDotsImage} />}
    </Group>
  )
}
