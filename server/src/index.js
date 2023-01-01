import express from 'express'
import tcpPortUsed from 'tcp-port-used'
import path from 'path'

const app = express()
let port = 3000

async function startServer(){
  let portInUse = true

  while(portInUse){
    portInUse = await tcpPortUsed.check(port)

    if(portInUse) {
      console.log(`Port ${port} already in use. Looking for unused port...`)
      port++
    }
  }

  app.use(express.static(path.join(process.cwd(), 'site')))
  
  app.listen(port, () => {
    console.log(`Theater avalible at url http://localhost:${port}?username=namehere`)
  })
}

startServer()