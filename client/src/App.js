import './styles/App.scss'

import { useEffect, useRef, useState } from 'react'
import { Stage, Layer, Image, Group } from 'react-konva'
import useImage from 'use-image'

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
    const removeLength = occupiedLength - viewers
    for (let i = 0; i < removeLength; i++) {
      let seatIndex = seats.findIndex(s => !!s.username)

      if (seatIndex === -1) {
        seatIndex = seats.reduce((result, seat) => {
          if (!result && seat) return seat
          if (seat.lastMessage > result.lastMessage) return seat
          else return result
        })
      }

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

  emitter.emit(`talk-${seatNumber}`)
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
  const { viewer = {}, offset = {}, start, image = true } = info
  const [rowsImage] = useImage(`/img/rows${index}.png`)

  return (
    <>
      <Group x={offset.x} y ={offset.y}>
        {[...Array(info.max).keys()]
          .map(index => <Seat key={index} index={index} seat={start + index} {...viewer} />)}
      </Group>
      {image ? <Image image={rowsImage} /> : null}
    </>
  )
}

function Seat (props) {
  const { width, height, seatStep, index, seat } = props

  const [viewerImage] = useImage('/img/viewer.png')
  const [talkingImage] = useImage('/img/talk.png')

  const [occupied, setOccupied] = useState(false)
  const [talking, setTalking] = useState(false)
  const [username, setUsername] = useState(null)
  const timeoutRef = useRef(null)

  useEffect(() => {
    if (occupied) {
      seats[seat] = { occupied, talking, username }
    } else {
      delete seats[seat]
    }
  }, [occupied, talking, username])

  useEffect(() => {
    if (!occupied) {
      setTalking(false)
      setUsername(null)
    }
  }, [occupied])

  const targetX = 0 + (index * seatStep)

  emitter.on(`fill-${seat}`, () => setOccupied(true))
  emitter.on(`empty-${seat}`, () => setOccupied(false))
  emitter.on(`sit-${seat}`, incoming => setUsername(incoming))
  emitter.on(`talk-${seat}`, () => {
    clearTimeout(timeoutRef.current)

    seats[seat].lastMessage = Date.now()
    setTalking(true)
    timeoutRef.current = setTimeout(() => setTalking(false), 5 * 1000)
  })

  return (
    <Group x={targetX} >
      {occupied
        ? (
            <Group>
              <Image image={viewerImage} width={width} height={height} />
              {talking ? <Image image={talkingImage} x={25} y={-20} offsetX={48} offsetY={48} /> : null}
            </Group>
          )
        : null}
    </Group>
  )
}
