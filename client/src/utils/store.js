
import { configureStore } from '@reduxjs/toolkit'

import chatReducer from '../slices/chat'

export default configureStore({
  reducer: {
    chat: chatReducer
  }
})
