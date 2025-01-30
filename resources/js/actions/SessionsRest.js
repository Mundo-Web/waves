import { Fetch, Notify } from "sode-extend-react"
import BasicRest from "./BasicRest"

class SessionsRest extends BasicRest {
  path = 'sessions'

  verify = async (id, showNotify) => {
    try {
      const { status, result } = await Fetch(`/api/${this.path}/${id}`)
      if (!status) throw new Error(result?.message ?? 'Ocurrio un error al verificar la sesion')
      return true
    } catch (error) {
      console.error(error.message)
      showNotify && Notify.add({
        icon: '/assets/img/icon.svg',
        title: 'Error',
        body: error.message,
        type: 'danger'
      })
      return false
    }
  }

  ping = async (data) => {
    try {
      const { status, result } = await Fetch(`/api/${this.path}/ping`, {
        method: 'POST',
        body: JSON.stringify(data)
      })
      if (!status) throw new Error(result?.message ?? 'Ocurrio un error al enviar el ping')
      Notify.add({
        icon: '/assets/img/icon.svg',
        title: 'Correcto',
        body: `El ping ha sido enviado correctamente a ${data.to}`,
        type: 'success'
      })
    } catch (error) {
      Notify.add({
        icon: '/assets/img/icon.svg',
        title: 'Error',
        body: error.message,
        type: 'danger'
      })
    }
  }
}

export default SessionsRest