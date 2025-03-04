import { Fetch, Notify } from "sode-extend-react"
import BasicRest from "./BasicRest"

class HistoriesRest extends BasicRest {
  path = 'histories'
  hasFiles = true

  reSend = async (id) => {
    try {
      const { status, result } = await Fetch(`/api/${this.path}/resend/${id}`)
      if (!status) throw new Error(result?.message || 'Ocurrio un error inesperado')
      return result.data
    } catch (error) {
      Notify.add({
        icon: '/assets/img/favicon.png',
        title: 'Error',
        body: error.message,
        type: 'danger'
      })
      return null
    }
  }
}

export default HistoriesRest