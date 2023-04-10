import { createSlice } from '@reduxjs/toolkit'

import { allSeats, maxSeats } from '../utils/constants'

/* {
  seatNumber
  username
  talking
} */

function getRandomSeatNumber (seatList) {
  const seatIndex = Math.floor((Math.random() * seatList.length))
  const seatNumber = seatList[seatIndex]

  return { seatNumber, seatIndex }
}

function addViewers (startAmmount, state) {
  let ammount = startAmmount
  const availableSeats = allSeats.filter(index => !Object.keys(state.seats).includes(index))
  const result = []

  while (ammount > 0) {
    const { seatIndex, seatNumber } = getRandomSeatNumber(availableSeats)
    result.push(seatNumber)

    availableSeats.splice(seatIndex, 1)

    state.seats[seatNumber] = { seatNumber, username: null, talking: false, lastMessage: -1 }
    ammount = ammount - 1
  }

  return result
}

export const chatSlice = createSlice({
  name: 'chat',
  initialState: {
    connected: false,
    viewers: 0,
    seats: {}
  },
  reducers: {
    updateChat: (state, action) => {
      state.connected = action.payload
    },
    updateViewers: (state, action) => {
      const newViewers = Math.min(action.payload, maxSeats)

      if (newViewers > state.viewers) {
        const ammount = newViewers - state.viewers
        addViewers(ammount, state)
      }

      if (newViewers < state.viewers) {
        let ammount = state.viewers - newViewers
        const removableSeats = [...Object.values(state.seats)].filter(seat => seat.username === null).map(seat => seat.seatNumber)

        while (ammount > 0 && removableSeats.length > 0) {
          const { seatIndex, seatNumber } = getRandomSeatNumber(removableSeats)

          removableSeats.splice(seatIndex, 1)

          delete state.seats[seatNumber]
          ammount = ammount - 1
        }
      }

      if (state.viewers !== newViewers) state.viewers = newViewers
    },
    handleMessage: (state, action) => {
      const { username, color } = action.payload
      const seatsValues = [...Object.values(state.seats)]

      let seat = seatsValues.find(s => s && s.username === username)
      let seatNumber

      if (!seat) {
        seat = seatsValues.find(s => s && s.username === null)
        if (!seat) seatNumber = addViewers(1, state)[0]
        else seatNumber = seat.seatNumber

        state.seats[seatNumber].username = username
      } else {
        seatNumber = seat.seatNumber
      }

      state.seats[seatNumber].lastMessage = Date.now()
      state.seats[seatNumber].talking = true
      state.seats[seatNumber].color = color
      // emitter.emit(`talk-${seatNumber}`, { color: user.color, emotes: user.emotes ? Object.keys(user.emotes) : [] }) */
    },
    clearSeat: (state, action) => {
      const { seatNumber } = action.payload
      delete state.seats[seatNumber]
    },
    leaveSeat: (state, action) => {
      const { seatNumber } = action.payload
      state.seats[seatNumber].username = null
      state.seats[seatNumber].talking = false
    },
    stopTalk: (state, action) => {
      const { seatNumber } = action.payload
      state.seats[seatNumber].talking = false
    }
  }
})

export const { updateChat, updateViewers, handleMessage, stopTalk, clearSeat, leaveSeat } = chatSlice.actions
export default chatSlice.reducer
