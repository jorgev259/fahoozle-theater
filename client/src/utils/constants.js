export const rowsInfo = [
  { max: 13, offset: { x: 30, y: 865 }, viewer: { width: 85, height: 85, seatStep: 152 } },
  { max: 11, offset: { x: 100, y: 895 }, viewer: { width: 85, height: 85, seatStep: 168 } },
  { image: false, max: 11, offset: { x: 15, y: 925 }, viewer: { width: 90, height: 90, seatStep: 184 } }
]

export const seatInfo = []
rowsInfo.forEach((row, rowIndex) => {
  row.index = rowIndex
  row.start = rowIndex === 0 ? 0 : rowsInfo[rowIndex - 1].end + 1
  row.end = row.start + row.max - 1

  const seatArray = [...Array(row.max).keys()]
  seatArray.forEach(index => {
    seatInfo.push({ position: { x: row.offset.x + (index * row.viewer.seatStep), y: row.offset.y }, index, seat: row.start + index, offsetX: row.offset.x, max: row.max, ...row.viewer })
  })
})

export const allSeats = [...Array(rowsInfo.map(row => row.max).reduce((a, b) => a + b)).keys()]
export const maxSeats = rowsInfo[rowsInfo.length - 1].end
