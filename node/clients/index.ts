import { IOClients, MasterData, Sphinx } from '@vtex/api'
import { VtexId } from './vtexId'

// Extend the default IOClients implementation with our own custom clients.
export class Clients extends IOClients {
  public get masterData() {
    return this.getOrSet('masterData', MasterData)
  }

  public get vtexId() {
    return this.getOrSet('vtexId', VtexId)
  }

  public get sphinx() {
    return this.getOrSet('sphinx', Sphinx)
  }
}
