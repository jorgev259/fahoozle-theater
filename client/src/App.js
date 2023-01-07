import './styles/App.scss'

import { useEffect, useRef, useState } from 'react'
import { Stage, Layer, Image, Group } from 'react-konva'
import useImage from 'use-image'
import { Spring, animated/*, easings */ } from '@react-spring/konva'

import Overlay from './components/overlay'
import { emitter, chatClient } from './components/chat'

function getRandom (list) {
  return list[Math.floor((Math.random() * list.length))]
}

const rowsInfo = [
  { max: 13, offset: { x: 30, y: 865 }, viewer: { width: 85, height: 85, seatStep: 152 } },
  { max: 11, offset: { x: 100, y: 895 }, viewer: { width: 85, height: 85, seatStep: 168 } },
  { image: false, max: 11, offset: { x: 15, y: 925 }, viewer: { width: 90, height: 90, seatStep: 184 } }
]

const allSeats = [...Array(rowsInfo.map(row => row.max).reduce((a, b) => a + b)).keys()]
const seats = []

let seatCount = 0
rowsInfo.forEach(row => {
  row.start = seatCount
  seatCount += row.max
})

function addViewer () {
  const availableSeats = allSeats.filter(index => ![...seats.keys()].includes(index))
  const seat = getRandom(availableSeats)

  emitter.emit(`fill-${seat}`)
  return seat
}

emitter.on('viewers', viewers => {
  const occupiedLength = seats.filter(seat => !!seat).length
  if (occupiedLength === viewers) return

  if (occupiedLength < viewers) {
    const addLength = viewers - occupiedLength
    for (let i = 0; i < addLength; i++) {
      addViewer()
    }
  } else if (occupiedLength > viewers) {
    const [heartless, chatViewers] = seats.reduce((acc, viewer) => {
      acc[viewer.username ? 1 : 0].push(viewer)
      return acc
    }, [[], []])
    chatViewers.sort((a, b) => a.lastMessage - b.lastMessage)

    const removeLength = occupiedLength - viewers

    for (let i = 0; i < removeLength; i++) {
      let seatIndex
      if (heartless.length > 0) {
        seatIndex = heartless[0].seat
        heartless.splice(0, 1)
      } /* else {
        seatIndex = chatViewers[0].seat
        chatViewers.splice(0, 1)
      } */

      emitter.emit(`empty-${seatIndex}`)
    }
  }
})

chatClient.on('chat', (_, user, message, self) => {
  if (self) return

  const { username } = user
  let seatNumber = seats.findIndex(s => s && s.username === username)

  if (seatNumber === -1) {
    seatNumber = seats.findIndex(s => s && s.username === null)
    if (seatNumber === -1) seatNumber = addViewer()

    emitter.emit(`sit-${seatNumber}`, username)
  }

  emitter.emit(`talk-${seatNumber}`, { color: user.color })
})

export default function App () {
  const [screenImage] = useImage('/img/screen.png')
  const [rowsImage] = useImage('/img/rows.png')

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
  const { viewer = {}, offset = {}, start, image = true, max } = info
  const [rowsImage] = useImage(`/img/rows${index}.png`)

  return (
    <>
      <Group x={offset.x} y ={offset.y}>
        {[...Array(max).keys()]
          .map(index => <Seat key={index} index={index} seat={start + index} offsetX={offset.x} max={max} {...viewer} />)}
      </Group>
      {image ? <Image image={rowsImage} /> : null}
    </>
  )
}

function Seat (props) {
  const { width, height, seatStep, index, seat, offsetX, max } = props

  const [viewerImage] = useImage('/img/viewer.png')
  const viewerImageRef = useRef()
  const [talkingImage] = useImage('/img/talk.png')

  const [occupied, setOccupied] = useState(false)
  const [talking, setTalking] = useState(false)
  const [username, setUsername] = useState(null)
  const [color, setColor] = useState(null)
  const timeoutRef = useRef(null)
  const inactivityRef = useRef(null)

  function ColorReplaceFilter (imageData) {
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

  useEffect(() => {
    if (occupied) {
      seats[seat] = { occupied, talking, username, color, seat }
    } else {
      delete seats[seat]
    }
  }, [occupied, talking, username, color])

  useEffect(() => {
    if (!occupied) {
      setTalking(false)
      setUsername(null)
      setColor(null)
    }
  }, [occupied])

  useEffect(() => {
    if (occupied) viewerImageRef.current.cache()
  }, [occupied])

  const targetX = 0 + (index * seatStep)
  const entranceLeft = index <= Math.floor(max / 2)
  const startX = entranceLeft ? -offsetX - (width / 2) : 1920 + (width / 2)
  const duration = (entranceLeft ? offsetX + targetX : (max - index) * seatStep) * 3.6

  emitter.on(`fill-${seat}`, () => setOccupied(true))
  emitter.on(`empty-${seat}`, () => setOccupied(false))
  emitter.on(`sit-${seat}`, incoming => setUsername(incoming))
  emitter.on(`talk-${seat}`, incoming => {
    clearTimeout(timeoutRef.current)
    clearTimeout(inactivityRef.current)

    seats[seat].lastMessage = Date.now()
    setTalking(true)

    if (incoming.color && incoming.color !== color) setColor(incoming.color)
    timeoutRef.current = setTimeout(() => setTalking(false), 4 * 1000)
    inactivityRef.current = setTimeout(() => setOccupied(false), 5 * 60 * 1000)
  })

  return (
    <Spring native immediate={!occupied} from={{ x: startX }} to={{ x: occupied ? targetX : startX }} config={{ duration }}>
      {slideProps => (
        /* {<Spring native loop={true} from={{ y: 0 }} to={occupied ? [{ y: -20 }, { y: -5 }] : { y: 0 }} config={{ easing: easings.easeInOutSine }} duration={25}>
          {bounceProps => ( */
            <animated.Group {...slideProps} /* {...bounceProps} */>
              {occupied
                ? (
                  <Group>
                    <Image ref={viewerImageRef} image={viewerImage} width={width} height={height} filters={[ColorReplaceFilter]} />
                    {talking ? <Image image={talkingImage} x={25} y={-20} offsetX={48} offsetY={48} /> : null}
                  </Group>
                  )
                : null}
            </animated.Group>
        /*  )}
        </Spring> */
      )}
    </Spring>
  )
}
